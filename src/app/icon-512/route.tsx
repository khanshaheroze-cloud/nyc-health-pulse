import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "linear-gradient(135deg, #4A7C59, #6B9E7A)",
          borderRadius: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="280" height="280" viewBox="0 0 18 18" fill="none">
          <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95"/>
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
