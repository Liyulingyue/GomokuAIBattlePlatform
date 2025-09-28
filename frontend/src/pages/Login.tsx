import { useState, useEffect } from 'react'
import { Layout, Card, Button, Input, Typography, message, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'
import './Login.css'

const { Content } = Layout
const { Title, Text } = Typography

function Login() {
  const { username, sessionId, login, updateUsername, loading, initializing } = useUser()
  const [inputUsername, setInputUsername] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setInputUsername(username)
  }, [username])

  const handleLogin = async () => {
    const result = await login()
    if (result.success) {
      message.success('登录成功')
      if (result.username) {
        setInputUsername(result.username)
      }
    } else {
      message.error(result.message ?? '登录失败')
    }
  }

  const handleUpdateUsername = async () => {
    if (!inputUsername.trim()) {
      message.error('用户名不能为空')
      return
    }
    const result = await updateUsername(inputUsername)
    if (result.success) {
      message.success(result.message ?? '用户名更新成功')
      setInputUsername(result.username ?? inputUsername)
    } else {
      message.error(result.message ?? '更新失败')
    }
  }

  const handleContinue = async () => {
    // 验证用户名格式
    if (!inputUsername.trim()) {
      message.error('用户名不能为空')
      return
    }
    if (!/^[a-zA-Z]+$/.test(inputUsername)) {
      message.error('用户名只能包含英文字母')
      return
    }
    if (inputUsername.length > 20) {
      message.error('用户名长度不能超过20个字符')
      return
    }

    const result = await updateUsername(inputUsername)
    if (result.success) {
      const actualUsername = result.username ?? inputUsername
      message.success(result.message ?? '用户名设置成功')
      setInputUsername(actualUsername)
      navigate('/room')
    } else {
      message.error(result.message ?? '设置用户名失败')
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Navbar />
      <Content style={{ flex: 1, padding: '50px 80px', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Title level={2}>登录</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {(!sessionId || initializing) ? (
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
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
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