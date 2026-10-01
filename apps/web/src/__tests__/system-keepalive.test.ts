import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("production uptime monitor", () => {
  it("checks the production health endpoint around the clock", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), "../../.github/workflows/system-keepalive.yml"),
      "utf8",
    );

    expect(workflow).toContain("7-57/10 * * * *");
    expect(workflow).toContain("https://app.arkodevph.com/health");
  });
});
