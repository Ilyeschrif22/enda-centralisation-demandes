import { useEffect, useState, useMemo, useRef } from "react";
import secteurActiviteMap from '../../../secteur-activite.json';
import { useAuth } from "../../context/AuthContext";

import './add-demande-modal.css';

import { API_BASE } from "../../config";

const TYPE_DEMANDE_OPTIONS = [
    { value: "PREMIER_PRET", label: "Demande 1er prêt" },
    { value: "RENOUVELLEMENT", label: "Demande de renouvellement" },
    { value: "REINTEGRATION", label: "Demande de réintégration" },
];

const GENRE_OPTIONS = ["Homme", "Femme"];

const SITUATION_FAMILIALE_OPTIONS = ["Célibataire", "Marié", "Divorcé", "Veuf"];

const SECTEURS = Object.keys(secteurActiviteMap).sort();

const MONTANT_OPTIONS = [
    { value: "100-1000", label: "100 - 1 000 DT" },
    { value: "2000-5000", label: "2 000 - 5 000 DT" },
    { value: "5001-10000", label: "5 001 - 10 000 DT" },
    { value: "10001-40000", label: "10 001 - 40 000 DT" },
];

const UTILISATION_PRET_OPTIONS = [
    "Equipements", "Stock", "Véhicules", "Fonds de roulement",
    "Aménagement", "Financement des études", "Amélioration d'habitation", "Autres besoins",
];

const DUREE_PRET_OPTIONS = ["12 mois", "24 mois", "36 mois", "Plus que 36 mois"];

const findMontantRange = (montant) => {
    if (montant === null || montant === undefined || montant === "") return "";
    const n = Number(montant);
    if (Number.isNaN(n)) return "";
    const match = MONTANT_OPTIONS.find((o) => {
        const [min, max] = o.value.split("-").map(Number);
        return n >= min && n <= max;
    });
    return match ? match.value : "";
};

const initialForm = {
    typeDemande: "",
    nomFamille: "",
    prenom: "",
    dateNaissance: "",
    genre: "",
    situationFamiliale: "",
    secteurActivite: "",
    activite: "",
    cin: "",
    telephone: "",
    adresse: "",
    gouvernorat: "",
    delegation: "",
    codePostal: "",
    agence: "",
    montantDemande: "",
    utilisationPret: "",
    capaciteRemboursement: "",
    dureePret: "",
    valide: false,
    contacte: false,
    interesse: null,
    joignable: null,
};

const REQUIRED_FIELDS = Object.keys(initialForm).filter(
    (key) => !["valide", "contacte", "interesse", "joignable"].includes(key)
);

const Field = ({ id, label, error, children }) => (
    <div className="add-demande-field">
        <label htmlFor={id}>{label} <span className="required">*</span></label>
        {children}
        {error && <span className="field-error">{error}</span>}
    </div>
);

const ValidationIcon = ({ filled }) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2.5l7.5 3.4v5.4c0 4.9-3.2 8.6-7.5 10.2-4.3-1.6-7.5-5.3-7.5-10.2V5.9L12 2.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
        />
        <path
            d="M8.5 12.2l2.4 2.4 4.6-4.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const PhoneIcon = ({ upsideDown }) => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={upsideDown ? { transform: "rotate(135deg)" } : undefined}
    >
        <path
            d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
            fill="currentColor"
        />
    </svg>
);

const ThumbUpIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm2.3 9h7.6c.8 0 1.5-.5 1.7-1.3l1.9-6.7A1.5 1.5 0 0 0 19.1 10H14l.9-4.4c.2-.9-.5-1.6-1.3-1.6-.4 0-.8.2-1 .6L9 11.3V20l.3 0z"
            fill="currentColor"
        />
    </svg>
);

const ThumbDownIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3zm-2.3-9H7.1c-.8 0-1.5.5-1.7 1.3L3.5 12a1.5 1.5 0 0 0 1.4 2h5.1l-.9 4.4c-.2.9.5 1.6 1.3 1.6.4 0 .8-.2 1-.6L15 12.7V4l-.3 0z"
            fill="currentColor"
        />
    </svg>
);

const SignalIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="14" width="3" height="6" rx="1" fill="currentColor" />
        <rect x="9" y="10" width="3" height="10" rx="1" fill="currentColor" />
        <rect x="15" y="6" width="3" height="14" rx="1" fill="currentColor" />
        <rect x="21" y="2" width="0" height="0" />
    </svg>
);

const SignalOffIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="14" width="3" height="6" rx="1" fill="currentColor" opacity=".35" />
        <rect x="9" y="10" width="3" height="10" rx="1" fill="currentColor" opacity=".35" />
        <rect x="15" y="6" width="3" height="14" rx="1" fill="currentColor" opacity=".35" />
        <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const formFromLead = (lead) => {
    const utilisateur = lead.utilisateur || {};

    return {
        ...initialForm,
        typeDemande: lead.typeDemande ?? "",
        nomFamille: utilisateur.nom ?? lead.nomFamille ?? "",
        prenom: utilisateur.prenom ?? lead.prenom ?? "",
        dateNaissance: utilisateur.dateNaissance ?? lead.dateNaissance ?? "",
        genre: utilisateur.genre ?? lead.genre ?? "",
        situationFamiliale: utilisateur.situationFamiliale ?? lead.situationFamiliale ?? "",
        secteurActivite: lead.secteurActivite ?? "",
        activite: lead.activite ?? "",
        cin: utilisateur.cin ?? lead.cin ?? "",
        telephone: utilisateur.telephone ?? lead.telephone ?? "",
        adresse: lead.adresseProjet ?? lead.adresse ?? lead.adresseDomicile ?? "",
        gouvernorat: utilisateur.gouvernorat ?? lead.gouvernorat ?? "",
        delegation: utilisateur.delegation ?? lead.delegation ?? "",
        codePostal: utilisateur.codePostal ?? lead.codePostal ?? "",
        agence: lead.agence ?? utilisateur.agence ?? "",
        montantDemande: lead.montant ?? findMontantRange(lead.montant),
        utilisationPret: lead.besoin ?? "",
        capaciteRemboursement: lead.capaciteRemboursement?.toString() ?? "",
        dureePret: lead.dureePret ?? "",
        valide: lead.valide ?? false,
        contacte: lead.contacte ?? false,
        interesse: lead.interesse ?? null,
        joignable: lead.joignable ?? null,
    };
};

