import { useState, useMemo, useEffect } from "react";
import RowActionsMenu from "./row-actions-menu";
import EditDemandeModal from "../edit-demande-modal/edit-demande-modal";
import LeadProfileView from "../profile-details/lead-profile";
import ReassignModal from "./reassign-modal";
import DeleteConfirmationModal from "./delete-confirmation-modal";
import { useAuth } from "../../context/AuthContext";

import './data-table.css';

const API_BASE = "http://127.0.0.1:8089";
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

const DataTable = ({ data = [], onLeadUpdated, onLeadDeleted }) => {

    const { user } = useAuth();

    const roles = user?.realm_access?.roles || [];
    const isCommercialAgent = roles.includes("Call center");
    const isDirecteurRegional = roles.includes("Directeur Régional");
    const isDirecteur = isDirecteurRegional || roles.includes("Directeur Agence");
    const canUpdateStatus = !isDirecteur;

    const [checked, setChecked] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [editingLead, setEditingLead] = useState(null);
    const [viewingLeadId, setViewingLeadId] = useState(null);
    const [reassigningLead, setReassigningLead] = useState(null);
    const [leadToDelete, setLeadToDelete] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [updatingContacteId, setUpdatingContacteId] = useState(null);
    const [updatingJoignableId, setUpdatingJoignableId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [statusError, setStatusError] = useState(null);
    const [page, setPage] = useState(1);
    const [regionData, setRegionData] = useState(null);
    const [regionLoading, setRegionLoading] = useState(false);

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
        fetch(`${API_BASE}/demandes/region/${encodeURIComponent(userRegion)}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Echec (${res.status})`);
                return res.json();
            })
            .then(setRegionData)
            .catch((err) => {
                console.error("Impossible de charger les demandes par région", err);
                setRegionData([]);
            })
            .finally(() => setRegionLoading(false));
    }, [isDirecteurRegional, user]);

    const filteredData = useMemo(() => {
        const isAssistantAgent = roles.includes("Assistant Agent");

        let result = isDirecteurRegional ? (regionData || []) : data;

        if (isAssistantAgent) {
            const userAgence = user?.agence?.[0];
            if (!userAgence) return [];
            result = result.filter((lead) => lead.agence === userAgence);
        }

        result = [...result].sort(
            (a, b) => new Date(b.dateSaisie) - new Date(a.dateSaisie)
        );

        return result;
    }, [data, user, isDirecteurRegional, regionData]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [totalPages, page]);

    const visibleData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredData.slice(start, start + PAGE_SIZE);
    }, [filteredData, page]);

    const viewingLead = visibleData.find((l) => l.id === viewingLeadId) || null;

    const handleView = (lead) => setViewingLeadId(lead.id);
    const handleEdit = (lead) => setEditingLead(lead);
    const handleReassign = (lead) => setReassigningLead(lead);

    const handleDelete = async (lead) => {
        setOpenMenu(null);

        setStatusError(null);
        setDeletingId(lead.id);
        onLeadDeleted?.(lead.id);

        try {
            const res = await fetch(`${API_BASE}/demandes/${lead.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(`Echec de la suppression (${res.status})`);
            }

            if (viewingLeadId === lead.id) {
                setViewingLeadId(null);
            }

            setLeadToDelete(null);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de supprimer cette demande.");
            onLeadUpdated?.(lead);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = (updatedLead) => {
        onLeadUpdated?.(updatedLead);
    };

    const handleReassignConfirm = async (updatedLead) => {
        const res = await fetch(`${API_BASE}/demandes/${updatedLead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agence: updatedLead.agence }),
        });

        if (!res.ok) {
            throw new Error(`Echec de la réaffectation (${res.status})`);
        }

        const savedLead = await res.json();
        onLeadUpdated?.(savedLead);
    };

    const handleStatusChange = async (lead, newStatut) => {
        const previousStatut = lead.statut;
        if (newStatut === previousStatut) return;

        setStatusError(null);
        setUpdatingStatusId(lead.id);

        onLeadUpdated?.({ ...lead, statut: newStatut });

        try {
            const res = await fetch(`${API_BASE}/demandes/${lead.id}/statut`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStatut),
            });

            if (!res.ok) {
                throw new Error(`Echec de la mise à jour du statut (${res.status})`);
            }

            const updated = await res.json();
            onLeadUpdated?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut.");
            onLeadUpdated?.({ ...lead, statut: previousStatut });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleContacteChange = async (lead, newValue) => {
        const previousContacte = lead.contacte;
        if (newValue === previousContacte) return;

        setStatusError(null);
        setUpdatingContacteId(lead.id);

        onLeadUpdated?.({ ...lead, contacte: newValue });

        try {
            const res = await fetch(`${API_BASE}/demandes/${lead.id}/contacte`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newValue),
            });

            if (!res.ok) {
                throw new Error(`Echec de la mise à jour du statut contacté (${res.status})`);
            }

            const updated = await res.json();
            onLeadUpdated?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut contacté.");
            onLeadUpdated?.({ ...lead, contacte: previousContacte });
        } finally {
            setUpdatingContacteId(null);
        }
    };

    const handleJoignableChange = async (lead, newValue) => {
        const previousJoignable = lead.joignable;
        if (newValue === previousJoignable) return;

        setStatusError(null);
        setUpdatingJoignableId(lead.id);

        onLeadUpdated?.({ ...lead, joignable: newValue });

        try {
            const res = await fetch(`${API_BASE}/demandes/${lead.id}/joignable`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newValue),
            });

            if (!res.ok) {
                throw new Error(`Echec de la mise à jour du statut joignable (${res.status})`);
            }

            const updated = await res.json();
            onLeadUpdated?.(updated);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de changer le statut joignable.");
            onLeadUpdated?.({ ...lead, joignable: previousJoignable });
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

                    <div className="data-table-header">
                        <ul className="data-table-header-list">
                            <li><input
                                type="checkbox"
                                aria-label="Select all"
                                checked={checked}
                                onChange={(e) => setChecked(e.target.checked)}
                            /></li>
                            <li>Date de creation</li>
                            <li>Nom &amp; Prénom</li>
                            <li>Téléphone</li>
                            <li>Cin</li>
                            <li>Montant</li>
                            <li>Agence</li>
                            <li>Région</li>
                            <li className="statu">Statut</li>
                            <li className="statu-contact">Contact</li>
                            <li className="statu-contact">Joignable</li>
                            <li className="statu-canal">Canal</li>

                            <li className="actions">Actions</li>
                        </ul>
                    </div>

                    {regionLoading ? (
                        <div className="data-table-empty">Chargement...</div>
                    ) : visibleData.length === 0 ? (
                        <div className="data-table-empty">Aucun résultat pour ces filtres</div>
                    ) : (
                        <div className="data-table-rows">
                            {visibleData.map((lead) => (
                                <div
                                    className={`data-table-body ${deletingId === lead.id ? "row-deleting" : ""}`}
                                    key={lead.id}
                                >
                                    <ul className="data-table-body-list">
                                        <li><input
                                            type="checkbox"
                                            aria-label="Select row"
                                        /></li>
                                        <li>{lead.dateSaisie}</li>
                                        <li>{lead.utilisateur?.nom} {lead.utilisateur?.prenom}</li>
                                        <li>{lead.utilisateur?.telephone}</li>
                                        <li>{lead.utilisateur?.cin}</li>
                                        <li>{lead.montant?.toLocaleString()} DT</li>
                                        <li>{lead.agence}</li>
                                        <li>{lead.utilisateur?.region}</li>
                                        <li className="statu">
                                            <select
                                                className={`status-demande ${getStatusClass(lead.statut)}`}
                                                value={lead.statut || "NON_SAISIE"}
                                                disabled={!canUpdateStatus || updatingStatusId === lead.id}
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
                                        <li className="status-contact">
                                            <button
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
                                        <li className="statu-canal">
                                            <span className="canal-badge">{lead.canal}</span>
                                        </li>
                                        <li className="row-actions">
                                            {isCommercialAgent ? (
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

                    {filteredData.length > PAGE_SIZE && (
                        <div className="data-table-pagination">
                            <span className="pagination-info">
                                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredData.length)} sur {filteredData.length}
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