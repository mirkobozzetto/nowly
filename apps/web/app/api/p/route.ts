import { NextResponse } from "next/server";
import { getRegistry } from "@nowly/websites";

export const GET = async () => {
  const presences = getRegistry();
  return NextResponse.json(presences);
};
