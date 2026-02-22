'use client'

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {createClient} from '@/lib/supabase'

const links = [
    {href: '/dashboard', label: 'Dashboard', icon: '▦'},
    {href: '/clients', label: 'Clientes', icon: '◈'},
    {href: '/invoices', label: 'Invoices', icon: '◎'},
    {href: '/leads', label: 'Leads', icon: '◉'},
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <aside style={{
            width: '220px', minHeight: '100vh',
            background: '#101010', borderRight: '1px solid #1f1f1f',
            display: 'flex', flexDirection: 'column',
            padding: '32px 0', flexShrink: 0
        }}>
            {/* Logo */}
            <div style={{padding: '0 24px 32px', borderBottom: '1px solid #1f1f1f'}}>
                <div style={{fontSize: '16px', fontWeight: '700', letterSpacing: '2px', color: '#fff'}}>
                    NAXIOR <span style={{color: '#00D4FF'}}>CORE</span>
                </div>
                <div style={{fontSize: '10px', color: '#6b6b6b', letterSpacing: '2px', marginTop: '2px'}}>
                    SISTEMA INTERNO
                </div>
            </div>

            {/* Links */}
            <nav style={{flex: 1, padding: '24px 0'}}>
                {links.map(link => {
                    const active = pathname === link.href
                    return (
                        <Link key={link.href} href={link.href} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 24px', textDecoration: 'none',
                            color: active ? '#00D4FF' : '#6b6b6b',
                            background: active ? 'rgba(0,212,255,0.06)' : 'transparent',
                            borderLeft: active ? '2px solid #00D4FF' : '2px solid transparent',
                            fontSize: '13px', fontWeight: active ? '600' : '400',
                            transition: 'all 0.2s'
                        }}>
                            <span style={{fontSize: '16px'}}>{link.icon}</span>
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div style={{padding: '24px', borderTop: '1px solid #1f1f1f'}}>
                <button onClick={handleLogout} style={{
                    width: '100%', background: 'transparent',
                    border: '1px solid #1f1f1f', color: '#6b6b6b',
                    padding: '10px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '12px', letterSpacing: '1px'
                }}>
                    SAIR
                </button>
            </div>
        </aside>
    )
}