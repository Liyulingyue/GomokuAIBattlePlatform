import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { message } from 'antd'
import { useUser } from '../context/UserContext'

interface AIConfig {
  url: string
  key: string
  model: string
  customPrompt: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface MultiplayerRoom {
  id?: string
  players: string[]
  current_player: number
  winner: number
  can_confirm: boolean
  board: number[][]
  moves: Array<{ x: number; y: number; player: number }>
  logs: string[]
  messages: Array<{ username: string; message: string; timestamp?: string }>
  pending_move: { x: number; y: number } | null
  ai_configs: Record<string, AIConfig | undefined>
  config_locked: Record<string, boolean | undefined>
  ready_status: Record<string, boolean | undefined>
  config_changes_left: Record<string, number | undefined>
  owner?: string
  error?: string | null
}

export function useMultiplayerBattle() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('roomId')
  const navigate = useNavigate()
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    url: 'https://aistudio.baidu.com/llm/lmapi/v3',
    key: '',
    model: 'ernie-3.5-8k',
    customPrompt: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { username, initializing, login } = useUser()

  useEffect(() => {
    if (!roomId) {
      message.error('缺少房间ID，已返回大厅')
      navigate('/room')
    }
  }, [roomId, navigate])

  const fetchRoom = useCallback(async () => {
    if (!roomId) {
      return
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}`)
      if (response.data.success) {
        setRoom(response.data.room as MultiplayerRoom)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.error('获取房间失败', error)
    }
  }, [roomId])

  useEffect(() => {
    if (initializing || !roomId) {
      return
    }

    let active = true
    let interval: ReturnType<typeof setInterval> | null = null

    const prepare = async () => {
      if (!username) {
        const result = await login()
        if (!result.success) {
          message.error(result.message ?? '无法加入房间，请稍后再试')
          navigate('/room')
          return
        }
      }

      if (!active) {
        return
      }

  await fetchRoom()
  interval = setInterval(fetchRoom, 2000)
    }

    prepare()

    return () => {
      active = false
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [initializing, roomId, username, login, fetchRoom, navigate])

  const handleStep = async () => {
    // 前端检查：AI配置必须锁定才能执行推理
    if (!roomId) {
      message.error('房间信息缺失')
      return
    }
    if (!username) {
      message.error('用户名未准备好，请稍后重试')
      return
    }
    if (!room || !room.config_locked || !room.config_locked[username]) {
      message.error('请先锁定AI配置才能执行推理')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/step`, {
        room_id: roomId,
        username
      })
      if (response.data.success) {
        message.success('AI已思考完成，请确认落子')
      } else {
        setError(response.data.message)
      }
      await fetchRoom()
    } catch (error) {
      console.error('执行失败', error)
      setError('执行失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmMove = async () => {
    if (!roomId || !username) {
      message.error('房间或用户名信息缺失')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/confirm_move`, {
        room_id: roomId,
        username
      })
      message.success('落子确认')
      await fetchRoom()
    } catch (error) {
      console.error('确认落子失败', error)
      message.error('确认落子失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    if (!roomId || !username) {
      message.error('房间或用户名信息缺失')
      return
    }
    try {
      await axios.post(`${API_BASE_URL}/send_message`, {
        room_id: roomId,
        username,
        message: messageText
      })
      await fetchRoom()
    } catch (error) {
      console.error('发送消息失败', error)
      message.error('发送消息失败')
    }
  }

  const handleLeaveRoom = async () => {
    if (!roomId || !username) {
      navigate('/room')
      return
    }
    try {
      await axios.post(`${API_BASE_URL}/rooms/leave`, {
        room_id: roomId,
        username
      })
      navigate('/room')
    } catch (error) {
      console.error('离开房间失败', error)
      message.error('离开房间失败')
    }
  }

  const handleDisbandRoom = async () => {
    if (!roomId || !username) {
      navigate('/room')
      return
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/rooms/delete`, {
        room_id: roomId,
        username
      })
      if (response.data.success) {
        message.success('房间已解散')
      } else {
        message.error(response.data.message ?? '解散房间失败')
      }
      navigate('/room')
    } catch (error) {
      console.error('解散房间失败', error)
      message.error('解散房间失败')
    }
  }

  return {
    room,
    aiConfig,
    setAiConfig,
    loading,
    error,
    username,
    roomId,
    fetchRoom,
    handleStep,
    handleConfirmMove,
    handleSendMessage,
    handleLeaveRoom,
    handleDisbandRoom
  }
}
