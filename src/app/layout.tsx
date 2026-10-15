import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Providers } from "./providers"
import "./globals.css"

const fontSans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-sans", display: "swap" })

export const metadata: Metadata = {
  title: "PFMNext Finance AI - Financial Document Assistant",
  description:
    "Ask questions about indexed action plans, performance reports and budgets and receive grounded, well-formatted responses with citations.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
