import { Card, Divider } from 'antd'

interface BattleLogProps {
  logs: string[]
  messages?: Array<{username: string, message: string, timestamp: string}>
}

function BattleLog({ logs, messages = [] }: BattleLogProps) {
  return (
    <Card title="对战日志" style={{ height: '100%', width: '300px' }}>
      <div style={{ height: 'calc(100% - 60px)', overflowY: 'auto', background: '#f5f5f5', padding: '8px' }}>
        {logs.map((log, idx) => <p key={idx} style={{ margin: 0 }}>{log}</p>)}
        
        {messages.length > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontSize: '12px', color: '#666' }}>
              {messages.map((msg, idx) => (
                <p key={idx} style={{ margin: 0, padding: '2px 0' }}>
                  <strong>{msg.username}:</strong> {msg.message}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default BattleLog