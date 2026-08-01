import json
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.features.sheets_data.google_sheets import GoogleSheetsService
from app.features.sheets_data.service import build_sheet_content
from app.features.sheets_data.spring_mapper import map_row_to_prospect
from app.features.sheets_data.canal_mapping import SPREADSHEET_CANAL_MAP
from app.clients.spring_client import SpringClient


logger = logging.getLogger(__name__)


def sync_google_sheet():
    db: Session = SessionLocal()

    try:
        service = GoogleSheetsService()
        spring_client = SpringClient()

        for spreadsheet_id, canal in SPREADSHEET_CANAL_MAP.items():

            content = service.get_sheet_content(spreadsheet_id)
            result = build_sheet_content(db, content)

            all_rows = [
                row
                for tab in result
                for row in tab["rows"]
            ]

            mapped_rows = [map_row_to_prospect(row, canal) for row in all_rows]

            # TEMP DEBUG: print always hits stdout regardless of logging
            # config, unlike logger.info which needs level=INFO configured
            # somewhere at startup. Remove once the logging setup is confirmed.
            print(
                f"[Scheduler] canal={canal} count={len(mapped_rows)} payload=",
                json.dumps(mapped_rows, ensure_ascii=False, default=str),
                flush=True,
            )

            try:
                response = spring_client.send_prospects(mapped_rows)
                print(
                    f"[Scheduler] canal={canal} sent={len(mapped_rows)} response={response}",
                    flush=True,
                )
            except Exception as spring_err:
                print(f"[Scheduler] Failed sending to Spring ({canal}): {spring_err}", flush=True)

    except Exception as e:
        print(f"[Scheduler] Error: {e!r}", flush=True)
        logger.exception("[Scheduler] Error: %s", e)

    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(
    sync_google_sheet,
    trigger="interval",
    seconds=10,
    id="google_sheet_sync",
    replace_existing=True,
)