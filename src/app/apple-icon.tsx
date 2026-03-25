import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #4A7C59, #6B9E7A)",
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 18 18" fill="none">
          <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
