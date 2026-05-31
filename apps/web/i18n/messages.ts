import { routing } from "@/i18n/routing"

export const getMessagesForLocale = async (locale: string) => {
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale

  return (await import(`../locales/messages/${safeLocale}.json`)).default
}