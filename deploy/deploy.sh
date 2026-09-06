#!/usr/bin/env bash
# Сборка и выкладка на сервер. Запускается НА СЕРВЕРЕ из каталога с кодом.
#
#   sudo -u erfolg bash deploy/deploy.sh
#
# Итог: /srv/erfolg/current — рабочая версия, /srv/erfolg/releases/<дата> —
# предыдущие, чтобы откатиться одним переключением симлинка.

set -euo pipefail

APP_DIR=${APP_DIR:-/srv/erfolg}
SRC_DIR=${SRC_DIR:-$(pwd)}
ENV_FILE=${ENV_FILE:-/etc/erfolg/erfolg.env}
RELEASE="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"

echo "==> Сборка в $SRC_DIR"
cd "$SRC_DIR"

# Переменные нужны уже на сборке: NEXT_PUBLIC_* вшиваются в клиентский
# бандл, и собранное без них приложение будет ходить на localhost.
set -a; . "$ENV_FILE"; set +a

npm ci
npm run db:deploy      # миграции Prisma; на пустой базе создаёт схему
npm run build          # prisma generate + next build (output: standalone)

echo "==> Сборка релиза $RELEASE"
mkdir -p "$RELEASE"
cp -r .next/standalone/. "$RELEASE/"

# standalone НЕ включает эти два каталога — их копируем отдельно, иначе
# статика и картинки отдают 404.
mkdir -p "$RELEASE/.next"
cp -r .next/static "$RELEASE/.next/static"
cp -r public "$RELEASE/public"

# Prisma-движок нужен в рантайме: query engine лежит вне трассировки Next.
if [ -d node_modules/.prisma ]; then
  mkdir -p "$RELEASE/node_modules/.prisma"
  cp -r node_modules/.prisma/. "$RELEASE/node_modules/.prisma/"
fi

echo "==> Переключение symlink"
ln -sfn "$RELEASE" "$APP_DIR/current.new"
mv -Tf "$APP_DIR/current.new" "$APP_DIR/current"

echo "==> Перезапуск"
sudo systemctl restart erfolg
sleep 2
systemctl is-active --quiet erfolg && echo "OK: сервис поднят" || {
  echo "ОШИБКА: сервис не поднялся, смотри journalctl -u erfolg -n 50"; exit 1;
}

# Держим пять последних релизов.
ls -1dt "$APP_DIR"/releases/*/ | tail -n +6 | xargs -r rm -rf

echo "==> Готово: $RELEASE"
