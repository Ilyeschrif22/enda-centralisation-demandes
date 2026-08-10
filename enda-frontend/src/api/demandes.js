const API_BASE = "http://127.0.0.1:8089";

export async function getDemandesByRegion(region) {
  const response = await fetch(
    `${API_BASE}/demandes/region/${encodeURIComponent(region)}`
  );

  if (!response.ok) {
    throw new Error(`Echec (${response.status})`);
  }

  return response.json();
}

export async function deleteDemande(id, auditQuery) {
  const response = await fetch(
    `${API_BASE}/demandes/${id}?${auditQuery}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(`Echec de la suppression (${response.status})`);
  }

  return response;
}

export async function reassignDemande(id, agence, auditQuery) {
  const response = await fetch(
    `${API_BASE}/demandes/${id}?${auditQuery}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agence }),
    }
  );

  if (!response.ok) {
    throw new Error(`Echec de la réaffectation (${response.status})`);
  }

  return response.json();
}

export async function updateStatut(id, statut, auditQuery) {
  const response = await fetch(
    `${API_BASE}/demandes/${id}/statut?${auditQuery}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(statut),
    }
  );

  if (!response.ok) {
    throw new Error(`Echec de la mise à jour du statut (${response.status})`);
  }

  return response.json();
}

export async function updateContacte(id, contacte, auditQuery) {
  const response = await fetch(
    `${API_BASE}/demandes/${id}/contacte?${auditQuery}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contacte),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Echec de la mise à jour du statut contacté (${response.status})`
    );
  }

  return response.json();
}

export async function updateJoignable(id, joignable, auditQuery) {
  const response = await fetch(
    `${API_BASE}/demandes/${id}/joignable?${auditQuery}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(joignable),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Echec de la mise à jour du statut joignable (${response.status})`
    );
  }

  return response.json();
}

export async function updateInteresse(id, interesse, auditQuery) {
  const response = await fetch(
    `${API_BASE}/demandes/${id}/interesse?${auditQuery}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interesse),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Echec de la mise à jour du statut intéressé (${response.status})`
    );
  }

  return response.json();
}