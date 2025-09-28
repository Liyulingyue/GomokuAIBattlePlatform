from typing import Literal
from pydantic import BaseModel, Field


class AIConfig(BaseModel):
    url: str = ""
    key: str
    model: str = "gpt-3.5-turbo"
    custom_prompt: str = Field(default="", max_length=200)


class NextMoveRequest(BaseModel):
    board: list[list[int]]
    current_player: int
    ai_config: AIConfig
    error: str = ""
    custom_prompt: str = ""


class UpdateUsernameRequest(BaseModel):
    old_username: str
    new_username: str


class CreateRoomRequest(BaseModel):
    username: str


class JoinRoomRequest(BaseModel):
    room_id: str
    username: str


class LeaveRoomRequest(BaseModel):
    room_id: str
    username: str


class DeleteRoomRequest(BaseModel):
    room_id: str
    username: str


class StepRequest(BaseModel):
    room_id: str
    username: str


class SendMessageRequest(BaseModel):
    room_id: str
    username: str
    message: str


class SetReadyRequest(BaseModel):
    room_id: str
    username: str
    ready: bool


class SetAIConfigRequest(BaseModel):
    room_id: str
    username: str
    ai_config: AIConfig


class LockConfigRequest(BaseModel):
    room_id: str
    username: str
    locked: bool
    cancel_unlock: bool = False


class SetOwnerColorRequest(BaseModel):
    room_id: str
    username: str
    color: Literal['black', 'white']