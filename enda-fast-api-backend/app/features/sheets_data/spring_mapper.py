from datetime import datetime


def parse_timestamp(raw: str):
    """Google Sheets timestamps are typically 'M/D/YYYY H:MM:SS'. Convert to ISO format."""
    if not raw:
        return None
    raw = raw.strip()
    formats = [
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt).isoformat()
        except ValueError:
            continue
    return None


def parse_date_naissance(raw: str):
    """The form's date picker records 'MM/DD/YYYY'. Convert to ISO date
    (YYYY-MM-DD) so it parses directly as a LocalDate on the backend."""
    if not raw:
        return None
    raw = raw.strip()
    formats = ["%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d"]
    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def parse_capacite_remboursement(raw: str):
    """Extract a numeric value from strings like '24', '24 mois', or ''."""
    if not raw:
        return None
    digits = "".join(c for c in raw if c.isdigit())
    return int(digits) if digits else None


def _get(row: dict, key: str) -> str:
    """Lookup tolerant of leading/trailing whitespace differences in keys."""
    if key in row:
        return row[key]
    stripped_key = key.strip()
    for k, v in row.items():
        if k.strip() == stripped_key:
            return v
    return ""


def map_row_to_prospect(row: dict, canal: str) -> dict:
    return {
        "timestamp": parse_timestamp(_get(row, "Timestamp")),
        "typeDemande": _get(row, "Type de demande"),
        "nom": _get(row, "Nom de famille"),
        "prenom": _get(row, "Prénom"),
        "dateNaissance": parse_date_naissance(_get(row, "Date de naissance")),
        "genre": _get(row, "Genre"),
        "situationFamiliale": _get(row, "Situation familiale"),
        "secteurActivite": _get(row, "Secteur d'activité"),
        "cin": _get(row, "Numéro CIN"),
        "telephone": _get(row, "N° de téléphone"),
        "adresse": _get(row, "Adresse"),
        "gouvernorat": _get(row, "Gouvernorat"),
        "delegation": _get(row, "Délégation"),
        "codePostal": _get(row, "Code postal"),
        "agenceProche": _get(row, "Agence Enda la plus proche"),
        "montantDemande": _get(row, "Montant de crédit demandé"),
        "utilisationPret": _get(row, "Utilisation du prêt"),
        "capaciteRemboursement": parse_capacite_remboursement(
            _get(row, "Capacité de remboursement déclarée (en mois)")
        ),
        "dureePret": _get(row, "Durée de prêt souhaitée"),
        "canal": canal,
    }