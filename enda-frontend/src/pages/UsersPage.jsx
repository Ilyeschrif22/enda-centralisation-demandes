import { useEffect, useState } from "react";
import AddUtilisateurModal from "../components/add-utilisateur-modal/add-utilisateur-modal";
import "../components/data-table/data-table.css";
import "./users-page.css";

const API_BASE = "http://127.0.0.1:8089";

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);

    const loadUsers = () => {
        setLoading(true);
        fetch(`${API_BASE}/admin/users`)
            .then((res) => res.json())
            .then(setUsers)
            .catch((err) => {
                console.error(err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(loadUsers, []);

    const openCreate = () => {
        setSelectedUser(null);
        setModalOpen(true);
    };

    const openEdit = (user) => {
        setOpenMenuId(null);
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleDelete = async (user) => {
        setOpenMenuId(null);
        if (!window.confirm(`Supprimer l'utilisateur ${user.username} ?`)) return;
        try {
            const res = await fetch(`${API_BASE}/admin/users/${user.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleEnabled = async (user) => {
        try {
            const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !user.enabled }),
            });
            if (!res.ok) throw new Error();
            setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, enabled: !u.enabled } : u))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const filteredUsers = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="users-page">
            <div className="users-page-header">
                <h2>Gestion des utilisateurs</h2>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                    + Nouvel utilisateur
                </button>
            </div>

            <div className="data-table users-table">
              

                <div className="data-table-header">
                    <ul className="data-table-header-list">
                        <li>Nom</li>
                        <li>Email</li>
                        <li>Agence</li>
                        <li>Rôles</li>
                        <li>Statut</li>
                        <li className="actions">Actions</li>
                    </ul>
                </div>

                {loading ? (
                    <div className="data-table-empty">Chargement...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="data-table-empty">Aucun utilisateur</div>
                ) : (
                    filteredUsers.map((u) => (
                        <div className="data-table-body" key={u.id}>
                            <ul className="data-table-body-list">
                                <li>
                                   
                                        <div className="users-table-name-text">
                                            
                                            <span className="users-table-username">{u.username}</span>
                                        </div>
                                    
                                </li>
                                <li>{u.email}</li>
                                <li>{u.attributes?.agence?.[0] || "—"}</li>
                                <li>
                                    <div className="users-table-roles">
                                        {(u.roles || []).map((r) => (
                                            <span key={r} className="role-badge">{r}</span>
                                        ))}
                                    </div>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className={`status-toggle ${u.enabled ? "enabled" : "disabled"}`}
                                        onClick={() => handleToggleEnabled(u)}
                                    >
                                        {u.enabled ? "Actif" : "Désactivé"}
                                    </button>
                                </li>
                                <li className="row-actions">
                                    <button
                                        type="button"
                                        className="row-actions-trigger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === u.id ? null : u.id);
                                        }}
                                    >
                                        ⋮
                                    </button>
                                    {openMenuId === u.id && (
                                        <div className="row-actions-menu">
                                            <button type="button" onClick={() => openEdit(u)}>
                                                Modifier
                                            </button>
                                            <button type="button" onClick={() => handleDelete(u)}>
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </li>
                            </ul>
                        </div>
                    ))
                )}
            </div>

            <AddUtilisateurModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                utilisateur={selectedUser}
                onCreated={loadUsers}
                onUpdated={loadUsers}
            />
        </div>
    );
};

export default UsersPage;