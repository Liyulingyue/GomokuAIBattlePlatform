import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { message } from 'antd'

interface AIConfig {
  url: string
  key: string
  model: string
  customPrompt: string
}

export function useMultiplayerBattle() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('roomId')
  const navigate = useNavigate()
  const [room, setRoom] = useState<any>(null)
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    url: 'https://aistudio.baidu.com/llm/lmapi/v3',
    key: '',
    model: 'ernie-3.5-8k',
    customPrompt: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const username = localStorage.getItem('username')

  useEffect(() => {
    if (!username || !roomId) {
      navigate('/login')
      return
    }
    fetchRoom()
    const interval = setInterval(fetchRoom, 2000) // 每2秒同步一次
    return () => clearInterval(interval)
  }, [roomId, username, navigate])

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/room/${roomId}`)
      if (response.data.success) {
        setRoom(response.data.room)
      }
    } catch (error) {
      console.error('获取房间失败', error)
    }
  }

  const handleStep = async () => {
    // 前端检查：AI配置必须锁定才能执行推理
    if (!room || !room.config_locked || !(username && room.config_locked[username])) {
      message.error('请先锁定AI配置才能执行推理')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('http://localhost:8000/step', {
        room_id: roomId,
        username
      })
      if (response.data.success) {
        message.success('AI已思考完成，请确认落子')
      } else {
        setError(response.data.message)
      }
      fetchRoom()
    } catch (error) {
      setError('执行失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmMove = async () => {
    setLoading(true)
    try {
      await axios.post('http://localhost:8000/confirm_move', {
        room_id: roomId,
        username
      })
      message.success('落子确认')
      fetchRoom()
    } catch (error) {
      message.error('确认落子失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    try {
      await axios.post('http://localhost:8000/send_message', {
        room_id: roomId,
        username,
        message: messageText
      })
      fetchRoom()
    } catch (error) {
      message.error('发送消息失败')
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await axios.post('http://localhost:8000/leave_room', {
        room_id: roomId,
        username
      })
      navigate('/room')
    } catch (error) {
      message.error('离开房间失败')
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
    handleLeaveRoom
  }
}
