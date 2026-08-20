'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { RUSSIA_REGIONS, RUSSIA_VIEWBOX } from './regions';
const mix = (from, to, t) => {
    const hex = (c) => {
        const s = c.replace('#', '');
        const n = s.length === 3 ? s.split('').map((x) => x + x).join('') : s;
        return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
    };
    const a = hex(from);
    const b = hex(to);
    const v = a.map((x, i) => Math.round(x + (b[i] - x) * t));
    return `rgb(${v[0]} ${v[1]} ${v[2]})`;
};
export function RussiaMap({ className, fill = '#ccd6de', hoverFill = '#e55220', stroke = '#ffffff', values, scale = ['#e8eef3', '#e55220'], colors, tooltip = false, renderTooltip, onRegionClick, onRegionHover, hrefFor, }) {
    const [hovered, setHovered] = React.useState(null);
    const [pointer, setPointer] = React.useState(null);
    const max = React.useMemo(() => (values ? Math.max(...Object.values(values), 0) : 0), [values]);
    const fillOf = (region) => {
        if (colors?.[region.code])
            return colors[region.code];
        const value = values?.[region.code];
        if (value === undefined || max <= 0)
            return fill;
        return mix(scale[0], scale[1], value / max);
    };
    const enter = (region) => {
        setHovered(region);
        onRegionHover?.(region);
    };
    const leave = () => {
        setHovered(null);
        setPointer(null);
        onRegionHover?.(null);
    };
    return (_jsxs("div", { className: className, style: { position: 'relative' }, onPointerMove: (event) => tooltip && setPointer({ x: event.clientX, y: event.clientY }), onPointerLeave: leave, children: [_jsx("svg", { viewBox: RUSSIA_VIEWBOX, role: "img", "aria-label": "\u041A\u0430\u0440\u0442\u0430 \u0440\u0435\u0433\u0438\u043E\u043D\u043E\u0432 \u0420\u043E\u0441\u0441\u0438\u0438", style: { width: '100%', height: 'auto', display: 'block' }, children: RUSSIA_REGIONS.map((region) => {
                    const href = hrefFor?.(region);
                    const active = hovered?.code === region.code;
                    const shapes = region.paths.map((d, i) => (_jsx("path", { d: d, fillRule: "evenodd", clipRule: "evenodd", fill: active ? hoverFill : fillOf(region), stroke: stroke, strokeWidth: 1.4, strokeLinejoin: "round", style: { transition: 'fill .2s ease-out' } }, i)));
                    const common = {
                        onPointerEnter: () => enter(region),
                        onFocus: () => enter(region),
                        onBlur: leave,
                        style: { cursor: href || onRegionClick ? 'pointer' : 'default', outline: 'none' },
                        'aria-label': region.name,
                    };
                    return href ? (_jsx("a", { href: href, ...common, children: shapes }, region.code)) : (_jsx("g", { ...common, tabIndex: onRegionClick ? 0 : undefined, role: onRegionClick ? 'button' : undefined, onClick: () => onRegionClick?.(region), onKeyDown: (event) => {
                            if (onRegionClick && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                onRegionClick(region);
                            }
                        }, children: shapes }, region.code));
                }) }), tooltip && hovered && pointer ? (_jsxs("div", { style: {
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
                }, children: [_jsx("strong", { style: { fontWeight: 600 }, children: hovered.name }), renderTooltip ? (_jsx("div", { style: { opacity: 0.7 }, children: renderTooltip(hovered, values?.[hovered.code]) })) : values?.[hovered.code] !== undefined ? (_jsx("div", { style: { opacity: 0.7 }, children: values[hovered.code] })) : null] })) : null] }));
}
