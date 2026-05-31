import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import type { ReactElement, ReactNode } from "react"

import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { routing } from "@/i18n/routing"

type Props = Readonly<{
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}>

const generateStaticParams = (): Array<{ locale: string }> => {
  return routing.locales.map((locale) => ({ locale }))
}

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Meta" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

const LocaleLayout = async ({ children, params }: Props): Promise<ReactElement> => {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar />
      {children}
      <Footer />
    </NextIntlClientProvider>
  )
}

export { generateMetadata, generateStaticParams }
export default LocaleLayout
