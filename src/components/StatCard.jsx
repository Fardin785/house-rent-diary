import { ReactNode } from 'react';

export default function StatCard({ label, value, icon, className }) {
  return (
    <div className={`stat-card ${className || ''}`}>
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}