const AddDemandeModal = ({ open, onClose, onCreated, lead = null, onUpdated }) => {
    const { user } = useAuth();
    const currentUsername = user?.preferred_username || user?.username || "utilisateur";
    const currentNomUtilisateur = `${user?.given_name} ${user?.family_name}`.trim() || currentUsername;

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [cinStatus, setCinStatus] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [agencesMap, setAgencesMap] = useState({});
    const [agencesLoaded, setAgencesLoaded] = useState(false);
    const [lockedBy, setLockedBy] = useState(null);
    const [checkingLock, setCheckingLock] = useState(false);
    const [cinAlert, setCinAlert] = useState(null);
    const isEditing = Boolean(lead);
    const cinCheckTimeout = useRef(null);

    useEffect(() => {
        fetch(`${API_BASE}/agences`)
            .then((res) => res.json())
            .then((list) => {
                const grouped = {};
                list.forEach(({ gouvernorat, delegation, agence }) => {
                    if (!grouped[gouvernorat]) grouped[gouvernorat] = {};
                    grouped[gouvernorat][delegation] = agence;
                });
                setAgencesMap(grouped);
            })
            .catch((err) => console.error("Impossible de charger les agences", err))
            .finally(() => setAgencesLoaded(true));
    }, []);

    const gouvernorats = useMemo(() => Object.keys(agencesMap).sort(), [agencesMap]);

    const delegations = useMemo(
        () => Object.keys(agencesMap[form.gouvernorat] || {}).sort(),
        [agencesMap, form.gouvernorat]
    );

    const activiteOptions = useMemo(() => {
        const list = secteurActiviteMap[form.secteurActivite] || [];
        if (form.activite && !list.includes(form.activite)) {
            return [form.activite, ...list];
        }
        return list;
    }, [form.secteurActivite, form.activite]);

    useEffect(() => {
        if (!open) return;

        setForm(lead ? formFromLead(lead) : initialForm);
        setErrors({});
        setCinStatus(null);
        setSubmitError(null);
        setLockedBy(null);
        setCinAlert(null);

        if (lead) {
            setCheckingLock(true);
            fetch(`${API_BASE}/demandes/${lead.id}/lock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: currentUsername }),
            })
                .then(async (res) => {
                    if (res.status === 409) {
                        const lockedByUser = await res.text();
                        setLockedBy(lockedByUser);
                        return;
                    }
                    if (!res.ok) throw new Error(`Echec du verrouillage (${res.status})`);
                })
                .catch((err) => {
                    console.error(err);
                    setSubmitError("Impossible de vérifier le verrouillage de cette demande.");
                })
                .finally(() => setCheckingLock(false));
        }
    }, [open, lead]);

    useEffect(() => {
        return () => clearTimeout(cinCheckTimeout.current);
    }, []);

    if (!open) return null;

    const releaseLock = () => {
        if (lead && !lockedBy) {
            fetch(
                `${API_BASE}/demandes/${lead.id}/lock?username=${encodeURIComponent(currentUsername)}`,
                { method: "DELETE" }
            ).catch((err) => console.error("Impossible de libérer le verrou", err));
        }
    };

    const handleClose = () => {
        releaseLock();
        onClose();
    };

    // Locked demande: show ONLY the alert, not the full modal behind it.
    if (lockedBy) {
        return (
            <div className="cin-alert-overlay" onClick={handleClose}>
                <div
                    className="cin-alert-modal cin-alert-modal--existing"
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                >
                    <div className="cin-alert-header">
                        <span className="cin-alert-badge">
                            <span className="cin-alert-badge-dot" />
                            Demande verrouillée
                        </span>
                        <h3 className="alert-lock-message">Cette demande est en cours de modification <br/> par un autre utilisateur Réessayez plus tard.</h3>
                    </div>

                    <div className="cin-alert-actions">
                        <button type="button" onClick={handleClose}>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const setField = (name, value) => {
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === "gouvernorat") {
                next.delegation = "";
                next.agence = "";
            }
            if (name === "delegation") {
                next.agence = agencesMap[next.gouvernorat]?.[value] || "";
            }
            if (name === "secteurActivite") {
                next.activite = "";
            }
            return next;
        });
    };

    const checkCin = async (cin) => {
        if (!/^\d{8}$/.test(cin)) {
            setCinStatus(null);
            return;
        }
        setCinStatus("checking");
        try {
            const res = await fetch(`${API_BASE}/utilisateurs/check-cin/${cin}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCinStatus(data.exists ? "existant" : "nouveau");
            setCinAlert({ cin, exists: data.exists });
        } catch {
            setCinStatus(null);
        }
    };

    const handleCinChange = (rawValue) => {
        const value = rawValue.replace(/\D/g, "");
        setField("cin", value);
        if (isEditing) return;
        if (value.length !== 8) {
            setCinStatus(null);
            return;
        }
        checkCin(value);
    };

    const validate = () => {
        const next = {};
        if (!isEditing) {
            REQUIRED_FIELDS.forEach((key) => {
                if (!form[key]) next[key] = "Champ obligatoire";
            });
        }
        if (form.cin && !/^\d{8}$/.test(form.cin)) next.cin = "8 chiffres requis";
        if (form.telephone && !/^\d{8}$/.test(form.telephone)) next.telephone = "8 chiffres requis";
        if (form.codePostal && !/^\d{4}$/.test(form.codePostal)) next.codePostal = "4 chiffres requis";
        if (form.capaciteRemboursement && !/^\d+$/.test(form.capaciteRemboursement)) {
            next.capaciteRemboursement = "Chiffres uniquement";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            const payload = isEditing
                ? Object.fromEntries(Object.entries(form).filter(([key]) => key !== "cin"))
                : form;

            const auditQuery = new URLSearchParams({
                username: currentUsername,
                nomUtilisateur: currentNomUtilisateur,
            }).toString();

            const url = isEditing
                ? `${API_BASE}/demandes/${lead.id}?${auditQuery}`
                : `${API_BASE}/demandes?${auditQuery}`;

            const res = await fetch(url, {
                method: isEditing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Echec de l'enregistrement (${res.status})`);
            const demande = await res.json();
            if (isEditing) {
                onUpdated?.(demande);
            } else {
                onCreated?.(demande);
                setForm(initialForm);
            }
            setCinStatus(null);
            onClose();
        } catch (err) {
            console.error(err);
            setSubmitError(isEditing ? "Impossible de modifier la demande." : "Impossible de créer la demande.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-demande-overlay" onClick={handleClose}>
            <div className="add-demande-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-demande-header">
                    <h2>{isEditing ? "Modifier la demande" : "Nouvelle demande"}</h2>
                    <button type="button" className="add-demande-close" onClick={handleClose}>×</button>
                </div>

                {checkingLock ? (
                    <div className="add-demande-body">
                        <p>Vérification en cours...</p>
                    </div>
                ) : (
                    <form id="add-demande-form" className="add-demande-body" onSubmit={handleSubmit}>
                        {submitError && <div className="add-demande-error">{submitError}</div>}

                        <div className="add-demande-columns">
                            <div className="add-demande-column">
                                <div className="add-demande-section add-demande-section-request">
                                    <div className="add-demande-grid">
                                        <Field id="typeDemande" label="Type demande" error={errors.typeDemande}>
                                            <select id="typeDemande" value={form.typeDemande} onChange={(e) => setField("typeDemande", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {TYPE_DEMANDE_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        </Field>

                                        <div className="add-demande-field">
                                            <label>Statuts</label>
                                           <div className="status-icon-group">
    <button
        type="button"
        className={`status-icon-btn ${form.contacte ? "status-icon-btn--green" : "status-icon-btn--red"}`}
        title={form.contacte ? "Contacté" : "Non contacté"}
        onClick={() => setField("contacte", !form.contacte)}
    >
        <PhoneIcon upsideDown={!form.contacte} />
    </button>

    <button
        type="button"
        disabled={!form.contacte}
        className={`status-icon-btn ${
            !form.contacte
                ? "status-icon-btn--disabled"
                : form.joignable === true
                ? "status-icon-btn--green"
                : form.joignable === false
                ? "status-icon-btn--red"
                : ""
        }`}
        title={
            !form.contacte
                ? "Contactez d'abord le client"
                : form.joignable === true
                ? "Joignable"
                : form.joignable === false
                ? "Non joignable"
                : "Joignabilité non définie"
        }
        onClick={() =>
            form.contacte &&
            setField(
                "joignable",
                form.joignable === null
                    ? true
                    : form.joignable === true
                    ? false
                    : null
            )
        }
    >
        {form.joignable === false ? <SignalOffIcon /> : <SignalIcon />}
    </button>

    <button
        type="button"
        disabled={form.joignable !== true}
        className={`status-icon-btn ${
            form.joignable !== true
                ? "status-icon-btn--disabled"
                : form.interesse === true
                ? "status-icon-btn--green"
                : form.interesse === false
                ? "status-icon-btn--red"
                : ""
        }`}
        title={
            form.joignable !== true
                ? "Le client doit être joignable"
                : form.interesse === true
                ? "Intéressé"
                : form.interesse === false
                ? "Non intéressé"
                : "Intérêt non défini"
        }
        onClick={() =>
            form.joignable === true &&
            setField(
                "interesse",
                form.interesse === null
                    ? true
                    : form.interesse === true
                    ? false
                    : null
            )
        }
    >
        {form.interesse === false ? <ThumbDownIcon /> : <ThumbUpIcon />}
    </button>
</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="add-demande-section add-demande-section-identity">
                                    <h3>Identité</h3>
                                    <div className="add-demande-grid">
                                        <Field id="nomFamille" label="Nom de famille" error={errors.nomFamille}>
                                            <input id="nomFamille" type="text" value={form.nomFamille} onChange={(e) => setField("nomFamille", e.target.value)} />
                                        </Field>
                                        <Field id="prenom" label="Prénom" error={errors.prenom}>
                                            <input id="prenom" type="text" value={form.prenom} onChange={(e) => setField("prenom", e.target.value)} />
                                        </Field>
                                        <Field id="dateNaissance" label="Date de naissance" error={errors.dateNaissance}>
                                            <input id="dateNaissance" type="date" value={form.dateNaissance} onChange={(e) => setField("dateNaissance", e.target.value)} />
                                        </Field>
                                        <Field id="genre" label="Genre" error={errors.genre}>
                                            <select id="genre" value={form.genre} onChange={(e) => setField("genre", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {GENRE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="situationFamiliale" label="Situation familiale" error={errors.situationFamiliale}>
                                            <select id="situationFamiliale" value={form.situationFamiliale} onChange={(e) => setField("situationFamiliale", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {SITUATION_FAMILIALE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="cin" label="CIN" error={errors.cin}>
                                            <input
                                                id="cin"
                                                type="text"
                                                maxLength={8}
                                                value={form.cin}
                                                onChange={(e) => handleCinChange(e.target.value)}
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="add-demande-section add-demande-section-activity">
                                    <h3>Activité</h3>
                                    <div className="add-demande-grid">
                                        <Field id="secteurActivite" label="Secteur d'activité" error={errors.secteurActivite}>
                                            <select id="secteurActivite" value={form.secteurActivite} onChange={(e) => setField("secteurActivite", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {SECTEURS.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="activite" label="Activité" error={errors.activite}>
                                            <select
                                                id="activite"
                                                value={form.activite}
                                                onChange={(e) => setField("activite", e.target.value)}
                                                disabled={!form.secteurActivite}
                                            >
                                                <option value="">{form.secteurActivite ? "Sélectionner..." : "Choisir un secteur"}</option>
                                                {activiteOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                    </div>
                                </div>
                            </div>

                            <div className="add-demande-column">
                                <div className="add-demande-section add-demande-section-contact">
                                    <h3>Contact & localisation</h3>
                                    <div className="add-demande-grid">
                                        <Field id="telephone" label="N° de téléphone" error={errors.telephone}>
                                            <input
                                                id="telephone"
                                                type="text"
                                                maxLength={8}
                                                value={form.telephone}
                                                onChange={(e) => setField("telephone", e.target.value.replace(/\D/g, ""))}
                                            />
                                        </Field>
                                        <Field id="adresse" label="Adresse" error={errors.adresse}>
                                            <input id="adresse" type="text" value={form.adresse} onChange={(e) => setField("adresse", e.target.value)} />
                                        </Field>
                                        <Field id="gouvernorat" label="Gouvernorat" error={errors.gouvernorat}>
                                            <select id="gouvernorat" value={form.gouvernorat} onChange={(e) => setField("gouvernorat", e.target.value)} disabled={!agencesLoaded}>
                                                <option value="">Sélectionner...</option>
                                                {gouvernorats.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="delegation" label="Délégation" error={errors.delegation}>
                                            <select id="delegation" value={form.delegation} onChange={(e) => setField("delegation", e.target.value)} disabled={!form.gouvernorat}>
                                                <option value="">Sélectionner...</option>
                                                {delegations.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="codePostal" label="Code postal" error={errors.codePostal}>
                                            <input
                                                id="codePostal"
                                                type="text"
                                                maxLength={4}
                                                value={form.codePostal}
                                                onChange={(e) => setField("codePostal", e.target.value.replace(/\D/g, ""))}
                                            />
                                        </Field>
                                        <Field id="agence" label="Agence la plus proche" error={errors.agence}>
                                            <input id="agence" type="text" value={form.agence} readOnly placeholder="Choisir une délégation" />
                                        </Field>
                                    </div>
                                </div>

                                <div className="add-demande-section add-demande-section-credit">
                                    <h3>Crédit</h3>
                                    <div className="add-demande-grid">
                                        <Field id="montantDemande" label="Montant de crédit demandé" error={errors.montantDemande}>
                                            <select id="montantDemande" value={form.montantDemande} onChange={(e) => setField("montantDemande", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {MONTANT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="utilisationPret" label="Utilisation du prêt" error={errors.utilisationPret}>
                                            <select id="utilisationPret" value={form.utilisationPret} onChange={(e) => setField("utilisationPret", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {UTILISATION_PRET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="capaciteRemboursement" label="Capacité de remboursement déclarée" error={errors.capaciteRemboursement}>
                                            <input
                                                id="capaciteRemboursement"
                                                type="text"
                                                inputMode="numeric"
                                                value={form.capaciteRemboursement}
                                                onChange={(e) => setField("capaciteRemboursement", e.target.value.replace(/\D/g, ""))}
                                            />
                                        </Field>
                                        <Field id="dureePret" label="Durée de prêt souhaitée" error={errors.dureePret}>
                                            <select id="dureePret" value={form.dureePret} onChange={(e) => setField("dureePret", e.target.value)}>
                                                <option value="">Sélectionner...</option>
                                                {DUREE_PRET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="add-demande-footer">
                            <button type="button" className="btn btn-ghost" onClick={handleClose}>Annuler</button>
                            <button id="add-demande-submit" type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Créer la demande"}
                            </button>
                            <button
                                type="button"
                                className={`btn-validation-toggle ${form.valide ? "btn-validation-toggle--active" : ""}`}
                                title={form.valide ? "Demande validée (cliquer pour annuler)" : "Marquer comme validée"}
                                onClick={() => setField("valide", !form.valide)}
                            >
                                <ValidationIcon filled={form.valide} />
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {cinAlert && (
                <div className="cin-alert-overlay" onClick={() => setCinAlert(null)}>
                    <div
                        className={`cin-alert-modal ${cinAlert.exists ? "cin-alert-modal--existing" : "cin-alert-modal--new"}`}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                    >
                        <div className="cin-alert-header">
                            <span className="cin-alert-badge">
                                <span className="cin-alert-badge-dot" />
                                {cinAlert.exists ? "Client existant" : "Nouveau client"}
                            </span>
                            <h3>
                                {cinAlert.exists
                                    ? "Un dossier existe déjà pour ce CIN"
                                    : "Aucun dossier trouvé pour ce CIN"}
                            </h3>
                            <p>
                                {cinAlert.exists
                                    ? "Vérifiez qu'il ne s'agit pas d'une demande en double avant de continuer."
                                    : "Vous pouvez poursuivre la création de cette demande."}
                            </p>
                        </div>

                        <div className="cin-alert-cin">
                            <span className="cin-alert-cin-label">CIN</span>
                            <span className="cin-alert-cin-value">{cinAlert.cin}</span>
                        </div>

                        <div className="cin-alert-actions">
                            <button id="cin-validate-button" type="button" onClick={() => setCinAlert(null)}>
                                Compris
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default AddDemandeModal;