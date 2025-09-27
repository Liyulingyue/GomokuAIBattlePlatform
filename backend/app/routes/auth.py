from fastapi import APIRouter, HTTPException
from ..models import UpdateUsernameRequest
from ..shared import used_usernames, user_sessions
import uuid
import re
import random
import string

router = APIRouter()


def generate_unique_username():
    while True:
        # 生成随机英文用户名
        length = random.randint(5, 10)
        username = ''.join(random.choices(string.ascii_letters, k=length))
        if username not in used_usernames:
            used_usernames.add(username)
            return username


def is_valid_username(username: str):
    return re.match(r'^[a-zA-Z]+$', username) and len(username) <= 20


@router.post("/login")
async def login():
    session_id = str(uuid.uuid4())
    username = generate_unique_username()
    user_sessions[session_id] = username
    return {"session_id": session_id, "username": username}


@router.post("/update_username")
async def update_username(request: UpdateUsernameRequest):
    old_username = request.old_username
    new_username = request.new_username
    if not is_valid_username(new_username):
        return {"success": False, "message": "用户名只能包含英文字母，且长度不超过20"}
    
    # 如果原用户名不存在，说明可能是新用户或session失效
    if old_username not in used_usernames:
        # 为新用户生成唯一用户名
        base_username = new_username
        unique_username = base_username
        counter = 1
        while unique_username in used_usernames:
            unique_username = f"{base_username}{counter}"
            counter += 1
            if len(unique_username) > 20:  # 确保不超过长度限制
                unique_username = base_username[:17] + str(counter)
        
        used_usernames.add(unique_username)
        # 更新session记录
        for sid, uname in user_sessions.items():
            if uname == old_username:
                user_sessions[sid] = unique_username
        message = f"用户名已设置为: {unique_username}" if unique_username != base_username else "用户名设置成功"
        return {"success": True, "username": unique_username, "message": message}
    
    # 原用户名存在，正常更新
    if new_username in used_usernames and new_username != old_username:
        return {"success": False, "message": "用户名已被使用"}
    used_usernames.remove(old_username)
    used_usernames.add(new_username)
    # 更新session
    for sid, uname in user_sessions.items():
        if uname == old_username:
            user_sessions[sid] = new_username
    return {"success": True, "username": new_username}