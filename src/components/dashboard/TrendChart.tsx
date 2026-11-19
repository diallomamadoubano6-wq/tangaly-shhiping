'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

export interface ShipmentTrendItem {
  createdAt?: string | Date;
  amountPaid?: number | null;
}

interface TrendChartProps {
  shipments?: ShipmentTrendItem[];
  title?: string;
  subtitle?: string;
}

type Period = '7d' | '30d' | 'year';

// Génère une courbe de Bézier cubique lisse reliant les points
function getCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function TrendChart({
  shipments = [],
  title = "Expéditions",
  subtitle = "Courbe de tendance journalière"
}: TrendChartProps) {
  const [period, setPeriod] = useState<Period>('30d');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Construction des tranches de temps selon la période sélectionnée
  const dataPoints = useMemo(() => {
    const now = new Date();
    const result: { label: string; fullDate: string; count: number; totalAmount: number }[] = [];

    if (period === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        const fullDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

        const matching = shipments.filter(s => {
          if (!s.createdAt) return false;
          const sDate = new Date(s.createdAt).toISOString().split('T')[0];
          return sDate === dayStr;
        });

        result.push({
          label,
          fullDate,
          count: matching.length,
          totalAmount: matching.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
        });
      }
    } else if (period === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        // Afficher l'étiquette seulement tous les 5 jours pour ne pas surcharger
        const showLabel = i % 5 === 0 || i === 0 || i === 29;
        const label = showLabel ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
        const fullDate = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const matching = shipments.filter(s => {
          if (!s.createdAt) return false;
          const sDate = new Date(s.createdAt).toISOString().split('T')[0];
          return sDate === dayStr;
        });

        result.push({
          label,
          fullDate,
          count: matching.length,
          totalAmount: matching.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
        });
      }
    } else {
      // Période 'year' : 12 mois
      const currentYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(currentYear, m, 1);
        const label = d.toLocaleDateString('fr-FR', { month: 'short' });
        const fullDate = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const matching = shipments.filter(s => {
          if (!s.createdAt) return false;
          const sD = new Date(s.createdAt);
          return sD.getFullYear() === currentYear && sD.getMonth() === m;
        });

        result.push({
          label,
          fullDate,
          count: matching.length,
          totalAmount: matching.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0)
        });
      }
    }

    return result;
  }, [shipments, period]);

  // Dimensions graphiques
  const svgWidth = 650;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxCount = useMemo(() => {
    const rawMax = Math.max(...dataPoints.map(p => p.count), 0);
    if (rawMax === 0) return 5; // Graduation par défaut propre
    if (rawMax <= 5) return 5;
    if (rawMax <= 10) return 10;
    if (rawMax <= 20) return 20;
    return Math.ceil(rawMax * 1.2);
  }, [dataPoints]);

  const totalPeriodShipments = useMemo(() => {
    return dataPoints.reduce((sum, p) => sum + p.count, 0);
  }, [dataPoints]);

  // Coordonnées de chaque point
  const points = useMemo(() => {
    if (dataPoints.length === 0) return [];
    return dataPoints.map((d, i) => {
      const x = padLeft + (i / Math.max(dataPoints.length - 1, 1)) * chartW;
      const y = padTop + chartH - (d.count / maxCount) * chartH;
      return { x, y, data: d };
    });
  }, [dataPoints, maxCount, chartW, chartH, padLeft, padTop]);

  // Construction du tracé de courbe et de l'aire sous la courbe
  const linePath = useMemo(() => getCurvedPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baseY = padTop + chartH;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [linePath, points, padTop, chartH]);

  // Lignes de graduation Y
  const yTicks = [
    { val: maxCount, y: padTop },
    { val: Math.round(maxCount / 2), y: padTop + chartH / 2 },
    { val: 0, y: padTop + chartH }
  ];

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div style={{ width: '100%' }}>
      {/* En-tête avec titre et sélecteur de période */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#2563eb" />
            {title} ({period === '7d' ? '7 derniers jours' : period === '30d' ? 'Ce mois' : 'Cette année'})
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {subtitle} • <strong style={{ color: '#2563eb' }}>{totalPeriodShipments}</strong> colis au total
          </p>
        </div>

        <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => { setPeriod('7d'); setHoveredIdx(null); }}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              background: period === '7d' ? '#2563eb' : 'transparent',
              color: period === '7d' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            7 jours
          </button>
          <button
            onClick={() => { setPeriod('30d'); setHoveredIdx(null); }}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              background: period === '30d' ? '#2563eb' : 'transparent',
              color: period === '30d' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Ce mois
          </button>
          <button
            onClick={() => { setPeriod('year'); setHoveredIdx(null); }}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: 'none',
              background: period === 'year' ? '#2563eb' : 'transparent',
              color: period === 'year' ? '#ffffff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Année
          </button>
        </div>
      </div>

      {/* Conteneur SVG avec Tooltip flottant */}
      <div style={{ position: 'relative', width: '100%', height: 220, overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grille horizontale et graduations Y */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={svgWidth - padRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray={tick.val === 0 ? undefined : "3 3"}
                strokeWidth={tick.val === 0 ? "1.5" : "1"}
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="500"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Aire sous la courbe */}
          {areaPath && (
            <path d={areaPath} fill="url(#trendGradient)" />
          )}

          {/* Ligne principale de la courbe */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadow)"
            />
          )}

          {/* Axe X étiquettes */}
          {points.map((p, i) => (
            p.data.label ? (
              <text
                key={i}
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {p.data.label}
              </text>
            ) : null
          ))}

          {/* Guide vertical lors du survol */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartH}
              stroke="#2563eb"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Points interactifs (cercles) */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            const hasData = p.data.count > 0;
            return (
              <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredIdx(i)}>
                {/* Zone de détection invisible élargie */}
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                
                {/* Point visible */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : hasData ? 4 : 2.5}
                  fill={isHovered ? "#2563eb" : hasData ? "#3b82f6" : "#cbd5e1"}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Message d'information quand tout est à 0 (après réinitialisation) */}
        {totalPeriodShipments === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '8px 16px',
              borderRadius: 20,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              fontSize: 12,
              fontWeight: 500,
              color: '#64748b',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📈</span> Courbe prête — les pics s&apos;afficheront au fur et à mesure de vos envois
          </div>
        )}

        {/* Tooltip interactif */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(Math.max((activePoint.x / svgWidth) * 100, 10), 90)}%`,
              top: `${Math.max(10, ((activePoint.y - 10) / svgHeight) * 100 - 25)}%`,
              transform: 'translate(-50%, -100%)',
              background: '#0f172a',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
              transition: 'left 0.1s ease, top 0.1s ease'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'capitalize', marginBottom: 2 }}>
              {activePoint.data.fullDate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#60a5fa' }}>
              <span>📦</span> {activePoint.data.count} colis expédié{activePoint.data.count > 1 ? 's' : ''}
            </div>
            {activePoint.data.totalAmount > 0 && (
              <div style={{ fontSize: 11, color: '#34d399', marginTop: 2 }}>
                💰 {activePoint.data.totalAmount.toLocaleString('fr-FR')} encaissés
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
