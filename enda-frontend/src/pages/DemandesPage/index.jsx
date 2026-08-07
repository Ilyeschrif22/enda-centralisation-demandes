import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTableFilters, { initialFilters, applyFilters } from "../../components/data-table-filters/data-table-filters";
import DataTable from "../../components/data-table/data-table";
import Pagination from "../../components/pagination/pagination";
import { useAuth } from "../../context/AuthContext";
import "./page-layout.css";

const PAGE_SIZE = 50;

const DemandesPage = () => {
  const { requests, onRequestUpdated, onRequestDeleted, onAddDemande } = useOutletContext();
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailView, setIsDetailView] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [requests]);

  const { user } = useAuth();
  const roles = user?.realm_access?.roles || [];
  const canAddDemande = roles.includes("Call center") || roles.includes("Admin");

  const filteredRequests = useMemo(
    () => applyFilters(requests, filters),
    [requests, filters]
  );

  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort(
      (a, b) => new Date(b.dateSaisie) - new Date(a.dateSaisie)
    );
  }, [filteredRequests]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / PAGE_SIZE));

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedRequests.slice(start, start + PAGE_SIZE);
  }, [sortedRequests, currentPage]);

  const handleFilterChange = (next) => {
    setFilters(next);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="content-header">
        {canAddDemande && (
          <button id="add-demande-button" className="btn btn-primary" onClick={onAddDemande}>
            + Nouvelle demande
          </button>
        )}
      </div>

      <DataTableFilters filters={filters} onFilterChange={handleFilterChange} />

      <DataTable
        data={paginatedRequests}
        onRequestUpdated={onRequestUpdated}
        onRequestDeleted={onRequestDeleted}
        onViewStateChange={setIsDetailView}
      />

      {!isDetailView && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedRequests.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default DemandesPage;