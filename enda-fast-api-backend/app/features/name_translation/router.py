from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from .schemas import TranslateRequest, TranslateResponse
from .service import translate_full_name

router = APIRouter(prefix="/names", tags=["names"])


@router.post("/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest, db: Session = Depends(get_db)):
    traduit = translate_full_name(db, payload.name)
    return {"original": payload.name, "traduit": traduit}