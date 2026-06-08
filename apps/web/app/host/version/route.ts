import { HOST_VERSION } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "edge";

export const GET = (): NextResponse => {
  return NextResponse.json({ version: HOST_VERSION });
};
