import json
import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, UniqueConstraint
from sqlalchemy.exc import IntegrityError
from app.database import Base, SessionLocal, engine

JSON_PATH = "namesdb.json"


class TypeNom(str, enum.Enum):
    prenom = "prenom"
    nom = "nom"


class Nom(Base):
    __tablename__ = "noms"
    __table_args__ = (UniqueConstraint("original", "type", name="uq_original_type"),)

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(TypeNom), nullable=False)
    original = Column(String(255, collation="utf8mb4_bin"), index=True, nullable=False)
    traduit = Column(String(255), nullable=True)
    verifie = Column(Boolean, default=False, nullable=False)


Nom.__table__.drop(bind=engine, checkfirst=True)
Base.metadata.create_all(bind=engine)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

db = SessionLocal()


def upsert(original, traduit, type_nom):
    entry = (
        db.query(Nom)
        .filter(Nom.original == original, Nom.type == type_nom)
        .first()
    )
    if entry:
        entry.traduit = traduit
        entry.verifie = True
    else:
        db.add(
            Nom(
                type=type_nom,
                original=original,
                traduit=traduit,
                verifie=True,
            )
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        print(f"Ignoré (doublon réel): {original} ({type_nom})")


count = 0
for original, traduit in data.get("prenom", {}).items():
    upsert(original, traduit, TypeNom.prenom)
    count += 1

for original, traduit in data.get("nom", {}).items():
    upsert(original, traduit, TypeNom.nom)
    count += 1

db.close()

print(f"Migration terminée. {count} entrées traitées.")