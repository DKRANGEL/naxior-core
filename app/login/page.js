'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {createClient} from '@/lib/supabase'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleLogin(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClient()
        const {error} = await supabase.auth.signInWithPassword({email, password})

        if (error) {
            setError('E-mail ou senha incorretos.')
            setLoading(false)
            return
        }

        router.push('/dashboard')
        router.refresh()
    }

    return (
        <div style={{
            width: '100vw', minHeight: '100vh',
            background: '#080808',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                background: '#101010', border: '1px solid #1f1f1f',
                padding: '48px', width: '100%', maxWidth: '400px', borderRadius: '4px'
            }}>
                <div style={{marginBottom: '32px'}}>
                    <h1 style={{color: '#fff', fontSize: '20px', fontWeight: '700', letterSpacing: '2px'}}>
                        NAXIOR <span style={{color: '#00D4FF'}}>CORE</span>
                    </h1>
                    <p style={{color: '#6b6b6b', fontSize: '13px', marginTop: '4px'}}>Sistema interno</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{marginBottom: '16px'}}>
                        <label style={{
                            display: 'block',
                            color: '#6b6b6b',
                            fontSize: '11px',
                            letterSpacing: '1px',
                            marginBottom: '8px'
                        }}>
                            E-MAIL
                        </label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            required autoFocus
                            style={{
                                width: '100%', background: '#080808', border: '1px solid #1f1f1f',
                                color: '#fff', padding: '12px 14px', borderRadius: '4px',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{marginBottom: '24px'}}>
                        <label style={{
                            display: 'block',
                            color: '#6b6b6b',
                            fontSize: '11px',
                            letterSpacing: '1px',
                            marginBottom: '8px'
                        }}>
                            SENHA
                        </label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', background: '#080808', border: '1px solid #1f1f1f',
                                color: '#fff', padding: '12px 14px', borderRadius: '4px',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {error && (
                        <p style={{color: '#ff6b6b', fontSize: '13px', marginBottom: '16px'}}>{error}</p>
                    )}

                    <button type="submit" disabled={loading} style={{
                        width: '100%', background: '#00D4FF', color: '#000',
                        fontWeight: '700', fontSize: '14px', padding: '14px',
                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                        opacity: loading ? 0.6 : 1
                    }}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}