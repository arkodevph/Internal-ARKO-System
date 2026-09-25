"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LANDING_THEME_COOKIE } from "@/lib/landing/theme";

export async function changeLandingTheme(formData: FormData) {
  const theme = formData.get("theme");
  if (theme !== "ink" && theme !== "studio") return;

  (await cookies()).set(LANDING_THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/");
}
