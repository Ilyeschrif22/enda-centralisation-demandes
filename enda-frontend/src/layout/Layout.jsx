import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/sidebar";
import Navbar from "../components/navbar/navbar";
import AddDemandeModal from "../components/add-demande/add-demande-modal";
import "../App.css";

const mapDemandeToLead = (demande) => ({
  ...demande,
  nomPrenom: `${demande.utilisateur?.nom || ""} ${demande.utilisateur?.prenom || ""}`.trim(),
  telephone: demande.utilisateur?.telephone || "",
  cin: demande.utilisateur?.cin || "",
  dateNaissance: demande.utilisateur?.dateNaissance || "",
  dateEmissionCin: demande.utilisateur?.dateEmissionCin || "",
  adresseDomicile: demande.utilisateur?.adresseDomicile || "",
  canal: demande.canal,
  statut: demande.statut || "NON_SAISIE",
});

const Layout = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8089/demandes")
      .then((res) => res.json())
      .then((data) => setLeads(data.map(mapDemandeToLead)))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLeadUpdated = (updatedLead) => {
    const flattened = mapDemandeToLead(updatedLead);

    setLeads((prev) => {
      const exists = prev.some((lead) => lead.id === flattened.id);

      if (!exists) {
        return [flattened, ...prev];
      }

      return prev.map((lead) =>
        lead.id === flattened.id
          ? { ...lead, ...flattened }
          : lead
      );
    });
  };

  const handleLeadDeleted = (deletedId) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== deletedId));
  };

  const handleDemandeCreated = (newDemande) => {
    const flattened = mapDemandeToLead(newDemande);

    setLeads((prev) => [flattened, ...prev]);

    setIsAddModalOpen(false);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="App">
      <div className="dashboard">
        <Sidebar />

        <div className="main-content">
          <Navbar
            title="Dashboard"
            onAddDemande={() => setIsAddModalOpen(true)}
          />

          <main className="content">
            <Outlet
              context={{
                leads,
                onLeadUpdated: handleLeadUpdated,
                onLeadDeleted: handleLeadDeleted,
                onAddDemande: () => setIsAddModalOpen(true),
              }}
            />
          </main>
        </div>
      </div>

      <AddDemandeModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleDemandeCreated}
      />
    </div>
  );
};

export default Layout;
