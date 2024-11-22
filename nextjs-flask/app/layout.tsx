import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Better Veterinary Care Starts Here | VET AI',
  description: 'Leveraging technology for better pet outcomes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="{inter.className} bg-[#fcfaf5]"
      >{children}</body>
    </html>
  )
}
