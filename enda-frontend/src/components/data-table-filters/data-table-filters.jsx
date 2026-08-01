import { useEffect, useMemo, useRef, useState } from "react";
import './data-table-filters.css';

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

const initialFilters = {
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
    dateFrom: "",
    dateTo: "",
};

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

const applyFilters = (data, filters) => {
    return data.filter((lead) => {
        if (filters.cin && !(lead.cin ?? "").toLowerCase().includes(filters.cin.toLowerCase())) return false;
        if (filters.telephone && !(lead.telephone ?? "").includes(filters.telephone)) return false;
        if (filters.statutProjet && lead.statutProjet !== filters.statutProjet) return false;
        if (filters.activite && lead.activite !== filters.activite) return false;

        // region lives under lead.utilisateur.region, not lead.region
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

        if (filters.dateFrom && (lead.dateSaisie ?? "") < filters.dateFrom) return false;
        if (filters.dateTo && (lead.dateSaisie ?? "") > filters.dateTo) return false;

        return true;
    });
};

const DataTableFilters = ({ data = [], onFilteredChange }) => {
    const [filters, setFilters] = useState(initialFilters);

    const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

    useEffect(() => {
        onFilteredChange?.(filteredData);
    }, [filteredData, onFilteredChange]);

    const update = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const reset = () => {
        setFilters(initialFilters);
    };

    const activeCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="data-table-filters">
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
                    <label>Nature du prêt</label>
                    <select value={filters.activite} onChange={(e) => update("activite", e.target.value)}>
                        <option value="">Toutes</option>
                        {ACTIVITES.map((a) => (
                            <option key={a} value={a}>{a}</option>
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
                    <label>Région</label>

                    <select
                        value={filters.region}
                        onChange={(e) => update("region", e.target.value)}
                    >
                        <option value="">
                            Toutes
                        </option>

                        {REGIONS.map((region) => (
                            <option
                                key={region}
                                value={region}
                            >
                                {region}
                            </option>
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

                {/* <div className="filter-field">
                    <label>Montant demandé</label>
                    <input
                        type="text"
                        placeholder="Montant"
                        value={filters.montant}
                        onChange={(e) => update("montant", e.target.value)}
                    />
                </div> */}

                <div className="filter-field">
                    <label>Statut</label>
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

                <div className="filter-field filter-field-range">
                    <label>Date de création</label>
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