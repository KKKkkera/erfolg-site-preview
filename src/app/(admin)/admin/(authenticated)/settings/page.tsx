import {
  SettingsCardForm,
  type SettingFieldDef,
} from "@/components/admin/settings/settings-form";
import { OfficesEditor } from "@/components/admin/settings/offices-editor";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Настройки — Эрфольг" };

const COMPANY_FIELDS: SettingFieldDef[] = [
  { key: "company.legal_name", label: "Юр. название", placeholder: "ООО «Эрфольг»" },
  { key: "company.inn", label: "ИНН", placeholder: "20YYNNNNNN" },
  { key: "company.kpp", label: "КПП" },
  { key: "company.ogrn", label: "ОГРН" },
  {
    key: "company.legal_address",
    label: "Юр. адрес",
    type: "textarea",
    placeholder: "г. Грозный, ул. ...",
  },
];

const CONTACTS_FIELDS: SettingFieldDef[] = [
  { key: "contacts.phone", label: "Основной телефон", placeholder: "+7 ..." },
  { key: "contacts.email", label: "Email" },
];

// Скан-копия лицензии не загружается: с 2022 года Росздравнадзор не выдаёт
// бумажные бланки — лицензия существует только в виде записи в Едином реестре.
// Достаточно номера и даты; подлинность проверяется онлайн в реестре.
const LICENSE_FIELDS: SettingFieldDef[] = [
  { key: "license.tomi_number", label: "Номер лицензии ТОМИ" },
  { key: "license.tomi_date", label: "Дата выдачи (DD.MM.YYYY)" },
  { key: "license.tomi_authority", label: "Кем выдана" },
];

const SEO_FIELDS: SettingFieldDef[] = [
  { key: "seo.metrika_id", label: "Я.Метрика ID", placeholder: "12345678" },
  { key: "seo.yandex_verification", label: "Я.Webmaster verification" },
  { key: "seo.google_verification", label: "Google verification" },
];

const EMAIL_FIELDS: SettingFieldDef[] = [
  {
    key: "email.notify_to",
    label: "Email для уведомлений",
    description: "Куда уходят заявки. Можно несколько через запятую.",
  },
];

const COMPLIANCE_FIELDS: SettingFieldDef[] = [
  {
    key: "compliance.rkn_notification_date",
    label: "Дата уведомления Роскомнадзора",
    placeholder: "YYYY-MM-DD",
    description:
      "Дата подачи уведомления об обработке ПДн в реестр операторов ПДн (152-ФЗ).",
  },
  {
    key: "compliance.rkn_notification_number",
    label: "Номер в реестре операторов ПДн",
    placeholder: "XX-XX-XXXXXX",
    description:
      "Номер записи после внесения в реестр Роскомнадзора. Заполняется после публикации сайта.",
  },
];

const BRANDING_FIELDS: SettingFieldDef[] = [
  {
    key: "branding.logo_url",
    label: "Логотип (URL)",
    type: "media",
    description:
      "Загрузите SVG/PNG в медиатеку. Используется в шапке сайта при наличии.",
  },
];

export default async function AdminSettingsPage() {
  let settings: Array<{ key: string; value: unknown }> = [];
  let dbError = false;
  try {
    settings = await db.setting.findMany({ orderBy: { key: "asc" } });
  } catch (e) {
    console.error("admin/settings fetch error", e);
    dbError = true;
  }

  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  const officesValue = map["contacts.offices"] ?? [];
  const s3 = isS3Configured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Настройки
        </h1>
        <p className="text-sm text-muted-foreground">
          Реквизиты, контакты, лицензия ТОМИ, SEO. После сохранения публичные
          страницы пересчитываются.
        </p>
      </div>

      {dbError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          База данных недоступна.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SettingsCardForm
            title="Компания"
            description="Юридические реквизиты в футере и на странице «О компании»."
            fields={COMPANY_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <SettingsCardForm
            title="Контакты"
            description="Основной телефон и email для шапки/футера."
            fields={CONTACTS_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <SettingsCardForm
            title="Лицензия ТОМИ"
            description="Регулирующее условие для медтехники в ЧР."
            fields={LICENSE_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <SettingsCardForm
            title="SEO"
            description="Идентификаторы Я.Метрики и поисковых консолей."
            fields={SEO_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <SettingsCardForm
            title="Email"
            description="Адресат уведомлений о заявках."
            fields={EMAIL_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <SettingsCardForm
            title="Соответствие требованиям (152-ФЗ)"
            description="Реквизиты уведомления об обработке ПДн в Роскомнадзор."
            fields={COMPLIANCE_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <SettingsCardForm
            title="Брендинг"
            description="Логотип компании для шапки сайта."
            fields={BRANDING_FIELDS}
            initial={map}
            s3Configured={s3}
          />
          <div className="lg:col-span-2">
            <OfficesEditor initial={officesValue} />
          </div>
        </div>
      )}
    </div>
  );
}
