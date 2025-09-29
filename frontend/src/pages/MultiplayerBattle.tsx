import { Layout, Card, Typography, Alert, Space, Divider } from 'antd'
import Navbar from '../components/Navbar'
import Board from '../components/Board'
import BattleLog from '../components/BattleLog'
import PlayerConfigPanel from '../components/PlayerConfigPanel'
import BattleControls from '../components/BattleControls'
import { useMultiplayerBattle } from '../hooks/useMultiplayerBattle'
import './MultiplayerBattle.css'

const { Content } = Layout
const { Title, Text } = Typography

function MultiplayerBattle() {
  const {
    room,
    aiConfig,
    setAiConfig,
    loading,
    error,
    username,
    roomId,
    fetchRoom,
    handleStep,
    handleConfirmMove,
    handleStepAndConfirm, // 新增
    handleSendMessage,
    handleLeaveRoom,
    handleDisbandRoom,
    handleSetOwnerColor,
    canAdjustOwnerColor
  } = useMultiplayerBattle()

  if (!room) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Navbar />
        <Content style={{ flex: 1, padding: '50px 80px', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Title level={2}>加载中...</Title>
        </Content>
      </Layout>
    )
  }

  const currentUsername = room.players[room.current_player - 1]
  const isMyTurn = currentUsername === username
  const isOwner = room.owner === username
  const ownerPreferredColor = room.owner_preferred_color ?? 'black'

  const getColorLabel = (playerName: string | undefined, index: number): string => {
    if (!playerName) {
      return index === 0 ? '黑棋' : '白棋'
    }
    if (playerName === room.owner) {
      if (ownerPreferredColor === 'white') {
        if (room.players.length < 2 && index === 0) {
          return '白棋（等待对手执黑）'
        }
        return '白棋'
      }
      return '黑棋'
    }
    return index === 0 ? '黑棋' : '白棋'
  }

  const alertConfig = room.winner !== 0
    ? {
        type: 'success' as const,
        message: `🎉 胜者: ${room.winner === 1 ? room.players[0] : room.winner === 2 ? room.players[1] : '平局'}`
      }
    : error
      ? {
          type: 'error' as const,
          message: `❌ 错误: ${error}`
        }
      : {
          type: 'info' as const,
          message: `📝 当前回合: ${currentUsername}`
        }

  return (
    <Layout style={{ height: '100vh' }}>
      <Navbar />
      <Content style={{ flex: 1, padding: '24px 48px', background: '#f0f2f5', overflow: 'auto' }}>
        <div style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
            多玩家AI对战 - 房间 {roomId}
          </Title>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <PlayerConfigPanel
              playerName={room.players[0]}
              colorLabel={getColorLabel(room.players[0], 0)}
              isCurrentUser={room.players[0] === username}
              username={username || ''}
              aiConfig={aiConfig}
              setAiConfig={setAiConfig}
              room={room}
              roomId={roomId || room.id || ''}
              loading={loading}
              onRoomUpdate={fetchRoom}
              onSendMessage={handleSendMessage}
            />

            <Card style={{ flex: 1, textAlign: 'center' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space size="large">
                  <Text strong>玩家: </Text>
                  <Text>{room.players.join(' vs ')}</Text>
                  <Text strong>当前玩家: </Text>
                  <Text type={isMyTurn ? 'success' : 'danger'}>
                    {currentUsername}
                  </Text>
                  <Text strong>步数: </Text>
                  <Text>{room.moves.length}</Text>
                </Space>

                <Alert message={alertConfig.message} type={alertConfig.type} showIcon />

                <Divider />

                <Board board={room.board} />

                <BattleControls
                  room={room}
                  username={username || ''}
                  loading={loading}
                  onStep={handleStep}
                  onConfirmMove={handleConfirmMove}
                  onStepAndConfirm={handleStepAndConfirm} // 新增
                  onLeaveRoom={handleLeaveRoom}
                  onDisbandRoom={isOwner ? handleDisbandRoom : undefined}
                  isOwner={isOwner}
                  ownerPreferredColor={ownerPreferredColor}
                  onSetOwnerColor={isOwner ? handleSetOwnerColor : undefined}
                  canAdjustOwnerColor={canAdjustOwnerColor}
                />
              </Space>
            </Card>

            {room.players[1] ? (
              <PlayerConfigPanel
                playerName={room.players[1]}
                colorLabel={getColorLabel(room.players[1], 1)}
                isCurrentUser={room.players[1] === username}
                username={username || ''}
                aiConfig={aiConfig}
                setAiConfig={setAiConfig}
                room={room}
                roomId={roomId || room.id || ''}
                loading={loading}
                onRoomUpdate={fetchRoom}
              />
            ) : (
              <Card title="等待玩家加入" style={{ flex: '0 0 300px' }}>
                <Text>房间ID: {roomId}</Text>
                <br />
                <Text>分享此ID给朋友加入对战</Text>
              </Card>
            )}

            <BattleLog logs={room.logs} messages={room.messages} />
          </div>
        </div>
      </Content>
    </Layout>
  )
}

export default MultiplayerBattle