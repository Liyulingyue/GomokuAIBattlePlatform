import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Modal, Input, Button, message } from 'antd'
import './Navbar.css'
import { useUser } from '../context/UserContext'

function Navbar() {
  const { username, updateUsername, initializing, loading, suggestUsername } = useUser()
  const [modalVisible, setModalVisible] = useState(false)
  const [newUsername, setNewUsername] = useState('')

  useEffect(() => {
    if (modalVisible) {
      setNewUsername(username)
    }
  }, [modalVisible, username])

  const handleUsernameClick = () => {
    if (initializing) {
      message.info('正在加载用户信息...')
      return
    }
    setModalVisible(true)
  }

  const handleOk = async () => {
    const trimmed = newUsername.trim()
    if (!trimmed) {
      message.error('用户名不能为空')
      return
    }
    if (!/^[a-zA-Z]+$/.test(trimmed)) {
      message.error('用户名只能包含英文字母')
      return
    }
    if (trimmed.length > 20) {
      message.error('用户名长度不能超过20个字符')
      return
    }

    const result = await updateUsername(trimmed)
    if (result.success) {
      message.success(result.message ?? '用户名更新成功')
      setModalVisible(false)
    } else {
      message.error(result.message ?? '用户名更新失败')
    }
  }

  const handleCancel = () => {
    setModalVisible(false)
  }

  const handleGenerate = async () => {
    const result = await suggestUsername()
    if (result.success && result.username) {
      setNewUsername(result.username)
      message.success('已生成随机用户名')
    } else {
      message.error(result.message ?? '获取用户名失败')
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">五子棋AI平台</Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/">首页</Link></li>
          <li><Link to="/battle">单人AI测试</Link></li>
          <li><Link to="/room">多人对战</Link></li>
        </ul>
        <div className="nav-user" onClick={handleUsernameClick}>
          {initializing ? '加载中...' : username || '未命名用户'}
        </div>
      </nav>
      <Modal
        title="更换用户名"
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="确认"
        cancelText="取消"
      >
        <Input
          placeholder="输入新用户名"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          maxLength={20}
        />
        <Button type="link" onClick={handleGenerate} disabled={loading || initializing} style={{ padding: 0, marginTop: 12 }}>
          随机生成用户名
        </Button>
      </Modal>
    </>
  )
}

export default Navbar