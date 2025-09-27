import { useState, useEffect } from 'react'
import { Layout, Card, Button, Input, Typography, message, Space, Divider } from 'antd'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import './Room.css'

const { Content } = Layout
const { Title, Text } = Typography

function Room() {
  const [roomId, setRoomId] = useState('')
  const [createdRoomId, setCreatedRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const username = localStorage.getItem('username')
    if (!username) {
      navigate('/login')
    }
  }, [navigate])

  const handleCreateRoom = async () => {
    setLoading(true)
    try {
      const username = localStorage.getItem('username')
      const response = await axios.post('http://localhost:8000/create_room', { username })
      if (response.data.success) {
        setCreatedRoomId(response.data.room_id)
        setRoomId(response.data.room_id) // 也设置到输入框中，方便复制
        message.success('房间创建成功')
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      message.error('创建房间失败')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      message.error('请输入房间ID')
      return
    }
    setLoading(true)
    try {
      const username = localStorage.getItem('username')
      const response = await axios.post('http://localhost:8000/join_room', { room_id: roomId, username })
      if (response.data.success) {
        message.success('加入房间成功')
        navigate(`/multiplayer-battle?roomId=${roomId}`)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      message.error('加入房间失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCreatedRoomId('')
    setRoomId('')
  }

  const handleEnterRoom = () => {
    if (createdRoomId) {
      navigate(`/multiplayer-battle?roomId=${createdRoomId}`)
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Navbar />
      <Content style={{ flex: 1, padding: '50px 80px', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Title level={2}>房间管理</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button type="primary" onClick={handleCreateRoom} loading={loading} size="large" disabled={!!createdRoomId}>
              创建房间
            </Button>
            
            {createdRoomId && (
              <div>
                <Text strong>已创建房间ID: </Text>
                <Text copyable>{createdRoomId}</Text>
                <br />
                <Space style={{ marginTop: 10 }}>
                  <Button type="primary" onClick={handleEnterRoom} size="large">
                    进入房间开始对战
                  </Button>
                  <Button onClick={handleReset} size="large">
                    重新选择
                  </Button>
                </Space>
                <Text style={{ marginTop: 10, display: 'block', color: '#666' }}>
                  等待其他玩家加入，或分享房间ID给朋友
                </Text>
              </div>
            )}

            <Divider>或</Divider>

            <div>
              <Input
                placeholder="输入房间ID加入其他人的房间"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                size="large"
                disabled={!!createdRoomId}
              />
              <Button 
                onClick={handleJoinRoom} 
                loading={loading} 
                size="large" 
                style={{ marginTop: 10 }}
                disabled={!!createdRoomId}
              >
                加入房间
              </Button>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  )
}

export default Room