import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTableFilters, { initialFilters, applyFilters } from "../components/data-table-filters/data-table-filters";
import DataTable from "../components/data-table/data-table";
import Pagination from "../components/pagination/pagination";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 50;

const DemandesPage = () => {
  const { leads, onLeadUpdated, onLeadDeleted, onAddDemande } = useOutletContext();
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const roles = user?.realm_access?.roles || [];
  const canAddDemande = roles.includes("Call center") || roles.includes("Admin");

  const filteredLeads = useMemo(
    () => applyFilters(leads, filters),
    [leads, filters]
  );

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort(
      (a, b) => new Date(b.dateSaisie) - new Date(a.dateSaisie)
    );
  }, [filteredLeads]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / PAGE_SIZE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedLeads.slice(start, start + PAGE_SIZE);
  }, [sortedLeads, currentPage]);

  const handleFilterChange = (next) => {
    setFilters(next);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="content-header">
        {canAddDemande && (
          <button className="btn btn-primary" onClick={onAddDemande}>
            + Nouvelle demande
          </button>
        )}
      </div>

      <DataTableFilters filters={filters} onFilterChange={handleFilterChange} />

      <DataTable
        data={paginatedLeads}
        onLeadUpdated={onLeadUpdated}
        onLeadDeleted={onLeadDeleted}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedLeads.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default DemandesPage;