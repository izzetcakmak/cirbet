import { ImageResponse } from "next/og";

export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07070d",
          borderRadius: 8,
        }}
      >
        {/* Simplified CirBet mark — no filters (ImageResponse limitation) */}
        <svg width="28" height="28" viewBox="0 0 220 220" fill="none">
          {/* Outer Arc ring */}
          <circle cx="110" cy="110" r="80"
            stroke="#00d4ff" strokeWidth="8" fill="none" />
          {/* Inner Circle ring */}
          <circle cx="110" cy="110" r="40"
            stroke="#c8a96e" strokeWidth="5" fill="none" />
          {/* C letterform */}
          <path d="M 145 75 A 48 48 0 1 0 145 145"
            stroke="white" strokeWidth="14" strokeLinecap="round" fill="none" />
          {/* Endpoint dots */}
          <circle cx="145" cy="75"  r="9" fill="#00d4ff" />
          <circle cx="145" cy="145" r="9" fill="#f0cc80" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
