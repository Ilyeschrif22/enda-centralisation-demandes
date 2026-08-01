import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./reassign-modal.css";

const API_BASE = "http://127.0.0.1:8089";

const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);

const ReassignModal = ({ lead, onClose, onConfirm }) => {
    const [agencesMap, setAgencesMap] = useState({});
    const [agencesLoaded, setAgencesLoaded] = useState(false);

    const [gouvernorat, setGouvernorat] = useState("");
    const [delegation, setDelegation] = useState("");
    const [agence, setAgence] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/agences`)
            .then((res) => res.json())
            .then((list) => {
                const grouped = {};
                list.forEach(({ gouvernorat, delegation, agence }) => {
                    if (!grouped[gouvernorat]) grouped[gouvernorat] = {};
                    grouped[gouvernorat][delegation] = agence;
                });
                setAgencesMap(grouped);
            })
            .catch((err) => console.error("Impossible de charger les agences", err))
            .finally(() => setAgencesLoaded(true));
    }, []);

    const gouvernorats = useMemo(() => Object.keys(agencesMap).sort(), [agencesMap]);

    const delegations = useMemo(
        () => Object.keys(agencesMap[gouvernorat] || {}).sort(),
        [agencesMap, gouvernorat]
    );

    useEffect(() => {
        if (!lead) return;

        const initialGouvernorat = lead?.utilisateur?.gouvernorat ?? lead?.gouvernorat ?? "";
        const initialDelegation = lead?.utilisateur?.delegation ?? lead?.delegation ?? "";

        setGouvernorat(initialGouvernorat);
        setDelegation(initialDelegation);
        setAgence(lead?.agence || "");
        setSaveError(null);
    }, [lead]);

    if (!lead) return null;

    const handleGouvernoratChange = (value) => {
        setGouvernorat(value);
        setDelegation("");
        setAgence("");
    };

    const handleDelegationChange = (value) => {
        setDelegation(value);
        setAgence(agencesMap[gouvernorat]?.[value] || "");
    };

    const hasChanges = agence !== lead.agence;

    const handleConfirm = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await onConfirm?.({ ...lead, agence });
            onClose();
        } catch (error) {
            console.error(error);
            setSaveError("Impossible de réaffecter cette demande.");
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="reassign-overlay" onClick={onClose}>
            <div className="reassign-modal" onClick={(e) => e.stopPropagation()}>
                <div className="reassign-header">
                    <h3>Réaffecter la demande</h3>
                    <button type="button" className="reassign-close" onClick={onClose} aria-label="Fermer">
                        <CloseIcon />
                    </button>
                </div>

                <div className="reassign-body">
                    {saveError && <div className="reassign-error">{saveError}</div>}
                    <div className="reassign-info">
                        <span className="reassign-info-label">Demandeur</span>
                        <span className="reassign-info-value">{lead.nomPrenom}</span>
                    </div>
                    <div className="reassign-info">
                        <span className="reassign-info-label">Adresse du projet</span>
                        <span className="reassign-info-value">{lead.adresseProjet || "-"}</span>
                    </div>
                    <div className="reassign-info">
                        <span className="reassign-info-label">Agence actuelle</span>
                        <span className="reassign-info-value">{lead.agence || "-"}</span>
                    </div>

                    <div className="reassign-field">
                        <label htmlFor="reassign-gouvernorat">Gouvernorat</label>
                        <select
                            id="reassign-gouvernorat"
                            value={gouvernorat}
                            onChange={(e) => handleGouvernoratChange(e.target.value)}
                            disabled={!agencesLoaded}
                        >
                            <option value="">Sélectionner...</option>
                            {gouvernorats.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    <div className="reassign-field">
                        <label htmlFor="reassign-delegation">Délégation</label>
                        <select
                            id="reassign-delegation"
                            value={delegation}
                            onChange={(e) => handleDelegationChange(e.target.value)}
                            disabled={!gouvernorat}
                        >
                            <option value="">Sélectionner...</option>
                            {delegations.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    <div className="reassign-field">
                        <label htmlFor="agence-proche">Agence la plus proche</label>
                        <input
                            id="agence-proche"
                            type="text"
                            value={agence}
                            readOnly
                            placeholder="Choisir une délégation"
                        />
                        <p className="reassign-hint">
                            Cette agence est déterminée automatiquement à partir du gouvernorat et de la délégation sélectionnés.
                        </p>
                    </div>

                </div>

                <div className="reassign-footer">
                    <button type="button" className="reassign-btn-cancel" onClick={onClose}>Annuler</button>
                    <button
                        type="button"
                        className="reassign-btn-confirm"
                        disabled={!hasChanges || !agence || isSaving}
                        onClick={handleConfirm}
                    >
                        {isSaving ? "Réaffectation..." : "Valider la réaffectation"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReassignModal;