import { useEffect, useRef, useState } from "react";
import AddUtilisateurModal from "../../components/add-utilisateur-modal/add-utilisateur-modal";
import PageLoader from "../../components/loader/PageLoader";
import "../../components/data-table/data-table.css";
import "./users-page.css";
import "./page-layout.css";

const API_BASE = "http://127.0.0.1:8089";

const getInitials = (u) => {
    const first = u.firstName?.[0] || u.username?.[0] || "";
    const last = u.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
};

const getFullName = (u) => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return name || u.username;
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

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

    // Close the row menu when clicking anywhere outside it
    useEffect(() => {
        if (openMenuId === null) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMenuId]);

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

    if (loading) {
        return <PageLoader message="Chargement des utilisateurs..." />;
    }

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
                <div>
                    <h2>Gestion des utilisateurs</h2>
                    <p className="users-page-subtitle">
                        {users.length} utilisateur{users.length > 1 ? "s" : ""} au total
                    </p>
                </div>
                <div className="users-page-actions">
                    
                    <button type="button" className="btn btn-primary" onClick={openCreate}>
                        + Nouvel utilisateur
                    </button>
                </div>
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
                    <div className="data-table-empty">
                        {search ? "Aucun résultat pour cette recherche" : "Aucun utilisateur"}
                    </div>
                ) : (
                    filteredUsers.map((u) => (
                        <div className="data-table-body" key={u.id}>
                            <ul className="data-table-body-list">
                                <li>
                                        <div className="users-table-name-text">
                                            <span className="users-table-fullname">{getFullName(u)}</span>
                                        </div>
                                </li>
                                <li>{u.email || "—"}</li>
                                <li>{u.attributes?.agence?.[0] || "—"}</li>
                                <li>
                                    <div className="users-table-roles">
                                        {(u.roles || []).length > 0 ? (
                                            u.roles.map((r) => (
                                                <span key={r} className="role-badge">{r}</span>
                                            ))
                                        ) : (
                                            <span className="users-table-empty-cell">—</span>
                                        )}
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
                                        <div className="row-actions-menu" ref={menuRef}>
                                            <button type="button" onClick={() => openEdit(u)}>
                                                Modifier
                                            </button>
                                            <button type="button" className="danger" onClick={() => handleDelete(u)}>
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