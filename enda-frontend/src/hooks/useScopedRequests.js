import { useMemo } from "react";

export function useScopedRequests(requests, user) {
  return useMemo(() => {
    const roles = user?.realm_access?.roles || [];

    if (roles.includes("Call center") || roles.includes("Admin")) {
      return requests;
    }

    if (roles.includes("Directeur Régional")) {
      const userRegion = user?.region?.[0] || user?.attributes?.region?.[0];
      if (!userRegion) return [];
      return requests.filter((request) => request.utilisateur?.region === userRegion);
    }

    const userAgence = user?.agence?.[0];
    if (!userAgence) return [];

    return requests.filter((request) => request.agence === userAgence);
  }, [requests, user]);
}