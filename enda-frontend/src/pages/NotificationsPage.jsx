import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./notifications-page.css";

const API_BASE = "http://127.0.0.1:8089";

const formatDate = (isoValue) => {
    if (!isoValue) return "";
    const date = new Date(isoValue);
    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const NotificationsPage = () => {
    const { user } = useAuth();
    const username = user?.sub;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = () => {
        if (!username) return;
        setLoading(true);
        fetch(`${API_BASE}/notifications?username=${encodeURIComponent(username)}`)
            .then((res) => res.json())
            .then(setNotifications)
            .catch((err) => {
                console.error(err);
                setError("Impossible de charger les notifications.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, [username]);

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH" });
            if (!res.ok) throw new Error();
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        if (!username) return;
        try {
            const res = await fetch(
                `${API_BASE}/notifications/read-all?username=${encodeURIComponent(username)}`,
                { method: "POST" }
            );
            if (!res.ok) throw new Error();
            setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.lu).length;

    return (
        <div className="notifications-page">
            <div className="notifications-page-header">
                <h2>Notifications</h2>
                {unreadCount > 0 && (
                    <button type="button" className="btn btn-ghost" onClick={markAllAsRead}>
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            {error && <div className="notifications-page-error">{error}</div>}

            {loading ? (
                <div className="notifications-page-empty">Chargement...</div>
            ) : notifications.length === 0 ? (
                <div className="notifications-page-empty">Aucune notification</div>
            ) : (
                <div className="notifications-page-list">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`notifications-page-item ${n.lu ? "" : "unread"}`}
                            onClick={() => !n.lu && markAsRead(n.id)}
                        >
                            {!n.lu && <span className="notif-dot" />}
                            <div className="notifications-page-item-content">
                                <span className="notifications-page-item-title">{n.titre}</span>
                                <span className="notifications-page-item-message">{n.message}</span>
                                <span className="notifications-page-item-time">
                                    {formatDate(n.dateCreation)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;