import { ImageResponse } from "next/og";

export const alt = "Erfolg — Медицинская техника";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#ffffff",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#039FE4",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#039FE4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            E
          </div>
          Erfolg
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "84px",
            fontWeight: 800,
            color: "#0F172A",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: "1000px",
          }}
        >
          Медицинская техника
        </div>
        <div
          style={{
            marginTop: "24px",
            fontSize: "36px",
            fontWeight: 500,
            color: "#475569",
            maxWidth: "1000px",
            lineHeight: 1.25,
          }}
        >
          Сервис и поставка по всей России
        </div>
        <div
          style={{
            marginTop: "48px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {[
            "Лицензия Росздравнадзора (ТОМИ)",
            "РУ на каждое изделие",
            "Юр. лицо с 2012 года",
          ].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                background: "#F1F5F9",
                color: "#0F172A",
                fontSize: "22px",
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
