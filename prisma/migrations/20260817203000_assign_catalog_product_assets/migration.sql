UPDATE "product_images" AS image
SET
  "url" = asset."url",
  "alt" = asset."alt"
FROM "products" AS product,
  (
    VALUES
      ('hamilton-c6-ventilator', '/images/catalog/hamilton-c6-ventilator.png', 'Аппарат ИВЛ Hamilton-C6 — изображение оборудования'),
      ('mindray-umec12-patient-monitor', '/images/catalog/mindray-umec12-patient-monitor.png', 'Монитор пациента Mindray uMEC12 — изображение оборудования'),
      ('nihon-kohden-tec-5631-defibrillator', '/images/catalog/nihon-kohden-tec-5631-defibrillator.png', 'Дефибриллятор-монитор Nihon Kohden cardiolife TEC-5631 — изображение оборудования'),
      ('b-braun-perfusor-space-syringe-pump', '/images/catalog/b-braun-perfusor-space-syringe-pump.png', 'Шприцевой насос B. Braun Perfusor Space — изображение оборудования'),
      ('samsung-medison-hs40-ultrasound', '/images/catalog/samsung-medison-hs40-ultrasound.png', 'Ультразвуковая система Samsung Medison HS40 — изображение оборудования'),
      ('draeger-fabius-plus-anesthesia', '/images/catalog/draeger-fabius-plus-anesthesia.png', 'Наркозно-дыхательный аппарат Dräger Fabius plus — изображение оборудования'),
      ('erbe-vio-3-electrosurgery', '/images/catalog/erbe-vio-3-electrosurgery.png', 'Электрохирургический аппарат Erbe VIO 3 — изображение оборудования'),
      ('uomz-emaled-500-300-surgical-light', '/images/catalog/uomz-emaled-500-300-surgical-light.png', 'Операционный светильник Эмалед 500/300 — изображение оборудования'),
      ('sysmex-xn-350-hematology-analyzer', '/images/catalog/sysmex-xn-350-hematology-analyzer.png', 'Гематологический анализатор Sysmex XN-350 — изображение оборудования'),
      ('roche-cobas-c111-biochemistry-analyzer', '/images/catalog/roche-cobas-c111-biochemistry-analyzer.png', 'Биохимический анализатор Roche cobas c 111 — изображение оборудования'),
      ('olympus-190-endoscopy-tower-bu', '/images/catalog/olympus-190-endoscopy-tower-bu.png', 'Эндоскопическая стойка Olympus 190 series, Б/У'),
      ('ge-oec-9900-elite-c-arm-bu', '/images/catalog/ge-oec-9900-elite-c-arm-bu.png', 'Мобильная С-дуга GE OEC 9900 Elite, Б/У'),
      ('karl-storz-image1-rigid-endoscopy-bu', '/images/catalog/karl-storz-image1-rigid-endoscopy-bu.png', 'Стойка жёсткой эндоскопии Karl Storz IMAGE1, Б/У'),
      ('ge-voluson-ultrasound-bu', '/images/catalog/ge-voluson-ultrasound-bu.png', 'Ультразвуковая система GE Voluson, Б/У')
  ) AS asset("slug", "url", "alt")
WHERE image."productId" = product."id"
  AND product."slug" = asset."slug"
  AND image."sort" = 0;
