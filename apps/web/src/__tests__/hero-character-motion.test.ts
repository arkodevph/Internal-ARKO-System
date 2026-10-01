import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("hero character motion", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/(marketing)/_components/HeroCharacter.tsx"),
    "utf8",
  );

  it("follows fine pointers with GPU transforms", () => {
    expect(source).toContain('hero.addEventListener("pointermove", move)');
    expect(source).toContain("translate3d(");
    expect(source).toContain("rotateX(");
    expect(source).toContain("rotateY(");
  });

  it("stays static for reduced motion and touch pointers", () => {
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain("(pointer: fine)");
  });
});
