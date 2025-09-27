import { useState, useEffect } from 'react'
import { Layout, Card, Button, Input, Typography, message, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import './Login.css'

const { Content } = Layout
const { Title, Text } = Typography

function Login() {
  const [username, setUsername] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 检查本地存储是否有session
    const storedSession = localStorage.getItem('sessionId')
    const storedUsername = localStorage.getItem('username')
    if (storedSession && storedUsername) {
      setSessionId(storedSession)
      setUsername(storedUsername)
    }
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/login')
      const { session_id, username: newUsername } = response.data
      setSessionId(session_id)
      setUsername(newUsername)
      localStorage.setItem('sessionId', session_id)
      localStorage.setItem('username', newUsername)
      message.success('登录成功')
    } catch (error) {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      message.error('用户名不能为空')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/update_username', {
        old_username: localStorage.getItem('username'),
        new_username: username
      })
      if (response.data.success) {
        localStorage.setItem('username', username)
        const successMessage = response.data.message || '用户名更新成功'
        message.success(successMessage)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    // 验证用户名格式
    if (!username.trim()) {
      message.error('用户名不能为空')
      return
    }
    if (!/^[a-zA-Z]+$/.test(username)) {
      message.error('用户名只能包含英文字母')
      return
    }
    if (username.length > 20) {
      message.error('用户名长度不能超过20个字符')
      return
    }

    setLoading(true)
    try {
      // 执行用户名更新/创建逻辑
      const response = await axios.post('http://localhost:8000/update_username', {
        old_username: localStorage.getItem('username') || '',
        new_username: username
      })
      
      if (response.data.success) {
        const actualUsername = response.data.username
        localStorage.setItem('username', actualUsername)
        const successMessage = response.data.message || '用户名设置成功'
        message.success(successMessage)
        // 如果返回的用户名与输入的不同，更新输入框显示
        if (actualUsername !== username) {
          setUsername(actualUsername)
        }
        navigate('/room')
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      message.error('设置用户名失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Navbar />
      <Content style={{ flex: 1, padding: '50px 80px', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Title level={2}>登录</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {!sessionId ? (
              <Button type="primary" onClick={handleLogin} loading={loading} size="large">
                获取用户名
              </Button>
            ) : (
              <>
                <div>
                  <Text strong>当前用户名: </Text>
                  <Text>{username}</Text>
                </div>
                <Input
                  placeholder="输入新用户名（仅英文）"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  size="large"
                />
                <Button onClick={handleUpdateUsername} loading={loading} size="large">
                  更新用户名
                </Button>
                <Button type="primary" onClick={handleContinue} loading={loading} size="large">
                  继续
                </Button>
              </>
            )}
          </Space>
        </Card>
      </Content>
    </Layout>
  )
}

export default Login