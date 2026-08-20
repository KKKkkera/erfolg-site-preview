'use client';

import * as React from 'react';
import { RUSSIA_REGIONS, RUSSIA_VIEWBOX, type RussiaRegion } from './regions';

export type RussiaMapProps = {
  className?: string;
  /** Заливка региона по умолчанию. */
  fill?: string;
  /** Заливка при наведении. */
  hoverFill?: string;
  /** Цвет границ. */
  stroke?: string;
  /** Значения по регионам: { 'RU-SAK': 12 }. Заливка считается по шкале scale. */
  values?: Record<string, number>;
  /** Шкала для values: от цвета минимума к цвету максимума. */
  scale?: [string, string];
  /** Заливка конкретных регионов, приоритетнее values. */
  colors?: Record<string, string>;
  /** Показывать подпись региона при наведении. */
  tooltip?: boolean;
  /** Что писать в подписи второй строкой. */
  renderTooltip?: (region: RussiaRegion, value?: number) => React.ReactNode;
  onRegionClick?: (region: RussiaRegion) => void;
  onRegionHover?: (region: RussiaRegion | null) => void;
  /** Ссылка для региона — тогда каждый регион оборачивается в <a>. */
  hrefFor?: (region: RussiaRegion) => string | undefined;
};

const mix = (from: string, to: string, t: number) => {
  const hex = (c: string) => {
    const s = c.replace('#', '');
    const n = s.length === 3 ? s.split('').map((x) => x + x).join('') : s;
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  };
  const a = hex(from);
  const b = hex(to);
  const v = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${v[0]} ${v[1]} ${v[2]})`;
};

export function RussiaMap({
  className,
  fill = '#ccd6de',
  hoverFill = '#e55220',
  stroke = '#ffffff',
  values,
  scale = ['#e8eef3', '#e55220'],
  colors,
  tooltip = false,
  renderTooltip,
  onRegionClick,
  onRegionHover,
  hrefFor,
}: RussiaMapProps) {
  const [hovered, setHovered] = React.useState<RussiaRegion | null>(null);
  const [pointer, setPointer] = React.useState<{ x: number; y: number } | null>(null);

  const max = React.useMemo(
    () => (values ? Math.max(...Object.values(values), 0) : 0),
    [values],
  );
  const fillOf = (region: RussiaRegion) => {
    if (colors?.[region.code]) return colors[region.code];
    const value = values?.[region.code];
    if (value === undefined || max <= 0) return fill;
    return mix(scale[0], scale[1], value / max);
  };

  const enter = (region: RussiaRegion) => {
    setHovered(region);
    onRegionHover?.(region);
  };
  const leave = () => {
    setHovered(null);
    setPointer(null);
    onRegionHover?.(null);
  };

  return (
    <div
      className={className}
      style={{ position: 'relative' }}
      onPointerMove={(event) => tooltip && setPointer({ x: event.clientX, y: event.clientY })}
      onPointerLeave={leave}
    >
      <svg
        viewBox={RUSSIA_VIEWBOX}
        role="img"
        aria-label="Карта регионов России"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {RUSSIA_REGIONS.map((region) => {
          const href = hrefFor?.(region);
          const active = hovered?.code === region.code;
          const shapes = region.paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fillRule="evenodd"
              clipRule="evenodd"
              fill={active ? hoverFill : fillOf(region)}
              stroke={stroke}
              strokeWidth={1.4}
              strokeLinejoin="round"
              style={{ transition: 'fill .2s ease-out' }}
            />
          ));
          const common = {
            onPointerEnter: () => enter(region),
            onFocus: () => enter(region),
            onBlur: leave,
            style: { cursor: href || onRegionClick ? 'pointer' : 'default', outline: 'none' },
            'aria-label': region.name,
          };
          return href ? (
            <a key={region.code} href={href} {...common}>
              {shapes}
            </a>
          ) : (
            <g
              key={region.code}
              {...common}
              tabIndex={onRegionClick ? 0 : undefined}
              role={onRegionClick ? 'button' : undefined}
              onClick={() => onRegionClick?.(region)}
              onKeyDown={(event) => {
                if (onRegionClick && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onRegionClick(region);
                }
              }}
            >
              {shapes}
            </g>
          );
        })}
      </svg>

      {tooltip && hovered && pointer ? (
        <div
          style={{
            position: 'fixed',
            left: pointer.x + 14,
            top: pointer.y + 14,
            zIndex: 50,
            pointerEvents: 'none',
            background: '#fff',
            border: '1px solid rgba(0,0,0,.12)',
            borderRadius: 6,
            boxShadow: '0 6px 24px rgba(0,0,0,.12)',
            padding: '6px 10px',
            fontSize: 13,
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
          }}
        >
          <strong style={{ fontWeight: 600 }}>{hovered.name}</strong>
          {renderTooltip ? (
            <div style={{ opacity: 0.7 }}>{renderTooltip(hovered, values?.[hovered.code])}</div>
          ) : values?.[hovered.code] !== undefined ? (
            <div style={{ opacity: 0.7 }}>{values[hovered.code]}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
