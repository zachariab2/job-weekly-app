"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1),
});

export type LoginResult = { error?: string };

export async function loginAction(_: LoginResult, formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !verifyPassword(password, user.passwordHash ?? null)) {
    return { error: "Invalid credentials." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
