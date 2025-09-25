import './Board.css'

interface BoardProps {
  board: number[][]
}

function Board({ board }: BoardProps) {
  const size = 15
  const cellSize = 30

  return (
    <div className="board-container">
      <svg width={size * cellSize + 40} height={size * cellSize + 40} className="board-svg">
        {/* 绘制网格线 */}
        {Array.from({ length: size + 1 }, (_, i) => (
          <g key={i}>
            <line
              x1={20}
              y1={20 + i * cellSize}
              x2={20 + size * cellSize}
              y2={20 + i * cellSize}
              stroke="#000"
              strokeWidth="1"
            />
            <line
              x1={20 + i * cellSize}
              y1={20}
              x2={20 + i * cellSize}
              y2={20 + size * cellSize}
              stroke="#000"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* 绘制棋子 */}
        {board.map((row, x) =>
          row.map((cell, y) =>
            cell !== 0 && (
              <circle
                key={`${x}-${y}`}
                cx={20 + y * cellSize}
                cy={20 + x * cellSize}
                r="12"
                fill={cell === 1 ? '#000' : '#fff'}
                stroke="#000"
                strokeWidth="1"
              />
            )
          )
        )}
      </svg>
    </div>
  )
}

export default Board