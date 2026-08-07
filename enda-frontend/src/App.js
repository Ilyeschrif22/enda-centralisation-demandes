import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Sidebar from "./components/sidebar/sidebar";
import Navbar from "./components/navbar/navbar";
import StatsCard from "./components/stats-card/stats-card";
import { UsersIcon, CoinsIcon } from "./components/stats-card/icons";
import DataTableFilters from "./components/data-table-filters/data-table-filters";
import DataTable from "./components/data-table/data-table";
import PageLoader from "./components/loader/PageLoader";
import { initKeycloak, getUser, login, logout } from './services/KeycloakService'

// Returns a representative numeric amount for a request, whether montant
// is a plain number or a "min-max" range string like "5001-10000".
const getMontantValue = (request) => {
  const montant = request.montant;

  if (typeof montant === "string" && montant.includes("-")) {
    const [minStr, maxStr] = montant.split("-");
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);

    if (!isNaN(min) && !isNaN(max)) return (min + max) / 2;
    if (!isNaN(min)) return min;
    return 0;
  }

  const numeric = Number(montant);
  return isNaN(numeric) ? 0 : numeric;
};

function App() {
  const [requests, setRequests] = useState([]);
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8089/demandes")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data);
        setFilteredRequests(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRequestUpdated = (updatedRequest) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === updatedRequest.id ? { ...request, ...updatedRequest } : request))
    );
  };

  const stats = useMemo(
    () => [
      {
        key: "count",
        icon: <UsersIcon />,
        iconBg: "#FCEDF5",
        value: requests.length,
        label: "Demandes reçues",
      },
      {
        key: "amount",
        icon: <CoinsIcon />,
        iconBg: "#FFF8E1",
        value: requests
          .reduce((sum, request) => sum + Number(getMontantValue(request)), 0)
          .toLocaleString(),
        label: "Montant total demandé",
      },
    ],
    [requests]
  );

  if (loading) {
    return <PageLoader message="Chargement de l'application..." />;
  }

  return (
    <div className="App">
      <div className="dashboard">
        <Sidebar />

        <div className="main-content">
          <Navbar title="Dashboard" />

          <main className="content">
            <div className="stats-row">
              {stats.map((stat) => (
                <StatsCard key={stat.key} {...stat} trendPositive />
              ))}
            </div>

            <DataTableFilters
              data={requests}
              onFilteredChange={setFilteredRequests}
            />

            <DataTable data={filteredRequests} onRequestUpdated={handleRequestUpdated} onRequestDeleted={() => {}} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;