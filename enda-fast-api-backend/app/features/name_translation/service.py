from sqlalchemy.orm import Session
from .models import Nom, TypeNom
from .groq_client import call_groq_api


def split_name(name: str):
    parts = name.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def get_or_translate(db: Session, original: str, type_nom: TypeNom) -> str:
    entry = db.query(Nom).filter(Nom.original == original, Nom.type == type_nom).first()

    if entry:
        return entry.traduit

    traduit = call_groq_api(original)
    db.add(Nom(type=type_nom, original=original, traduit=traduit, verifie=False))
    db.commit()

    return traduit


def translate_full_name(db: Session, name: str) -> str:
    prenom, nom = split_name(name)

    r_prenom = get_or_translate(db, prenom, TypeNom.prenom)
    r_nom = get_or_translate(db, nom, TypeNom.nom) if nom else ""

    return r_prenom + (" " + r_nom if r_nom else "")