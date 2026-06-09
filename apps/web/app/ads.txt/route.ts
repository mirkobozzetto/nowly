import { NextResponse } from "next/server";

export const GET = () => {
  return new NextResponse("google.com, pub-6330177306711077, DIRECT, f08c47fec0942fa0\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};