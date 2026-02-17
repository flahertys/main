import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TradeHax AI social preview";
export const size = {
  width: 1200,
  height: 675,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 20%, #0f3f2d 0%, #071422 45%, #01050b 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
          padding: "56px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(130deg, rgba(0,255,65,0.12), rgba(153,102,255,0.08), rgba(0,0,0,0) 70%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              border: "1px solid rgba(143,255,182,0.5)",
              borderRadius: "999px",
              background: "rgba(6, 20, 15, 0.75)",
              color: "#b7ffd2",
              padding: "8px 14px",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            TRADEHAX AI
          </div>
          <div style={{ fontSize: "60px", lineHeight: 1.06, fontWeight: 800 }}>
            Build. Repair. Teach. Scale.
          </div>
          <div style={{ fontSize: "29px", color: "#d0e7f6", maxWidth: "1000px" }}>
            Websites, apps, device support, online guitar lessons, and Web3 consulting.
          </div>
          <div style={{ fontSize: "24px", color: "#98ffc2" }}>
            tradehaxai.tech
          </div>
        </div>
      </div>
    ),
    size,
  );
}

