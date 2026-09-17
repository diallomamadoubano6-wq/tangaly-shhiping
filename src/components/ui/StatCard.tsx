import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
}

export default function StatCard({ label, value, icon, iconBg }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex-between">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ backgroundColor: iconBg }} aria-hidden="true">
          {icon}
        </div>
      </div>
      <p className="stat-card-value">{value}</p>
    </div>
  );
}
