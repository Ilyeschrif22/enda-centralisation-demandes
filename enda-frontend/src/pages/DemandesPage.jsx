import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTableFilters from "../components/data-table-filters/data-table-filters";
import DataTable from "../components/data-table/data-table";
import { useAuth } from "../context/AuthContext";

const DemandesPage = () => {
  const { leads, onLeadUpdated, onLeadDeleted, onAddDemande } = useOutletContext();
  const [filteredLeads, setFilteredLeads] = useState(leads);

  const { user } = useAuth();
  const roles = user?.realm_access?.roles || [];
  const canAddDemande = roles.includes("Call center") || roles.includes("Admin");

  useEffect(() => {
    setFilteredLeads(leads);
  }, [leads]);

  return (
    <>
      <div className="content-header">
        {canAddDemande && (
          <button className="btn btn-primary" onClick={onAddDemande}>
            + Nouvelle demande
          </button>
        )}
      </div>

      <DataTableFilters data={leads} onFilteredChange={setFilteredLeads} />

      <DataTable
        data={filteredLeads}
        onLeadUpdated={onLeadUpdated}
        onLeadDeleted={onLeadDeleted}
      />
    </>
  );
};

export default DemandesPage;