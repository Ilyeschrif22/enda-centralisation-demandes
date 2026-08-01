from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.features.sheets_data.google_sheets import GoogleSheetsService
from app.features.sheets_data.service import build_sheet_content
from app.features.sheets_data.spring_mapper import map_row_to_prospect
from app.clients.spring_client import SpringClient
from app.features.sheets_data.service import get_raw_headers


router = APIRouter(prefix="/sheets", tags=["sheets"])


@router.get("/")
def get_sheet_responses():
    service = GoogleSheetsService()
    sheets = service.get_all_sheets()
    return {"sheets": sheets}


@router.get("/{spreadsheet_id}")
def get_sheet_content(spreadsheet_id: str, db: Session = Depends(get_db)):
    service = GoogleSheetsService()
    content = service.get_sheet_content(spreadsheet_id)
    result = build_sheet_content(db, content)
    return {"content": result}


def _build_mapped_rows(spreadsheet_id: str, db: Session) -> list[dict]:
    service = GoogleSheetsService()
    content = service.get_sheet_content(spreadsheet_id)
    result = build_sheet_content(db, content)

    all_rows = [row for tab in result for row in tab["rows"]]
    return [map_row_to_prospect(r) for r in all_rows]


@router.get("/{spreadsheet_id}/preview")
def preview_mapped_rows(spreadsheet_id: str, db: Session = Depends(get_db)):
    """Voir les données mappées telles qu'elles seront envoyées à Spring,
    sans réellement les envoyer."""
    mapped_rows = _build_mapped_rows(spreadsheet_id, db)
    return {"count": len(mapped_rows), "rows": mapped_rows}


@router.post("/{spreadsheet_id}/send")
def send_sheet_to_spring(spreadsheet_id: str, db: Session = Depends(get_db)):
    mapped_rows = _build_mapped_rows(spreadsheet_id, db)

    spring_client = SpringClient()
    response = spring_client.send_prospects(mapped_rows)

    return {
        "sent": len(mapped_rows),
        "rows": mapped_rows,
        "spring_response": response,
    }


@router.get("/{spreadsheet_id}/columns")
def get_sheet_columns(spreadsheet_id: str):
    service = GoogleSheetsService()
    content = service.get_sheet_content(spreadsheet_id)
    return {"columns": get_raw_headers(content)}