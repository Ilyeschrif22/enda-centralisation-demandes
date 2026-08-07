import { useEffect, useMemo, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    FunnelChart,
    Funnel,
    LabelList,
} from "recharts";
import PageLoader from "../../components/loader/PageLoader";
import "./statistiques-page.css";

const API_BASE = "http://127.0.0.1:8089";

const STATUT_LABELS = {
    NON_SAISIE: "Non saisie",
    SAISIE: "Saisie",
    MANQUE_INFORMATION: "Manque d'information",
    DEMANDE_RENOUVELLEMENT: "Demande de renouvellement",
    DEMANDE_COMPLEMENT: "Demande de complément",
};

const CANAL_LABELS = {
    FACEBOOK: "Facebook",
    WHATSAPP: "WhatsApp",
    WEB: "Web",
    TELEPHONE: "Téléphone",
    AGENCE: "Agence",
};

const TYPE_DEMANDE_LABELS = {
    PREMIER_PRET: "1er prêt",
    RENOUVELLEMENT: "Renouvellement",
    REINTEGRATION: "Réintégration",
};

const STATUT_COLORS = [
    "#DE0065",
    "#F59E0B",
    "#7C3AED",
    "#6B7280",
];

const CANAL_COLORS = [
    "#DE0065",
    "#4338CA",
    "#059669",
    "#F59E0B",
    "#0EA5E9",
];

const REGION_COLORS = [
    "#DE0065",
    "#4338CA",
    "#059669",
    "#F59E0B",
    "#0EA5E9",
    "#EF4444",
    "#8B5CF6",
    "#14B8A6",
];

const FUNNEL_COLORS = [
    "#DE0065",
    "#B8005A",
    "#920048",
    "#6B0035",
    "#4A0025",
];

const CLIENT_TYPE_COLORS = ["#DE0065", "#0EA5E9"];

const MOIS_LABELS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Spring/Jackson can serialize a java.time.LocalDate either as an ISO string
// ("2026-08-07") or, depending on backend ObjectMapper config, as a
// [year, month, day] array (month 1-indexed). Handle both shapes here.
// Dates are built from local y/m/d components rather than passed to
// `new Date(isoString)`, which parses "YYYY-MM-DD" as UTC midnight and can
// shift the day (and therefore month/year) once read back in local time.
const parseDateSaisie = (dateSaisie) => {
    if (!dateSaisie) return null;

    if (Array.isArray(dateSaisie)) {
        const [year, month, day] = dateSaisie;
        if (!year || !month || !day) return null;
        const d = new Date(year, month - 1, day);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof dateSaisie === "string") {
        const match = dateSaisie.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, year, month, day] = match;
            const d = new Date(Number(year), Number(month) - 1, Number(day));
            return Number.isNaN(d.getTime()) ? null : d;
        }
        const fallback = new Date(dateSaisie);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    }

    return null;
};

const pad2 = (n) => String(n).padStart(2, "0");

