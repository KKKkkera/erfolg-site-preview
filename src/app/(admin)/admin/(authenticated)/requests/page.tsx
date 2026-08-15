import { redirect } from "next/navigation";

export default function RequestsRootPage() {
  redirect("/admin/requests/quote");
}
