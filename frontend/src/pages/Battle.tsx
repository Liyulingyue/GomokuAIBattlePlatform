import { useState } from 'react'
import { Layout, Card, Button, Space, Typography, Alert, Divider } from 'antd'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Board from '../components/Board'
import AIConfigComponent from '../components/AIConfig'
import BattleLog from '../components/BattleLog'
import './Battle.css'

const { Content } = Layout
const { Title, Text } = Typography

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

interface AIConfig {
  url: string
  key: string
  model: string
  customPrompt: string
}

interface Move {
  x: number
  y: number
  player: number
}

function Battle() {
  const [ai1, setAi1] = useState<AIConfig>({ url: 'https://aistudio.baidu.com/llm/lmapi/v3', key: '', model: 'ernie-3.5-8k', customPrompt: '' })
  const [ai2, setAi2] = useState<AIConfig>({ url: 'https://aistudio.baidu.com/llm/lmapi/v3', key: '', model: 'ernie-3.5-8k', customPrompt: '' })
  const [board, setBoard] = useState<number[][]>(Array(15).fill(null).map(() => Array(15).fill(0)))
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [winner, setWinner] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [pendingMove, setPendingMove] = useState<{x: number, y: number} | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [canConfirm, setCanConfirm] = useState(false)
  const [moves, setMoves] = useState<Move[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkWinner = (board: number[][]): number => {
    const size = 15
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (board[i][j] !== 0) {
          const player = board[i][j]
          if (
            checkLine(board, i, j, 0, 1, player) ||
            checkLine(board, i, j, 1, 0, player) ||
            checkLine(board, i, j, 1, 1, player) ||
            checkLine(board, i, j, 1, -1, player)
          ) {
            return player
          }
        }
      }
    }
    return 0
  }

  const checkLine = (board: number[][], x: number, y: number, dx: number, dy: number, player: number): boolean => {
    let count = 1
    let nx = x + dx
    let ny = y + dy
    while (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[nx][ny] === player) {
      count++
      nx += dx
      ny += dy
    }
    nx = x - dx
    ny = y - dy
    while (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[nx][ny] === player) {
      count++
      nx -= dx
      ny -= dy
    }
    return count >= 5
  }

  const isBoardFull = (boardState: number[][]) => boardState.every(row => row.every(cell => cell !== 0))

  const requestMove = async (player: number, boardState: number[][], error: string | null = null) => {
    if (winner !== 0 || isBoardFull(boardState)) return

    setLoading(true)
    setError(null)

    const aiConfig = player === 1 ? ai1 : ai2

    try {
      const response = await axios.post(`${API_BASE_URL}/next_move`, {
        board: boardState,
        current_player: player,
        ai_config: aiConfig,
        error: error || "",
        custom_prompt: aiConfig.customPrompt
      })

      const result = response.data
      const logMessage = result.log ?? `AI player ${player} 正在思考`

      if (result.error) {
        setLogs(prev => [...prev, logMessage])
        setCanConfirm(false)
        setError(result.error)
      } else if (result.move) {
        const [x, y] = result.move
        if (boardState[x]?.[y] !== 0) {
          setLogs(prev => [...prev, `${logMessage}，但位置 (${x},${y}) 已有棋子，重新思考`])
          setCanConfirm(false)
          setError('位置已被占用')
        } else {
          setLogs(prev => [...prev, logMessage])
          setPendingMove({ x, y })
          setCanConfirm(true)
          setError(null)
        }
      } else {
        setLogs(prev => [...prev, `AI player ${player} 未返回有效落子`])
        setCanConfirm(false)
      }
    } catch (error) {
      setLogs(prev => [...prev, '网络错误，无法获取下一步'])
      setError('Failed to get next move')
      setCanConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  const confirmMove = () => {
    if (!pendingMove) return

    const { x, y } = pendingMove
    const playerJustMoved = currentPlayer
    const newBoard = board.map(row => [...row])
    newBoard[x][y] = playerJustMoved
    setBoard(newBoard)

    const newMoves = [...moves, { x, y, player: playerJustMoved }]
    setMoves(newMoves)

    const win = checkWinner(newBoard)
    if (win !== 0) {
      setWinner(win)
    } else if (newMoves.length >= 225) {
      setWinner(0) // Draw
    } else {
      const nextPlayer = 3 - playerJustMoved
      setCurrentPlayer(nextPlayer)
      setPendingMove(null)
      setCanConfirm(false)
      requestMove(nextPlayer, newBoard)
    }
  }

  const resetGame = () => {
    setBoard(Array(15).fill(null).map(() => Array(15).fill(0)))
    setCurrentPlayer(1)
    setWinner(0)
    setMoves([])
    setError(null)
    setLogs([])
    setPendingMove(null)
    setCanConfirm(false)
    setGameStarted(false)
  }

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : '等待 AI 落子...'
  const alertConfig = winner !== 0
    ? {
        type: 'success' as const,
        message: `🎉 胜者: ${winner === 1 ? 'AI 1 (黑)' : winner === 2 ? 'AI 2 (白)' : '平局'}`
      }
    : error
      ? {
          type: 'error' as const,
          message: `❌ 错误: ${error}`
        }
      : {
          type: 'info' as const,
          message: `📝 最新日志: ${latestLog}`
        }

  return (
    <Layout style={{ height: '100vh' }}>
      <Navbar />
      <Content style={{ flex: 1, padding: '24px 48px', background: '#f0f2f5', overflow: 'auto' }}>
        <div style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
            AI 五子棋对战
          </Title>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <Card title="AI 1 (黑棋)" style={{ flex: '0 0 300px' }}>
              <AIConfigComponent ai={ai1} setAi={setAi1} title="" />
            </Card>

            <Card style={{ flex: 1, textAlign: 'center' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space size="large">
                  <Text strong>当前玩家: </Text>
                  <Text type={currentPlayer === 1 ? 'success' : 'danger'}>
                    {currentPlayer === 1 ? 'AI 1 (黑)' : 'AI 2 (白)'}
                  </Text>
                  <Text strong>步数: </Text>
                  <Text>{moves.length}</Text>
                </Space>

                <Alert message={alertConfig.message} type={alertConfig.type} showIcon />

                <Divider />

                <Board board={board} />

                <Space>
                  <Button
                    onClick={() => {
                      setGameStarted(true)
                      requestMove(currentPlayer, board)
                    }}
                    disabled={gameStarted || winner !== 0 || isBoardFull(board)}
                    size="large"
                  >
                    开始
                  </Button>
                  <Button
                    type="primary"
                    onClick={confirmMove}
                    disabled={!canConfirm || loading}
                    size="large"
                  >
                    下一步
                  </Button>
                  <Button
                    onClick={() => requestMove(currentPlayer, board, error)}
                    disabled={!gameStarted || canConfirm || loading || winner !== 0 || isBoardFull(board)}
                    size="large"
                  >
                    重新思考
                  </Button>
                  <Button onClick={resetGame} size="large">
                    重新开始
                  </Button>
                </Space>
              </Space>
            </Card>

            <Card title="AI 2 (白棋)" style={{ flex: '0 0 300px' }}>
              <AIConfigComponent ai={ai2} setAi={setAi2} title="" />
            </Card>

            <BattleLog logs={logs} />
          </div>
        </div>
      </Content>
    </Layout>
  )
}

export default Battle