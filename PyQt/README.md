# ������AI��սƽ̨

## ʲô��������

��������һ�����˶��ĵĲ���������Ϸ��ͨ����15x15�������Ͻ��С���������������Ϸ������ӣ����ںᡢ����б�����������ӵ�һ����ʤ�����������򵥣������Էḻ���������ϲ����

## ��Ŀ����

����Ŀ��һ������PyQt���������սӦ�ã�֧�����������AI���ж�ս���û���������AIΪ�ڷ���׷���AI���Զ����ô�����ģ��API�������Ӿ��ߡ���Ϸ�������£�

1. �û�ѡ��AI�����ڷ����׷�����AI��
2. ����AI������API Key��ģ�͡�URL���Զ�����ʾ��
3. ��ʼ��Ϸ����������
4. AI�ж�ʱ�Զ�����API��������������
5. �����ж�ʱ�����������
6. ��Ϸ����ʱ����ʤ�����

## ����21BA3BThinkingģ��

����Ŀʹ�ô�����ģ����ΪAI���֣�֧��OpenAI����API���Ƽ�ʹ�ðٶ�����һ��Ernie 4.5ϵ��ģ�ͣ�����Ϊ���𷽷���

1. ���ʰٶ�AI Studio����ҳ�� [https://aistudio.baidu.com/deploy/mine](https://aistudio.baidu.com/deploy/mine) 
2. ��� `�½�����`��ѡ�� `ERNIE-4.5-21B-A3B-Thinking` ��������
3. ��ȡAPI Key�͵���URL�����õ�Ӧ����

Ĭ�����ã�
- URL: https://aistudio.baidu.com/llm/lmapi/v3
- Model: ernie-3.5-8k

## Ӧ��ʵ��

### ��ʾ�����

AI�����Ӿ���ͨ��������Ƶ���ʾ��ʵ�֡���ʾ�ʰ�����

- ��Ϸ����˵��
- ��ǰ����״̬
- �����Ϣ
- ����Ҫ�󣨽�����JSON��ʽ���꣩
- ������

������ʾ�ʴ���λ��`gomoku.py`��`get_prompt`������

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

### ���Ĵ���

��Ŀ����PyQt6����GUI����Ҫ�ļ���

- `main.py`: ��Ӧ�ô��ڣ��������̻��ơ��û�������AI����
- `gomoku.py`: ��Ϸ�߼�������״̬����AI��ʾ������
- `ai.py`: AI API�����߼�

�ؼ������

1. **BoardWidget**: �Զ������̻��ƺ�����¼�����
2. **GomokuBoard**: ����״̬�࣬���ӡ�ʤ���ж�
3. **AI����**: ʹ��threading�첽����API��������涳��

���з�ʽ����Ҫ���أ���
```bash
pip install -r requirements.txt
python main.py
```

����Ŀչʾ����ν�������ģ�ͼ��ɵ�����Ӧ���У�ʵ�����ܶ�ս���ܡ�

## ����ҳ�潻������
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
        self.setWindowTitle('�������ս')
        self.setGeometry(100, 100, 1000, 600)  # Increased width

        main_layout = QHBoxLayout()

        # Left side: config, buttons, status, board
        left_layout = QVBoxLayout()

        # AI config
        config_layout = QHBoxLayout()
        config_layout.addWidget(QLabel('AI ��:'))
        self.ai_side_combo = QComboBox()
        self.ai_side_combo.addItems(['��', '�ڷ�', '�׷�'])
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
        self.start_button = QPushButton('��ʼ��Ϸ')
        self.start_button.clicked.connect(self.start_game)
        button_layout.addWidget(self.start_button)

        self.reset_button = QPushButton('���¿�ʼ')
        self.reset_button.clicked.connect(self.reset_game)
        button_layout.addWidget(self.reset_button)

        left_layout.addLayout(button_layout)

        # Status
        self.status_label = QLabel('��ѡ��AI���ò���ʼ��Ϸ')
        left_layout.addWidget(self.status_label)

        # Board
        self.board_widget = BoardWidget(self)
        left_layout.addWidget(self.board_widget)

        main_layout.addLayout(left_layout)

        # Right side: custom prompt
        right_layout = QVBoxLayout()
        right_layout.addWidget(QLabel('Custom Prompt:'))
        self.custom_prompt_edit = QTextEdit()
        self.custom_prompt_edit.setPlaceholderText('�����Զ�����ʾ��...')
        right_layout.addWidget(self.custom_prompt_edit)

        main_layout.addLayout(right_layout)

        self.setLayout(main_layout)

    def start_game(self):
        ai_side = self.ai_side_combo.currentText()
        self.ai_player = {'�ڷ�': 1, '�׷�': 2}.get(ai_side, None)
        self.ai_config['key'] = self.api_key_edit.text()
        self.ai_config['model'] = self.model_edit.text()
        self.ai_config['url'] = self.url_edit.text()
        self.ai_config['custom_prompt'] = self.custom_prompt_edit.toPlainText()

        if self.ai_player and not self.ai_config['key']:
            QMessageBox.warning(self, '���ô���', '���ṩAPI Key')
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
            winner = '�ڷ�' if self.board.check_winner() == 1 else '�׷�'
            self.status_label.setText(f'��Ϸ������ʤ��: {winner}')
            if not self.game_over_shown:
                QMessageBox.information(self, '��Ϸ����', f'{winner}��ʤ��')
                self.game_over_shown = True
        elif self.board.is_full():
            self.status_label.setText('��Ϸ������ƽ��')
            if not self.game_over_shown:
                QMessageBox.information(self, '��Ϸ����', 'ƽ�֣�')
                self.game_over_shown = True
        else:
            current = '�ڷ�' if self.board.current_player == 1 else '�׷�'
            if self.board.current_player == self.ai_player:
                self.status_label.setText(f'��ǰ���: AI ({current})')
            else:
                self.status_label.setText(f'��ǰ���: ���� ({current})')

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