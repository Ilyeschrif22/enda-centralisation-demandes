import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import StatsCard from "../../components/stats-card/stats-card";
import {
  UsersIcon,
  PhoneCheckIcon,
  PhoneXIcon,
  ClipboardCheckIcon,
  ClipboardXIcon,
} from "../../components/stats-card/icons";
import DataTableFilters, { initialFilters, applyFilters } from "../../components/data-table-filters/data-table-filters";
import DataTable from "../../components/data-table/data-table";
import Pagination from "../../components/pagination/pagination";
import { useAuth } from "../../context/AuthContext";

const PAGE_SIZE = 50;

const DashboardPage = () => {
  const { requests, onRequestUpdated, onRequestDeleted } = useOutletContext();
  const { user } = useAuth();

  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
const [isViewingDetails, setIsViewingDetails] = useState(false);

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

  const statsRequests = useMemo(() => {
    const roles = user?.realm_access?.roles || [];
    const isCommercialAgent = roles.includes("Call center");
    const isAdmin = roles.includes("Admin");
    const isDirecteurRegional = roles.includes("Directeur Régional");

    if (isCommercialAgent || isAdmin) {
      return requests;
    }

    if (isDirecteurRegional) {
      const userRegion = user?.region?.[0] || user?.attributes?.region?.[0];
      if (!userRegion) return [];
      return requests.filter((request) => request.utilisateur?.region === userRegion);
    }

    const userAgence = user?.agence?.[0];
    if (!userAgence) return [];

    return requests.filter((request) => request.agence === userAgence);
  }, [requests, user]);


  const filteredRequests = useMemo(
    () => applyFilters(statsRequests, filters),
    [statsRequests, filters]
  );

  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort(
      (a, b) => new Date(b.dateSaisie) - new Date(a.dateSaisie)
    );
  }, [filteredRequests]);

  const handleFilterChange = (next) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRequests.length / PAGE_SIZE)
  );

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedRequests.slice(start, start + PAGE_SIZE);
  }, [sortedRequests, currentPage]);

  const isDirecteur =
    (user?.realm_access?.roles || []).includes("Directeur Régional") ||
    (user?.realm_access?.roles || []).includes("Directeur Agence");

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const stats = useMemo(
    () => {
      const baseStats = [
        {
          key: "count",
          icon: <UsersIcon />,
          iconBg: "#FCEDF5",
          value: statsRequests.length,
          label: "Demandes reçues",
        },
        {
          key: "contacted",
          icon: <PhoneCheckIcon />,
          iconBg: "#ECFDF5",
          value: statsRequests.filter(
            (request) => request.contacte === true
          ).length,
          label: "Demandes contactées",
        },
        {
          key: "saisie",
          icon: <ClipboardCheckIcon />,
          iconBg: "#EFF6FF",
          value: statsRequests.filter(
            (request) => request.statut === "SAISIE"
          ).length,
          label: "Demandes saisies",
        },
        {
          key: "non-saisie",
          icon: <ClipboardXIcon />,
          iconBg: "#FFF7ED",
          value: statsRequests.filter(
            (request) => request.statut === "NON_SAISIE" || !request.statut
          ).length,
          label: "Demandes non saisies",
        },
      ];

      if (isDirecteur) {
        const nonEligibles = statsRequests.filter((request) => {
          const age = calculateAge(request.utilisateur?.dateNaissance);
          return age !== null && (age < 18 || age > 65);
        }).length;

        return [
          ...baseStats,
          {
            key: "non-eligible",
            icon: <ClipboardXIcon />,
            iconBg: "#FEF2F2",
            value: nonEligibles,
            label: "Demandes non éligibles (âge)",
          },
        ];
      }

      return baseStats;
    },
    [statsRequests, isDirecteur]
  );

  return (
    <>
      <div className="stats-row">
        {stats.map((stat) => (
          <StatsCard key={stat.key} {...stat} trendPositive />
        ))}
      </div>

      <DataTableFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <DataTable
        data={paginatedRequests}
        onRequestUpdated={onRequestUpdated}
        onRequestDeleted={onRequestDeleted}
        onViewStateChange={setIsViewingDetails}
      />

      {!isViewingDetails && (
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

export default DashboardPage;