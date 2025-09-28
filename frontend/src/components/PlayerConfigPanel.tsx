import { Card, Button, Typography, Space, message, Divider } from 'antd'
import { useState } from 'react'
import axios from 'axios'
import AIConfigComponent from './AIConfig'
import type { MultiplayerRoom } from '../hooks/useMultiplayerBattle'

const { Text } = Typography

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

interface AIConfig {
  url: string
  key: string
  model: string
  customPrompt: string
}

interface PlayerConfigPanelProps {
  playerName: string
  colorLabel: string
  isCurrentUser: boolean
  username: string
  aiConfig: AIConfig
  setAiConfig: (config: AIConfig) => void
  room: MultiplayerRoom
  roomId: string
  loading: boolean
  onRoomUpdate: () => void
  onSendMessage?: (message: string) => void
}

function PlayerConfigPanel({
  playerName,
  colorLabel,
  isCurrentUser,
  username,
  aiConfig,
  setAiConfig,
  room,
  roomId,
  loading,
  onRoomUpdate,
  onSendMessage
}: PlayerConfigPanelProps) {
  const [originalAiConfig, setOriginalAiConfig] = useState<AIConfig | null>(null)
  const handleLockConfig = async (locked: boolean) => {
    try {
      if (!locked) {
        // 解锁前检查剩余修改次数
        const changesLeft = room.config_changes_left?.[username] || 0
        if (changesLeft <= 0) {
          message.error('修改次数已用完，无法解锁')
          return
        }
        
        // 保存当前配置作为原始配置，用于取消操作
        setOriginalAiConfig({ ...aiConfig })
      }

      // 如果是锁定配置，先保存当前的AI配置
      if (locked) {
        await axios.post(`${API_BASE_URL}/set_ai_config`, {
          room_id: roomId,
          username,
          ai_config: {
            url: aiConfig.url,
            key: aiConfig.key,
            model: aiConfig.model,
            custom_prompt: aiConfig.customPrompt
          }
        })
      }

      await axios.post(`${API_BASE_URL}/lock_config`, {
        room_id: roomId,
        username,
        locked
      })
      onRoomUpdate()
      if (locked) {
        message.success('配置已锁定')
        setOriginalAiConfig(null) // 锁定成功后清除原始配置
      } else {
        message.success('配置已解锁')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data?.message || '操作失败')
      } else {
        message.error('操作失败')
      }
    }
  }

  const handleCancelUnlock = async () => {
    if (originalAiConfig) {
      try {
        await axios.post(`${API_BASE_URL}/lock_config`, {
          room_id: roomId,
          username,
          locked: true,
          cancel_unlock: true
        })
        setAiConfig(originalAiConfig)
        setOriginalAiConfig(null)
        onRoomUpdate()
        message.success('已取消解锁，恢复原始配置')
      } catch (error) {
        if (axios.isAxiosError(error)) {
          message.error(error.response?.data?.message || '操作失败')
        } else {
          message.error('操作失败')
        }
      }
    }
  }

  const handleSetReady = async (ready: boolean) => {
    try {
      await axios.post(`${API_BASE_URL}/set_ready`, {
        room_id: roomId,
        username,
        ready
      })
      onRoomUpdate()
      if (ready) {
        message.success('已标记为准备完毕')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data?.message || '操作失败')
      } else {
        message.error('操作失败')
      }
    }
  }

  if (!isCurrentUser) {
    return (
  <Card title={`${playerName} (${colorLabel})`} style={{ flex: '0 0 300px' }}>
        <div>
          <Text strong>AI配置: {room.ai_configs?.[playerName] ? '已设置' : '未设置'}</Text>
          <br />
          <Text>状态: {room.ready_status?.[playerName] ? '✅ 已准备' : room.config_locked?.[playerName] ? '🔒 已锁定' : '⏳ 未锁定'}</Text>
        </div>
      </Card>
    )
  }

  return (
  <Card title={`${playerName} (${colorLabel})`} style={{ flex: '0 0 300px' }}>
      <AIConfigComponent
        ai={aiConfig}
        setAi={setAiConfig}
        title=""
        disabled={room.config_locked?.[username] && !originalAiConfig}
      />
      <div style={{ marginTop: 10 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            {room.ready_status?.[username]
              ? `状态: 🛡️ 已整备 (剩余修改: ${room.config_changes_left?.[username] || 0})`
              : room.config_locked?.[username]
                ? '状态: 🔒 已锁定'
                : '状态: 🔓 可修改'
            }
          </Text>

          <Space wrap>
            {!room.config_locked?.[username] && (
              <Button
                type="primary"
                onClick={() => username && handleLockConfig(true)}
                loading={loading}
              >
                锁定状态
              </Button>
            )}

            {!room.config_locked?.[username] && originalAiConfig && (
              <Button
                type="default"
                onClick={handleCancelUnlock}
              >
                取消解锁
              </Button>
            )}

            {room.config_locked?.[username] && !room.ready_status?.[username] && (
              <Button
                type="primary"
                onClick={() => username && handleSetReady(true)}
                loading={loading}
              >
                完成整备
              </Button>
            )}

            {room.config_locked?.[username] && (room.config_changes_left?.[username] || 0) > 0 && (
              <Button
                type="default"
                onClick={() => username && handleLockConfig(false)}
                loading={loading}
              >
                解除锁定
              </Button>
            )}
          </Space>
        </Space>
      </div>

      {isCurrentUser && onSendMessage && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ padding: '0 12px 12px 12px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong style={{ fontSize: '14px' }}>快捷互动:</Text>
              <Space wrap size="small">
                <Button 
                  onClick={() => onSendMessage('我已准备完毕')}
                  size="small"
                  type="default"
                >
                  我已准备完毕
                </Button>
                <Button 
                  onClick={() => onSendMessage('请尽快开始')}
                  size="small"
                  type="default"
                >
                  请尽快开始
                </Button>
                <Button 
                  onClick={() => onSendMessage('即将开始')}
                  size="small"
                  type="default"
                >
                  即将开始
                </Button>
                <Button 
                  onClick={() => onSendMessage('请等一等')}
                  size="small"
                  type="default"
                >
                  请等一等
                </Button>
                <Button 
                  onClick={() => onSendMessage('在吗')}
                  size="small"
                  type="default"
                >
                  在吗
                </Button>
                <Button 
                  onClick={() => onSendMessage('我在')}
                  size="small"
                  type="default"
                >
                  我在
                </Button>
                <Button 
                  onClick={() => onSendMessage('加油！')}
                  size="small"
                  type="default"
                >
                  加油！
                </Button>
                <Button 
                  onClick={() => onSendMessage('好棋！')}
                  size="small"
                  type="default"
                >
                  好棋！
                </Button>
              </Space>
            </Space>
          </div>
        </>
      )}
    </Card>
  )
}

export default PlayerConfigPanel
