"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { pingIndexNow } from "@/lib/indexnow";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

// coverUrl может быть либо относительным путём (/images/...), либо полным https URL.
const coverUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => {
      if (v === "") return true;
      if (v.startsWith("/") && !v.startsWith("//")) return true; // относительный путь
      try {
        const u = new URL(v);
        if (!["https:", "http:"].includes(u.protocol)) return false;
        const h = u.hostname.toLowerCase();
        if (h === "localhost" || h === "127.0.0.1" || h === "::1") return false;
        return true;
      } catch {
        return false;
      }
    },
    { message: "Допустим относительный путь (/...) или публичный https:// URL" },
  );

const BlogPostInput = z.object({
  id: z.string().optional().nullable(),
  slug: z.string().trim().min(1, "Slug обязателен").max(120),
  title: z.string().trim().min(2, "Заголовок обязателен").max(200),
  excerpt: z.string().trim().max(2000).optional().or(z.literal("")),
  content: z.string().trim().max(120000).default(""),
  coverUrl: coverUrlSchema.optional().or(z.literal("")),
  authorName: z.string().trim().max(120).optional().or(z.literal("")),
  isPublished: z.coerce.boolean().default(false),
  publishedAt: z.string().trim().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDesc: z.string().trim().max(400).optional().or(z.literal("")),
});

export type BlogPostSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveBlogPost(
  input: z.input<typeof BlogPostInput>,
): Promise<BlogPostSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = BlogPostInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля формы" };
  }
  const data = parsed.data;
  const slug = slugify(data.slug);
  if (!slug) {
    return {
      ok: false,
      errors: { slug: "Некорректный slug" },
      message: "Невалидный slug",
    };
  }

  // Если опубликовано — гарантируем publishedAt; иначе по выбору пользователя.
  let publishedAt: Date | null = null;
  if (data.publishedAt && data.publishedAt.trim()) {
    const d = new Date(data.publishedAt);
    if (!Number.isNaN(d.getTime())) publishedAt = d;
  }
  if (data.isPublished && !publishedAt) publishedAt = new Date();

  const payload = {
    slug,
    title: data.title,
    excerpt: data.excerpt?.trim() ? data.excerpt.trim() : null,
    content: data.content,
    coverUrl: data.coverUrl?.trim() ? data.coverUrl.trim() : null,
    authorName: data.authorName?.trim() ? data.authorName.trim() : null,
    isPublished: data.isPublished,
    publishedAt,
    seoTitle: data.seoTitle?.trim() ? data.seoTitle.trim() : null,
    seoDesc: data.seoDesc?.trim() ? data.seoDesc.trim() : null,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.blogPost.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "BlogPost", id);
    } else {
      const created = await db.blogPost.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "BlogPost", id);
    }
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);

    if (data.isPublished) {
      void pingIndexNow([`/blog/${slug}`, "/blog"]);
    }

    return { ok: true, id };
  } catch (e) {
    console.error("saveBlogPost error", e);
    const msg =
      typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002"
        ? "Slug уже используется"
        : "Не удалось сохранить статью";
    return { ok: false, message: msg };
  }
}

export async function deleteBlogPost(id: string) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false as const, message: "Unauthorized" };
  try {
    const post = await db.blogPost.findUnique({ where: { id } });
    await db.blogPost.delete({ where: { id } });
    await logAction(admin.id, "delete", "BlogPost", id);
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    if (post?.slug) revalidatePath(`/blog/${post.slug}`);
    return { ok: true as const };
  } catch (e) {
    console.error("deleteBlogPost error", e);
    return { ok: false as const, message: "Не удалось удалить статью" };
  }
}
