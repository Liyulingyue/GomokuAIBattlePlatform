import { Card } from 'antd'

interface BattleLogProps {
  logs: string[]
}

function BattleLog({ logs }: BattleLogProps) {
  return (
    <Card title="对战日志" style={{ height: '100%', width: '300px' }}>
      <div style={{ height: 'calc(100% - 60px)', overflowY: 'auto', background: '#f5f5f5', padding: '8px' }}>
        {logs.map((log, idx) => <p key={idx} style={{ margin: 0 }}>{log}</p>)}
      </div>
    </Card>
  )
}

export default BattleLog