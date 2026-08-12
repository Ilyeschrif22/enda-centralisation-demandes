import { useEffect, useState } from "react";
import './navbar.css';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { API_BASE } from "../../config";

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

const ChevronIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const formatRelativeTime = (isoValue) => {
    if (!isoValue) return "";
    const date = new Date(isoValue);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH} h`;
    const diffDays = Math.floor(diffH / 24);
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} j`;
};

const Navbar = () => {
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const DEFAULT_ROLES = ["offline_access", "uma_authorization"];
const roles = user?.realm_access?.roles || [];
const isAdmin = roles.includes("Admin");
const username = user?.preferred_username;
const displayRoles = roles.filter(
    (role) => !DEFAULT_ROLES.includes(role) && !role.startsWith("default-roles-")
);



    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!username) return;
        fetch(`${API_BASE}/notifications?username=${encodeURIComponent(user?.sub)}`)
            .then((res) => res.json())
            .then((data) => setNotifications(data.slice(0, 5)))
            .catch((err) => console.error("Impossible de charger les notifications", err));
    }, [username]);

    const unreadCount = notifications.filter((n) => !n.lu).length;

    const markAllAsRead = async () => {
        if (!username) return;
        try {
            const res = await fetch(
                `${API_BASE}/notifications/read-all?username=${encodeURIComponent(username)}`,
                { method: "POST" }
            );
            if (!res.ok) throw new Error(`Echec (${res.status})`);
            setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: "PATCH",
            });
            if (!res.ok) throw new Error(`Echec (${res.status})`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const initials = `${user?.given_name || ""} ${user?.family_name || ""}`
        .trim()
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <h1 className="navbar-title">Bienvenue {user?.given_name} {user?.family_name}</h1>
            </div>

            <div className="navbar-right">

                <div className="navbar-notif">
                    <button
                        type="button"
                        className="navbar-icon-btn"
                        aria-label="Notifications"
                        onClick={() => {
                            setNotifOpen(!notifOpen);
                            setProfileOpen(false);
                        }}
                    >
                        <BellIcon />
                        {unreadCount > 0 && <span className="navbar-badge" />}
                    </button>

                    {notifOpen && (
                        <div className="notif-dropdown">
                            <div className="notif-dropdown-header">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        className="notif-mark-all"
                                        onClick={markAllAsRead}
                                    >
                                        Tout marquer comme lu
                                    </button>
                                )}
                            </div>

                            <div className="notif-dropdown-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">
                                        Aucune notification
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`notif-item ${n.lu ? "" : "unread"}`}
                                            onClick={() => !n.lu && markAsRead(n.id)}
                                        >
                                            {!n.lu && <span className="notif-dot" />}
                                            <div className="notif-item-content">
                                                <span className="notif-item-title">
                                                    {n.titre}
                                                </span>
                                                <span className="notif-item-message">
                                                    {n.message}
                                                </span>
                                                <span className="notif-item-time">
                                                    {formatRelativeTime(n.dateCreation)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="notif-dropdown-footer">
                                <button
                                    onClick={() => {
                                        navigate("/notifications");
                                        setNotifOpen(false);
                                    }}
                                >
                                    Voir toutes les notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="navbar-profile">
                    <div
                        className="navbar-user"
                        onClick={() => {
                            setProfileOpen(!profileOpen);
                            setNotifOpen(false);
                        }}
                    >
                        <div className="navbar-avatar">{initials}</div>

                        <div className="navbar-user-info">
                            <span className="navbar-user-name">
                                {user?.given_name} {user?.family_name}
                            </span>

                            <span className="navbar-user-role">
                                {displayRoles[0] || user?.preferred_username}
                            </span>
                        </div>

                        <ChevronIcon />
                    </div>

                    {profileOpen && (
                        <div className="profile-dropdown">
                            <button
                                className="profile-dropdown-item"
                                onClick={() => {
                                    navigate("/profile");
                                    setProfileOpen(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-icon lucide-user-round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg> Mon profil
                            </button>

                            <button className="profile-dropdown-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" /><circle cx="12" cy="12" r="3" /></svg> Paramètres
                            </button>



                            <div className="profile-dropdown-divider" />

                            <button
                                className="profile-dropdown-item logout"
                                onClick={() => {
                                    logout();
                                    setProfileOpen(false);
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m16 17 5-5-5-5" />
                                    <path d="M21 12H9" />
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                </svg>
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;