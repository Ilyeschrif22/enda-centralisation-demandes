import { createPortal } from "react-dom";

const UserRowActionsMenu = ({ anchorRect, onEdit, onDelete, onClose }) => {
    if (!anchorRect) return null;

    return createPortal(
        <>
            <div
                style={{ position: "fixed", inset: 0, zIndex: 999 }}
                onClick={onClose}
            />
            <div
                className="row-actions-menu"
                style={{
                    position: "fixed",
                    top: anchorRect.bottom + 4,
                    left: anchorRect.right - 160,
                }}
            >
                <button type="button" onClick={onEdit}>Modifier</button>
                <button type="button" onClick={onDelete}>Supprimer</button>
            </div>
        </>,
        document.body
    );
};

export default UserRowActionsMenu;