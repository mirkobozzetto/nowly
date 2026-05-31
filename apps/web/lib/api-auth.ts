import { NextResponse } from "next/server";

export const requireAuth = (request: Request): NextResponse | null => {
  const secret = process.env.API_SECRET_KEY;
  if (!secret) return null;

  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
};
