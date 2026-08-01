import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./delete-confirmation-modal.css";

const WarningIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
);

const DeleteConfirmationModal = ({ lead, isDeleting, onClose, onConfirm }) => {
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!lead) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isDeleting) onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        cancelButtonRef.current?.focus();
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [lead, isDeleting, onClose]);

    if (!lead) return null;

    const fullName = [lead.utilisateur?.nom, lead.utilisateur?.prenom].filter(Boolean).join(" ") || "ce demandeur";

    return createPortal(
        <div className="delete-confirmation-overlay" role="presentation" onMouseDown={() => !isDeleting && onClose()}>
            <section className="delete-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirmation-title" aria-describedby="delete-confirmation-description" onMouseDown={(event) => event.stopPropagation()}>
                <div className="delete-confirmation-icon"><WarningIcon /></div>
                <h2 id="delete-confirmation-title">Supprimer la demande ?</h2>
                <p id="delete-confirmation-description">Vous êtes sur le point de supprimer la demande de <strong>{fullName}</strong>. Cette action est irréversible.</p>
                <div className="delete-confirmation-actions">
                    <button ref={cancelButtonRef} type="button" className="delete-confirmation-cancel" disabled={isDeleting} onClick={onClose}>Annuler</button>
                    <button type="button" className="delete-confirmation-submit" disabled={isDeleting} onClick={onConfirm}>{isDeleting ? "Suppression..." : "Supprimer"}</button>
                </div>
            </section>
        </div>,
        document.body
    );
};

export default DeleteConfirmationModal;
