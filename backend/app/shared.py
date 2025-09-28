import time
import uuid


# 全局存储
used_usernames = set()
# session_id -> {"username": str, "created_at": float, "last_activity": float}
user_sessions = {}
rooms = {}  # room_id -> room_data

# 会话清理配置
SESSION_TIMEOUT_SECONDS = 3600  # 1小时无活动清理
SESSION_MAX_LIFETIME_SECONDS = 86400  # 24小时最长存活


def _upgrade_session_structure(session_id: str, value):
	"""确保旧结构的session数据升级为带时间戳的字典格式"""
	if isinstance(value, dict):
		return value

	now = time.time()
	upgraded = {
		"username": value,
		"created_at": now,
		"last_activity": now,
	}
	user_sessions[session_id] = upgraded
	return upgraded


def register_session(session_id: str, username: str) -> None:
	now = time.time()
	user_sessions[session_id] = {
		"username": username,
		"created_at": now,
		"last_activity": now,
	}


def touch_sessions_by_username(username: str) -> None:
	now = time.time()
	for session_id, session in list(user_sessions.items()):
		session = _upgrade_session_structure(session_id, session)
		if session["username"] == username:
			session["last_activity"] = now


def update_sessions_username(old_username: str, new_username: str) -> None:
	now = time.time()
	for session_id, session in list(user_sessions.items()):
		session = _upgrade_session_structure(session_id, session)
		if session["username"] == old_username:
			session["username"] = new_username
			session["last_activity"] = now


def _is_username_active(username: str) -> bool:
	# 检查是否仍有其他会话使用该用户名
	for session in user_sessions.values():
		if isinstance(session, dict) and session.get("username") == username:
			return True
	# 检查是否仍在任何房间内
	for room in rooms.values():
		if username in room.get("players", []):
			return True
	return False


def cleanup_inactive_users() -> dict:
	"""清理由于长期无活动或超时的会话及对应用户名"""
	now = time.time()
	removed_sessions = []

	for session_id, session in list(user_sessions.items()):
		session = _upgrade_session_structure(session_id, session)
		last_activity = session.get("last_activity", session.get("created_at", now))
		created_at = session.get("created_at", now)

		if (now - last_activity) > SESSION_TIMEOUT_SECONDS or (now - created_at) > SESSION_MAX_LIFETIME_SECONDS:
			removed_sessions.append((session_id, session["username"]))
			del user_sessions[session_id]

	removed_usernames = set()
	for _, username in removed_sessions:
		if not _is_username_active(username):
			if username in used_usernames:
				used_usernames.remove(username)
				removed_usernames.add(username)

	return {
		"sessions_removed": len(removed_sessions),
		"usernames_removed": len(removed_usernames),
	}



def ensure_username_registered(username: str) -> None:
	"""确保用户名已在系统中注册并保持活跃状态"""
	if not username:
		return

	now = time.time()
	found_session = False
	for session_id, session in list(user_sessions.items()):
		session = _upgrade_session_structure(session_id, session)
		if session["username"] == username:
			session["last_activity"] = now
			found_session = True

	if username not in used_usernames:
		used_usernames.add(username)

	if not found_session:
		session_id = str(uuid.uuid4())
		register_session(session_id, username)