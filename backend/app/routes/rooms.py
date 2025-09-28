from fastapi import APIRouter
from ..models import CreateRoomRequest, JoinRoomRequest, LeaveRoomRequest, DeleteRoomRequest
from ..shared import used_usernames, rooms, ensure_username_registered
import uuid
import time

router = APIRouter(prefix="/rooms", tags=["rooms"])


def init_room():
    return {
        "players": [],
        "owner": None,
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
        "config_changes_left": {},  # 玩家剩余配置修改次数 {username: count}
        "created_at": time.time(),  # 房间创建时间戳
        "last_activity": time.time(),  # 最后活动时间戳
        "max_players": 2,
    }


def update_room_activity(room_id: str):
    """更新房间最后活动时间"""
    if room_id in rooms:
        rooms[room_id]["last_activity"] = time.time()


def get_room_id_by_username(username: str) -> str | None:
    for room_id, room in rooms.items():
        if username in room.get("players", []):
            return room_id
    return None


def cleanup_inactive_rooms():
    """清理非活跃房间"""
    current_time = time.time()
    inactive_timeout = 3600  # 1小时无活动
    empty_timeout = 300      # 5分钟空房间
    
    rooms_to_delete = []
    
    for room_id, room in rooms.items():
        # 空房间清理
        if len(room["players"]) == 0:
            if current_time - room["created_at"] > empty_timeout:
                rooms_to_delete.append(room_id)
        # 非活跃房间清理（有玩家但长时间无活动）
        elif current_time - room["last_activity"] > inactive_timeout:
            rooms_to_delete.append(room_id)
    
    for room_id in rooms_to_delete:
        del rooms[room_id]
    
    return len(rooms_to_delete)


@router.post("/cleanup")
async def cleanup_rooms():
    """手动触发房间清理"""
    deleted_count = cleanup_inactive_rooms()
    return {"success": True, "deleted_rooms": deleted_count}


@router.get("")
async def list_rooms():
    cleanup_inactive_rooms()
    room_list = []
    for room_id, room in rooms.items():
        room_list.append({
            "room_id": room_id,
            "players": room["players"],
            "player_count": len(room["players"]),
            "max_players": room.get("max_players", 2),
            "created_at": room.get("created_at"),
            "last_activity": room.get("last_activity"),
            "owner": room.get("owner"),
        })
    room_list.sort(key=lambda item: item["created_at"], reverse=True)
    return {"success": True, "rooms": room_list}


@router.post("/create")
async def create_room(request: CreateRoomRequest):
    username = request.username
    ensure_username_registered(username)
    if username not in used_usernames:
        return {"success": False, "message": "用户名不存在"}

    existing_room_id = get_room_id_by_username(username)
    if existing_room_id:
        update_room_activity(existing_room_id)
        return {
            "success": True,
            "room_id": existing_room_id,
            "already_in_room": True,
            "message": "已存在的房间，正在为您跳转"
        }
    
    # 创建房间前先清理非活跃房间
    cleanup_inactive_rooms()
    
    room_id = str(uuid.uuid4())
    rooms[room_id] = init_room()
    rooms[room_id]["players"].append(username)
    rooms[room_id]["owner"] = username
    update_room_activity(room_id)
    return {"success": True, "room_id": room_id}


@router.post("/join")
async def join_room(request: JoinRoomRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    ensure_username_registered(username)
    if username not in used_usernames:
        return {"success": False, "message": "用户名不存在"}

    existing_room_id = get_room_id_by_username(username)
    if existing_room_id:
        if existing_room_id == room_id:
            update_room_activity(room_id)
            return {"success": True, "room_id": room_id, "message": "已在房间中"}
        return {"success": False, "message": "您已在其它房间，请先离开后再加入新的房间"}

    if len(room["players"]) >= room.get("max_players", 2):
        return {"success": False, "message": "房间已满"}

    room["players"].append(username)
    update_room_activity(room_id)
    return {"success": True, "room_id": room_id}


@router.get("/{room_id}")
async def get_room(room_id: str):
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    update_room_activity(room_id)
    return {"success": True, "room": rooms[room_id]}


@router.post("/leave")
async def leave_room(request: LeaveRoomRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    ensure_username_registered(username)
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    room["players"].remove(username)
    if username in room["ai_configs"]:
        del room["ai_configs"][username]
    update_room_activity(room_id)
    if len(room["players"]) == 0:
        del rooms[room_id]
        return {"success": True}

    if room.get("owner") == username:
        room["owner"] = room["players"][0]
    return {"success": True}


@router.post("/delete")
async def delete_room(request: DeleteRoomRequest):
    room_id = request.room_id
    username = request.username
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    ensure_username_registered(username)
    if room.get("owner") != username:
        return {"success": False, "message": "仅房主可以解散房间"}
    del rooms[room_id]
    return {"success": True}