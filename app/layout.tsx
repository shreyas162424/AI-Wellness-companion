import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _inter = Inter({ subsets: ["latin"] })
const _poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] })

export const metadata: Metadata = {
  title: "Smart Health Companion",
  description: "AI-powered fatigue and stress detection with wellness insights",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          type="module"
          src="https://interfaces.zapier.com/assets/web-components/zapier-interfaces/zapier-interfaces.esm.js"
        ></script>
      </head>
      <body className={`font-sans antialiased ${_inter.className} ${_poppins.className}`}>
        {children}
        <zapier-interfaces-chatbot-embed
          is-popup="true"
          chatbot-id="cmhnt8p010029g1vqpdlhy7fy"
        ></zapier-interfaces-chatbot-embed>
        <Analytics />
      </body>
    </html>
  )
}
