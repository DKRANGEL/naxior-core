import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
    title: 'Naxior Core',
    description: 'Sistema interno Naxior Tech',
}

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
        <body className={geist.className} style={{ display: 'flex', background: '#080808' }}>
        {children}
        </body>
        </html>
    )
}