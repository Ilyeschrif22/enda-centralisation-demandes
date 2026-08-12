import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import './sidebar.css';

import { API_BASE } from "../../config";

const NAV_SECTIONS = [
    {
        items: [
            {
                key: "dashboard",
                label: "Dashboard",
                path: "/",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                ),
            },
            {
                key: "requests",
                label: "Demandes",
                path: "/demandes",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" />
                    </svg>
                ),
            },
            
            {
                key: "agences",
                label: "Agences",
                path: "/agences",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
                    </svg>
                ),
            },
             {
                 key: "users",
                 label: "Utilisateurs",
                path: "/users",
                 icon: (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" />
                     </svg>
                 ),
             },
            {
                key: "notifications",
                label: "Notifications",
                path: "/notifications",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                ),
            },

        ],
    },
    {
        items: [
            {
                key: "stats",
                label: "Statistiques",
                path: "/statistiques",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                    </svg>
                ),
            },
            {
                key: "reports",
                label: "Rapports",
                path: "/rapports",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
                    </svg>
                ),
            },
        ],
    },
    {
        pinBottom: true,
        items: [
            {
                key: "settings",
                label: "Paramètres",
                path: "/parametres",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                ),
            },
            {
                key: "logout",
                label: "Déconnexion",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                ),
            },
        ],
    },
];

const Sidebar = () => {
    const [active, setActive] = useState("dashboard");
    const { user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const roles = user?.realm_access?.roles || [];
    const isAdmin = roles.includes("Admin");
    const username = user?.preferred_username;

    useEffect(() => {
        if (!username) return;
        fetch(`${API_BASE}/notifications/unread-count?username=${encodeURIComponent(username)}`)
            .then((res) => res.json())
            .then((data) => setUnreadCount(data.count || 0))
            .catch((err) => console.error("Impossible de charger le nombre de notifications", err));
    }, [username]);

    return (
        <div className="sidebar">
            <div className="logo-container">
                <img className="enda-logo" src="/enda-logo.png" alt="Logo" />
            </div>

            <div className="sidebar-elements">
                {NAV_SECTIONS.map((section, i) => (
                    <div
                        className={`sidebar-section${section.pinBottom ? " sidebar-section-bottom" : ""}`}
                        key={section.title ?? i}
                    >
                        {section.title && <span className="sidebar-section-title">{section.title}</span>}
                        <ul className="sidebar-list" id={`sidebar-sec-${i}`}>
                            {section.items
                                .filter((item) => !["agences", "users"].includes(item.key) || isAdmin)
                                .map((item) => (
                                    <li key={item.key}>
                                        {item.key === "logout" ? (
                                            <button
                                                type="button"
                                                id={item.key}
                                                className="sidebar-logout-btn"
                                                onClick={logout}
                                            >
                                                {item.icon}
                                                {item.label}
                                            </button>
                                        ) : (
                                            <NavLink
                                                id={item.key}
                                                to={item.path}
                                                className={({ isActive }) => (isActive ? "active" : "")}
                                                end={item.path === "/"}
                                            >
                                                {item.icon}
                                                {item.label}
                                                {item.key === "notifications" && unreadCount > 0 && (
                                                    <span className="sidebar-badge">{unreadCount}</span>
                                                )}
                                            </NavLink>
                                        )}
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;