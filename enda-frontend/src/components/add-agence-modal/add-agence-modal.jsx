import { useEffect, useMemo, useState } from "react";
import geoAgences from "../../../geo-agences.json";
import './add-agence-modal.css';

import { API_BASE } from "../../config";

const initialForm = {
    gouvernorat: "",
    delegation: "",
    agence: "",
};

const GOUVERNORATS = Object.keys(geoAgences).sort();

const Field = ({ label, error, children }) => (
    <div className="add-agence-field">
        <label>{label} <span className="required">*</span></label>
        {children}
        {error && <span className="field-error">{error}</span>}
    </div>
);

const AddAgenceModal = ({ open, onClose, onCreated, onUpdated, agence = null }) => {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const isEditing = Boolean(agence);

    const delegations = useMemo(
        () => Object.keys(geoAgences[form.gouvernorat] || {}).sort(),
        [form.gouvernorat]
    );

    useEffect(() => {
        if (!open) return;
        setForm(agence ? { gouvernorat: agence.gouvernorat, delegation: agence.delegation, agence: agence.agence } : initialForm);
        setErrors({});
        setSubmitError(null);
    }, [open, agence]);

    if (!open) return null;

    const setField = (name, value) => {
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === "gouvernorat") next.delegation = "";
            return next;
        });
    };

    const validate = () => {
        const next = {};
        Object.keys(initialForm).forEach((key) => {
            if (!form[key]) next[key] = "Champ obligatoire";
        });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(isEditing ? `${API_BASE}/agences/${agence.id}` : `${API_BASE}/agences`, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(`Echec de l'enregistrement (${res.status})`);
            const saved = await res.json();
            if (isEditing) {
                onUpdated?.(saved);
            } else {
                onCreated?.(saved);
                setForm(initialForm);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setSubmitError(isEditing ? "Impossible de modifier l'agence." : "Impossible de créer l'agence.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-agence-overlay" onClick={onClose}>
            <div className="add-agence-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-agence-header">
                    <h2>{isEditing ? "Modifier l'agence" : "Nouvelle agence"}</h2>
                    <button type="button" className="add-agence-close" onClick={onClose}>×</button>
                </div>

                <form className="add-agence-body" onSubmit={handleSubmit}>
                    {submitError && <div className="add-agence-error">{submitError}</div>}

                    <Field label="Gouvernorat" error={errors.gouvernorat}>
                        <select value={form.gouvernorat} onChange={(e) => setField("gouvernorat", e.target.value)}>
                            <option value="">Sélectionner un gouvernorat</option>
                            {GOUVERNORATS.map((gouvernorat) => (
                                <option key={gouvernorat} value={gouvernorat}>{gouvernorat}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Délégation" error={errors.delegation}>
                        <select
                            value={form.delegation}
                            onChange={(e) => setField("delegation", e.target.value)}
                            disabled={!form.gouvernorat}
                        >
                            <option value="">Sélectionner une délégation</option>
                            {delegations.map((delegation) => (
                                <option key={delegation} value={delegation}>{delegation}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Agence" error={errors.agence}>
                        <input type="text" value={form.agence} onChange={(e) => setField("agence", e.target.value)} />
                    </Field>

                    <div className="add-agence-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Créer l'agence"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAgenceModal;
