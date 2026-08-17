import { useState, useMemo, useEffect, useRef } from "react";
import RowActionsMenu from "./row-actions-menu";
import EditDemandeModal from "../edit-demande-modal/edit-demande-modal";
import LeadProfileView from "../profile-details/lead-profile";
import ReassignModal from "./reassign-modal";
import DeleteConfirmationModal from "./delete-confirmation-modal";
import { useAuth } from "../../context/AuthContext";
import {
    getDemandesByRegion,
    deleteDemande,
    reassignDemande,
    updateStatut,
    updateContacte,
    updateJoignable,
    updateInteresse,
} from "../../api/demandes";

import './data-table.css';

const PAGE_SIZE = 50;

const STATUT_OPTIONS = [
    { value: "NON_SAISIE", label: "Non saisie" },
    { value: "SAISIE", label: "Saisie" },
];

const getStatusClass = (statut) => {
    switch (statut) {
        case "NON_SAISIE":
            return "status-nonsaisie";
        case "SAISIE":
            return "status-saisie";
        case "MANQUE_INFORMATION":
            return "status-manqueinfo";
        case "DEMANDE_RENOUVELLEMENT":
            return "status-renouvellement";
        case "DEMANDE_COMPLEMENT":
            return "status-complement";
        default:
            return "status-default";
    }
};

const getContacteClass = (contacte) => (contacte ? "status-contacte" : "status-noncontacte");

const getJoignableClass = (joignable) => {
    if (joignable === true) return "status-joignable";
    if (joignable === false) return "status-nonjoignable";
    return "status-default";
};

const getJoignableLabel = (joignable) => {
    if (joignable === true) return "Joignable";
    if (joignable === false) return "Non joignable";
    return "Joinable ?";
};

const nextJoignableValue = (current) => {
    if (current === null || current === undefined) return true;
    if (current === true) return false;
    return null;
};

const getInteresseClass = (interesse) => {
    if (interesse === true) return "status-interesse-oui";
    if (interesse === false) return "status-interesse-non";
    return "status-default";
};

const getInteresseLabel = (interesse) => {
    if (interesse === true) return "Intéressé";
    if (interesse === false) return "Non intéressé";
    return "Intéressé ?";
};

const nextInteresseValue = (current) => {
    if (current === null || current === undefined) return true;
    if (current === true) return false;
    return null;
};

const getSortValue = (lead, key) => {
    switch (key) {
        case "dateSaisie":
            return new Date(lead.dateSaisie).getTime() || 0;
        case "nom":
            return `${lead.utilisateur?.nom || ""} ${lead.utilisateur?.prenom || ""}`.toLowerCase();
        case "telephone":
            return lead.utilisateur?.telephone || "";
        case "cin":
            return lead.utilisateur?.cin || "";
        case "montant":
            return Number(lead.montant) || 0;
        case "agence":
            return lead.agence || "";
        case "region":
            return lead.utilisateur?.region || "";
        case "statut":
            return lead.statut || "";
        case "contacte":
            return lead.contacte ? 1 : 0;
        case "joignable":
            if (lead.joignable === true) return 2;
            if (lead.joignable === false) return 1;
            return 0;
        case "interesse":
            if (lead.interesse === true) return 2;
            if (lead.interesse === false) return 1;
            return 0;
        default:
            return "";
    }
};

const SortIcon = ({ direction }) => {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`sort-icon ${direction ? "sort-icon-active" : "sort-icon-neutral"}`}
            style={{
                transform: direction === "asc" ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
            }}
        >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
        </svg>
    );
};

const GripIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
    </svg>
);

const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const buildAuditQuery = (user) => {
    const username = user?.preferred_username || "";
    const nomUtilisateur = `${user?.given_name || ""} ${user?.family_name || ""}`.trim() || username;
    const params = new URLSearchParams({ username, nomUtilisateur });
    return params.toString();
};

const DataTable = ({ data = [], onLeadUpdated, onLeadDeleted, onRequestUpdated, onRequestDeleted, onViewStateChange }) => {

    const { user } = useAuth();

    const roles = user?.realm_access?.roles || [];
    const isCommercialAgent = roles.includes("Call center");
    const isAssistantAgent = roles.includes("Assistant Agent");
    const isDirecteurRegional = roles.includes("Directeur Régional");
    const isDirecteur = isDirecteurRegional || roles.includes("Directeur Agence");
    const canUpdateStatus = !isDirecteur;

    const auditQuery = buildAuditQuery(user);
    const updateHandler = onRequestUpdated || onLeadUpdated;
    const deleteHandler = onRequestDeleted || onLeadDeleted;

    const [openMenu, setOpenMenu] = useState(null);
    const [editingLead, setEditingLead] = useState(null);
    const [viewingLeadId, setViewingLeadId] = useState(null);
    const [reassigningLead, setReassigningLead] = useState(null);
    const [leadToDelete, setLeadToDelete] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [updatingContacteId, setUpdatingContacteId] = useState(null);
    const [updatingInteresseId, setUpdatingInteresseId] = useState(null);
    const [updatingJoignableId, setUpdatingJoignableId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [statusError, setStatusError] = useState(null);
    const [page, setPage] = useState(1);
    const [regionData, setRegionData] = useState(null);
    const [regionLoading, setRegionLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: "dateSaisie", direction: "desc" });

    const [searchQuery, setSearchQuery] = useState("");

    const [selectedIds, setSelectedIds] = useState(new Set());
    const selectAllRef = useRef(null);
    const [customOrder, setCustomOrder] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);

    useEffect(() => {
        if (!isDirecteurRegional) {
            setRegionData(null);
            return;
        }
        const userRegion = user?.region?.[0] || user?.attributes?.region?.[0];
        if (!userRegion) {
            setRegionData([]);
            return;
        }
        setRegionLoading(true);
        getDemandesByRegion(userRegion)
            .then(setRegionData)
            .catch((err) => {
                console.error("Impossible de charger les demandes par région", err);
                setRegionData([]);
            })
            .finally(() => setRegionLoading(false));
    }, [isDirecteurRegional, user]);

    useEffect(() => {
        setSelectedIds((prev) => {
            if (prev.size === 0) return prev;
            const validIds = new Set(data.map((l) => l.id));
            let changed = false;
            const next = new Set();
            prev.forEach((id) => {
                if (validIds.has(id)) next.add(id);
                else changed = true;
            });
            return changed ? next : prev;
        });
    }, [data]);


    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const handleSort = (key) => {
        setCustomOrder(null);
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const getSortDirection = (key) => (sortConfig.key === key ? sortConfig.direction : null);

    const filteredData = useMemo(() => {
        const isAssistantAgent = roles.includes("Assistant Agent");

        let result = isDirecteurRegional ? (regionData || []) : data;

        if (isAssistantAgent) {
            const userAgence = user?.agence?.[0];
            if (!userAgence) return [];
            result = result.filter((lead) => lead.agence === userAgence);
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            result = result.filter((lead) => {
                const haystack = [
                    lead.utilisateur?.nom,
                    lead.utilisateur?.prenom,
                    lead.utilisateur?.telephone,
                    lead.utilisateur?.cin,
                    lead.agence,
                    lead.utilisateur?.region,
                    lead.canal,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(query);
            });
        }

        result = [...result].sort((a, b) => {
            const valA = getSortValue(a, sortConfig.key);
            const valB = getSortValue(b, sortConfig.key);

            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [data, user, isDirecteurRegional, regionData, sortConfig, searchQuery, roles]);

    // Applies the manual drag order on top of the sorted/filtered data, if any.
    // Any lead not present in customOrder (e.g. newly fetched) is appended at the end.
    const orderedData = useMemo(() => {
        if (!customOrder) return filteredData;

        const byId = new Map(filteredData.map((lead) => [lead.id, lead]));
        const ordered = customOrder.map((id) => byId.get(id)).filter(Boolean);
        const orderedIds = new Set(customOrder);
        const extra = filteredData.filter((lead) => !orderedIds.has(lead.id));

        return [...ordered, ...extra];
    }, [filteredData, customOrder]);

    const totalPages = Math.max(1, Math.ceil(orderedData.length / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [totalPages, page]);

    const visibleData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return orderedData.slice(start, start + PAGE_SIZE);
    }, [orderedData, page]);

    const viewingLead = visibleData.find((l) => l.id === viewingLeadId) || null;

    useEffect(() => {
        onViewStateChange?.(Boolean(viewingLead));
    }, [viewingLead, onViewStateChange]);

    // --- Selection helpers (current page only, like most modern tables) ---
    const allVisibleSelected = visibleData.length > 0 && visibleData.every((l) => selectedIds.has(l.id));
    const someVisibleSelected = visibleData.some((l) => selectedIds.has(l.id));

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
        }
    }, [someVisibleSelected, allVisibleSelected]);

    const handleSelectAll = (isChecked) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            visibleData.forEach((lead) => {
                if (isChecked) next.add(lead.id);
                else next.delete(lead.id);
            });
            return next;
        });
    };

    const handleSelectRow = (id, isChecked) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isChecked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleDragStart = (e, id) => {
        setDraggedRowId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const handleDragOverRow = (e, id) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedRowId && id !== draggedRowId && id !== dragOverRowId) {
            setDragOverRowId(id);
        }
    };

    const handleDragLeaveRow = (id) => {
        setDragOverRowId((prev) => (prev === id ? null : prev));
    };

    const handleDropRow = (e, targetId) => {
        e.preventDefault();
        setDragOverRowId(null);

        if (!draggedRowId || draggedRowId === targetId) {
            setDraggedRowId(null);
            return;
        }

        const currentIds = orderedData.map((l) => l.id);
        const fromIndex = currentIds.indexOf(draggedRowId);
        const toIndex = currentIds.indexOf(targetId);

        if (fromIndex === -1 || toIndex === -1) {
            setDraggedRowId(null);
            return;
        }

        const nextIds = [...currentIds];
        nextIds.splice(fromIndex, 1);
        nextIds.splice(toIndex, 0, draggedRowId);

        setCustomOrder(nextIds);
        setDraggedRowId(null);
    };

    const handleDragEnd = () => {
        setDraggedRowId(null);
        setDragOverRowId(null);
    };

    const handleView = (lead) => setViewingLeadId(lead.id);
    const handleEdit = (lead) => setEditingLead(lead);
    const handleReassign = (lead) => setReassigningLead(lead);

    const handleDelete = async (lead) => {
        setOpenMenu(null);

        setStatusError(null);
        setDeletingId(lead.id);
        deleteHandler?.(lead.id);

        try {
            await deleteDemande(lead.id, auditQuery);

            if (viewingLeadId === lead.id) {
                setViewingLeadId(null);
            }

            setLeadToDelete(null);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de supprimer cette demande.");
            updateHandler?.(lead);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = (updatedLead) => {
        updateHandler?.(updatedLead);
    };

    const handleReassignConfirm = async (updatedLead) => {
        const savedLead = await reassignDemande(updatedLead.id, updatedLead.agence, auditQuery);
        updateHandler?.(savedLead);
    };

    const handleStatusChange = async (lead, newStatut) => {
        const previousStatut = lead.statut;
        if (newStatut === previousStatut) return;

        setStatusError(null);
        setUpdatingStatusId(lead.id);

        updateHandler?.({ ...lead, statut: newStatut });

        try {
            const updated = await updateStatut(lead.id, newStatut, auditQuery);
            updateHandler?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut.");
            updateHandler?.({ ...lead, statut: previousStatut });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleContacteChange = async (lead, newValue) => {
        const previousContacte = lead.contacte;
        if (newValue === previousContacte) return;

        setStatusError(null);
        setUpdatingContacteId(lead.id);

        updateHandler?.({ ...lead, contacte: newValue });

        try {
            const updated = await updateContacte(lead.id, newValue, auditQuery);
            updateHandler?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut contacté.");
            updateHandler?.({ ...lead, contacte: previousContacte });
        } finally {
            setUpdatingContacteId(null);
        }
    };

    const handleInteresseChange = async (lead, newValue) => {
        const previousInteresse = lead.interesse;
        if (newValue === previousInteresse) return;

        setStatusError(null);
        setUpdatingInteresseId(lead.id);

        updateHandler?.({ ...lead, interesse: newValue });

        try {
            const updated = await updateInteresse(lead.id, newValue, auditQuery);
            updateHandler?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut intéressé.");
            updateHandler?.({ ...lead, interesse: previousInteresse });
        } finally {
            setUpdatingInteresseId(null);
        }
    };

    const handleJoignableChange = async (lead, newValue) => {
        const previousJoignable = lead.joignable;
        if (newValue === previousJoignable) return;

        setStatusError(null);
        setUpdatingJoignableId(lead.id);

        updateHandler?.({ ...lead, joignable: newValue });

        try {
            const updated = await updateJoignable(lead.id, newValue, auditQuery);
            updateHandler?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut joignable.");
            updateHandler?.({ ...lead, joignable: previousJoignable });
        } finally {
            setUpdatingJoignableId(null);
        }
    };

    return (
        <>
            {viewingLead ? (
                <LeadProfileView
                    lead={viewingLead}
                    allLeads={visibleData}
                    onBack={() => setViewingLeadId(null)}
                    onEdit={() => setEditingLead(viewingLead)}
                />
            ) : (
                <div className="data-table">
                    {statusError && (
                        <div className="data-table-error">{statusError}</div>
                    )}

                    <div className="data-table-search">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Rechercher ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="data-table-search-clear"
                                onClick={() => setSearchQuery("")}
                                aria-label="Effacer la recherche"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="data-table-selection-bar">
                            <span>{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
                            <button type="button" onClick={clearSelection}>
                                Désélectionner
                            </button>
                        </div>
                    )}

                    <div className="data-table-header">
                        <ul className="data-table-header-list">
                            <li><input
                                type="checkbox"
                                aria-label="Select all"
                                ref={selectAllRef}
                                checked={allVisibleSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            /></li>
                            <li className="col-drag" aria-hidden="true"></li>
                            <li className="sortable-header" onClick={() => handleSort("dateSaisie")}>
                                <span>Date</span>
                                <SortIcon direction={getSortDirection("dateSaisie")} />
                            </li>
                            <li className="sortable-header" onClick={() => handleSort("nom")}>
                                <span>Nom Prénom</span>
                                <SortIcon direction={getSortDirection("nom")} />
                            </li>
                            <li className="sortable-header" onClick={() => handleSort("telephone")}>
                                <span>Téléphone</span>
                                <SortIcon direction={getSortDirection("telephone")} />
                            </li>
                            <li className="sortable-header" onClick={() => handleSort("cin")}>
                                <span>Cin</span>
                                <SortIcon direction={getSortDirection("cin")} />
                            </li>
                            <li className="sortable-header" onClick={() => handleSort("montant")}>
                                <span>Montant</span>
                                <SortIcon direction={getSortDirection("montant")} />
                            </li>
                            <li className="sortable-header" onClick={() => handleSort("region")}>
                                <span>Région</span>
                                <SortIcon direction={getSortDirection("region")} />
                            </li>
                            <li className="sortable-header" onClick={() => handleSort("agence")}>
                                <span>Agence</span>
                                <SortIcon direction={getSortDirection("agence")} />
                            </li>
                            <li className="statu-contact sortable-header" onClick={() => handleSort("contacte")}>
                                <span>Contact</span>
                                <SortIcon direction={getSortDirection("contacte")} />
                            </li>
                            <li className="statu-contact sortable-header" onClick={() => handleSort("joignable")}>
                                <span>Joignable</span>
                                <SortIcon direction={getSortDirection("joignable")} />
                            </li>
                            <li className="statu-contact sortable-header" onClick={() => handleSort("interesse")}>
                                <span>Intéressé</span>
                                <SortIcon direction={getSortDirection("interesse")} />
                            </li>
                            <li className="statu sortable-header" onClick={() => handleSort("statut")}>
                                <span>Statut</span>
                                <SortIcon direction={getSortDirection("statut")} />
                            </li>

                            <li className="statu-canal">Canal</li>

                            <li className="actions">Actions</li>
                        </ul>
                    </div>

                    {regionLoading ? (
                        <div className="data-table-empty">Chargement...</div>
                    ) : visibleData.length === 0 ? (
                        <div className="data-table-empty">
                            {searchQuery ? "Aucun résultat pour cette recherche" : "Aucun résultat pour ces filtres"}
                        </div>
                    ) : (
                        <div className="data-table-rows">
                            {visibleData.map((lead) => (
                                <div
                                    className={[
                                        "data-table-body",
                                        deletingId === lead.id ? "row-deleting" : "",
                                        draggedRowId === lead.id ? "row-dragging" : "",
                                        dragOverRowId === lead.id ? "row-drag-over" : "",
                                        selectedIds.has(lead.id) ? "row-selected" : "",
                                    ].filter(Boolean).join(" ")}
                                    key={lead.id}
                                    onDragOver={(e) => handleDragOverRow(e, lead.id)}
                                    onDragLeave={() => handleDragLeaveRow(lead.id)}
                                    onDrop={(e) => handleDropRow(e, lead.id)}
                                >
                                    <ul className="data-table-body-list">
                                        <li><input
                                            type="checkbox"
                                            aria-label="Select row"
                                            checked={selectedIds.has(lead.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleSelectRow(lead.id, e.target.checked)}
                                        /></li>
                                        <li className="col-drag">
                                            <span
                                                className="drag-handle"
                                                draggable="true"
                                                title="Glisser pour réordonner"
                                                onClick={(e) => e.stopPropagation()}
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    handleDragStart(e, lead.id);
                                                }}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <GripIcon />
                                            </span>
                                        </li>
                                        <li>{lead.dateSaisie}</li>
                                        <li>{lead.utilisateur?.nom} {lead.utilisateur?.prenom}</li>
                                        <li>{lead.utilisateur?.telephone}</li>
                                        <li>{lead.utilisateur?.cin}</li>
                                        <li>{lead.montant?.toLocaleString()} DT</li>
                                        <li>{lead.utilisateur?.region}</li>
                                        <li>{lead.agence}</li>

                                        <li className="status-contact">
                                            <button
                                                id="status-contact"
                                                type="button"
                                                className={`status-contact ${getContacteClass(lead.contacte)}`}
                                                disabled={!canUpdateStatus || updatingContacteId === lead.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleContacteChange(lead, !lead.contacte);
                                                }}
                                         
                                            >
                                                {lead.contacte ? "Contacté" : "Non contacté"}
                                            </button>
                                        </li>

                                        <li className="status-joinable">
                                            <button
                                                type="button"
                                                id="status-joinable"
                                                className={`status-contact ${getJoignableClass(lead.joignable)}`}
                                                disabled={!canUpdateStatus || !lead.contacte || updatingJoignableId === lead.id}
                                                title={!lead.contacte ? "Contacter le client d'abord" : ""}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleJoignableChange(lead, nextJoignableValue(lead.joignable));
                                                }}
                                            >
                                                {getJoignableLabel(lead.joignable)}
                                            </button>
                                        </li>
                                        <li className="status-interesse">
                                            <button
                                                id="status-interesse"
                                                type="button"
                                                className={`status-contact ${getInteresseClass(lead.interesse)}`}
                                                disabled={!canUpdateStatus || lead.joignable !== true || updatingInteresseId === lead.id}
                                                title={lead.joignable !== true ? "Le client doit être Joignable d'abord" : ""}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInteresseChange(lead, nextInteresseValue(lead.interesse));
                                                }}
                                            >
                                                {getInteresseLabel(lead.interesse)}
                                            </button>
                                        </li>
                                        <li className="statu">
                                            <select
                                                className={`status-demande ${getStatusClass(lead.statut)}`}
                                                value={lead.statut || "NON_SAISIE"}
                                                disabled={
                                                    !isAssistantAgent ||
                                                    !canUpdateStatus ||
                                                    !(lead.contacte && lead.joignable && lead.interesse) ||
                                                    updatingStatusId === lead.id
                                                }
                                                title={
                                                    isAssistantAgent
                                                        ? "Les assistants ne peuvent pas modifier le statut."
                                                        : !(lead.contacte && lead.joignable && lead.interesse)
                                                            ? "Contacté, Joignable et Intéressé doivent être validés d'abord."
                                                            : ""
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleStatusChange(lead, e.target.value)}
                                            >
                                                {STATUT_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </li>
                                        <li className="statu-canal">
                                            <span className="canal-badge">{lead.canal}</span>
                                        </li>
                                        <li className="row-actions">
                                            {(isCommercialAgent || isDirecteur) ? (
                                                <button
                                                    type="button"
                                                    className="row-actions-trigger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleView(lead);
                                                    }}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="row-actions-trigger"
                                                        disabled={deletingId === lead.id}
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setOpenMenu(openMenu?.id === lead.id ? null : { id: lead.id, rect });
                                                        }}
                                                    >
                                                        ⋮
                                                    </button>
                                                    {openMenu?.id === lead.id && (
                                                        <RowActionsMenu
                                                            anchorRect={openMenu.rect}
                                                            onView={() => handleView(lead)}
                                                            onEdit={() => handleEdit(lead)}
                                                            onDelete={() => setLeadToDelete(lead)}
                                                            onReassign={() => handleReassign(lead)}
                                                            onClose={() => setOpenMenu(null)}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </li>
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {orderedData.length > PAGE_SIZE && (
                        <div className="data-table-pagination">
                            <span className="pagination-info">
                                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, orderedData.length)} sur {orderedData.length}
                            </span>
                            <div className="pagination-controls">
                                <button
                                    type="button"
                                    className="pagination-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Précédent
                                </button>
                                <span className="pagination-page">Page {page} / {totalPages}</span>
                                <button
                                    type="button"
                                    className="pagination-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Suivant
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <EditDemandeModal
                lead={editingLead}
                onClose={() => setEditingLead(null)}
                onSave={handleSave}
            />

            <ReassignModal
                lead={reassigningLead}
                onClose={() => setReassigningLead(null)}
                onConfirm={handleReassignConfirm}
            />

            <DeleteConfirmationModal
                lead={leadToDelete}
                isDeleting={deletingId === leadToDelete?.id}
                onClose={() => setLeadToDelete(null)}
                onConfirm={() => handleDelete(leadToDelete)}
            />
        </>
    );
};

export default DataTable;