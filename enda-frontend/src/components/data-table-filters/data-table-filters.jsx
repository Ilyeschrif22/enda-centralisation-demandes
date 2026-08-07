import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import './data-table-filters.css';

const API_BASE = "http://127.0.0.1:8089";

const ACTIVITES = ["Agriculture et Elevage", "Artisanat", "Commerce", "Production", "Autres"];
const CANAUX = ["FACEBOOK", "WHATSAPP", "WEB", "TELEPHONE", "AGENCE"];
const CANAL_LABELS = {
    FACEBOOK: "Facebook",
    WHATSAPP: "WhatsApp",
    WEB: "Web",
    TELEPHONE: "Téléphone",
    AGENCE: "Agence",
};

const STATUT_OPTIONS = [
    { value: "NON_SAISIE", label: "Non saisie" },
    { value: "SAISIE", label: "Saisie" },
];

const CONTACTE_OPTIONS = [
    { value: "true", label: "Contacté" },
    { value: "false", label: "Non contacté" },
];

const JOIGNABLE_OPTIONS = [
    { value: "true", label: "Joignable" },
    { value: "false", label: "Non joignable" },
    { value: "null", label: "Non défini" },
];

const INTERESSE_OPTIONS = [
    { value: "true", label: "Intéressé" },
    { value: "false", label: "Non intéressé" },
    { value: "null", label: "Non défini" },
];

const AGENCES = [
    "Alghalba", "Akouda", "Amdoune", "Ariana", "Bargou", "Beja", "Ben Arous", "Ben Garden",
    "Bir lahfay", "Bizerte", "Bizerte Sud", "Bni kaled", "Bouarada", "Bouhajla", "Chebba",
    "Douar Hicher", "Douz", "El Alaa", "El Ksar", "Elalia", "Elhamma", "Ennadhour", "Ennfidha",
    "Fahs", "Fouchana", "Foussena", "Gabes", "Gabes-sud", "Gafsa", "Ghardimaou", "Grombalia",
    "Haffouz", "Hajeb laayoun", "Hammam lif", "hammamet", "Jammel", "Jbeniana", "Jelma",
    "Jendouba", "Jerba", "Kabaria", "Kairouan", "Kasserine", "Kbilli", "Kef", "Kef Ouest",
    "Kelibia", "Korba", "Kram", "Krib", "KsarHellal", "M,Bourguiba", "M.beb", "M'seken",
    "Mahdia", "Makther", "Mareth", "Marsa", "Mateur", "Medina", "Mednine", "Manzel bouzalfa",
    "Manzel temim", "Metlaoui", "Moknine", "Monastir", "Mornag", "Mornaguia", "Nabeul", "Nefza",
    "Omrane sup", "Oued lil", "Ouslatia", "Raoeud", "Ras Jbal", "Regeub", "Sakiat Eddeir",
    "Sakiet sidi youssef", "Sbiba", "Sbikha", "Sbitla", "Sejnane", "Sers", "Sfax", "Sidi bouzid",
    "Sidi Hessine", "Sidi Thabet", "Siliana", "Sned", "solimen", "SoukEjdid", "Skhira", "Sousse",
    "Tbarka", "Tadhamen", "Tajerouine", "Tataouine", "Tebourba", "Testour", "Thala", "Touzeur",
    "Zaghouen", "Zarzis", "Zouhour",
];

const REGIONS = [
    "GT1",
    "GT2",
    "Bizerte",
    "Nord Ouest 1",
    "Nord Ouest 2",
    "Sud Est",
    "Sud Ouest",
    "Centre Ouest 1",
    "Centre Ouest 2",
    "Centre Ouest 3",
    "Sahel",
    "Cap Bon",
];

const formatDate = (isoValue) => {
    if (!isoValue) return "";
    const [year, month, day] = isoValue.split("-");
    return `${day}/${month}/${year}`;
};

const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);

const BookmarkIcon = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
);

