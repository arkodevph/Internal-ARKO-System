import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("root Vercel deployment", () => {
  it("builds the public landing site without database credentials", () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "../../vercel.json"), "utf8"),
    );

    expect(config.env).toMatchObject({
      ARKO_SURFACE: "site",
      ARKO_API_URL: "https://app.arkodevph.com",
    });
    expect(config.buildCommand).not.toMatch(/prisma|DATABASE_URL|DIRECT_URL/);
    expect(config).not.toHaveProperty("outputDirectory");
  });
});
