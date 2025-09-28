import openai
import json
from gomoku import get_prompt, extract_json_content

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
            move_data = json_data[0] if isinstance(json_data, list) and json_data else json_data
        else:
            move_data = json.loads(move_str)
        x, y = move_data['x'], move_data['y']
        return {'move': (x, y), 'log': f'AI player {player} chose ({x},{y})', 'error': None}
    except Exception as e:
        return {'move': None, 'log': f'AI player {player} error: {str(e)}', 'error': str(e)}