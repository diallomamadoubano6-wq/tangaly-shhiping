import React from 'react';
import { FileEdit, Package, Cog, Plane, MapPin, CheckCircle2 } from 'lucide-react';

interface StatusIconProps {
  status?: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

export function StatusIcon({ status, size = 16, className, color, style }: StatusIconProps) {
  const code = (status || '').toUpperCase();
  switch (code) {
    case 'CREATED':
      return <FileEdit size={size} className={className} color={color} style={style} />;
    case 'RECEIVED':
      return <Package size={size} className={className} color={color} style={style} />;
    case 'PREPARING':
      return <Cog size={size} className={className} color={color} style={style} />;
    case 'SHIPPED':
      return <Plane size={size} className={className} color={color} style={style} />;
    case 'ARRIVED':
      return <MapPin size={size} className={className} color={color} style={style} />;
    case 'DELIVERED':
      return <CheckCircle2 size={size} className={className} color={color} style={style} />;
    default:
      return <Package size={size} className={className} color={color} style={style} />;
  }
}

export default StatusIcon;
