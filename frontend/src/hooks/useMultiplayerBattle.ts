import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  owner?: string
  owner_preferred_color?: 'black' | 'white'
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
  const [shouldPoll, setShouldPoll] = useState(true)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { username, initializing, login } = useUser()

  useEffect(() => {
    if (!roomId) {
      message.error('缺少房间ID，已返回大厅')
      navigate('/room')
    }
  }, [roomId, navigate])

  const stopPolling = useCallback(() => {
    setShouldPoll(false)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const fetchRoom = useCallback(async () => {
    if (!roomId || !shouldPoll) {
      return
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}`)
      if (response.data.success) {
        setRoom(response.data.room as MultiplayerRoom)
      } else {
        const messageText = response.data.message ?? '房间不可用'
        message.error(messageText)
        if (messageText.includes('房间不存在')) {
          stopPolling()
          setRoom(null)
          navigate('/room')
        }
      }
    } catch (error) {
      console.error('获取房间失败', error)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 404) {
          stopPolling()
          setRoom(null)
          message.error('房间不存在，正在返回大厅')
          navigate('/room')
          return
        }
      }
      // 对于瞬时错误，保持轮询但提示
      message.warning('暂时无法获取房间信息，将自动重试')
    }
  }, [roomId, navigate, shouldPoll, stopPolling])

  useEffect(() => {
    if (initializing || !roomId || !shouldPoll) {
      return
    }

    let active = true

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
      if (!active) {
        return
      }
      pollIntervalRef.current = setInterval(fetchRoom, 2000)
    }

    prepare()

    return () => {
      active = false
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [initializing, roomId, username, login, fetchRoom, navigate, shouldPoll])

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

  // 新增：自动执行下一步并确认落子的合并函数
  const handleStepAndConfirm = async () => {
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
      // 步骤1：执行AI推理
      const stepResponse = await axios.post(`${API_BASE_URL}/step`, {
        room_id: roomId,
        username
      })
      
      if (!stepResponse.data.success) {
        setError(stepResponse.data.message)
        message.error(stepResponse.data.message || 'AI推理失败')
        return
      }

      // 刷新房间状态以获取AI的落子
      await fetchRoom()

      // 步骤2：自动确认落子
      const confirmResponse = await axios.post(`${API_BASE_URL}/confirm_move`, {
        room_id: roomId,
        username
      })

      if (confirmResponse.data.success) {
        message.success('AI已完成落子')
      } else {
        message.error('落子确认失败')
      }

      // 最终刷新房间状态
      await fetchRoom()
    } catch (error) {
      console.error('执行并确认落子失败', error)
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || '操作失败'
        setError(errorMsg)
        message.error(errorMsg)
      } else {
        setError('操作失败')
        message.error('操作失败')
      }
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
      stopPolling()
      setRoom(null)
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
      stopPolling()
      setRoom(null)
      navigate('/room')
    } catch (error) {
      console.error('解散房间失败', error)
      message.error('解散房间失败')
    }
  }

  const handleSetOwnerColor = async (color: 'black' | 'white') => {
    if (!roomId || !username) {
      message.error('房间或用户名信息缺失')
      return
    }
    if (room) {
      if (room.moves.length > 0) {
        message.error('对局已开始，无法调整颜色')
        return
      }
      const players = room.players ?? []
      if (players.length > 0 && players.every((player) => room.ready_status?.[player] ?? false)) {
        message.error('双方已完成整备，无法调整颜色')
        return
      }
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/rooms/set_owner_color`, {
        room_id: roomId,
        username,
        color
      })
      if (!response.data.success) {
        message.error(response.data.message ?? '调整执棋颜色失败')
      } else {
        message.success(color === 'black' ? '您已选择执黑' : '您已选择执白')
      }
      await fetchRoom()
    } catch (error) {
      console.error('调整执棋颜色失败', error)
      message.error('调整执棋颜色失败')
    }
  }

  const canAdjustOwnerColor = useMemo(() => {
    if (!room) {
      return false
    }
    if (room.moves.length > 0) {
      return false
    }
    const players = room.players ?? []
    if (players.length === 0) {
      return true
    }
    const allReady = players.every((player) => room.ready_status?.[player] ?? false)
    return !allReady
  }, [room])

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
    handleStepAndConfirm, // 新增的合并函数
    handleSendMessage,
    handleLeaveRoom,
    handleDisbandRoom,
    handleSetOwnerColor,
    canAdjustOwnerColor
  }
}
