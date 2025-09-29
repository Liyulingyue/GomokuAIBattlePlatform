from fastapi import APIRouter
from ..models import SetAIConfigRequest, LockConfigRequest, SetReadyRequest, StepRequest, NextMoveRequest
from ..shared import rooms
from ..gomoku import call_ai
from .rooms import update_room_activity

router = APIRouter()


def check_winner(board):
    size = 15
    for i in range(size):
        for j in range(size):
            if board[i][j] != 0:
                player = board[i][j]
                if (
                    check_line(board, i, j, 0, 1, player) or
                    check_line(board, i, j, 1, 0, player) or
                    check_line(board, i, j, 1, 1, player) or
                    check_line(board, i, j, 1, -1, player)
                ):
                    return player
    return 0


def check_line(board, x, y, dx, dy, player):
    count = 1
    nx, ny = x + dx, y + dy
    while 0 <= nx < 15 and 0 <= ny < 15 and board[nx][ny] == player:
        count += 1
        nx += dx
        ny += dy
    nx, ny = x - dx, y - dy
    while 0 <= nx < 15 and 0 <= ny < 15 and board[nx][ny] == player:
        count += 1
        nx -= dx
        ny -= dy
    return count >= 5


def is_board_full(board):
    return all(all(cell != 0 for cell in row) for row in board)