const DateField = ({ value, onChange, placeholder, min, max }) => {
    const inputRef = useRef(null);

    const openPicker = () => {
        if (inputRef.current?.showPicker) {
            inputRef.current.showPicker();
        } else {
            inputRef.current?.focus();
        }
    };

    return (
        <div className="date-field" onClick={openPicker}>
            <span className={`date-field-text ${!value ? "date-field-placeholder" : ""}`}>
                {value ? formatDate(value) : placeholder}
            </span>
            <CalendarIcon />
            <input
                ref={inputRef}
                type="date"
                className="date-field-input"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export const initialFilters = {
    cin: "",
    telephone: "",
    statutProjet: "",
    activite: "",
    adresseProjet: "",
    montant: "",
    region: "",
    agence: "",
    canal: "",
    statut: "",
    contacte: "",
    joignable: "",
    interesse: "",
    dateFrom: "",
    dateTo: "",
};

export const applyFilters = (data, filters) => {
    return data.filter((lead) => {
        if (filters.cin && !(lead.cin ?? "").toLowerCase().includes(filters.cin.toLowerCase())) return false;
        if (filters.telephone && !(lead.telephone ?? "").includes(filters.telephone)) return false;
        if (filters.statutProjet && lead.statutProjet !== filters.statutProjet) return false;
        if (filters.activite && lead.activite !== filters.activite) return false;

        if (filters.region && lead.utilisateur?.region !== filters.region) return false;

        if (filters.agence === "SANS_AGENCE") {
            if (lead.agence) return false;
        } else if (filters.agence && lead.agence !== filters.agence) {
            return false;
        }

        if (filters.canal && lead.canal !== filters.canal) return false;
        if (filters.adresseProjet && !(lead.adresseProjet ?? "").toLowerCase().includes(filters.adresseProjet.toLowerCase())) return false;

        if (filters.statut && lead.statut !== filters.statut) return false;

        if (filters.contacte !== "" && Boolean(lead.contacte) !== (filters.contacte === "true")) return false;

        if (filters.joignable !== "") {
            const filterVal = filters.joignable === "null" ? null : filters.joignable === "true";
            if (lead.joignable !== filterVal) return false;
        }

        if (filters.interesse !== "") {
            const filterVal = filters.interesse === "null" ? null : filters.interesse === "true";
            if (lead.interesse !== filterVal) return false;
        }

        if (filters.dateFrom && (lead.dateSaisie ?? "") < filters.dateFrom) return false;
        if (filters.dateTo && (lead.dateSaisie ?? "") > filters.dateTo) return false;

        return true;
    });
};

const DataTableFilters = ({ filters, onFilterChange }) => {
    const { user } = useAuth();
    const keycloakId = user?.sub;

    const [savedFilters, setSavedFilters] = useState([]);
    const [activeSavedId, setActiveSavedId] = useState("");
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [savingError, setSavingError] = useState(null);
    const saveInputRef = useRef(null);

    const fetchSavedFilters = useCallback(() => {
        if (!keycloakId) return;

        fetch(`${API_BASE}/saved-filters?keycloakId=${encodeURIComponent(keycloakId)}`)
            .then((res) => res.json())
            .then(setSavedFilters)
            .catch((err) => console.error("Erreur chargement filtres enregistrés:", err));
    }, [keycloakId]);

    useEffect(() => {
        fetchSavedFilters();
    }, [fetchSavedFilters]);

    useEffect(() => {
        if (showSaveForm) {
            saveInputRef.current?.focus();
        }
    }, [showSaveForm]);

    const update = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
        setActiveSavedId("");
    };

    const reset = () => {
        onFilterChange(initialFilters);
        setActiveSavedId("");
    };

    const activeCount = Object.values(filters).filter(Boolean).length;

    const openSaveForm = () => {
        setSaveName("");
        setSavingError(null);
        setShowSaveForm(true);
    };

    const cancelSaveForm = () => {
        setShowSaveForm(false);
        setSaveName("");
        setSavingError(null);
    };

    const confirmSave = () => {
        const name = saveName.trim();
        if (!name || !keycloakId) return;

        fetch(`${API_BASE}/saved-filters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, keycloakId, filters }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Échec de l'enregistrement");
                return res.json();
            })
            .then((created) => {
                setSavedFilters((prev) => [...prev, created]);
                setActiveSavedId(created.id);
                setShowSaveForm(false);
                setSaveName("");
                setSavingError(null);
            })
            .catch((err) => {
                console.error(err);
                setSavingError("Erreur lors de l'enregistrement.");
            });
    };

    const handleSaveKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            confirmSave();
        } else if (e.key === "Escape") {
            cancelSaveForm();
        }
    };

    const applySaved = (id) => {
        setActiveSavedId(id);
        if (!id) return;
        const saved = savedFilters.find((f) => f.id === id);
        if (saved) onFilterChange({ ...initialFilters, ...saved.filters });
    };

   const deleteSaved = (id) => {
    if (!keycloakId) return;

    fetch(`${API_BASE}/saved-filters/${id}?keycloakId=${encodeURIComponent(keycloakId)}`, {
        method: "DELETE",
    })
        .then((res) => {
            if (res.status === 404) {
                throw new Error("Filtre introuvable ou déjà supprimé (vérifiez keycloakId).");
            }
            if (!res.ok) throw new Error("Échec de la suppression");
            setSavedFilters((prev) => prev.filter((f) => f.id !== id));
            if (activeSavedId === id) setActiveSavedId("");
        })
        .catch((err) => console.error(err));
};

    return (
        <div className="data-table-filters">
            <div className="data-table-filters-row saved-filters-row">
                <div className="filter-field saved-filters-select-field">
                    <label>Filtres enregistrés</label>
                    <select value={activeSavedId} onChange={(e) => applySaved(e.target.value)}>
                        <option value="">Aucun</option>
                        {savedFilters.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                {activeSavedId && (
                    <button
                        type="button"
                        className="saved-filter-delete"
                        title="Supprimer ce filtre enregistré"
                        onClick={() => deleteSaved(activeSavedId)}
                    >
                        <TrashIcon />
                    </button>
                )}

                {showSaveForm ? (
                    <div className="save-filter-form">
                        <input
                            ref={saveInputRef}
                            type="text"
                            placeholder="Nom du filtre"
                            value={saveName}
                            maxLength={40}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyDown={handleSaveKeyDown}
                        />
                        <button type="button" className="save-filter-confirm" disabled={!saveName.trim()} onClick={confirmSave}>
                            Enregistrer
                        </button>
                        <button type="button" className="save-filter-cancel" onClick={cancelSaveForm}>
                            Annuler
                        </button>
                        {savingError && <span className="save-filter-error">{savingError}</span>}
                    </div>
                ) : (
                    <button
                        type="button"
                        className="save-filter-trigger"
                        disabled={activeCount === 0}
                        title={activeCount === 0 ? "Ajoutez au moins un filtre pour l'enregistrer" : "Enregistrer les filtres actuels"}
                        onClick={openSaveForm}
                    >
                        <BookmarkIcon />
                        Enregistrer les filtres
                    </button>
                )}
            </div>

            <div className="data-table-filters-row">
                <div className="filter-field">
                    <label>CIN</label>
                    <input
                        type="text"
                        placeholder="CIN"
                        value={filters.cin}
                        onChange={(e) => update("cin", e.target.value)}
                    />
                </div>

                <div className="filter-field">
                    <label>Téléphone</label>
                    <input
                        type="text"
                        placeholder="Téléphone"
                        value={filters.telephone}
                        onChange={(e) => update("telephone", e.target.value)}
                    />
                </div>

                 <div className="filter-field">
                    <label>Région</label>
                    <select
                        value={filters.region}
                        onChange={(e) => update("region", e.target.value)}
                    >
                        <option value="">Toutes</option>
                        {REGIONS.map((region) => (
                            <option key={region} value={region}>
                                {region}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Agence</label>
                    <select value={filters.agence} onChange={(e) => update("agence", e.target.value)}>
                        <option value="">Toutes</option>
                        <option value="SANS_AGENCE">Sans agence</option>
                        {AGENCES.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

               

                <div className="filter-field">
                    <label>Canal</label>
                    <select value={filters.canal} onChange={(e) => update("canal", e.target.value)}>
                        <option value="">Tous</option>
                        {CANAUX.map((c) => (
                            <option key={c} value={c}>{CANAL_LABELS[c] || c}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="data-table-filters-row">
                <div className="filter-field">
                    <label>Statut (dfla)</label>
                    <select value={filters.statut} onChange={(e) => update("statut", e.target.value)}>
                        <option value="">Tous</option>
                        {STATUT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Contact</label>
                    <select value={filters.contacte} onChange={(e) => update("contacte", e.target.value)}>
                        <option value="">Tous</option>
                        {CONTACTE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Joignable</label>
                    <select value={filters.joignable} onChange={(e) => update("joignable", e.target.value)}>
                        <option value="">Tous</option>
                        {JOIGNABLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Intéressé</label>
                    <select value={filters.interesse} onChange={(e) => update("interesse", e.target.value)}>
                        <option value="">Tous</option>
                        {INTERESSE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field filter-field-range">
                    <label>Date de saisie</label>
                    <div className="filter-range">
                        <DateField
                            value={filters.dateFrom}
                            onChange={(v) => update("dateFrom", v)}
                            placeholder="Du"
                            max={filters.dateTo || undefined}
                        />
                        <span>-</span>
                        <DateField
                            value={filters.dateTo}
                            onChange={(v) => update("dateTo", v)}
                            placeholder="Au"
                            min={filters.dateFrom || undefined}
                        />
                    </div>
                </div>

                <div className="filter-field filter-actions">
                    {activeCount > 0 && <span className="filter-count">{activeCount} filtre(s)</span>}
                    <button type="button" className="filter-reset" onClick={reset}>
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTableFilters;