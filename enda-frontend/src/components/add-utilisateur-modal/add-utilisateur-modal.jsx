import { useEffect, useState } from "react";
import './add-utilisateur-modal.css';

const API_BASE = "http://127.0.0.1:8089";

const initialForm = {
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    agence: "",
    temporaryPassword: "",
    roles: [],
};

const Field = ({ label, error, required = true, children }) => (
    <div className="add-utilisateur-field">
        <label>{label} {required && <span className="required">*</span>}</label>
        {children}
        {error && <span className="field-error">{error}</span>}
    </div>
);

const AddUtilisateurModal = ({ open, onClose, onCreated, onUpdated, utilisateur = null }) => {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [availableRoles, setAvailableRoles] = useState([]);
    const [agences, setAgences] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [resettingPassword, setResettingPassword] = useState(false);
    const isEditing = Boolean(utilisateur);

    useEffect(() => {
        fetch(`${API_BASE}/admin/users/roles`)
            .then((res) => {
                if (!res.ok) throw new Error(`Echec (${res.status})`);
                return res.json();
            })
            .then((data) => setAvailableRoles(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Impossible de charger les rôles", err);
                setAvailableRoles([]);
            });

        fetch(`${API_BASE}/agences`)
            .then((res) => {
                if (!res.ok) throw new Error(`Echec (${res.status})`);
                return res.json();
            })
            .then((list) => setAgences([...new Set((list || []).map((a) => a.agence))].sort()))
            .catch((err) => {
                console.error("Impossible de charger les agences", err);
                setAgences([]);
            });
    }, []);

    useEffect(() => {
        if (!open) return;
        setForm(
            utilisateur
                ? {
                    username: utilisateur.username || "",
                    email: utilisateur.email || "",
                    firstName: utilisateur.firstName || "",
                    lastName: utilisateur.lastName || "",
                    agence: utilisateur.attributes?.agence?.[0] || "",
                    temporaryPassword: "",
                    roles: utilisateur.roles || [],
                }
                : initialForm
        );
        setErrors({});
        setSubmitError(null);
        setNewPassword("");
    }, [open, utilisateur]);

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

    const validate = () => {
        const next = {};
        if (!isEditing && !form.username) next.username = "Champ obligatoire";
        if (!form.email) next.email = "Champ obligatoire";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            if (isEditing) {
                const res = await fetch(`${API_BASE}/admin/users/${utilisateur.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: form.email,
                        firstName: form.firstName,
                        lastName: form.lastName,
                        agence: form.agence,
                    }),
                });
                if (!res.ok) throw new Error(`Echec de l'enregistrement (${res.status})`);

                const rolesRes = await fetch(`${API_BASE}/admin/users/${utilisateur.id}/roles`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roles: form.roles }),
                });
                if (!rolesRes.ok) throw new Error(`Echec de la mise à jour des rôles (${rolesRes.status})`);

                onUpdated?.({ ...utilisateur, ...form });
            } else {
                const res = await fetch(`${API_BASE}/admin/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                if (res.status === 409) throw new Error("CONFLICT");
                if (!res.ok) throw new Error(`Echec de l'enregistrement (${res.status})`);
                const saved = await res.json();
                onCreated?.(saved);
                setForm(initialForm);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setSubmitError(
                err.message === "CONFLICT"
                    ? "Ce nom d'utilisateur ou email existe déjà."
                    : isEditing
                        ? "Impossible de modifier l'utilisateur."
                        : "Impossible de créer l'utilisateur."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) return;
        setResettingPassword(true);
        try {
            const res = await fetch(`${API_BASE}/admin/users/${utilisateur.id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword, temporary: true }),
            });
            if (!res.ok) throw new Error();
            setNewPassword("");
        } catch (err) {
            console.error(err);
            setSubmitError("Impossible de réinitialiser le mot de passe.");
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className="add-utilisateur-overlay" onClick={onClose}>
            <div className="add-utilisateur-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-utilisateur-header">
                    <h2>{isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
                    <button type="button" className="add-utilisateur-close" onClick={onClose}>×</button>
                </div>

                <form className="add-utilisateur-body" onSubmit={handleSubmit}>
                    {submitError && <div className="add-utilisateur-error">{submitError}</div>}

                    <Field label="Nom d'utilisateur" error={errors.username} required={!isEditing}>
                        <input
                            type="text"
                            value={form.username}
                            disabled={isEditing}
                            onChange={(e) => setField("username", e.target.value)}
                        />
                    </Field>

                    <Field label="Email" error={errors.email}>
                        <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                    </Field>

                    <Field label="Prénom" required={false}>
                        <input type="text" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                    </Field>

                    <Field label="Nom" required={false}>
                        <input type="text" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                    </Field>

                    <Field label="Agence" required={false}>
                        <select value={form.agence} onChange={(e) => setField("agence", e.target.value)}>
                            <option value="">Sélectionner une agence</option>
                            {agences.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </Field>

                    {!isEditing && (
                        <Field label="Mot de passe temporaire" required={false}>
                            <input
                                type="text"
                                value={form.temporaryPassword}
                                onChange={(e) => setField("temporaryPassword", e.target.value)}
                            />
                        </Field>
                    )}

                    <div className="add-utilisateur-field">
                        <label>Rôles <span className="required">*</span></label>
                        <div className="roles-checklist">
                            {availableRoles.length === 0 ? (
                                <span className="roles-empty">Aucun rôle disponible</span>
                            ) : (
                                availableRoles.map((role) => (
                                    <label key={role} className="role-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={form.roles.includes(role)}
                                            onChange={() => toggleRole(role)}
                                        />
                                        {role}
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="add-utilisateur-field reset-password-block">
                            <label>Réinitialiser le mot de passe</label>
                            <div className="reset-password-row">
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

                    <div className="add-utilisateur-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Créer l'utilisateur"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUtilisateurModal;