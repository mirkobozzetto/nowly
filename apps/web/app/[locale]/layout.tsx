import { ThemeProvider } from "@/components/theme-provider"
import { routing } from "@/i18n/routing"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { FC, PropsWithChildren } from "react"

type Props = PropsWithChildren & {
  params: Promise<{
    locale: string
  }>
}

const LocaleLayout: FC<Props> = async ({ children, params }) => {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>{children}</ThemeProvider>
    </NextIntlClientProvider>
  )
}

export default LocaleLayout

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}