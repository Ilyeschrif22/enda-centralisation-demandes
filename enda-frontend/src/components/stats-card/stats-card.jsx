import './stats-card.css';

const StatsCard = ({ icon, iconBg, value, label, trend, trendPositive = true }) => {
    return (
        <div className="stats-card">
            <div className="stats-card-top">
                <div className="stats-card-icon" style={{ backgroundColor: iconBg }}>
                    {icon}
                </div>

                {trend && (
                    <span className={`stats-card-trend ${trendPositive ? "positive" : "negative"}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {trendPositive ? (
                                <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>
                            ) : (
                                <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></>
                            )}
                        </svg>
                        {trend}
                    </span>
                )}
            </div>

            <div className="stats-card-value">{value}</div>
            <div className="stats-card-label">{label}</div>
        </div>
    );
};

export default StatsCard;