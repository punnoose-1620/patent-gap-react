// components/dashboard/StatCard.jsx

const StatCard = ({ title, value, subtitle, icon, color = 'green' }) => {
  const isAmber = color === 'yellow' || color === 'amber';

  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-lbl">{title}</div>
        <div className="stat-num">{value}</div>
        <div className="stat-foot">
          <div className={`stat-bar${isAmber ? ' amber' : ''}`} />
          <span className="stat-note">{subtitle}</span>
        </div>
      </div>
      <div className={`stat-ico${isAmber ? ' amber' : ''}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
