import { Button, Popconfirm, Space, Segmented, Tooltip } from 'antd'
import type { MultiplayerRoom } from '../hooks/useMultiplayerBattle'

interface BattleControlsProps {
  room: Pick<MultiplayerRoom, 'players' | 'current_player' | 'winner' | 'can_confirm' | 'moves'>
  username: string
  loading: boolean
  error?: string | null // 新增错误状态
  onStep: () => void | Promise<void>
  onConfirmMove: () => void | Promise<void>
  onStepAndConfirm?: () => void | Promise<void> // 新增合并函数
  onLeaveRoom: () => void | Promise<void>
  onDisbandRoom?: () => void | Promise<void>
  isOwner?: boolean
  ownerPreferredColor?: 'black' | 'white'
  onSetOwnerColor?: (color: 'black' | 'white') => void | Promise<void>
  canAdjustOwnerColor?: boolean
}

function BattleControls({
  room,
  username,
  loading,
  error, // 新增
  onStep,
  onConfirmMove,
  onStepAndConfirm, // 新增
  onLeaveRoom,
  onDisbandRoom,
  isOwner,
  ownerPreferredColor,
  onSetOwnerColor,
  canAdjustOwnerColor
}: BattleControlsProps) {
  const isMyTurn = room.players && room.players[room.current_player - 1] === username
  const canConfirm = room.can_confirm
  const hasError = !!error
  const ownerColorValue = ownerPreferredColor ?? 'black'
  const ownerColorTip = canAdjustOwnerColor
    ? '调整执棋颜色'
    : '仅可在对局开始前且双方未完成整备时调整颜色'

  return (
    <Space direction="vertical" size="middle">
      {/* 新增的一键执行按钮 */}
      {onStepAndConfirm && (
        <Button
          type="primary"
          onClick={onStepAndConfirm}
          disabled={!isMyTurn || room.winner !== 0 || canConfirm || loading}
          size="large"
          style={{ width: '100%' }}
        >
          {hasError ? '� 重试执行并落子' : '�🚀 一键执行并落子'}
        </Button>
      )}
      
      {/* 原有的分步操作按钮 */}
      <Space size="middle">
        <Button
          onClick={onStep}
          disabled={!isMyTurn || room.winner !== 0 || canConfirm || loading}
          size="large"
        >
          {hasError ? '🔄 重试执行' : '执行下一步'}
        </Button>
        <Button
          onClick={onConfirmMove}
          disabled={!canConfirm || loading}
          size="large"
        >
          确认落子
        </Button>
      </Space>
      <Space size="middle">
        {isOwner && onSetOwnerColor && (
          <Tooltip title={ownerColorTip}>
            <Segmented
              value={ownerColorValue}
              onChange={(value) => onSetOwnerColor(value as 'black' | 'white')}
              options={[
                { label: '我执黑', value: 'black' },
                { label: '我执白', value: 'white' }
              ]}
              disabled={!canAdjustOwnerColor}
            />
          </Tooltip>
        )}
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
    </Space>
  )
}

export default BattleControls