@router.post("/set_ai_config")
async def set_ai_config(request: SetAIConfigRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    
    # 检查配置锁定状态
    is_locked = room["config_locked"].get(username, False)
    is_ready = room["ready_status"].get(username, False)
    
    if is_locked and not is_ready:
        # 已锁定但未整备，不允许修改
        return {"success": False, "message": "配置已锁定，请先解锁"}
    elif is_locked and is_ready:
        # 已锁定且已整备，检查剩余修改次数
        changes_left = room["config_changes_left"].get(username, 0)
        if changes_left <= 0:
            return {"success": False, "message": "修改次数已用完，请重新锁定配置"}
        room["config_changes_left"][username] = changes_left - 1
    
    room["ai_configs"][username] = request.ai_config.dict()
    update_room_activity(room_id)
    return {"success": True}


@router.post("/lock_config")
async def lock_config(request: LockConfigRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    
    # 检查是否已设置AI配置
    if username not in room["ai_configs"]:
        return {"success": False, "message": "请先设置AI配置"}
    
    if request.locked:
        # 锁定配置：设置锁定状态
        room["config_locked"][username] = True
        
        # 如果是从已整备状态重新锁定，且不是取消解锁操作，才扣除修改次数
        if room["ready_status"].get(username, False) and not request.cancel_unlock:
            changes_left = room["config_changes_left"].get(username, 3)
            if changes_left > 0:
                room["config_changes_left"][username] = changes_left - 1
    else:
        # 解锁配置：只解除锁定状态，不改变修改次数
        room["config_locked"][username] = False
    
    update_room_activity(room_id)
    return {"success": True}


@router.post("/set_ready")
async def set_ready(request: SetReadyRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    
    # 检查是否已设置AI配置
    if username not in room["ai_configs"]:
        return {"success": False, "message": "请先设置AI配置"}
    
    # 检查是否已锁定配置
    if not room["config_locked"].get(username, False):
        return {"success": False, "message": "请先锁定配置"}
    
    if request.ready:
        # 完成整备：只设置整备状态和修改次数
        room["ready_status"][username] = True
        room["config_changes_left"][username] = 3
    else:
        # 取消整备：只取消整备状态，重置修改次数
        room["ready_status"][username] = False
        room["config_changes_left"][username] = 0
    
    update_room_activity(room_id)
    return {"success": True}


@router.post("/step")
async def step(request: StepRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if len(room["players"]) != 2:
        return {"success": False, "message": "房间玩家不足"}
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    # 确定当前玩家
    current_player_index = room["current_player"] - 1
    current_username = room["players"][current_player_index]
    if username != current_username:
        return {"success": False, "message": "不是你的回合"}
    if room["winner"] != 0 or is_board_full(room["board"]):
        return {"success": False, "message": "游戏已结束"}
    if username not in room["ai_configs"]:
        return {"success": False, "message": "未设置AI配置"}
    
    # 检查AI配置是否已锁定
    if not room["config_locked"].get(username, False):
        return {"success": False, "message": "请先锁定AI配置才能开始对战"}
    
    # 检查双方是否都准备完毕（只有在对局开始前才需要检查）
    if not room["moves"]:  # 如果还没有下过棋，检查准备状态
        for player in room["players"]:
            if not room["ready_status"].get(player, False):
                return {"success": False, "message": "双方都需要先点击'整备完毕'才能开始对战"}
    
    ai_config = room["ai_configs"][username]
    # 调用AI
    result = call_ai(room["board"], room["current_player"], ai_config["key"], ai_config.get("model", "gpt-3.5-turbo"), ai_config.get("url", ""), room["error"] or "", ai_config.get("custom_prompt", ""))
    
    if result["error"]:
        room["logs"].append(result["log"])
        room["error"] = result["error"]
        update_room_activity(room_id)
        return {"success": False, "message": result["error"]}
    elif result["move"]:
        x, y = result["move"]
        # 检查坐标是否在棋盘范围内
        if not (0 <= x < 15 and 0 <= y < 15):
            room["logs"].append(f"{result['log']}，但位置 ({x},{y}) 超出棋盘范围")
            room["error"] = "坐标超出范围"
            update_room_activity(room_id)
            return {"success": False, "message": "坐标超出范围"}
        elif room["board"][x][y] != 0:
            room["logs"].append(f"{result['log']}，但位置 ({x},{y}) 已有棋子")
            room["error"] = "位置已被占用"
            update_room_activity(room_id)
            return {"success": False, "message": "位置已被占用"}
        else:
            room["logs"].append(result["log"])
            room["pending_move"] = {"x": x, "y": y}
            room["can_confirm"] = True
            room["error"] = None
            update_room_activity(room_id)
            return {"success": True, "pending_move": room["pending_move"]}
    else:
        room["logs"].append("AI未返回有效落子")
        update_room_activity(room_id)
        return {"success": False, "message": "AI未返回有效落子"}


# 确认落子接口
@router.post("/confirm_move")
async def confirm_move(request: StepRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    if not room["can_confirm"] or not room["pending_move"]:
        return {"success": False, "message": "无待确认落子"}
    
    x, y = room["pending_move"]["x"], room["pending_move"]["y"]
    room["board"][x][y] = room["current_player"]
    room["moves"].append({"x": x, "y": y, "player": room["current_player"]})
    
    winner = check_winner(room["board"])
    if winner != 0:
        room["winner"] = winner
    elif len(room["moves"]) >= 225:
        room["winner"] = 0  # 平局
    else:
        room["current_player"] = 3 - room["current_player"]
    
    room["pending_move"] = None
    room["can_confirm"] = False
    update_room_activity(room_id)
    return {"success": True}


@router.post("/next_move")
async def next_move(request: NextMoveRequest):
    """
    单机AI对战接口 - 用于Battle页面
    """
    ai_config = {
        "key": request.ai_config.key,
        "model": request.ai_config.model,
        "url": request.ai_config.url,
        "custom_prompt": request.ai_config.custom_prompt
    }
    
    # 调用AI获取下一步
    result = call_ai(
        board_state=request.board,
        player=request.current_player,
        api_key=ai_config["key"],
        model=ai_config["model"],
        url=ai_config["url"],
        error=request.error,
        custom_prompt=ai_config["custom_prompt"]
    )
    
    # 检查AI返回的坐标是否有效
    if result.get("move"):
        x, y = result["move"]
        # 检查坐标是否在棋盘范围内
        if not (0 <= x < 15 and 0 <= y < 15):
            return {
                "move": None,
                "log": f"AI返回了无效坐标 ({x},{y})，超出棋盘范围",
                "error": "坐标超出范围"
            }
        # 检查位置是否已被占用
        if request.board[x][y] != 0:
            return {
                "move": None,
                "log": f"AI返回了无效坐标 ({x},{y})，位置已被占用",
                "error": "位置已被占用"
            }
    
    return {
        "move": result.get("move"),
        "log": result.get("log", "AI正在思考..."),
        "error": result.get("error")
    }