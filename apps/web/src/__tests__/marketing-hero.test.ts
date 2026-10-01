import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("marketing hero", () => {
  it("clips the character artwork to the hero section", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(marketing)/page.tsx"),
      "utf8",
    );

    expect(page).toContain("<HeroCharacter />");
    expect(page).not.toMatch(
      /<section(?=[^>]*id="top")(?=[^>]*className="[^"]*overflow-hidden)[^>]*>/,
    );
  });
});
