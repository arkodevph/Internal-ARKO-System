import { cookies } from "next/headers";

export type LandingTheme = "ink" | "studio";
export const LANDING_THEME_COOKIE = "arko-landing-theme";

export async function getLandingTheme(): Promise<LandingTheme> {
  const saved = (await cookies()).get(LANDING_THEME_COOKIE)?.value;
  return saved === "studio" ? "studio" : "ink";
}
