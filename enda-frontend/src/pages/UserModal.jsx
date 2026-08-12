import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "../config";

const initialForm = {
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    agence: "",
    temporaryPassword: "",
    roles: [],
};

const UserModal = ({ open, onClose, user = null, onSaved }) => {
    const isEditing = Boolean(user);

    const [form, setForm] = useState(initialForm);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [agences, setAgences] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [resettingPassword, setResettingPassword] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/admin/users/roles`)
            .then((res) => res.json())
            .then(setAvailableRoles)
            .catch((err) => console.error("Impossible de charger les rôles", err));

        fetch(`${API_BASE}/agences`)
            .then((res) => res.json())
            .then((list) => {
                const uniqueAgences = [...new Set(list.map((a) => a.agence))].sort();
                setAgences(uniqueAgences);
            })
            .catch((err) => console.error("Impossible de charger les agences", err));
    }, []);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setNewPassword("");

        if (user) {
            setForm({
                username: user.username || "",
                email: user.email || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                agence: user.attributes?.agence?.[0] || "",
                temporaryPassword: "",
                roles: user.roles || [],
            });
        } else {
            setForm(initialForm);
        }
    }, [open, user]);

    if (!open) return null;

    const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const toggleRole = (role) => {
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (isEditing) {
                const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: form.email,
                        firstName: form.firstName,
                        lastName: form.lastName,
                        agence: form.agence,
                    }),
                });
                if (!res.ok) throw new Error();

                const rolesRes = await fetch(`${API_BASE}/admin/users/${user.id}/roles`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roles: form.roles }),
                });
                if (!rolesRes.ok) throw new Error();
            } else {
                const res = await fetch(`${API_BASE}/admin/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                if (res.status === 409) {
                    setError("Ce nom d'utilisateur ou email existe déjà.");
                    return;
                }
                if (!res.ok) throw new Error();
            }

            onSaved?.();
            onClose();
        } catch (err) {
            console.error(err);
            setError(isEditing ? "Impossible de modifier l'utilisateur." : "Impossible de créer l'utilisateur.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) return;
        setResettingPassword(true);
        try {
            const res = await fetch(`${API_BASE}/admin/users/${user.id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword, temporary: true }),
            });
            if (!res.ok) throw new Error();
            setNewPassword("");
        } catch (err) {
            console.error(err);
            setError("Echec de la réinitialisation.");
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className="user-modal-overlay" onClick={onClose}>
            <div className="user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-modal-header">
                    <h2>{isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
                    <button type="button" className="user-modal-close" onClick={onClose}>×</button>
                </div>

                <form className="user-modal-body" onSubmit={handleSubmit}>
                    {error && <div className="user-modal-error">{error}</div>}

                    <div className="user-modal-grid">
                        <div className="user-modal-field">
                            <label>Nom d'utilisateur {!isEditing && <span className="required">*</span>}</label>
                            <input
                                type="text"
                                value={form.username}
                                disabled={isEditing}
                                onChange={(e) => setField("username", e.target.value)}
                                required={!isEditing}
                            />
                        </div>

                        <div className="user-modal-field">
                            <label>Email <span className="required">*</span></label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setField("email", e.target.value)}
                                required
                            />
                        </div>

                        <div className="user-modal-field">
                            <label>Prénom</label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={(e) => setField("firstName", e.target.value)}
                            />
                        </div>

                        <div className="user-modal-field">
                            <label>Nom</label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={(e) => setField("lastName", e.target.value)}
                            />
                        </div>

                        <div className="user-modal-field">
                            <label>Agence</label>
                            <select value={form.agence} onChange={(e) => setField("agence", e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {agences.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        {!isEditing && (
                            <div className="user-modal-field">
                                <label>Mot de passe temporaire</label>
                                <input
                                    type="text"
                                    value={form.temporaryPassword}
                                    onChange={(e) => setField("temporaryPassword", e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="user-modal-field">
                        <label>Rôles</label>
                        <div className="roles-checklist">
                            {availableRoles.map((role) => (
                                <label key={role} className="role-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={form.roles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                    />
                                    {role}
                                </label>
                            ))}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="user-modal-field password-reset-block">
                            <label>Réinitialiser le mot de passe</label>
                            <div className="password-reset-row">
                                <input
                                    type="text"
                                    placeholder="Nouveau mot de passe temporaire"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={handleResetPassword}
                                    disabled={!newPassword || resettingPassword}
                                >
                                    {resettingPassword ? "..." : "Réinitialiser"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="user-modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;