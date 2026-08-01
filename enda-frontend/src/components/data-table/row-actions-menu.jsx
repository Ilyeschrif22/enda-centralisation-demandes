import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";

const EyeIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
);

const EditIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const ReassignIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M21 3 14 10" /><path d="M3 21l7-7" />
    </svg>
);

const RowActionsMenu = ({ anchorRect, onView, onEdit, onDelete, onReassign, onClose }) => {
    const menuRef = useRef(null);
    const { user } = useAuth();

    const roles = user?.realm_access?.roles || [];
    const isCommercialAgent = roles.includes("Call center");
    const isAdmin = roles.includes("Admin");

    const canEditReassign = isAdmin || !isCommercialAgent;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", onClose, true);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", onClose, true);
        };
    }, [onClose]);

    if (!anchorRect) return null;

    const style = {
        position: "fixed",
        top: anchorRect.bottom + 4,
        left: anchorRect.right - 160,
    };

    return createPortal(
        <div className="row-actions-menu" style={style} ref={menuRef}>
            {onView && <button type="button" onClick={() => { onView(); onClose(); }}>
                <EyeIcon /> Voir détails
            </button>}
            {canEditReassign && onEdit && <button type="button" onClick={() => { onEdit(); onClose(); }}>
                <EditIcon /> Modifier
            </button>}
            {canEditReassign && onReassign && <button type="button" onClick={() => { onReassign(); onClose(); }}>
                <ReassignIcon /> Réaffecter
            </button>}
            {isAdmin && onDelete && <button type="button" className="danger" onClick={() => { onDelete(); onClose(); }}>
                <TrashIcon /> Supprimer
            </button>}
        </div>,
        document.body
    );
};

export default RowActionsMenu;