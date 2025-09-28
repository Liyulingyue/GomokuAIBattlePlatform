import { Button, Popconfirm, Space } from 'antd'
import type { MultiplayerRoom } from '../hooks/useMultiplayerBattle'

interface BattleControlsProps {
  room: Pick<MultiplayerRoom, 'players' | 'current_player' | 'winner' | 'can_confirm'>
  username: string
  loading: boolean
  onStep: () => void | Promise<void>
  onConfirmMove: () => void | Promise<void>
  onLeaveRoom: () => void | Promise<void>
  onDisbandRoom?: () => void | Promise<void>
  isOwner?: boolean
}

function BattleControls({ room, username, loading, onStep, onConfirmMove, onLeaveRoom, onDisbandRoom, isOwner }: BattleControlsProps) {
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
      {isOwner && onDisbandRoom && (
        <Popconfirm
          title="确认解散房间？"
          okText="解散"
          cancelText="取消"
          onConfirm={onDisbandRoom}
        >
          <Button danger type="primary">
            解散房间
          </Button>
        </Popconfirm>
      )}
    </Space>
  )
}

export default BattleControls
