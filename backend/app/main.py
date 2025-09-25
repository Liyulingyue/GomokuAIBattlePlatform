from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .gomoku import call_ai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIConfig(BaseModel):
    url: str = ""
    key: str
    model: str = "gpt-3.5-turbo"

class NextMoveRequest(BaseModel):
    board: list[list[int]]
    current_player: int
    ai_config: AIConfig
    error: str = ""
    custom_prompt: str = ""

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.post("/next_move")
async def next_move(request: NextMoveRequest):
    result = call_ai(request.board, request.current_player, request.ai_config.key, request.ai_config.model, request.ai_config.url, request.error, request.custom_prompt)
    return result