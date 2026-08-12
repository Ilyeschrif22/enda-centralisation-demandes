import { useState } from "react";
import RowActionsMenu from "../data-table/row-actions-menu";
import '../data-table/data-table.css';
import '../data-table-filters/data-table-filters.css';

import { API_BASE } from "../../config";

const AgencesTable = ({ data = [], loading, onEdit, onDeleted }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);

    const handleDelete = async (agence) => {
        const confirmed = window.confirm(
            `Supprimer l'agence "${agence.agence}" (${agence.gouvernorat} / ${agence.delegation}) ?`
        );
        if (!confirmed) return;

        setOpenMenu(null);
        setError(null);
        setDeletingId(agence.id);

        try {
            const res = await fetch(`${API_BASE}/agences/${agence.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(`Echec de la suppression (${res.status})`);
            }

            onDeleted?.(agence.id);
        } catch (err) {
            console.error(err);
            setError("Impossible de supprimer cette agence.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="data-table agences-table">
            {error && <div className="data-table-error">{error}</div>}

            <div className="data-table-header">
                <ul className="data-table-header-list">
                    <li>Gouvernorat</li>
                    <li>Délégation</li>
                    <li>Agence</li>
                    <li className="actions">Actions</li>
                </ul>
            </div>

            {loading ? (
                <div className="data-table-empty">Chargement...</div>
            ) : data.length === 0 ? (
                <div className="data-table-empty">Aucune agence trouvée</div>
            ) : (
                data.map((agence) => (
                    <div
                        className={`data-table-body ${deletingId === agence.id ? "row-deleting" : ""}`}
                        key={agence.id}
                    >
                        <ul className="data-table-body-list">
                            <li>{agence.gouvernorat}</li>
                            <li>{agence.delegation}</li>
                            <li>{agence.agence}</li>
                            <li className="row-actions">
                                <button
                                    type="button"
                                    className="row-actions-trigger"
                                    disabled={deletingId === agence.id}
                                    aria-label={`Actions pour ${agence.agence}`}
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setOpenMenu(openMenu?.id === agence.id ? null : { id: agence.id, rect });
                                    }}
                                >
                                    ⋮
                                </button>
                                {openMenu?.id === agence.id && (
                                    <RowActionsMenu
                                        anchorRect={openMenu.rect}
                                        onEdit={() => onEdit?.(agence)}
                                        onDelete={() => handleDelete(agence)}
                                        onClose={() => setOpenMenu(null)}
                                    />
                                )}
                            </li>
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
};

export default AgencesTable;
