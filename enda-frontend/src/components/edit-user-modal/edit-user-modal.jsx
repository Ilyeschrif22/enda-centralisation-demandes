import { useEffect, useState } from "react";
import "../add-demande/add-demande-modal.css";

const API_BASE = "http://127.0.0.1:8089";

const GENRE_OPTIONS = ["Homme", "Femme"];
const SITUATION_FAMILIALE_OPTIONS = ["Célibataire", "Marié", "Divorcé", "Veuf"];

const EditUserModal = ({ user, onClose, onSaved }) => {
    const [form, setForm] = useState({
        nom: "",
        prenom: "",
        telephone: "",
        cin: "",
        dateNaissance: "",
        adresseDomicile: "",
        genre: "",
        situationFamiliale: "",
        gouvernorat: "",
        delegation: "",
        codePostal: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        if (!user) return;
        setForm({
            nom: user.nom ?? "",
            prenom: user.prenom ?? "",
            telephone: user.telephone ?? "",
            cin: user.cin ?? "",
            dateNaissance: user.dateNaissance ?? "",
            adresseDomicile: user.adresseDomicile ?? "",
            genre: user.genre ?? "",
            situationFamiliale: user.situationFamiliale ?? "",
            gouvernorat: user.gouvernorat ?? "",
            delegation: user.delegation ?? "",
            codePostal: user.codePostal ?? "",
        });
        setSubmitError(null);
    }, [user]);

    if (!user) return null;

    const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`${API_BASE}/utilisateurs/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(`Echec de la mise à jour (${res.status})`);
            const updated = await res.json();
            onSaved?.(updated);
            onClose();
        } catch (err) {
            console.error(err);
            setSubmitError("Impossible de modifier cet utilisateur.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-demande-overlay" onClick={onClose}>
            <div className="add-demande-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-demande-header">
                    <h2>Modifier l'utilisateur</h2>
                    <button type="button" className="add-demande-close" onClick={onClose}>×</button>
                </div>

                <form className="add-demande-body" onSubmit={handleSubmit}>
                    {submitError && <div className="add-demande-error">{submitError}</div>}

                    <div className="add-demande-grid">
                        <div className="add-demande-field">
                            <label>Nom de famille</label>
                            <input type="text" value={form.nom} onChange={(e) => setField("nom", e.target.value)} />
                        </div>
                        <div className="add-demande-field">
                            <label>Prénom</label>
                            <input type="text" value={form.prenom} onChange={(e) => setField("prenom", e.target.value)} />
                        </div>
                        <div className="add-demande-field">
                            <label>Téléphone</label>
                            <input
                                type="text"
                                maxLength={8}
                                value={form.telephone}
                                onChange={(e) => setField("telephone", e.target.value.replace(/\D/g, ""))}
                            />
                        </div>
                        <div className="add-demande-field">
                            <label>CIN</label>
                            <input type="text" maxLength={8} value={form.cin} readOnly />
                        </div>
                        <div className="add-demande-field">
                            <label>Date de naissance</label>
                            <input
                                type="date"
                                value={form.dateNaissance}
                                onChange={(e) => setField("dateNaissance", e.target.value)}
                            />
                        </div>
                        <div className="add-demande-field">
                            <label>Adresse</label>
                            <input
                                type="text"
                                value={form.adresseDomicile}
                                onChange={(e) => setField("adresseDomicile", e.target.value)}
                            />
                        </div>
                        <div className="add-demande-field">
                            <label>Genre</label>
                            <select value={form.genre} onChange={(e) => setField("genre", e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {GENRE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="add-demande-field">
                            <label>Situation familiale</label>
                            <select
                                value={form.situationFamiliale}
                                onChange={(e) => setField("situationFamiliale", e.target.value)}
                            >
                                <option value="">Sélectionner...</option>
                                {SITUATION_FAMILIALE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="add-demande-field">
                            <label>Gouvernorat</label>
                            <input
                                type="text"
                                value={form.gouvernorat}
                                onChange={(e) => setField("gouvernorat", e.target.value)}
                            />
                        </div>
                        <div className="add-demande-field">
                            <label>Délégation</label>
                            <input
                                type="text"
                                value={form.delegation}
                                onChange={(e) => setField("delegation", e.target.value)}
                            />
                        </div>
                        <div className="add-demande-field">
                            <label>Code postal</label>
                            <input
                                type="text"
                                maxLength={4}
                                value={form.codePostal}
                                onChange={(e) => setField("codePostal", e.target.value.replace(/\D/g, ""))}
                            />
                        </div>
                    </div>

                    <div className="add-demande-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;