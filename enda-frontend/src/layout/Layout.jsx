import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/sidebar";
import Navbar from "../components/navbar/navbar";
import AddDemandeModal from "../components/add-demande/add-demande-modal";
import PageLoader from "../components/loader/PageLoader";
import "../App.css";

import { API_BASE } from "../config";

const mapDemandeToRequest = (demande) => ({
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
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fetchRequests = useCallback(() => {
    return fetch(`${API_BASE}/demandes`)
      .then((res) => res.json())
      .then((data) => {setRequests(data.map(mapDemandeToRequest)); 
      })
      .catch((err) => console.error(err));
  }, []);
  

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const handleRequestUpdated = (updatedRequest) => {
    const flattened = mapDemandeToRequest(updatedRequest);

    setRequests((prev) => {
      const exists = prev.some((request) => request.id === flattened.id);

      if (!exists) {
        return [flattened, ...prev];
      }

      return prev.map((request) =>
        request.id === flattened.id
          ? { ...request, ...flattened }
          : request
      );
    });
  };

  const handleRequestDeleted = (deletedId) => {
    setRequests((prev) => prev.filter((request) => request.id !== deletedId));
  };

  const handleDemandeCreated = (newDemande) => {
    const flattened = mapDemandeToRequest(newDemande);
    setRequests((prev) => [flattened, ...prev.filter((r) => r.id !== flattened.id)]);
    setIsAddModalOpen(false);
    setRefreshing(true);
    fetchRequests().finally(() => setRefreshing(false));
  };

  if (loading) {
    return <PageLoader message="Connexion en cours..." />;
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
                requests,
                refreshing,
                onRequestUpdated: handleRequestUpdated,
                onRequestDeleted: handleRequestDeleted,
                onAddDemande: () => setIsAddModalOpen(true),
                onRefreshRequests: () => {
                  setRefreshing(true);
                  fetchRequests().finally(() => setRefreshing(false));
                },
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