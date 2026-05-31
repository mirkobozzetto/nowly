import { NextResponse } from "next/server";
import { getRegistry } from "@presence/websites";

export const GET = async () => {
  const presences = getRegistry();
  return NextResponse.json(presences);
};
