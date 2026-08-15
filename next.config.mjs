// Картинки каталога отдаются собственным маршрутом /media (см. app/media),
// а не прямой ссылкой в хранилище: бакет закрыт целиком, потому что в нём
// же лежат вложения к заявкам с персональными данными. Адрес картинки
// абсолютный — он идёт в og:image и разметку schema.org, — а для next/image
// любой абсолютный адрес считается внешним, поэтому собственный домен нужно
// внести в белый список наравне с чужими.
// Протокол и порт берём из того же адреса, что и хост: в белом списке
// опущенный порт означает «адрес без порта», а не «любой порт». Из-за этого
// шаблон без порта не совпадал с http://localhost:3200 и оптимизатор отвечал
// «url parameter is not allowed» — на боевом домене порта нет, а в разработке
// он есть, и правило должно подходить обоим.
const siteUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://erfolgmt.ru');
  } catch {
    return new URL('https://erfolgmt.ru');
  }
})();

const sitePattern = {
  protocol: siteUrl.protocol.replace(':', ''),
  hostname: siteUrl.hostname,
  ...(siteUrl.port ? { port: siteUrl.port } : {}),
};

const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  images: {
    // AVIF/WebP вместо исходных PNG — на главной это разница ~1.2 МБ → ~70 КБ
    // на картинку. Порядок важен: Next отдаёт первый формат, который принял браузер.
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    remotePatterns: [
      // Собственный домен: через него идут картинки каталога (/media/...).
      sitePattern,
      { protocol: 'https', hostname: '**.selcloud.ru' },
      { protocol: 'https', hostname: 'roszdravnadzor.gov.ru' },
      // unsplash убран: ссылок на сток в коде не осталось, а лишний
      // внешний хост в белом списке — это лишний внешний хост.
    ],
  },
  // Next 16 собирает Turbopack'ом; прежний однопоточный режим webpack
  // (experimental.cpus) больше не существует. Ограничение для боевого
  // сервера с 2 ГБ памяти: собирать образ на машине разработчика или CI,
  // а не на самом сервере.
  async redirects() {
    const redirects = [
      // Заглушка под будущие 301-редиректы (старые URL после миграции и т.п.).
      // WWW→non-www и trailing-slash чаще решаются через nginx (этап 9).
    ];

    if (!databaseConfigured) {
      redirects.push(
        { source: '/catalog', destination: '/', permanent: false },
        { source: '/catalog/:path*', destination: '/', permanent: false },
      );
    }

    return redirects;
  },
};
export default nextConfig;
