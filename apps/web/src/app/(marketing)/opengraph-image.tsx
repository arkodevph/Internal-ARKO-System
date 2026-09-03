import { ImageResponse } from "next/og";

export const alt = "Arko Software Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function createSocialCard(origin = "https://arkodevph.com") {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f5f4f1",
      }}
    >
      <img
        src={`${origin}/og-image.png`}
        width="1200"
        height="630"
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>,
    size,
  );
}

export default function OpengraphImage() {
  return createSocialCard();
}
