import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email-уведомления о заявках с сайта.
 *
 * Транспорт инициализируется лениво при первом обращении.
 * Если SMTP-переменные не заданы (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`) —
 * `sendMail` логирует «SMTP не настроен» и возвращает `false`,
 * не роняя вызывающий код. Заявка в любом случае уже сохранена в БД.
 *
 * Получатель — `ADMIN_NOTIFY_EMAIL` (через .env). Отправитель — `SMTP_FROM`.
 */

let cachedTransporter: Transporter | null = null;
let transporterReady = false;

function isConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

function getTransporter(): Transporter | null {
  if (transporterReady) return cachedTransporter;
  transporterReady = true;
  if (!isConfigured()) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 — TLS с первого байта. На любом другом порту (587, 25) шифрование
    // поднимается через STARTTLS, и requireTLS здесь обязателен: без него
    // nodemailer при отсутствии STARTTLS молча уходит в открытый текст и
    // отправляет логин с паролем от почтового ящика незашифрованными.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

type SendArgs = {
  subject: string;
  text: string;
  html?: string;
  to?: string;
  /**
   * Обратный адрес заявителя. Письмо уходит с info@ на info@ (reg.ru не даёт
   * отправлять от чужого адреса), поэтому без этого заголовка «Ответить» в
   * почтовом клиенте адресует ответ самому себе, а не клиенту.
   * Передаётся объектом: nodemailer сам кодирует имя и экранирует спецсимволы,
   * так что имя из формы не может подделать заголовки письма.
   */
  replyTo?: { name?: string | null; address?: string | null } | null;
};

export async function sendMail({
  subject,
  text,
  html,
  to,
  replyTo,
}: SendArgs): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.info(
      `[mailer] SMTP не настроен — пропускаю отправку «${subject}». ` +
        "Заявка сохранена в БД и видна в /admin/requests.",
    );
    return false;
  }

  const recipient =
    to ?? process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_FROM;
  if (!recipient) {
    console.warn("[mailer] не задан получатель (ADMIN_NOTIFY_EMAIL/SMTP_FROM)");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? recipient,
      to: recipient,
      // Без адреса заявителя заголовок не ставим: пустой Reply-To хуже, чем
      // его отсутствие — часть клиентов подставит в ответ пустого получателя.
      ...(replyTo?.address
        ? { replyTo: { name: replyTo.name ?? "", address: replyTo.address } }
        : {}),
      subject,
      text,
      html,
    });
    return true;
  } catch (e) {
    console.error("[mailer] sendMail failed:", e);
    return false;
  }
}

// ─────────────────────── Шаблоны ───────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `${label}: ${value}\n`;
}

function htmlRow(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#0f172a;">${escapeHtml(value)}</td></tr>`;
}

function adminUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru";
  return `${base}${path}`;
}

export type QuoteNotification = {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  organization?: string | null;
  inn?: string | null;
  message?: string | null;
  productName?: string | null;
  source?: string | null;
};

export async function sendQuoteNotification(q: QuoteNotification): Promise<boolean> {
  const subject = q.productName
    ? `Запрос КП: ${q.productName} — ${q.name}`
    : `Запрос КП — ${q.name}`;
  const text =
    `Новая заявка на коммерческое предложение.\n\n` +
    row("Имя", q.name) +
    row("Телефон", q.phone) +
    row("Email", q.email) +
    row("Организация", q.organization) +
    row("ИНН", q.inn) +
    row("Товар", q.productName) +
    row("Источник", q.source) +
    (q.message ? `\nСообщение:\n${q.message}\n` : "") +
    `\nОткрыть в админке: ${adminUrl(`/admin/requests/quote/${q.id}`)}\n`;
  const html =
    `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#0f172a;max-width:560px;">
      <h2 style="font-size:18px;margin:0 0 16px;">Новая заявка на коммерческое предложение</h2>
      <table style="font-size:14px;border-collapse:collapse;">
        ${htmlRow("Имя", q.name)}
        ${htmlRow("Телефон", q.phone)}
        ${htmlRow("Email", q.email)}
        ${htmlRow("Организация", q.organization)}
        ${htmlRow("ИНН", q.inn)}
        ${htmlRow("Товар", q.productName)}
        ${htmlRow("Источник", q.source)}
      </table>
      ${q.message ? `<div style="margin-top:16px;padding:12px;background:#f1f5f9;border-radius:8px;font-size:14px;white-space:pre-wrap;">${escapeHtml(q.message)}</div>` : ""}
      <p style="margin-top:20px;font-size:14px;"><a href="${adminUrl(`/admin/requests/quote/${q.id}`)}" style="color:#0a6ebd;">Открыть в админке →</a></p>
    </div>`;
  return sendMail({
    subject,
    text,
    html,
    replyTo: { name: q.name, address: q.email },
  });
}
