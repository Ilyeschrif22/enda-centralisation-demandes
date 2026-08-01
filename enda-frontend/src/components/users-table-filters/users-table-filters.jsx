import { useEffect, useMemo, useRef, useState } from "react";
import "../data-table-filters/data-table-filters.css";

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

const DateField = ({ value, onChange, placeholder }) => {
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
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

const DateRangeField = ({ from, to, onFromChange, onToChange }) => (
    <div className="date-range-field">
        <DateField value={from} onChange={onFromChange} placeholder="De" />
        <span className="date-range-separator">-</span>
        <DateField value={to} onChange={onToChange} placeholder="À" />
    </div>
);

const initialFilters = {
    nomPrenom: "",
    telephone: "",
    cin: "",
    adresseDomicile: "",
    naissanceFrom: "",
    naissanceTo: "",
    genre: "",
    situationFamiliale: "",
    gouvernorat: "",
    delegation: "",
    codePostal: "",
};

const applyFilters = (data, filters) => {
    return data.filter((user) => {
        const nomPrenom = `${user.nom ?? ""} ${user.prenom ?? ""}`.toLowerCase();

        if (filters.nomPrenom && !nomPrenom.includes(filters.nomPrenom.toLowerCase())) return false;
        if (filters.telephone && !(user.telephone ?? "").includes(filters.telephone)) return false;
        if (filters.cin && !(user.cin ?? "").includes(filters.cin)) return false;
        if (filters.adresseDomicile && !(user.adresseDomicile ?? "").toLowerCase().includes(filters.adresseDomicile.toLowerCase())) return false;

        if (filters.naissanceFrom && (!user.dateNaissance || user.dateNaissance < filters.naissanceFrom)) return false;
        if (filters.naissanceTo && (!user.dateNaissance || user.dateNaissance > filters.naissanceTo)) return false;

        if (filters.genre && user.genre !== filters.genre) return false;
        if (filters.situationFamiliale && user.situationFamiliale !== filters.situationFamiliale) return false;
        if (filters.gouvernorat && user.gouvernorat !== filters.gouvernorat) return false;
        if (filters.delegation && user.delegation !== filters.delegation) return false;
        if (filters.codePostal && !(user.codePostal ?? "").includes(filters.codePostal)) return false;

        return true;
    });
};

const UsersTableFilters = ({ data = [], onFilteredChange }) => {
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

    const gouvernorats = useMemo(
        () => [...new Set(data.map((u) => u.gouvernorat).filter(Boolean))].sort(),
        [data]
    );

    const delegations = useMemo(() => {
        const source = filters.gouvernorat
            ? data.filter((u) => u.gouvernorat === filters.gouvernorat)
            : data;
        return [...new Set(source.map((u) => u.delegation).filter(Boolean))].sort();
    }, [data, filters.gouvernorat]);

    const genres = useMemo(
        () => [...new Set(data.map((u) => u.genre).filter(Boolean))].sort(),
        [data]
    );

    const situations = useMemo(
        () => [...new Set(data.map((u) => u.situationFamiliale).filter(Boolean))].sort(),
        [data]
    );

    // Reset delegation if it no longer matches the selected gouvernorat
    useEffect(() => {
        if (filters.delegation && !delegations.includes(filters.delegation)) {
            update("delegation", "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delegations]);

    return (
        <div className="data-table-filters">
            <div className="data-table-filters-row">
                <div className="filter-field">
                    <label>Nom &amp; Prénom</label>
                    <input
                        type="text"
                        placeholder="Nom & Prénom"
                        value={filters.nomPrenom}
                        onChange={(e) => update("nomPrenom", e.target.value)}
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
                    <label>CIN</label>
                    <input
                        type="text"
                        placeholder="CIN"
                        value={filters.cin}
                        onChange={(e) => update("cin", e.target.value)}
                    />
                </div>

                <div className="filter-field">
                    <label>Adresse domicile</label>
                    <input
                        type="text"
                        placeholder="Adresse"
                        value={filters.adresseDomicile}
                        onChange={(e) => update("adresseDomicile", e.target.value)}
                    />
                </div>

                <div className="filter-field filter-field-date-range">
                    <label>Date de naissance</label>
                    <DateRangeField
                        from={filters.naissanceFrom}
                        to={filters.naissanceTo}
                        onFromChange={(v) => update("naissanceFrom", v)}
                        onToChange={(v) => update("naissanceTo", v)}
                    />
                </div>

                <div className="filter-field">
                    <label>Genre</label>
                    <select value={filters.genre} onChange={(e) => update("genre", e.target.value)}>
                        <option value="">Tous</option>
                        {genres.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Situation familiale</label>
                    <select
                        value={filters.situationFamiliale}
                        onChange={(e) => update("situationFamiliale", e.target.value)}
                    >
                        <option value="">Toutes</option>
                        {situations.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Gouvernorat</label>
                    <select
                        value={filters.gouvernorat}
                        onChange={(e) => update("gouvernorat", e.target.value)}
                    >
                        <option value="">Tous</option>
                        {gouvernorats.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Délégation</label>
                    <select
                        value={filters.delegation}
                        onChange={(e) => update("delegation", e.target.value)}
                        disabled={delegations.length === 0}
                    >
                        <option value="">Toutes</option>
                        {delegations.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label>Code postal</label>
                    <input
                        type="text"
                        placeholder="Code postal"
                        value={filters.codePostal}
                        onChange={(e) => update("codePostal", e.target.value)}
                    />
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

export default UsersTableFilters;
