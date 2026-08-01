import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Sidebar from "./components/sidebar/sidebar";
import Navbar from "./components/navbar/navbar";
import StatsCard from "./components/stats-card/stats-card";
import { UsersIcon, CoinsIcon } from "./components/stats-card/icons";
import DataTableFilters from "./components/data-table-filters/data-table-filters";
import DataTable from "./components/data-table/data-table";
import { initKeycloak, getUser, login, logout } from './services/KeycloakService'

// Returns a representative numeric amount for a lead, whether montant
// is a plain number or a "min-max" range string like "5001-10000".
const getMontantValue = (lead) => {
  const montant = lead.montant;

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
  const [leads, setLeads] = useState([]);
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8089/demandes")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
        setFilteredLeads(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLeadUpdated = (updatedLead) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead))
    );
  };

  const stats = useMemo(
    () => [
      {
        key: "count",
        icon: <UsersIcon />,
        iconBg: "#FCEDF5",
        value: leads.length,
        label: "Demandes reçues",
      },
      {
        key: "amount",
        icon: <CoinsIcon />,
        iconBg: "#FFF8E1",
        value: leads
          .reduce((sum, lead) => sum + Number(getMontantValue(lead)), 0)
          .toLocaleString(),
        label: "Montant total demandé",
      },
    ],
    [leads]
  );

  if (loading) {
    return <div>Chargement...</div>;
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
              data={leads}
              onFilteredChange={setFilteredLeads}
            />

            <DataTable data={filteredLeads} onLeadUpdated={handleLeadUpdated} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;