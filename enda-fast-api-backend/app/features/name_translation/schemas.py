from pydantic import BaseModel


class TranslateRequest(BaseModel):
    name: str


class TranslateResponse(BaseModel):
    original: str
    traduit: str