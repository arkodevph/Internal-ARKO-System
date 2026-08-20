import { ImageResponse } from "next/og";

export const alt = "Arko Software Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function createSocialCard() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#b8ff2e",
        color: "#0a0a0a",
        padding: 36,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "white",
          borderRadius: 30,
          padding: "54px 62px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 66,
                height: 66,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                background: "#b8ff2e",
                color: "#0a0a0a",
                fontSize: 40,
                fontWeight: 900,
              }}
            >
              A
            </div>
            <span style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2 }}>
              ARKO
            </span>
          </div>
          <span style={{ fontSize: 20, color: "#a3a3a3", letterSpacing: 4 }}>
            SOFTWARE STUDIO
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontWeight: 900,
            lineHeight: 0.92,
          }}
        >
          <span style={{ fontSize: 84, letterSpacing: -4 }}>
            WE BUILD PRODUCTS
          </span>
          <span style={{ fontSize: 84, letterSpacing: -4, color: "#b8ff2e" }}>
            THAT MOVE BUSINESS.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 25, color: "#c7c7c7" }}>
            Web · Mobile · Automation · AI
          </span>
          <span style={{ fontSize: 25, fontWeight: 700, color: "#b8ff2e" }}>
            arkodevph.com
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}

export default function OpengraphImage() {
  return createSocialCard();
}
