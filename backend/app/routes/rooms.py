from fastapi import APIRouter
from ..models import CreateRoomRequest, JoinRoomRequest, LeaveRoomRequest
from ..shared import used_usernames, rooms
import uuid

router = APIRouter()


def init_room():
    return {
        "players": [],
        "board": [[0 for _ in range(15)] for _ in range(15)],
        "current_player": 1,
        "ai_configs": {},
        "moves": [],
        "winner": 0,
        "logs": [],
        "messages": [],
        "pending_move": None,
        "can_confirm": False,
        "error": None,
        "ready_status": {},  # 玩家准备状态 {username: True/False}
        "config_locked": {},  # 玩家配置锁定状态 {username: True/False}
        "config_changes_left": {}  # 玩家剩余配置修改次数 {username: count}
    }


@router.post("/create_room")
async def create_room(request: CreateRoomRequest):
    username = request.username
    if username not in used_usernames:
        return {"success": False, "message": "用户名不存在"}
    room_id = str(uuid.uuid4())
    rooms[room_id] = init_room()
    rooms[room_id]["players"].append(username)
    return {"success": True, "room_id": room_id}


@router.post("/join_room")
async def join_room(request: JoinRoomRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if len(room["players"]) >= 2:
        return {"success": False, "message": "房间已满"}
    if username in room["players"]:
        return {"success": False, "message": "已在房间中"}
    if username not in used_usernames:
        return {"success": False, "message": "用户名不存在"}
    room["players"].append(username)
    return {"success": True}


@router.get("/room/{room_id}")
async def get_room(room_id: str):
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    return {"success": True, "room": rooms[room_id]}


@router.post("/leave_room")
async def leave_room(request: LeaveRoomRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    room["players"].remove(username)
    if username in room["ai_configs"]:
        del room["ai_configs"][username]
    if len(room["players"]) == 0:
        del rooms[room_id]
    return {"success": True}