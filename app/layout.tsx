import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans';
import './globals.css'

export const metadata: Metadata = {
    title: 'Time Break',
    description: ''
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={GeistSans.className}>
            <body className={GeistSans.className}>{children}</body>
        </html>
    )
}
