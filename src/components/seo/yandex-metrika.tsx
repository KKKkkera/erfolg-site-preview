"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

import { readConsent, subscribeConsent } from "@/lib/consent";

type Props = {
  metrikaId?: string;
};

/**
 * Я.Метрика с проверкой cookie-consent (152-ФЗ).
 * Рендерит <Script> только после получения согласия пользователя.
 * Cookie-banner пишет выбор через writeConsent (см. lib/consent.ts) —
 * подписка через useSyncExternalStore перерисует компонент и подгрузит счётчик.
 */
export function YandexMetrika({ metrikaId }: Props) {
  // На сервере согласия нет (false), на клиенте — актуальное значение.
  const allowed = useSyncExternalStore(
    subscribeConsent,
    () => readConsent() === "accepted",
    () => false,
  );

  if (!metrikaId) return null;
  if (!allowed) return null;

  const numericId = String(metrikaId).replace(/[^0-9]/g, "");
  if (!numericId) return null;

  const code = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${numericId}, "init", { defer: true, clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false });`;

  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: code }}
      />
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${numericId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
