import { notFound } from "next/navigation"
import type { ReactElement } from "react"

import { PlatformDetailClient } from "@/components/marketplace/platform-detail-client"
import { getRegistry, getPresence } from "@presence/websites"
import { metadataToPlatform } from "@/lib/data/presence-adapter"

type Props = {
  params: Promise<{
    item: string
  }>
}

const generateStaticParams = () => {
  const registry = getRegistry()
  return registry.map((m) => ({
    item: m.slug,
  }))
}

const PlatformDetailPage = async ({ params }: Props): Promise<ReactElement> => {
  const { item } = await params
  const metadata = getPresence(item)
  const platform = metadata ? metadataToPlatform(metadata) : undefined

  if (!platform) {
    notFound()
  }

  return <PlatformDetailClient platform={platform} />
}

export { generateStaticParams }
export default PlatformDetailPage
