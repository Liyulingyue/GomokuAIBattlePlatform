import openai
from typing import Tuple

class GomokuBoard:
    def __init__(self, size=15):
        self.size = size
        self.board = [[0 for _ in range(size)] for _ in range(size)]
        self.current_player = 1  # 1 for black, 2 for white

    def make_move(self, x, y):
        if self.board[x][y] != 0:
            raise ValueError("Position already occupied")
        self.board[x][y] = self.current_player
        self.current_player = 3 - self.current_player  # Switch player

    def check_winner(self):
        # Check rows, columns, diagonals
        for i in range(self.size):
            for j in range(self.size):
                if self.board[i][j] != 0:
                    if self._check_line(i, j, 0, 1) or self._check_line(i, j, 1, 0) or self._check_line(i, j, 1, 1) or self._check_line(i, j, 1, -1):
                        return self.board[i][j]
        return 0  # No winner

    def _check_line(self, x, y, dx, dy):
        player = self.board[x][y]
        count = 1
        # Check in positive direction
        nx, ny = x + dx, y + dy
        while 0 <= nx < self.size and 0 <= ny < self.size and self.board[nx][ny] == player:
            count += 1
            nx += dx
            ny += dy
        # Check in negative direction
        nx, ny = x - dx, y - dy
        while 0 <= nx < self.size and 0 <= ny < self.size and self.board[nx][ny] == player:
            count += 1
            nx -= dx
            ny -= dy
        return count >= 5

    def get_board_state(self):
        return self.board

    def is_full(self):
        return all(all(cell != 0 for cell in row) for row in self.board)


def call_ai(board_state, player, api_key, model="gpt-3.5-turbo", url=""):
    try:
        client = openai.OpenAI(api_key=api_key, base_url=url if url else None)
        prompt = f"You are playing Gomoku on a 15x15 board. The board state is: {board_state}. 0 is empty, 1 is black, 2 is white. You are player {player}. Choose your next move as coordinates (x,y) where x and y are integers from 0 to 14. Respond only with the coordinates in the format (x,y)."
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10
        )
        move_str = response.choices[0].message.content.strip()
        # Parse (x,y)
        x, y = map(int, move_str.strip('()').split(','))
        return {'move': (x, y), 'log': f'AI player {player} chose ({x},{y})', 'error': None}
    except Exception as e:
        return {'move': None, 'log': f'AI player {player} error: {str(e)}', 'error': str(e)}


def simulate_battle(ai1_config, ai2_config):
    board = GomokuBoard()
    moves = []
    while True:
        current_player = board.current_player
        ai_config = ai1_config if current_player == 1 else ai2_config
        try:
            x, y = call_ai(board.get_board_state(), current_player, ai_config['key'], ai_config.get('model', 'gpt-3.5-turbo'), ai_config.get('url', ''))
            board.make_move(x, y)
            moves.append((x, y, current_player))
            winner = board.check_winner()
            if winner != 0:
                return {"winner": winner, "moves": moves}
            if board.is_full():
                return {"winner": 0, "moves": moves}  # Draw
        except Exception as e:
            return {"error": str(e), "moves": moves}