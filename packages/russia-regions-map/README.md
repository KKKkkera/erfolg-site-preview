# russia-regions-map

Карта регионов России для React / Next.js. Каждый регион — отдельная область
с кодом и названием: наводишь — подсвечивается целиком, вместе со своими
островами.

- **86 регионов.** Это 89 субъектов по Конституции минус три, которые
  нарисованы вместе с соседом: Москва в Московской области, Санкт-Петербург
  в Ленинградской, Севастополь в Республике Крым. Крым, ДНР, ЛНР, Запорожская
  и Херсонская области на карте есть.
- **Архипелаги привязаны к своим регионам.** Курилы подсвечиваются вместе с
  Сахалинской областью, Земля Франца-Иосифа и Новая Земля — с Архангельской,
  Северная Земля — с Красноярским краем, Новосибирские острова — с Якутией,
  остров Врангеля — с Чукоткой, Командорские — с Камчаткой.
- **Без зависимостей**, кроме React. Ничего не грузится по сети.

## Установка

```bash
npm i ./russia-regions-map-1.0.0.tgz
```

## Использование

Подсветка при наведении:

```tsx
import { RussiaMap } from 'russia-regions-map';

<RussiaMap className="w-full max-w-4xl" />;
```

Название региона в подсказке и переход на страницу региона:

```tsx
<RussiaMap
  tooltip
  hrefFor={(region) => `/regions/${region.slug}`}
  fill="#e8eef3"
  hoverFill="#e55220"
/>;
```

Данные из базы — заливка по значению (тепловая карта):

```tsx
const values = { 'RU-MOS': 120, 'RU-SPE': 64, 'RU-SAK': 12 };

<RussiaMap
  values={values}
  scale={['#eaf2f7', '#0f6fa8']}
  tooltip
  renderTooltip={(region, value) => `${value ?? 0} поставок`}
/>;
```

Клик без ссылки — например, открыть модалку или отфильтровать список:

```tsx
'use client';
<RussiaMap onRegionClick={(region) => setSelected(region.code)} />;
```

## Пропсы

| Проп | Тип | Что делает |
| --- | --- | --- |
| `className` | `string` | Класс на обёртку. Ширину задавайте ей, SVG растянется. |
| `fill` | `string` | Заливка региона по умолчанию (`#ccd6de`). |
| `hoverFill` | `string` | Заливка при наведении (`#e55220`). |
| `stroke` | `string` | Цвет границ (`#fff`). |
| `values` | `Record<string, number>` | Значения по кодам регионов — заливка считается по шкале. |
| `scale` | `[string, string]` | Цвета минимума и максимума для `values`. |
| `colors` | `Record<string, string>` | Явная заливка отдельных регионов, приоритетнее `values`. |
| `tooltip` | `boolean` | Подсказка с названием региона у курсора. |
| `renderTooltip` | `(region, value) => ReactNode` | Вторая строка подсказки. |
| `hrefFor` | `(region) => string \| undefined` | Оборачивает регион в ссылку. |
| `onRegionClick` | `(region) => void` | Клик по региону (плюс Enter/Space с клавиатуры). |
| `onRegionHover` | `(region \| null) => void` | Наведение и уход курсора. |

## Данные отдельно от карты

```ts
import { RUSSIA_REGIONS, regionByCode } from 'russia-regions-map';

RUSSIA_REGIONS.length;              // 86
regionByCode('RU-SAK')?.name;       // 'Сахалинская область'
regionByCode('RU-SAK')?.slug;       // 'sahalinskaya-oblast'
regionByCode('RU-CR')?.includes;    // ['Севастополь']
```

Поля региона: `code` (ISO 3166-2), `name`, `slug` (для ссылок), `includes`
(субъекты, нарисованные внутри контура), `paths` (контуры SVG — материк и
острова). Система координат — `viewBox="0 40 1920 1000"`, экспортируется как
`RUSSIA_VIEWBOX`.

## Без React

В пакете лежит `russia-regions.svg` — самодостаточный файл со своим `<style>`.
Регион — группа `<g class="region" id="RU-SAK" data-name="Сахалинская область">`.
Вставьте его инлайном в HTML (через `<img>` ховер не работает — так устроен SVG)
и при желании поменяйте цвета:

```css
svg { --region-fill: #ccd6de; --region-hover: #e55220; }
```

## Server и client компоненты

`RussiaMap` помечен `'use client'` — из-за подсказки и обработчиков. Его можно
импортировать в серверный компонент Next.js напрямую, ничего дополнительно
настраивать не нужно.
