import { useState } from "react";
import RowActionsMenu from "../data-table/row-actions-menu";
import EditUserModal from "../edit-user-modal/edit-user-modal";
import DeleteConfirmationModal from "../data-table/delete-confirmation-modal";
import "../data-table/data-table.css";

const API_BASE = "http://127.0.0.1:8089";

const UsersTable = ({ data = [], onUserUpdated, onUserDeleted, showActions = false }) => {
    const [openMenu, setOpenMenu] = useState(null); // { id, rect }
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [statusError, setStatusError] = useState(null);

    const handleDelete = async (user) => {
        setOpenMenu(null);
        setStatusError(null);
        setDeletingId(user.id);
        onUserDeleted?.(user.id);

        try {
            const res = await fetch(`${API_BASE}/utilisateurs/${user.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(`Echec de la suppression (${res.status})`);
            }

            setUserToDelete(null);
        } catch (err) {
            console.error(err);
            setStatusError("Impossible de supprimer cet utilisateur.");
            onUserUpdated?.(user);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSaved = (updatedUser) => {
        onUserUpdated?.(updatedUser);
    };

    return (
        <div className="data-table">
            {statusError && (
                <div className="data-table-error">{statusError}</div>
            )}

            <div className="data-table-header">
                <ul className="data-table-header-list">
                    <li>
                        <input type="checkbox" aria-label="Select all" />
                    </li>
                    <li>Nom &amp; Prénom</li>
                    <li>Téléphone</li>
                    <li>CIN</li>
                    <li>Date de naissance</li>
                    <li>Adresse</li>
                    <li>Genre</li>
                    <li>Situation familiale</li>
                    <li>Gouvernorat</li>
                    <li>Délégation</li>
                    <li>Code postal</li>
                    {showActions && <li className="actions">Actions</li>}
                </ul>
            </div>

            {data.length === 0 ? (
                <div className="data-table-empty">Aucun utilisateur trouvé</div>
            ) : (
                data.map((user) => (
                    <div
                        className={`data-table-body ${deletingId === user.id ? "row-deleting" : ""}`}
                        key={user.id}
                    >
                        <ul className="data-table-body-list">
                            <li>
                                <input type="checkbox" aria-label="Select row" />
                            </li>
                            <li>{`${user.nom || ""} ${user.prenom || ""}`.trim() || "-"}</li>
                            <li>{user.telephone || "-"}</li>
                            <li>{user.cin || "-"}</li>
                            <li>{user.dateNaissance || "-"}</li>
                            <li>{user.adresseDomicile || "-"}</li>
                            <li>{user.genre || "-"}</li>
                            <li>{user.situationFamiliale || "-"}</li>
                            <li>{user.gouvernorat || "-"}</li>
                            <li>{user.delegation || "-"}</li>
                            <li>{user.codePostal || "-"}</li>
                            {showActions && (
                                <li className="row-actions">
                                    <button
                                        type="button"
                                        className="row-actions-trigger"
                                        disabled={deletingId === user.id}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setOpenMenu(openMenu?.id === user.id ? null : { id: user.id, rect });
                                        }}
                                    >
                                        ⋮
                                    </button>
                                    {openMenu?.id === user.id && (
                                        <RowActionsMenu
                                            anchorRect={openMenu.rect}
                                            onEdit={() => setEditingUser(user)}
                                            onDelete={() => setUserToDelete(user)}
                                            onClose={() => setOpenMenu(null)}
                                        />
                                    )}
                                </li>
                            )}
                        </ul>
                    </div>
                ))
            )}

            {showActions && (
                <>
                    <EditUserModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSaved={handleSaved}
                    />

                    <DeleteConfirmationModal
                        lead={userToDelete}
                        isDeleting={deletingId === userToDelete?.id}
                        onClose={() => setUserToDelete(null)}
                        onConfirm={() => handleDelete(userToDelete)}
                    />
                </>
            )}
        </div>
    );
};

export default UsersTable;