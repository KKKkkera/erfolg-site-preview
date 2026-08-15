import { permanentRedirect } from "next/navigation";

export const dynamic = "force-static";

export default function CookieAlias() {
  // Канонический адрес — /cookie-policy. /cookie оставлен как 301-алиас
  // для исторических ссылок (футер, политика конфиденциальности).
  permanentRedirect("/cookie-policy");
}
