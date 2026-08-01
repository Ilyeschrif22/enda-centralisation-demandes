import { useEffect, useState, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import secteurActiviteMap from '../../../secteur-activite.json';
import { useAuth } from "../../context/AuthContext";

import './add-demande-modal.css';

const API_BASE = "http://127.0.0.1:8089";

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
};

const REQUIRED_FIELDS = Object.keys(initialForm);

const Field = ({ label, error, children }) => (
    <div className="add-demande-field">
        <label>{label} <span className="required">*</span></label>
        {children}
        {error && <span className="field-error">{error}</span>}
    </div>
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
    };
};

const AddDemandeModal = ({ open, onClose, onCreated, lead = null, onUpdated }) => {
    const { user } = useAuth();
    const currentUsername = user?.preferred_username || user?.username || "utilisateur";

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
        const toastId = toast.custom(
            () => (
                <div className="cin-toast cin-toast-checking">
                    <span className="cin-toast-spinner" />
                    Vérification du CIN...
                </div>
            ),
            { duration: Infinity }
        );
        try {
            const res = await fetch(`${API_BASE}/utilisateurs/check-cin/${cin}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCinStatus(data.exists ? "existant" : "nouveau");
            toast.dismiss(toastId);
            setCinAlert({ cin, exists: data.exists });
        } catch {
            setCinStatus(null);
            toast.dismiss(toastId);
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
            const res = await fetch(isEditing ? `${API_BASE}/demandes/${lead.id}` : `${API_BASE}/demandes`, {
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
            <Toaster
                position="top-right"
                containerStyle={{ zIndex: 999999 }}
                toastOptions={{ style: { background: "transparent", boxShadow: "none", padding: 0 } }}
            />
            <div className="add-demande-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-demande-header">
                    <h2>{isEditing ? "Modifier la demande" : "Nouvelle demande"}</h2>
                    <button type="button" className="add-demande-close" onClick={handleClose}>×</button>
                </div>

                {checkingLock ? (
                    <div className="add-demande-body">
                        <p>Vérification en cours...</p>
                    </div>
                ) : lockedBy ? (
                    <div className="add-demande-body">
                        <div className="add-demande-error">
                            {lockedBy} est en train de modifier cette demande. Réessayez plus tard.
                        </div>
                        <div className="add-demande-footer">
                            <button type="button" className="btn btn-ghost" onClick={handleClose}>Fermer</button>
                        </div>
                    </div>
                ) : (
                    <form className="add-demande-body" onSubmit={handleSubmit}>
                        {submitError && <div className="add-demande-error">{submitError}</div>}

                        <div className="add-demande-columns">
                        <div className="add-demande-column">
                        <div className="add-demande-section add-demande-section-request">
                            <div className="add-demande-grid">
                                <Field label="Type demande" error={errors.typeDemande}>
                                    <select value={form.typeDemande} onChange={(e) => setField("typeDemande", e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {TYPE_DEMANDE_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <div className="add-demande-section add-demande-section-identity">
                            <h3>Identité</h3>
                            <div className="add-demande-grid">
                                <Field label="Nom de famille" error={errors.nomFamille}>
                                    <input type="text" value={form.nomFamille} onChange={(e) => setField("nomFamille", e.target.value)} />
                                </Field>
                                <Field label="Prénom" error={errors.prenom}>
                                    <input type="text" value={form.prenom} onChange={(e) => setField("prenom", e.target.value)} />
                                </Field>
                                <Field label="Date de naissance" error={errors.dateNaissance}>
                                    <input type="date" value={form.dateNaissance} onChange={(e) => setField("dateNaissance", e.target.value)} />
                                </Field>
                                <Field label="Genre" error={errors.genre}>
                                    <select value={form.genre} onChange={(e) => setField("genre", e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {GENRE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </Field>
                                <Field label="Situation familiale" error={errors.situationFamiliale}>
                                    <select value={form.situationFamiliale} onChange={(e) => setField("situationFamiliale", e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {SITUATION_FAMILIALE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </Field>
                                <Field label="CIN" error={errors.cin}>
                                    <input
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
                                <Field label="Secteur d'activité" error={errors.secteurActivite}>
                                    <select value={form.secteurActivite} onChange={(e) => setField("secteurActivite", e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {SECTEURS.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </Field>
                                <Field label="Activité" error={errors.activite}>
                                    <select
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
                                <Field label="N° de téléphone" error={errors.telephone}>
                                    <input
                                        type="text"
                                        maxLength={8}
                                        value={form.telephone}
                                        onChange={(e) => setField("telephone", e.target.value.replace(/\D/g, ""))}
                                    />
                                </Field>
                                <Field label="Adresse" error={errors.adresse}>
                                    <input type="text" value={form.adresse} onChange={(e) => setField("adresse", e.target.value)} />
                                </Field>
                                <Field label="Gouvernorat" error={errors.gouvernorat}>
                                    <select value={form.gouvernorat} onChange={(e) => setField("gouvernorat", e.target.value)} disabled={!agencesLoaded}>
                                        <option value="">Sélectionner...</option>
                                        {gouvernorats.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </Field>
                                <Field label="Délégation" error={errors.delegation}>
                                    <select value={form.delegation} onChange={(e) => setField("delegation", e.target.value)} disabled={!form.gouvernorat}>
                                        <option value="">Sélectionner...</option>
                                        {delegations.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </Field>
                                <Field label="Code postal" error={errors.codePostal}>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={form.codePostal}
                                        onChange={(e) => setField("codePostal", e.target.value.replace(/\D/g, ""))}
                                    />
                                </Field>
                                <Field label="Agence la plus proche" error={errors.agence}>
                                    <input type="text" value={form.agence} readOnly placeholder="Choisir une délégation" />
                                </Field>
                            </div>
                        </div>

                        <div className="add-demande-section add-demande-section-credit">
                            <h3>Crédit</h3>
                            <div className="add-demande-grid">
                                <Field label="Montant de crédit demandé" error={errors.montantDemande}>
                                    <select value={form.montantDemande} onChange={(e) => setField("montantDemande", e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {MONTANT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </Field>
                                <Field label="Utilisation du prêt" error={errors.utilisationPret}>
                                    <select value={form.utilisationPret} onChange={(e) => setField("utilisationPret", e.target.value)}>
                                        <option value="">Sélectionner...</option>
                                        {UTILISATION_PRET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </Field>
                                <Field label="Capacité de remboursement déclarée" error={errors.capaciteRemboursement}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={form.capaciteRemboursement}
                                        onChange={(e) => setField("capaciteRemboursement", e.target.value.replace(/\D/g, ""))}
                                    />
                                </Field>
                                <Field label="Durée de prêt souhaitée" error={errors.dureePret}>
                                    <select value={form.dureePret} onChange={(e) => setField("dureePret", e.target.value)}>
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
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Créer la demande"}
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
                <button type="button" onClick={() => setCinAlert(null)}>
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
