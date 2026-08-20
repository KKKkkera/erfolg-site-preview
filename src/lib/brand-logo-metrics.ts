/**
 * Пропорции (ширина / высота) содержимого логотипов брендов.
 *
 * Файлы в public/images/brands обрезаны по содержимому, поэтому пропорция
 * файла = пропорция марки. Лента брендов считает по ней размер плитки так,
 * чтобы у всех логотипов была примерно равная оптическая площадь: иначе
 * широкие начертания (Olympus, Philips) выходили низкими, а квадратные
 * эмблемы (Roche, УОМЗ) распирало на всю высоту ячейки.
 *
 * Значения пересчитываются скриптом при замене логотипа; для незнакомого
 * слага lookup вернёт undefined и лента возьмёт запасную пропорцию.
 */
export const BRAND_LOGO_ASPECT: Record<string, number> = {
  "altonika": 7.68,
  "b-braun": 4.10,
  "bpl-medical": 4.80,
  "canon-medical": 4.77,
  "contec": 5.33,
  "draeger": 2.57,
  "edan": 4.20,
  "elatma": 4.31,
  "erbe": 2.64,
  "fresenius": 4.85,
  "fukuda-denshi": 6.49,
  "ge-healthcare": 4.50,
  "getinge": 5.40,
  "hamilton-medical": 5.23,
  "hitachi": 6.13,
  "karl-storz": 2.93,
  "kazmedpribor": 1.01,
  "medtronic": 6.07,
  "mindray": 2.94,
  "nihon-kohden": 7.73,
  "olympus": 4.71,
  "philips": 5.00,
  "ramenskoe-pribor": 1.02,
  "riester": 6.00,
  "roche-diagnostics": 1.92,
  "samsung-medison": 6.45,
  "schiller": 5.40,
  "siemens-healthineers": 4.41,
  "smiths-medical": 11.70,
  "spacelabs": 1.77,
  "stryker": 4.16,
  "sysmex": 5.64,
  "triton-electronics": 3.81,
  "uomz": 2.13,
  "welch-allyn": 4.90,
};
