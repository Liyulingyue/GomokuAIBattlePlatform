from fastapi import APIRouter
from ..models import SendMessageRequest
from ..shared import rooms
from .rooms import update_room_activity
import uuid

router = APIRouter()


@router.post("/send_message")
async def send_message(request: SendMessageRequest):
    room_id = request.room_id
    username = request.username
    message = request.message
    if room_id not in rooms:
        return {"success": False, "message": "房间不存在"}
    room = rooms[room_id]
    if username not in room["players"]:
        return {"success": False, "message": "不在房间中"}
    
    # 添加消息到房间消息列表
    room["messages"].append({
        "username": username,
        "message": message,
        "timestamp": str(uuid.uuid4())  # 简单的时间戳
    })
    
    # 只保留最近的10条消息
    if len(room["messages"]) > 10:
        room["messages"] = room["messages"][-10:]
    
    update_room_activity(room_id)
    return {"success": True}