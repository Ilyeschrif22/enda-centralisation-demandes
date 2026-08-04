import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import './lead-profile-view.css';

const API_BASE = "http://127.0.0.1:8089";

const booleanLabel = (value) => {
    if (value === true) return "Oui";
    if (value === false) return "Non";
    return null;
};

const displayValue = (value) => (value !== null && value !== undefined && value !== "" ? value : "—");

const initials = (name) =>
    (name ?? "")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?";

const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const birth = new Date(dateNaissance);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);
const PencilIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
const PhoneIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.732 1.55l-.465.354a1 1 0 0 0-.31 1.225 12 12 0 0 0 6.34 6.34" /></svg>
);
const MapPinIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
);
const BriefcaseIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>
);
const WalletIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
);
const CalendarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
);
const IdCardIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 10h2" /><path d="M16 14h2" /><path d="M6.17 15a3 3 0 0 1 5.66 0" /><circle cx="9" cy="11" r="2" /><rect width="20" height="14" x="2" y="5" rx="2" /></svg>
);

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="info-row">
        <div className="info-row-icon"><Icon /></div>
        <div className="info-row-text">
            <span className="info-row-label">{label}</span>
            <span className="info-row-value">{displayValue(value)}</span>
        </div>
    </div>
);

const Badge = ({ children, tone }) => (
    <span className={`badge ${tone ? `badge-${tone}` : ""}`}>{children}</span>
);

const JoignableBadge = ({ value }) => {
    if (value === null || value === undefined) return <Badge>—</Badge>;
    return <Badge tone={value ? "green" : "red"}>{value ? "Joignable" : "Non joignable"}</Badge>;
};

const AgeEligibiliteBadge = ({ dateNaissance }) => {
    const age = calculateAge(dateNaissance);
    if (age === null) return null;
    if (age >= 18 && age <= 65) return null;

    const raison = age < 18 ? "< 18" : "> 65";

    return <Badge tone="red">Non éligible {raison}</Badge>;
};

const TYPE_DEMANDE_LABELS = {
    PREMIER_PRET: "Nouveau client",
    RENOUVELLEMENT: "Ancien client",
    REINTEGRATION: "Ancien client",
};

const TypeDemandeBadge = ({ typeDemande }) => {
    const label = TYPE_DEMANDE_LABELS[typeDemande];
    if (!label) return null;
    return <Badge tone="purple">{label}</Badge>;
};

const InteresseBadge = ({ value }) => {
    if (value === null || value === undefined) return <Badge tone="blue">—</Badge>;
    return <Badge tone="blue">{value ? "Intéressé" : "Non intéressé"}</Badge>;
};

const CANAL_LABELS = {
    FACEBOOK: "Facebook",
    WHATSAPP: "WhatsApp",
    WEB: "Web",
    TELEPHONE: "Téléphone",
    AGENCE: "Agence",
};

const CanalBadge = ({ canal }) => {
    if (!canal) return null;
    return <Badge tone="green">{CANAL_LABELS[canal] || canal}</Badge>;
};

const DemandeCard = ({ demande, onSelect }) => (
    <button type="button" className="demande-card" onClick={() => onSelect?.(demande)}>
        <div className="demande-card-top">
            <span className="demande-card-date">{displayValue(demande.dateSaisie)}</span>
            <CanalBadge canal={demande.canal} />
        </div>
        <div className="demande-card-body">
            <span className="demande-card-activite">{displayValue(demande.activite)}</span>
            <span className="demande-card-agence">{displayValue(demande.agence)}</span>
        </div>
        <div className="demande-card-bottom">
            <span className="demande-card-montant">{displayValue(demande.montant)} TD</span>
            {demande.statutProjet && <Badge>{demande.statutProjet}</Badge>}
        </div>
    </button>
);

const formatCommentDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const CommentsSection = ({ demandeId, currentUser }) => {
    const [commentaires, setCommentaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nouveauCommentaire, setNouveauCommentaire] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [error, setError] = useState(null);

    const chargerCommentaires = useCallback(() => {
        if (!demandeId) return;
        setLoading(true);
        fetch(`${API_BASE}/demandes/${demandeId}/commentaires`)
            .then((res) => {
                if (!res.ok) throw new Error(`Echec (${res.status})`);
                return res.json();
            })
            .then(setCommentaires)
            .catch((err) => {
                console.error("Impossible de charger les commentaires:", err);
            })
            .finally(() => setLoading(false));
    }, [demandeId]);

    useEffect(() => {
        chargerCommentaires();
    }, [chargerCommentaires]);

    const handleAjouterCommentaire = async () => {
        const texte = nouveauCommentaire.trim();
        if (!texte || !demandeId) return;

        setEnvoiEnCours(true);
        setError(null);

        const auteurUsername = currentUser?.preferred_username || currentUser?.sub || "";
        const auteurNom =
            `${currentUser?.given_name || ""} ${currentUser?.family_name || ""}`.trim() ||
            currentUser?.preferred_username ||
            "Utilisateur";

        try {
            const res = await fetch(`${API_BASE}/demandes/${demandeId}/commentaires`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texte, auteurUsername, auteurNom }),
            });

            if (!res.ok) throw new Error(`Echec (${res.status})`);

            const created = await res.json();
            setCommentaires((prev) => [...prev, created]);
            setNouveauCommentaire("");
        } catch (err) {
            console.error(err);
            setError("Impossible d'ajouter le commentaire.");
        } finally {
            setEnvoiEnCours(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleAjouterCommentaire();
        }
    };

    return (
        <div className="lead-profile-card lead-profile-comments">
            <h3>Commentaires</h3>

            {error && <p className="comment-error">{error}</p>}

            <div className="comment-list">
                {loading ? (
                    <p className="comment-empty">Chargement...</p>
                ) : commentaires.length === 0 ? (
                    <p className="comment-empty">Aucun commentaire pour l'instant.</p>
                ) : (
                    commentaires.map((c) => (
                        <div key={c.id} className="comment-item">
                            <div className="comment-item-header">
                                <span className="comment-author">{c.auteurNom || c.auteurUsername}</span>
                                <span className="comment-date">{formatCommentDate(c.dateCreation)}</span>
                            </div>
                            <p className="comment-text">{c.texte}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="comment-form">
                <textarea
                    value={nouveauCommentaire}
                    onChange={(e) => setNouveauCommentaire(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ajouter un commentaire pour clarifier cette demande..."
                    rows={3}
                    maxLength={1000}
                />
                <div className="comment-form-footer">
                    <span className="comment-char-count">{nouveauCommentaire.length}/1000</span>
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!nouveauCommentaire.trim() || envoiEnCours}
                        onClick={handleAjouterCommentaire}
                    >
                        {envoiEnCours ? "Envoi..." : "Publier"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LeadProfileView = ({ lead, allLeads = [], onBack, onEdit, onSelectDemande }) => {
    const alertedLeadId = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!lead) return;

        const age = calculateAge(lead.utilisateur?.dateNaissance);
        const isNonEligible = age !== null && (age < 18 || age > 65);

        if (isNonEligible && alertedLeadId.current !== lead.id) {
            alertedLeadId.current = lead.id;

            fetch(`${API_BASE}/demandes/${lead.id}/verifier-eligibilite`, {
                method: "POST",
            }).catch((err) => {
                console.error("Echec de l'alerte éligibilité:", err);
            });
        }
    }, [lead]);

    if (!lead) return null;

    const utilisateur = lead.utilisateur || {};
    const nomPrenom = `${utilisateur.prenom ?? ""} ${utilisateur.nom ?? ""}`.trim();
    const numeroDemande = lead.numeroDemande ?? lead.demande?.numeroDemande;

    const autresDemandes = allLeads.filter(
        (l) => l.utilisateur?.telephone === utilisateur.telephone && l.id !== lead.id
    );

    const roles = user?.realm_access?.roles || [];
    const isDirecteur = roles.includes("Directeur Régional") || roles.includes("Directeur Agence");

    return (
        <div className="lead-profile">
            <div className="lead-profile-toolbar">
                <button type="button" className="btn btn-ghost" onClick={onBack}>
                    <ArrowLeftIcon /> Retour à la liste
                </button>
                {!isDirecteur && (
                    <button type="button" className="btn btn-primary" onClick={onEdit}>
                        <PencilIcon /> Modifier
                    </button>
                )}
            </div>

            <div className="lead-profile-card lead-profile-header">
                <div className="lead-avatar">{initials(nomPrenom)}</div>
                <div className="lead-profile-header-info">
                    <h2>{displayValue(nomPrenom)}</h2>
                    <p>{displayValue(lead.activite)}</p>
                    <div className="lead-profile-badges">
                        <CanalBadge canal={lead.canal} />
                        {numeroDemande && (
                            <Badge tone="purple">
                                Demande Numéro  ({numeroDemande})
                            </Badge>
                        )}
                        <TypeDemandeBadge typeDemande={lead.typeDemande} />
                        <JoignableBadge value={lead.joignable} />
                        <InteresseBadge value={lead.interesse} />
                        <AgeEligibiliteBadge dateNaissance={utilisateur.dateNaissance} />
                    </div>
                </div>
                <div className="lead-profile-amount">
                    <span>Montant demandé</span>
                    <strong>{displayValue(lead.montant)} TD</strong>
                </div>
            </div>

            <div className="lead-profile-grid">
                <div className="lead-profile-card">
                    <h3>Identité</h3>
                    <InfoRow icon={IdCardIcon} label="CIN" value={utilisateur.cin} />
                    <InfoRow icon={CalendarIcon} label="Date d'émission CIN" value={utilisateur.dateEmissionCin} />
                    <InfoRow icon={CalendarIcon} label="Date de naissance" value={utilisateur.dateNaissance} />
                    <InfoRow icon={IdCardIcon} label="Genre" value={utilisateur.genre} />
                    <InfoRow icon={IdCardIcon} label="Situation familiale" value={utilisateur.situationFamiliale} />
                </div>

                <div className="lead-profile-card">
                    <h3>Contact</h3>
                    <InfoRow icon={PhoneIcon} label="Téléphone" value={utilisateur.telephone} />
                    <InfoRow icon={MapPinIcon} label="Agence" value={lead.agence} />
                    <InfoRow icon={MapPinIcon} label="Adresse domicile" value={utilisateur.adresseDomicile} />
                    <InfoRow icon={MapPinIcon} label="Gouvernorat" value={utilisateur.gouvernorat} />
                    <InfoRow icon={MapPinIcon} label="Délégation" value={utilisateur.delegation} />
                    <InfoRow icon={MapPinIcon} label="Code postal" value={utilisateur.codePostal} />
                </div>

                <div className="lead-profile-card">
                    <h3>Projet</h3>
                    <InfoRow icon={BriefcaseIcon} label="Activité" value={lead.activite} />
                    <InfoRow
                        icon={BriefcaseIcon}
                        label="Type de demande"
                        value={TYPE_DEMANDE_LABELS[lead.typeDemande] ?? lead.typeDemande}
                    />
                    <InfoRow icon={BriefcaseIcon} label="Besoin" value={lead.besoin} />
                    <InfoRow icon={MapPinIcon} label="Adresse projet" value={lead.adresseProjet} />
                </div>

                <div className="lead-profile-card">
                    <h3>Financier</h3>
                    <InfoRow icon={WalletIcon} label="Montant demandé" value={lead.montant} />
                    <InfoRow icon={WalletIcon} label="Capacité de remboursement" value={lead.capaciteRemboursement} />
                    <InfoRow icon={CalendarIcon} label="Durée du prêt" value={lead.dureePret} />
                    <InfoRow icon={CalendarIcon} label="Date de saisie" value={lead.dateSaisie} />
                    <InfoRow icon={CalendarIcon} label="Date prévu de traitement" value={lead.datePrevuTraitement} />
                </div>

                <div className="lead-profile-card">
                    <h3>Suivi</h3>
                    <InfoRow icon={BriefcaseIcon} label="Statut de la demande" value={lead.statut} />
                    <InfoRow icon={BriefcaseIcon} label="Statut du projet" value={lead.statutProjet} />
                    <InfoRow icon={PhoneIcon} label="Contacté" value={booleanLabel(lead.contacte)} />
                    <InfoRow icon={PhoneIcon} label="Joignable" value={booleanLabel(lead.joignable)} />
                    <InfoRow icon={PhoneIcon} label="Intéressé" value={booleanLabel(lead.interesse)} />
                    <InfoRow icon={BriefcaseIcon} label="Retour agence" value={lead.retourAgence} />
                </div>

                
                <CommentsSection demandeId={lead.id} currentUser={user} />
            </div>
        </div>
    );
};

export default LeadProfileView;