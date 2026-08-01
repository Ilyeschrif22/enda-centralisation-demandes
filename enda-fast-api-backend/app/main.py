from fastapi import FastAPI
from app.database import init_db
from app.features.name_translation import models  # noqa: F401
from app.features.name_translation.router import router as name_router
from app.features.sheets_data.sheets import router as sheets_router
from app.scheduler import scheduler


app = FastAPI(title="Enda API")
app.include_router(name_router)
app.include_router(sheets_router)


@app.on_event("startup")
def startup():
    init_db()
    scheduler.start()


@app.on_event("shutdown")
def shutdown():
    scheduler.shutdown()