import * as React from 'react';
import { type RussiaRegion } from './regions';
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
export declare function RussiaMap({ className, fill, hoverFill, stroke, values, scale, colors, tooltip, renderTooltip, onRegionClick, onRegionHover, hrefFor, }: RussiaMapProps): React.JSX.Element;
