import { notFound } from "next/navigation"
import type { ReactElement } from "react"

import { PlatformDetailClient } from "@/components/marketplace/platform-detail-client"
import { getPlatformBySlug, platforms } from "@/lib/data/platforms"

type Props = {
  params: Promise<{
    item: string
  }>
}

const generateStaticParams = (): Array<{ item: string }> => {
  return platforms.map((platform) => ({
    item: platform.slug,
  }))
}

const PlatformDetailPage = async ({ params }: Props): Promise<ReactElement> => {
  const { item } = await params
  const platform = getPlatformBySlug(item)

  if (!platform) {
    notFound()
  }

  return <PlatformDetailClient platform={platform} />
}

export { generateStaticParams }
export default PlatformDetailPage
