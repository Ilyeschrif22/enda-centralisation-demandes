import re
import unicodedata
from sqlalchemy.orm import Session

from app.features.name_translation.service import get_or_translate
from app.features.name_translation.models import TypeNom

SELECTED_COLUMNS = [
    "Timestamp",
    "Type de demande",
    "Nom de famille",
    "Prénom",
    "Date de naissance",
    "Genre",
    "Situation familiale",
    "Secteur d'activité",
    "Numéro CIN",
    "N° de téléphone",
    "Adresse",
    "Gouvernorat",
    "Délégation",
    "Code postal",
    "Agence Enda la plus proche",
    "Montant de crédit demandé",
    "Utilisation du prêt",
    "Capacité de remboursement déclarée (en mois)",
    "Durée de prêt souhaitée",
]

_ARABIC_CHARS_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]")


def _is_arabic_script(text: str) -> bool:
    """True only if the text contains at least one Arabic-script
    character. Names already written in Latin/French script should
    never be sent through the Arabic->French translation service —
    doing so risks a false/incorrect match."""
    return bool(text) and bool(_ARABIC_CHARS_RE.search(text))


def _normalize_header(h: str) -> str:
    """Normalize a header for tolerant matching: replace non-breaking
    spaces, collapse whitespace, strip trailing punctuation, lowercase.
    Google Sheets headers exported from Forms often carry hidden
    formatting (NBSP, trailing colon/space) that breaks exact dict
    lookups without raising any error."""
    if not h:
        return ""
    h = unicodedata.normalize("NFKC", h)
    h = h.replace("\xa0", " ")
    h = re.sub(r"\s+", " ", h).strip()
    h = h.rstrip(":*？?").strip()
    return h.lower()


def clean_phone(raw: str) -> str:
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("216") and len(digits) > 8:
        digits = digits[3:]
    return digits[-8:] if len(digits) >= 8 else digits


def clean_montant_range(raw: str) -> str:
    """The form stores the picked choice as '[100-1000]'; strip the
    brackets so it matches the frontend's MONTANT_OPTIONS values."""
    if not raw:
        return ""
    return raw.strip().strip("[]")


def process_row(db: Session, headers: list[str], row: list[str]) -> dict:
    row = row + [""] * (len(headers) - len(row))
    record = dict(zip(headers, row))


    normalized_lookup = {}
    for header, value in record.items():
        normalized_lookup.setdefault(_normalize_header(header), value)

    filtered_record = {}
    unmatched_columns = []
    for column in SELECTED_COLUMNS:
        if column in record:
            filtered_record[column] = record[column]
            continue
        value = normalized_lookup.get(_normalize_header(column))
        if value is not None:
            filtered_record[column] = value
        else:
            filtered_record[column] = ""
            unmatched_columns.append(column)

    if unmatched_columns:
        print(f"[process_row] no header match (even normalized) for: {unmatched_columns}")

    nom = filtered_record.get("Nom de famille", "").strip()
    prenom = filtered_record.get("Prénom", "").strip()

    # Only run through translation if the raw value is actually Arabic
    # script. A name already in French/Latin script (e.g. "Chrif") must
    # pass through untouched — sending it to get_or_translate risks a
    # false/incorrect match against the Arabic->French dictionary.
    if nom:
        filtered_record["Nom de famille"] = (
            get_or_translate(db, nom, TypeNom.nom) if _is_arabic_script(nom) else nom
        )
    if prenom:
        filtered_record["Prénom"] = (
            get_or_translate(db, prenom, TypeNom.prenom) if _is_arabic_script(prenom) else prenom
        )

    phone = filtered_record.get("N° de téléphone", "")
    filtered_record["N° de téléphone"] = clean_phone(phone)

    montant = filtered_record.get("Montant de crédit demandé", "")
    filtered_record["Montant de crédit demandé"] = clean_montant_range(montant)

    return filtered_record


def build_sheet_content(db: Session, content: list[dict]) -> list[dict]:
    result = []
    for tab in content:
        values = tab.get("values", [])
        if not values:
            continue
        headers = values[0]
        rows = [
            process_row(db, headers, row)
            for row in values[1:]
            if row
        ]
        result.append({"tab": tab["tab"], "rows": rows})
    return result


def get_raw_headers(content: list[dict]) -> list[dict]:
    """Debug helper: return raw headers per tab, with repr() to expose hidden whitespace/encoding issues."""
    result = []
    for tab in content:
        values = tab.get("values", [])
        if not values:
            result.append({"tab": tab.get("tab", "unknown"), "headers": []})
            continue
        headers = values[0]
        result.append({
            "tab": tab["tab"],
            "headers": headers,
            "headers_repr": [repr(h) for h in headers],
        })
    return result