import type { Metadata } from "next"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Fiscal Mind — Financial Document Assistant",
  description:
    "Ask questions about indexed action plans, performance reports and budgets and receive grounded, well-formatted responses with citations.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Sans, self-hosted (see globals.css) */}
        <link rel="preload" href="/fonts/GoogleSans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
