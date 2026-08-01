import os
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SERVICE_ACCOUNT_FILE = Path(
    os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "secret.json")
)

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
]


class GoogleSheetsService:

    def __init__(self):
        if not SERVICE_ACCOUNT_FILE.exists():
            raise FileNotFoundError(
                f"Google service account file not found: {SERVICE_ACCOUNT_FILE}. "
                "Set GOOGLE_SERVICE_ACCOUNT_FILE or place the service account JSON file in the project root."
            )

        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
        )

        self.drive_service = build(
            "drive",
            "v3",
            credentials=creds,
        )

        self.sheets_service = build(
            "sheets",
            "v4",
            credentials=creds,
        )

    def get_all_sheets(self):
        response = self.drive_service.files().list(
            q="mimeType='application/vnd.google-apps.spreadsheet'",
            fields="files(id,name)",
            pageSize=1000,
        ).execute()

        return response.get("files", [])

    def get_sheet_content(self, spreadsheet_id):
        spreadsheet = self.sheets_service.spreadsheets().get(
            spreadsheetId=spreadsheet_id
        ).execute()

        tabs = []

        for sheet in spreadsheet["sheets"]:
            tab_name = sheet["properties"]["title"]

            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=f"'{tab_name}'",
            ).execute()

            tabs.append({
                "tab": tab_name,
                "values": result.get("values", [])
            })

        return tabs