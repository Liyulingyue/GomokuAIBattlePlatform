import openai
import json
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


def extract_json_content(text):
    """
    从模型返回结果中提取JSON内容

    参数：
        text (str): 模型返回的原始文本

    返回：
        list: 解析后的QA对列表
    """
    # 检查是否是思考模型的输出，如果存在</think>标签，则只取后半部分
    if "</think>" in text:
        text = text.split("</think>")[-1]

    start_marker = "```json"
    end_marker = "```"

    # 找到起始和结束标记的位置
    start_index = text.find(start_marker)
    end_index = text.find(end_marker, start_index + len(start_marker))

    # 如果找到了标记，则提取JSON部分
    if start_index != -1 and end_index != -1:
        json_content = text[start_index + len(start_marker) : end_index].strip()

        # 使用json将字符串形式的列表转换为Python列表
        try:
            json_list = json.loads(json_content)
            return json_list
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            return []
    else:
        return []

def get_prompt(board_state, player, error="", custom_prompt=""):
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
    3. The following positions are occupied by player 1 (black): {[(i, j) for i in range(15) for j in range(15) if board_state[i][j] == 1]}.
    4. The following positions are occupied by player 2 (white): {[(i, j) for i in range(15) for j in range(15) if board_state[i][j] == 2]}.
    """
    if error:
        prompt += f"\n    Previous error: {error}\n"
    if custom_prompt:
        prompt += f"\n    Custom instructions: {custom_prompt}\n"
    return prompt

def call_ai(board_state, player, api_key, model="gpt-3.5-turbo", url="", error="", custom_prompt=""):
    try:
        client = openai.OpenAI(api_key=api_key, base_url=url if url else None)
        prompt = get_prompt(board_state, player, error, custom_prompt)
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50
        )
        move_str = response.choices[0].message.content
        print(move_str)
        # Try to extract JSON content
        json_data = extract_json_content(move_str)
        if json_data:
            # Assume the first item is the move data
            move_data = json_data[0] if isinstance(json_data, list) and json_data else json_data
        else:
            # Fallback to direct JSON parse
            move_data = json.loads(move_str)
        x, y = move_data['x'], move_data['y']
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