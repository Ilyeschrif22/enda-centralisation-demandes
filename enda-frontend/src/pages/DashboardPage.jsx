import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import StatsCard from "../components/stats-card/stats-card";
import {
  UsersIcon,
  PhoneCheckIcon,
  PhoneXIcon,
  ClipboardCheckIcon,
  ClipboardXIcon,
} from "../components/stats-card/icons";
import DataTableFilters, { initialFilters, applyFilters } from "../components/data-table-filters/data-table-filters";
import DataTable from "../components/data-table/data-table";
import Pagination from "../components/pagination/pagination";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 50;

const DashboardPage = () => {
  const { leads, onLeadUpdated, onLeadDeleted } = useOutletContext();
  const { user } = useAuth();

  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const statsLeads = useMemo(() => {
    const roles = user?.realm_access?.roles || [];
    const isCommercialAgent = roles.includes("Call center");
    const isAdmin = roles.includes("Admin");
    const isDirecteurRegional = roles.includes("Directeur Régional");

    if (isCommercialAgent || isAdmin) {
      return leads;
    }

    if (isDirecteurRegional) {
      const userRegion = user?.region?.[0] || user?.attributes?.region?.[0];
      if (!userRegion) return [];
      return leads.filter((lead) => lead.utilisateur?.region === userRegion);
    }

    const userAgence = user?.agence?.[0];
    if (!userAgence) return [];

    return leads.filter((lead) => lead.agence === userAgence);
  }, [leads, user]);

 
  const filteredLeads = useMemo(
    () => applyFilters(statsLeads, filters),
    [statsLeads, filters]
  );

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort(
      (a, b) => new Date(b.dateSaisie) - new Date(a.dateSaisie)
    );
  }, [filteredLeads]);

  const handleFilterChange = (next) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(sortedLeads.length / PAGE_SIZE)
  );

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedLeads.slice(start, start + PAGE_SIZE);
  }, [sortedLeads, currentPage]);

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
          value: statsLeads.length,
          label: "Demandes reçues",
        },
         {
          key: "contacted",
          icon: <PhoneCheckIcon />,
          iconBg: "#ECFDF5",
          value: statsLeads.filter(
            (lead) => lead.contacte === true
          ).length,
          label: "Demandes contactées",
        },
        {
          key: "saisie",
          icon: <ClipboardCheckIcon />,
          iconBg: "#EFF6FF",
          value: statsLeads.filter(
            (lead) => lead.statut === "SAISIE"
          ).length,
          label: "Demandes saisies",
        },
        {
          key: "non-saisie",
          icon: <ClipboardXIcon />,
          iconBg: "#FFF7ED",
          value: statsLeads.filter(
            (lead) => lead.statut === "NON_SAISIE" || !lead.statut
          ).length,
          label: "Demandes non saisies",
        },
      ];

      if (isDirecteur) {
        const nonEligibles = statsLeads.filter((lead) => {
          const age = calculateAge(lead.utilisateur?.dateNaissance);
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

      return [
        ...baseStats,
       ,
        // {
        //   key: "not-contacted",
        //   icon: <PhoneXIcon />,
        //   iconBg: "#FEF2F2",
        //   value: statsLeads.filter(
        //     (lead) => lead.contacte !== true
        //   ).length,
        //   label: "Demandes non contactées",
        // },
      ];
    },
    [statsLeads, isDirecteur]
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

export default DashboardPage;