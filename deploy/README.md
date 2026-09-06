# Деплой на Selectel

Ubuntu 22.04/24.04, Node 20+, nginx, managed PostgreSQL в Selectel,
S3-бакет Selectel для картинок и вложений.

На сервере уже стоит старый проект — см. раздел «Замена старого проекта».

## 1. Подготовка сервера

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Пользователь без прав входа: приложение не должно ходить под root
sudo useradd -r -m -d /srv/erfolg -s /usr/sbin/nologin erfolg
sudo mkdir -p /srv/erfolg/releases /etc/erfolg
sudo chown -R erfolg:erfolg /srv/erfolg
```

## 2. Переменные окружения

```bash
sudo cp deploy/../.env.example /etc/erfolg/erfolg.env
sudo nano /etc/erfolg/erfolg.env      # заполнить все пустые значения
sudo chmod 600 /etc/erfolg/erfolg.env
sudo chown erfolg:erfolg /etc/erfolg/erfolg.env
```

`NEXTAUTH_SECRET` сгенерировать: `openssl rand -base64 32`.

Корневой сертификат Selectel для `sslmode=verify-full`:

```bash
sudo curl -o /etc/ssl/certs/selectel-root.crt \
  https://my.selectel.ru/db/ca/root.crt
```

## 3. Код и первая сборка

```bash
sudo -u erfolg git clone <репозиторий> /srv/erfolg/src
cd /srv/erfolg/src
sudo -u erfolg bash deploy/deploy.sh
```

Скрипт делает `npm ci`, `prisma migrate deploy`, `next build`, собирает
релиз в `/srv/erfolg/releases/<дата>`, переключает симлинк
`/srv/erfolg/current` и перезапускает сервис.

Первый администратор (только один раз, на пустой базе):

```bash
cd /srv/erfolg/src && sudo -u erfolg npm run db:seed
```

## 4. systemd

```bash
sudo cp deploy/erfolg.service /etc/systemd/system/erfolg.service
sudo systemctl daemon-reload
sudo systemctl enable --now erfolg
sudo systemctl status erfolg
```

Логи: `journalctl -u erfolg -f`.

## 5. nginx и TLS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/erfolg
sudo ln -sf /etc/nginx/sites-available/erfolg /etc/nginx/sites-enabled/erfolg
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d erfolgmt.ru -d www.erfolgmt.ru
```

Автопродление проверить: `sudo certbot renew --dry-run`.

## 6. Замена старого проекта

Старый сайт на этом же сервере снимается до переключения DNS, иначе оба
займут порт 80/443.

```bash
# что сейчас слушает порты и какие юниты есть
sudo ss -ltnp
systemctl list-units --type=service | grep -iE 'node|next|pm2|erfolg'

# остановить старое (подставить реальное имя юнита)
sudo systemctl disable --now <старый-юнит>
sudo rm -f /etc/nginx/sites-enabled/<старый-конфиг>
sudo nginx -t && sudo systemctl reload nginx
```

Каталог старого проекта не удалять сразу — оставить до подтверждения, что
новый сайт работает на боевом домене.

## 7. Обновление

```bash
cd /srv/erfolg/src && sudo -u erfolg git pull && sudo -u erfolg bash deploy/deploy.sh
```

Откат: переключить симлинк на предыдущий релиз и перезапустить.

```bash
sudo -u erfolg ln -sfn /srv/erfolg/releases/<предыдущий> /srv/erfolg/current
sudo systemctl restart erfolg
```

## Проверка после выкладки

```bash
curl -I https://erfolgmt.ru                    # 200, HSTS, X-Frame-Options
curl -s https://erfolgmt.ru/robots.txt         # без Disallow: /, есть Sitemap:
curl -s https://erfolgmt.ru/sitemap.xml | head # абсолютные https-адреса
curl -I https://erfolgmt.ru/admin              # X-Robots-Tag: noindex
curl -I https://www.erfolgmt.ru                # 301 на без-www
```
