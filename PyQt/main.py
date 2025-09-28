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