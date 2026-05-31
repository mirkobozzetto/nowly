import { NextResponse } from "next/server"
import { getRegistry } from "@presence/websites"

export async function GET() {
  const presences = getRegistry()
  return NextResponse.json(presences)
}
