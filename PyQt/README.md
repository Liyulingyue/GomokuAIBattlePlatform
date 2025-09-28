# 五子棋AI对战平台

## 什么是五子棋

五子棋是一种两人对弈的策略棋类游戏，通常在15x15的棋盘上进行。玩家轮流在棋盘上放置棋子，先在横、竖或斜线上连成五子的一方获胜。五子棋规则简单，但策略丰富，深受玩家喜爱。

## 项目机制

本项目是一个基于PyQt的五子棋对战应用，支持人类玩家与AI进行对战。用户可以配置AI为黑方或白方，AI会自动调用大语言模型API进行落子决策。游戏流程如下：

1. 用户选择AI方（黑方、白方或无AI）
2. 配置AI参数：API Key、模型、URL、自定义提示词
3. 开始游戏后，轮流落子
4. AI行动时自动调用API，如果出错会重试
5. 人类行动时点击棋盘落子
6. 游戏结束时弹出胜负结果

## 部署21BA3BThinking模型

本项目使用大语言模型作为AI对手，支持OpenAI兼容API。推荐使用百度文心一言Ernie 4.5系列模型，以下为部署方法：

1. 访问百度AI Studio部署页面 [https://aistudio.baidu.com/deploy/mine](https://aistudio.baidu.com/deploy/mine) 
2. 点击 `新建部署`，选择 `ERNIE-4.5-21B-A3B-Thinking` 创建服务
3. 获取API Key和调用URL，配置到应用中

默认配置：
- URL: https://aistudio.baidu.com/llm/lmapi/v3
- Model: ernie-3.5-8k

## 应用实现

### 提示词设计

AI的落子决策通过精心设计的提示词实现。提示词包含：

- 游戏规则说明
- 当前棋盘状态
- 玩家信息
- 落子要求（仅返回JSON格式坐标）
- 错误处理

核心提示词代码位于`gomoku.py`的`get_prompt`函数：

```python
def get_prompt(board_state, player, error="", custom_prompt=""):
    occupied_black = [(i, j) for i in range(15) for j in range(15) if board_state[i][j] == 1]
    occupied_white = [(i, j) for i in range(15) for j in range(15) if board_state[i][j] == 2]
    prompt = f"""
    You are playing Gomoku on a 15x15 board. You need to choose your next move.

    # Requirements:
    1. Respond only with ```json\n{{"x": int, "y": int}}\n```
    2. Choose an empty position (0). 
    3. Occupied positions (1 or 2) cannot be chosen.
    4. Do not include any explanations or additional text.
    5. The x and y coordinates should be integers between 0 and 14.
    
    # Information:
    1. The board state is: {board_state}. 
    2. You are player {player}. 
    3. The following positions are occupied by player 1 (black): {occupied_black}.
    4. The following positions are occupied by player 2 (white): {occupied_white}.
    """
    if error:
        prompt += f"\n    Previous error: {error}\n"
    if custom_prompt:
        prompt += f"\n    Custom instructions: {custom_prompt}\n"
    return prompt
```

### 核心代码

项目采用PyQt6构建GUI，主要文件：

- `main.py`: 主应用窗口，包含棋盘绘制、用户交互、AI调用
- `gomoku.py`: 游戏逻辑、棋盘状态管理、AI提示词生成
- `ai.py`: AI API调用逻辑

关键组件：

1. **BoardWidget**: 自定义棋盘绘制和鼠标事件处理
2. **GomokuBoard**: 棋盘状态类，落子、胜负判断
3. **AI调用**: 使用threading异步调用API，避免界面冻结

运行方式（需要本地）：
```bash
pip install -r requirements.txt
python main.py
```

该项目展示了如何将大语言模型集成到桌面应用中，实现智能对战功能。

## 核心页面交互代码
```python
import sys
from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit, QComboBox, QMessageBox, QTextEdit
from PyQt6.QtGui import QPainter, QPen, QBrush, QColor
from PyQt6.QtCore import Qt, QPoint
from gomoku import GomokuBoard
from ai import call_ai
import threading

class BoardWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.board_size = 15
        self.cell_size = 30
        self.margin = 20
        self.hover_pos = None
        self.setMouseTracking(True)  # Enable mouse tracking
        self.setFixedSize(self.board_size * self.cell_size + 2 * self.margin, self.board_size * self.cell_size + 2 * self.margin)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Draw grid
        pen = QPen(QColor(0, 0, 0), 1)
        painter.setPen(pen)
        for i in range(self.board_size + 1):
            # Horizontal lines
            painter.drawLine(self.margin, self.margin + i * self.cell_size, self.margin + self.board_size * self.cell_size, self.margin + i * self.cell_size)
            # Vertical lines
            painter.drawLine(self.margin + i * self.cell_size, self.margin, self.margin + i * self.cell_size, self.margin + self.board_size * self.cell_size)

        # Draw stones
        board = self.parent().board
        for x in range(self.board_size):
            for y in range(self.board_size):
                if board.board[x][y] != 0:
                    color = QColor(0, 0, 0) if board.board[x][y] == 1 else QColor(255, 255, 255)
                    painter.setBrush(QBrush(color))
                    painter.setPen(QPen(color, 1))
                    center_x = self.margin + y * self.cell_size
                    center_y = self.margin + x * self.cell_size
                    painter.drawEllipse(center_x - 12, center_y - 12, 24, 24)

        # Draw hover hint
        if self.hover_pos and self.parent().board.board[self.hover_pos[0]][self.hover_pos[1]] == 0:
            x, y = self.hover_pos
            center_x = self.margin + y * self.cell_size
            center_y = self.margin + x * self.cell_size
            painter.setBrush(QBrush(QColor(255, 0, 0, 100)))  # Semi-transparent red
            painter.setPen(QPen(QColor(255, 0, 0, 150), 2))
            painter.drawEllipse(center_x - 12, center_y - 12, 24, 24)

    def mouseMoveEvent(self, event):
        x = (event.pos().y() - self.margin) // self.cell_size
        y = (event.pos().x() - self.margin) // self.cell_size
        if 0 <= x < self.board_size and 0 <= y < self.board_size:
            self.hover_pos = (x, y)
        else:
            self.hover_pos = None
        self.repaint()

    def leaveEvent(self, event):
        self.hover_pos = None
        self.repaint()

    def mousePressEvent(self, event):
        parent = self.parent()
        if not parent.game_started or parent.board.check_winner() != 0 or parent.board.is_full():
            return

        if parent.board.current_player == parent.ai_player:
            return  # AI's turn

        x = (event.pos().y() - self.margin) // self.cell_size
        y = (event.pos().x() - self.margin) // self.cell_size

        if 0 <= x < self.board_size and 0 <= y < self.board_size and parent.board.board[x][y] == 0:
            try:
                parent.board.make_move(x, y)
                parent.update_status()
                self.repaint()
                parent.check_game_end()
                if parent.board.current_player == parent.ai_player and not parent.board.check_winner() and not parent.board.is_full():
                    parent.ai_move()
            except ValueError:
                pass

class GomokuWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.board_size = 15
        self.cell_size = 30
        self.margin = 20
        self.board = GomokuBoard(self.board_size)
        self.ai_player = None  # 1 for black, 2 for white, None for human vs human
        self.ai_config = {'key': '', 'model': 'ernie-3.5-8k', 'url': 'https://aistudio.baidu.com/llm/lmapi/v3', 'custom_prompt': ''}
        self.game_started = False
        self.pending_move = None
        self.game_over_shown = False
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle('五子棋对战')
        self.setGeometry(100, 100, 1000, 600)  # Increased width

        main_layout = QHBoxLayout()

        # Left side: config, buttons, status, board
        left_layout = QVBoxLayout()

        # AI config
        config_layout = QHBoxLayout()
        config_layout.addWidget(QLabel('AI 方:'))
        self.ai_side_combo = QComboBox()
        self.ai_side_combo.addItems(['无', '黑方', '白方'])
        config_layout.addWidget(self.ai_side_combo)

        config_layout.addWidget(QLabel('API Key:'))
        self.api_key_edit = QLineEdit()
        config_layout.addWidget(self.api_key_edit)

        config_layout.addWidget(QLabel('Model:'))
        self.model_edit = QLineEdit('ernie-3.5-8k')
        config_layout.addWidget(self.model_edit)

        config_layout.addWidget(QLabel('URL:'))
        self.url_edit = QLineEdit('https://aistudio.baidu.com/llm/lmapi/v3')
        config_layout.addWidget(self.url_edit)

        left_layout.addLayout(config_layout)

        # Buttons
        button_layout = QHBoxLayout()
        self.start_button = QPushButton('开始游戏')
        self.start_button.clicked.connect(self.start_game)
        button_layout.addWidget(self.start_button)

        self.reset_button = QPushButton('重新开始')
        self.reset_button.clicked.connect(self.reset_game)
        button_layout.addWidget(self.reset_button)

        left_layout.addLayout(button_layout)

        # Status
        self.status_label = QLabel('请选择AI配置并开始游戏')
        left_layout.addWidget(self.status_label)

        # Board
        self.board_widget = BoardWidget(self)
        left_layout.addWidget(self.board_widget)

        main_layout.addLayout(left_layout)

        # Right side: custom prompt
        right_layout = QVBoxLayout()
        right_layout.addWidget(QLabel('Custom Prompt:'))
        self.custom_prompt_edit = QTextEdit()
        self.custom_prompt_edit.setPlaceholderText('输入自定义提示词...')
        right_layout.addWidget(self.custom_prompt_edit)

        main_layout.addLayout(right_layout)

        self.setLayout(main_layout)

    def start_game(self):
        ai_side = self.ai_side_combo.currentText()
        self.ai_player = {'黑方': 1, '白方': 2}.get(ai_side, None)
        self.ai_config['key'] = self.api_key_edit.text()
        self.ai_config['model'] = self.model_edit.text()
        self.ai_config['url'] = self.url_edit.text()
        self.ai_config['custom_prompt'] = self.custom_prompt_edit.toPlainText()

        if self.ai_player and not self.ai_config['key']:
            QMessageBox.warning(self, '配置错误', '请提供API Key')
            return

        self.game_started = True
        self.board = GomokuBoard(self.board_size)
        self.pending_move = None
        self.update_status()
        self.board_widget.repaint()

        if self.board.current_player == self.ai_player:
            self.ai_move()

    def reset_game(self):
        self.game_started = False
        self.board = GomokuBoard(self.board_size)
        self.pending_move = None
        self.game_over_shown = False
        self.update_status()
        self.board_widget.repaint()

    def update_status(self):
        if self.board.check_winner() != 0:
            winner = '黑方' if self.board.check_winner() == 1 else '白方'
            self.status_label.setText(f'游戏结束，胜者: {winner}')
            if not self.game_over_shown:
                QMessageBox.information(self, '游戏结束', f'{winner}获胜！')
                self.game_over_shown = True
        elif self.board.is_full():
            self.status_label.setText('游戏结束，平局')
            if not self.game_over_shown:
                QMessageBox.information(self, '游戏结束', '平局！')
                self.game_over_shown = True
        else:
            current = '黑方' if self.board.current_player == 1 else '白方'
            if self.board.current_player == self.ai_player:
                self.status_label.setText(f'当前玩家: AI ({current})')
            else:
                self.status_label.setText(f'当前玩家: 人类 ({current})')

    def check_game_end(self):
        if self.board.check_winner() != 0 or self.board.is_full():
            self.game_started = False

    def ai_move(self):
        def run_ai():
            error = ""
            while True:
                result = call_ai(self.board.get_board_state(), self.board.current_player, self.ai_config['key'], self.ai_config['model'], self.ai_config['url'], error)
                if result['error']:
                    error = result['error']
                    continue  # Retry
                else:
                    x, y = result['move']
                    if self.board.board[x][y] == 0:
                        try:
                            self.board.make_move(x, y)
                            self.update_status()
                            self.board_widget.repaint()
                            self.check_game_end()
                            break
                        except ValueError:
                            error = "Position occupied"
                            continue
                    else:
                        error = "Position occupied"
                        continue

        threading.Thread(target=run_ai).start()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = GomokuWidget()
    window.show()
    sys.exit(app.exec())

```