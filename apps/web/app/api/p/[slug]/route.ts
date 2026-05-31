import { NextResponse } from "next/server"
import { getPresence } from "@presence/websites"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const presence = getPresence(slug)

  if (!presence) {
    return NextResponse.json({ error: "Presence not found" }, { status: 404 })
  }

  return NextResponse.json(presence)
}
