import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTableFilters, { initialFilters, applyFilters } from "../../components/data-table-filters/data-table-filters";
import DataTable from "../../components/data-table/data-table";
import Pagination from "../../components/pagination/pagination";
import { useAuth } from "../../context/AuthContext";
import { useScopedRequests } from "../../hooks/useScopedRequests";
import "./page-layout.css";

const PAGE_SIZE = 50;

const DemandesPage = () => {
  const { requests, onRequestUpdated, onRequestDeleted, onAddDemande } = useOutletContext();
  const { user } = useAuth();

  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailView, setIsDetailView] = useState(false);

  // Reset to page 1 only when the actual set of items changes (add/remove),
  // not on every field update (e.g. a status change) which would otherwise
  // cause an annoying pagination jump on each row edit.
  const requestIdSignature = useMemo(
    () => requests.map((r) => r.id).join(","),
    [requests]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [requestIdSignature]);

  const roles = user?.realm_access?.roles || [];
  const canAddDemande = roles.includes("Call center") || roles.includes("Admin");

  const scopedRequests = useScopedRequests(requests, user);

  const filteredRequests = useMemo(
    () => applyFilters(scopedRequests, filters),
    [scopedRequests, filters]
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