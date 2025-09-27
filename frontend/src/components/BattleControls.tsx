import { Button, Space } from 'antd'

interface BattleControlsProps {
  room: any
  username: string
  loading: boolean
  onStep: () => void
  onConfirmMove: () => void
  onLeaveRoom: () => void
}

function BattleControls({ room, username, loading, onStep, onConfirmMove, onLeaveRoom }: BattleControlsProps) {
  const isMyTurn = room.players && room.players[room.current_player - 1] === username
  const canConfirm = room.can_confirm

  return (
    <Space>
      <Button
        type="primary"
        onClick={onStep}
        disabled={!isMyTurn || room.winner !== 0 || canConfirm || loading}
        size="large"
      >
        执行下一步
      </Button>
      <Button
        onClick={onConfirmMove}
        disabled={!canConfirm || loading}
        size="large"
      >
        确认落子
      </Button>
      <Button
        danger
        onClick={onLeaveRoom}
        loading={loading}
      >
        离开房间
      </Button>
    </Space>
  )
}

export default BattleControls
