import { afterEach, describe, expect, it, jest } from "@jest/globals";

const originalS3Region = process.env.S3_REGION;
const originalAwsRegion = process.env.AWS_REGION;

afterEach(() => {
  if (originalS3Region === undefined) delete process.env.S3_REGION;
  else process.env.S3_REGION = originalS3Region;

  if (originalAwsRegion === undefined) delete process.env.AWS_REGION;
  else process.env.AWS_REGION = originalAwsRegion;

  jest.resetModules();
});

describe("S3 configuration", () => {
  it("uses the default region when Vercel provides empty region variables", async () => {
    process.env.S3_REGION = "";
    process.env.AWS_REGION = "";
    jest.resetModules();

    const { s3 } = await import("../s3");

    await expect(s3.config.region()).resolves.toBe("us-east-1");
  });
});
