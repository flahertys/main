import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "TradeHax AI: Web development, tech repair, music lessons, and Web3 services";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at 15% 15%, #123f2a 0%, #07111e 45%, #02060d 100%)",
          color: "#ffffff",
          padding: "52px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(0,255,65,0.16), rgba(0,0,0,0) 45%, rgba(64,196,255,0.12))",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid rgba(0,255,65,0.5)",
              background: "rgba(3, 15, 10, 0.75)",
              borderRadius: "999px",
              padding: "8px 16px",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            TRADEHAX AI
          </div>
          <div
            style={{
              fontSize: "66px",
              lineHeight: 1.06,
              fontWeight: 800,
              maxWidth: "1000px",
            }}
          >
            Web Development, Tech Repair, Music Lessons, and Web3 Services
          </div>
          <div
            style={{
              fontSize: "30px",
              color: "#cde4f2",
              maxWidth: "1000px",
            }}
          >
            Greater Philadelphia and Remote Support
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            {["2h Response Goal", "25+ Years Experience", "Local + Remote"].map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  border: "1px solid rgba(143,255,182,0.45)",
                  background: "rgba(6, 25, 42, 0.68)",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  fontSize: "20px",
                  color: "#b8ffd4",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

