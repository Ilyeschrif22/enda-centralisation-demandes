import { useEffect, useMemo, useState } from "react";
import AddAgenceModal from "../../components/add-agence-modal/add-agence-modal";
import AgencesTable from "../../components/agences-table/agences-table";
import Pagination from "../../components/pagination/pagination";
import PageLoader from "../../components/loader/PageLoader";
import "../../components/data-table-filters/data-table-filters.css";
import "./page-layout.css";

const API_BASE = "http://127.0.0.1:8089";
const PAGE_SIZE = 10;

const AgencesPage = () => {
    const [agences, setAgences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAgence, setEditingAgence] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ gouvernorat: "", delegation: "" });

    const loadAgences = () => {
        setLoading(true);
        setLoadError(null);
        fetch(`${API_BASE}/agences`)
            .then((res) => {
                if (!res.ok) throw new Error(`Echec du chargement (${res.status})`);
                return res.json();
            })
            .then(setAgences)
            .catch((err) => {
                console.error(err);
                setLoadError("Impossible de charger les agences.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(loadAgences, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [agences, filters]);

    const gouvernorats = useMemo(
        () => [...new Set(agences.map((agence) => agence.gouvernorat).filter(Boolean))].sort(),
        [agences]
    );

    const delegations = useMemo(
        () => [...new Set(
            agences
                .filter((agence) => !filters.gouvernorat || agence.gouvernorat === filters.gouvernorat)
                .map((agence) => agence.delegation)
                .filter(Boolean)
        )].sort(),
        [agences, filters.gouvernorat]
    );

    const filteredAgences = useMemo(
        () => agences.filter((agence) => (
            (!filters.gouvernorat || agence.gouvernorat === filters.gouvernorat) &&
            (!filters.delegation || agence.delegation === filters.delegation)
        )),
        [agences, filters]
    );

    const distinctAgences = useMemo(
        () => [...new Map(filteredAgences.map((agence) => [agence.agence, agence])).values()],
        [filteredAgences]
    );

    const updateFilter = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "gouvernorat" ? { delegation: "" } : {}),
        }));
    };

    const paginatedAgences = useMemo(
        () => distinctAgences.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [distinctAgences, currentPage]
    );

    const totalPages = Math.max(1, Math.ceil(distinctAgences.length / PAGE_SIZE));

    const handleAdd = () => {
        setEditingAgence(null);
        setModalOpen(true);
    };

    const handleEdit = (agence) => {
        setEditingAgence(agence);
        setModalOpen(true);
    };

    const handleCreated = (created) => {
        setAgences((prev) => [...prev, created]);
    };

    const handleUpdated = (updated) => {
        setAgences((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    };

    const handleDeleted = (id) => {
        setAgences((prev) => prev.filter((a) => a.id !== id));
    };

    if (loading) {
        return <PageLoader message="Chargement des agences..." />;
    }

    return (
        <>
            <div className="content-header">
                <button className="btn btn-primary" onClick={handleAdd}>
                    + Nouvelle agence
                </button>
            </div>

            {loadError && <div className="data-table-error">{loadError}</div>}

            <div className="data-table-filters">
                <div className="data-table-filters-row">
                    <div className="filter-field">
                        <label htmlFor="agence-gouvernorat-filter">Gouvernorat</label>
                        <select
                            id="agence-gouvernorat-filter"
                            value={filters.gouvernorat}
                            onChange={(e) => updateFilter("gouvernorat", e.target.value)}
                        >
                            <option value="">Tous les gouvernorats</option>
                            {gouvernorats.map((gouvernorat) => (
                                <option key={gouvernorat} value={gouvernorat}>{gouvernorat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label htmlFor="agence-delegation-filter">Délégation</label>
                        <select
                            id="agence-delegation-filter"
                            value={filters.delegation}
                            disabled={!filters.gouvernorat}
                            onChange={(e) => updateFilter("delegation", e.target.value)}
                        >
                            <option value="">Toutes les délégations</option>
                            {delegations.map((delegation) => (
                                <option key={delegation} value={delegation}>{delegation}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-field filter-actions">
                        <button
                            type="button"
                            className="filter-reset"
                            disabled={!filters.gouvernorat && !filters.delegation}
                            onClick={() => setFilters({ gouvernorat: "", delegation: "" })}
                        >
                            Réinitialiser
                        </button>
                        <span className="filter-count">{distinctAgences.length} agence(s)</span>
                    </div>
                </div>
            </div>

            <AgencesTable
                data={paginatedAgences}
                loading={loading}
                onEdit={handleEdit}
                onDeleted={handleDeleted}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={distinctAgences.length}
                pageSize={PAGE_SIZE}
            />

            <AddAgenceModal
                open={modalOpen}
                agence={editingAgence}
                onClose={() => setModalOpen(false)}
                onCreated={handleCreated}
                onUpdated={handleUpdated}
            />
        </>
    );
};

export default AgencesPage;
