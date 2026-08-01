import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, UniqueConstraint
from app.database import Base


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