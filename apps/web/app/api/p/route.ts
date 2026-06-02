import { NextResponse } from "next/server";
import { presenceApi } from "@/lib/presence-api";

export const GET = async () => {
  const presences = await presenceApi.get("/");
  return NextResponse.json(presences ?? []);
};
