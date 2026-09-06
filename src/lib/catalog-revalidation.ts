import { revalidatePath } from "next/cache";

export function revalidateCatalog() {
  revalidatePath("/catalog", "layout");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
