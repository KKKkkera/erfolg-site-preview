export type RussiaRegion = {
    /** Код ISO 3166-2, например RU-MOW → здесь RU-MOS (Московская область). */
    code: string;
    /** Название субъекта по-русски. */
    name: string;
    /** Транслитерация для ссылок: /regions/sahalinskaya-oblast */
    slug: string;
    /** Субъекты, нарисованные внутри этого контура. */
    includes?: string[];
    /** Контуры SVG (атрибут d). Их может быть много: материк плюс острова. */
    paths: string[];
};
/** Система координат контуров: viewBox="0 40 1920 1000". */
export declare const RUSSIA_VIEWBOX = "0 40 1920 1000";
export declare const RUSSIA_REGIONS: RussiaRegion[];
/** Регион по коду ISO 3166-2. */
export declare const regionByCode: (code: string) => RussiaRegion | undefined;
