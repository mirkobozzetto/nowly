import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Geist_Mono, Inter } from "next/font/google"
import { FC, PropsWithChildren } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <html
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout