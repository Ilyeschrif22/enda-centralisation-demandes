import AddDemandeModal from "../add-demande/add-demande-modal";

const EditDemandeModal = ({ lead, onClose, onSave }) => (
    <AddDemandeModal
        open={Boolean(lead)}
        lead={lead}
        onClose={onClose}
        onUpdated={onSave}
    />
);

export default EditDemandeModal;
