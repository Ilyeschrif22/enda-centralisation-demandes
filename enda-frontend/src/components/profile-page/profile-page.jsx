import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./profile-page.css";

const DEFAULT_ROLES = ["offline_access", "uma_authorization"];

const ProfilePage = () => {
    const { user } = useAuth();

    console.log(user);

    const initials = `${user?.given_name || ""} ${user?.family_name || ""}`
        .trim()
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const roles = (user?.realm_access?.roles || []).filter(
        (role) => !DEFAULT_ROLES.includes(role) && !role.startsWith("default-roles-")
    );

    

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-avatar-lg">{initials}</div>

                <div className="profile-main-info">
                    <h2 className="profile-name">
                        {user?.given_name} {user?.family_name}
                    </h2>
                    <span className="profile-username">@{user?.preferred_username}</span>

                    <div className="profile-roles">
                        {roles.map((role) => (
                            <span className="profile-role-badge" key={role}>
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="profile-details">
                <div className="profile-detail-row">
                    <span className="profile-detail-label">Email</span>
                    <span className="profile-detail-value">
                        {user?.email}
                        {!user?.email_verified && (
                            <span className="profile-unverified"> (non vérifié)</span>
                        )}
                    </span>
                </div>

                <div className="profile-detail-row">
                    <span className="profile-detail-label">Nom d'utilisateur</span>
                    <span className="profile-detail-value">{user?.preferred_username}</span>
                </div>

                <div className="profile-detail-row">
                    <span className="profile-detail-label">Nom complet</span>
                    <span className="profile-detail-value">{user?.name}</span>
                </div>

                <div className="profile-detail-row">
    <span className="profile-detail-label">Agence</span>
    <span className="profile-detail-value">
        {user?.agence ||
            user?.attributes?.agence?.[0] ||
            user?.attributes?.agence ||
            "-"}
    </span>
</div>
            </div>
        </div>
    );
};

export default ProfilePage;