// Stable "YYYY-MM-DD" key/label built from local components, for grouping
// and sorting by day (used by the evolution chart).
const formatDateKey = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const StatistiquesPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("all");

    useEffect(() => {
        fetch(`${API_BASE}/demandes`)
            .then((res) => res.json())
            .then(setRequests)
            .catch((err) => {
                console.error(err);
                setError("Impossible de charger les statistiques.");
            })
            .finally(() => setLoading(false));
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set();
        requests.forEach((l) => {
            const d = parseDateSaisie(l.dateSaisie);
            if (d) years.add(d.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (selectedYear === "all" && selectedMonth === "all") return requests;

        return requests.filter((l) => {
            const d = parseDateSaisie(l.dateSaisie);
            if (!d) return false;
            if (selectedYear !== "all" && d.getFullYear() !== Number(selectedYear)) return false;
            if (selectedMonth !== "all" && d.getMonth() !== Number(selectedMonth)) return false;
            return true;
        });
    }, [requests, selectedYear, selectedMonth]);

    const kpis = useMemo(() => {
        const total = filteredRequests.length;
        const contactes = filteredRequests.filter((l) => l.contacte === true).length;
        const joignables = filteredRequests.filter((l) => l.joignable === true).length;
        const saisies = filteredRequests.filter((l) => l.statut && l.statut !== "NON_SAISIE").length;

        const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

        return [
            { label: "Total demandes", value: total, sub: null },
            { label: "Taux de contact", value: `${pct(contactes)}%`, sub: `${contactes} / ${total}` },
            { label: "Taux de joignabilité", value: `${pct(joignables)}%`, sub: `${joignables} / ${total}` },
            { label: "Taux de saisie", value: `${pct(saisies)}%`, sub: `${saisies} / ${total}` },
        ];
    }, [filteredRequests]);

    const statutData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key = request.statut || "NON_SAISIE";
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts).map(([key, value]) => ({
            name: STATUT_LABELS[key] || key,
            value,
        }));
    }, [filteredRequests]);

    const canalData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key = request.canal || "INCONNU";
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts).map(([key, value]) => ({
            name: CANAL_LABELS[key] || key,
            value,
        }));
    }, [filteredRequests]);

    const regionData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key =
                request.utilisateur?.region ||
                request.utilisateur?.gouvernorat ||
                "Non renseignée";

            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({
                name,
                value,
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredRequests]);

    const funnelData = useMemo(() => {
        const total = filteredRequests.length;

        const contactes = filteredRequests.filter(
            (l) => l.contacte === true
        ).length;

        const joignables = filteredRequests.filter(
            (l) => l.joignable === true
        ).length;

        const interesses = filteredRequests.filter(
            (l) => l.interesse === true
        ).length;

        const saisies = filteredRequests.filter(
            (l) => l.statut && l.statut !== "NON_SAISIE"
        ).length;

        return [
            {
                name: "Prospects",
                value: total,
                fill: FUNNEL_COLORS[0],
            },
            {
                name: "Contactés",
                value: contactes,
                fill: FUNNEL_COLORS[1],
            },
            {
                name: "Joignables",
                value: joignables,
                fill: FUNNEL_COLORS[2],
            },
            {
                name: "Intéressés",
                value: interesses,
                fill: FUNNEL_COLORS[3],
            },
            {
                name: "Saisies",
                value: saisies,
                fill: FUNNEL_COLORS[4],
            },
        ];
    }, [filteredRequests]);

    const evolutionData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const d = parseDateSaisie(request.dateSaisie);
            if (!d) return;
            const key = formatDateKey(d);
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
            .slice(-30);
    }, [filteredRequests]);

    const agenceData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key = request.agence || "Non affectée";
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [filteredRequests]);

    const typeDemandeData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key = request.typeDemande || "Non renseigné";
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts).map(([key, value]) => ({
            name: TYPE_DEMANDE_LABELS[key] || key,
            value,
        }));
    }, [filteredRequests]);

    const clientTypeData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key = request.typeClient || "Non renseigné";
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
        }));
    }, [filteredRequests]);


    const montantData = useMemo(() => {
        const montants = filteredRequests
            .map((request) => parseFloat(request.montant))
            .filter((m) => !Number.isNaN(m));

        const total = montants.reduce((sum, m) => sum + m, 0);
        const moyenne = montants.length > 0 ? total / montants.length : 0;

        return { total, moyenne, count: montants.length };
    }, [filteredRequests]);

    const interesseData = useMemo(() => {
        const counts = { "Intéressé": 0, "Non intéressé": 0, "Non renseigné": 0 };

        filteredRequests.forEach((request) => {
            if (request.interesse === true) counts["Intéressé"]++;
            else if (request.interesse === false) counts["Non intéressé"]++;
            else counts["Non renseigné"]++;
        });

        return Object.entries(counts)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    }, [filteredRequests]);

    const activiteData = useMemo(() => {
        const counts = {};

        filteredRequests.forEach((request) => {
            const key = request.activite || "Non renseignée";
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [filteredRequests]);

    if (loading) {
        return <PageLoader message="Chargement des statistiques..." />;
    }

    return (
        <div className="statistiques-page">
            {error && (
                <div className="stats-page-error">
                    {error}
                </div>
            )}

            <div className="stats-filters">
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="stats-filter-select"
                >
                    <option value="all">Toutes les années</option>
                    {availableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="stats-filter-select"
                >
                    <option value="all">Tous les mois</option>
                    {MOIS_LABELS.map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                    ))}
                </select>
            </div>

            <div className="stats-charts-grid">

                <div className="stats-chart-card stats-chart-card-wide">
                    <h3>Évolution des demandes reçues (30 derniers jours)</h3>

                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#DE0065"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="stats-chart-card">
                    <h3>Répartition par canal</h3>

                    <ResponsiveContainer
                        width="100%"
                        height={280}
                    >
                        <BarChart data={canalData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                            />

                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 12 }}
                            />

                            <Tooltip />

                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                            >
                                {canalData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            CANAL_COLORS[
                                                index %
                                                    CANAL_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                

                <div className="stats-chart-card">
                    <h3>Tunnel de conversion</h3>

                    <ResponsiveContainer
                        width="100%"
                        height={320}
                    >
                        <FunnelChart>
                            <Tooltip />

                            <Funnel
                                dataKey="value"
                                data={funnelData}
                                isAnimationActive
                            >
                                <LabelList
                                    position="right"
                                    dataKey="name"
                                    fill="#1F2937"
                                    fontSize={13}
                                />

                                <LabelList
                                    position="center"
                                    dataKey="value"
                                    fill="#ffffff"
                                    fontSize={14}
                                    fontWeight={600}
                                />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>

                <div className="stats-chart-card">
                    <h3>Top agences par volume</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={agenceData} layout="vertical" margin={{ left: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                width={110}
                            />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {agenceData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={REGION_COLORS[index % REGION_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            

                <div className="stats-chart-card">
                    <h3>Répartition par statut des demandes</h3>

                    <ResponsiveContainer
                        width="100%"
                        height={280}
                    >
                        <PieChart>
                            <Pie
                                data={statutData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(
                                        0
                                    )}%`
                                }
                            >
                                {statutData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            STATUT_COLORS[
                                                index %
                                                    STATUT_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>

                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="stats-chart-card">
                    <h3>Nouveau vs ancien client</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={clientTypeData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {clientTypeData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={CLIENT_TYPE_COLORS[index % CLIENT_TYPE_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="stats-chart-card">
                    <h3>Répartition par type de demande</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={typeDemandeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {typeDemandeData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={STATUT_COLORS[index % STATUT_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="stats-chart-card">
                    <h3>Distribution des demandes par région</h3>

                    <ResponsiveContainer
                        width="100%"
                        height={320}
                    >
                        <PieChart>
                            <Pie
                                data={regionData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={110}
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(
                                        0
                                    )}%`
                                }
                            >
                                {regionData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            REGION_COLORS[
                                                index %
                                                    REGION_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>

                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>


                <div className="stats-chart-card">
                    <h3>Intérêt des prospects</h3>

                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={interesseData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {interesseData.map((entry, index) => (
                                    <Cell key={entry.name} fill={STATUT_COLORS[index % STATUT_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

              

            </div>
        </div>
    );
};

export default StatistiquesPage;