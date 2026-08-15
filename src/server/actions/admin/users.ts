"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { requireOwner } from "@/server/actions/admin/auth";

const CreateInput = z.object({
  email: z.string().trim().email("Некорректный email").max(200),
  name: z.string().trim().min(2, "Имя обязательно").max(120),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(200, "Слишком длинный"),
  role: z.enum(["OWNER", "EDITOR"]),
});

export type UserSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function createAdminUser(
  input: z.input<typeof CreateInput>,
): Promise<UserSaveResult> {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return { ok: false, message: "Forbidden" };

  const parsed = CreateInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля" };
  }
  const data = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const created = await db.adminUser.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        role: data.role,
        passwordHash,
      },
    });
    await logAction(owner.id, "create", "AdminUser", created.id, {
      email: created.email,
      role: created.role,
    });
    revalidatePath("/admin/users");
    return { ok: true, id: created.id };
  } catch (e) {
    console.error("createAdminUser error", e);
    const code =
      typeof e === "object" && e && "code" in e
        ? (e as { code: string }).code
        : null;
    if (code === "P2002") {
      return {
        ok: false,
        errors: { email: "Этот email уже используется" },
        message: "Email уже занят",
      };
    }
    return { ok: false, message: "Не удалось создать пользователя" };
  }
}

const UpdateInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, "Имя обязательно").max(120),
  role: z.enum(["OWNER", "EDITOR"]),
});

export async function updateAdminUser(
  input: z.input<typeof UpdateInput>,
): Promise<UserSaveResult> {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return { ok: false, message: "Forbidden" };
  const parsed = UpdateInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля" };
  }
  const { id, name, role } = parsed.data;
  try {
    // Защита: нельзя понизить себе самому роль до EDITOR, если ты единственный OWNER
    if (id === owner.id && role !== "OWNER") {
      const ownerCount = await db.adminUser.count({
        where: { role: "OWNER", isActive: true },
      });
      if (ownerCount <= 1) {
        return {
          ok: false,
          message: "Нельзя снять роль: вы единственный активный OWNER",
        };
      }
    }
    const updated = await db.adminUser.update({
      where: { id },
      data: { name, role },
    });
    await logAction(owner.id, "update", "AdminUser", id, { name, role });
    revalidatePath("/admin/users");
    return { ok: true, id: updated.id };
  } catch (e) {
    console.error("updateAdminUser error", e);
    return { ok: false, message: "Не удалось обновить пользователя" };
  }
}

const PasswordInput = z.object({
  id: z.string().trim().min(1),
  password: z.string().min(8, "Минимум 8 символов").max(200),
});

export async function setAdminPassword(
  input: z.input<typeof PasswordInput>,
): Promise<{ ok: true } | { ok: false; message?: string; errors?: Record<string, string> }> {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return { ok: false, message: "Forbidden" };
  const parsed = PasswordInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля" };
  }
  const { id, password } = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.adminUser.update({
      where: { id },
      data: { passwordHash },
    });
    await logAction(owner.id, "update", "AdminUser", id, {
      action: "set_password",
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    console.error("setAdminPassword error", e);
    return { ok: false, message: "Не удалось обновить пароль" };
  }
}

export async function toggleAdminActive(
  id: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return { ok: false, message: "Forbidden" };
  try {
    if (id === owner.id && !isActive) {
      return {
        ok: false,
        message: "Нельзя деактивировать себя",
      };
    }
    if (!isActive) {
      const ownerCount = await db.adminUser.count({
        where: { role: "OWNER", isActive: true, NOT: { id } },
      });
      const target = await db.adminUser.findUnique({ where: { id } });
      if (target?.role === "OWNER" && ownerCount === 0) {
        return {
          ok: false,
          message: "Нельзя деактивировать единственного OWNER",
        };
      }
    }
    await db.adminUser.update({
      where: { id },
      data: { isActive },
    });
    await logAction(owner.id, "update", "AdminUser", id, {
      action: isActive ? "activate" : "deactivate",
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    console.error("toggleAdminActive error", e);
    return { ok: false, message: "Не удалось изменить статус" };
  }
}
