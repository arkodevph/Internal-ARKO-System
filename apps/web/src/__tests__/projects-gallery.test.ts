import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("projects gallery", () => {
  it("uses the current DM ARC Construction domain", () => {
    const content = readFileSync(
      resolve(process.cwd(), "src/lib/landing/content.ts"),
      "utf8",
    );
    expect(content).toContain('domain: "dmarcconstruction.com"');
    expect(content).toContain('href: "https://dmarcconstruction.com/"');
  });

  it("keeps project metadata outside screenshot artwork", () => {
    const gallery = readFileSync(
      resolve(process.cwd(), "src/app/(marketing)/projects/ProjectGallery.tsx"),
      "utf8",
    );
    expect(gallery).toContain('data-project-metadata');
    expect(gallery).not.toContain('absolute inset-x-0 bottom-0 p-4');
  });

  it("does not iframe sites that explicitly block embedding", () => {
    const gallery = readFileSync(
      resolve(process.cwd(), "src/app/(marketing)/projects/ProjectGallery.tsx"),
      "utf8",
    );
    expect(gallery).toContain('"dmarcconstruction.com"');
    expect(gallery).toContain('"gohuntly.com"');
    expect(gallery).toContain('"hivecx.asia"');
  });
});
