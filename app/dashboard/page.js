'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { createClient } from '@/lib/supabase'

function formatCurrency(val) {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso) {
    if (!iso) return '—'
    const parts = iso.split('T')[0].split('-')
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0]
    return iso
}

export default function DashboardPage() {
    const [data, setData]       = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        setLoading(true)
        const [clients, invoices, leads] = await Promise.all([
            supabase.from('clients').select('id, name, company, created_at'),
            supabase.from('invoices').select('id, number, amount, status, due_date, client_id, clients(name)').order('created_at', { ascending: false }),
            supabase.from('leads').select('id, name, company, status, problem_type, created_at').order('created_at', { ascending: false }),
        ])

        const inv = invoices.data || []
        const lds = leads.data    || []
        const cli = clients.data  || []

        setData({
            totalClients:   cli.length,
            totalInvoices:  inv.length,
            pendingAmount:  inv.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0),
            paidAmount:     inv.filter(i => i.status === 'paid').reduce((s, i)    => s + Number(i.amount), 0),
            newLeads:       lds.filter(l => l.status === 'new').length,
            recentInvoices: inv.slice(0, 5),
            recentLeads:    lds.filter(l => l.status === 'new').slice(0, 5),
        })
        setLoading(false)
    }

    const S = styles

    if (loading) return (
        <>
            <Sidebar />
            <main style={S.main}>
                <TopBar title="DASHBOARD" />
                <div style={S.content}>
                    <p style={{ color: '#6b6b6b', fontSize: '13px' }}>Carregando...</p>
                </div>
            </main>
        </>
    )

    const STATUS = {
        pending:   { label: 'Pendente',  color: '#f59e0b' },
        paid:      { label: 'Pago',      color: '#22c55e' },
        cancelled: { label: 'Cancelado', color: '#ff6b6b' },
    }

    const LEAD_STATUS = {
        new:       { label: 'Novo',       color: '#00D4FF' },
        contacted: { label: 'Contatado',  color: '#f59e0b' },
        converted: { label: 'Convertido', color: '#22c55e' },
        lost:      { label: 'Perdido',    color: '#ff6b6b' },
    }

    return (
        <>
            <Sidebar />
            <main style={S.main}>
                <TopBar title="DASHBOARD" />
                <div style={S.content}>

                    {/* KPI cards */}
                    <div style={S.kpiRow}>
                        <div style={S.kpiCard}>
                            <div style={S.kpiLabel}>A RECEBER</div>
                            <div style={{ ...S.kpiValue, color: '#f59e0b' }}>{formatCurrency(data.pendingAmount)}</div>
                            <div style={S.kpiSub}>invoices pendentes</div>
                        </div>
                        <div style={S.kpiCard}>
                            <div style={S.kpiLabel}>RECEBIDO</div>
                            <div style={{ ...S.kpiValue, color: '#22c55e' }}>{formatCurrency(data.paidAmount)}</div>
                            <div style={S.kpiSub}>total recebido</div>
                        </div>
                        <div style={S.kpiCard}>
                            <div style={S.kpiLabel}>CLIENTES</div>
                            <div style={S.kpiValue}>{data.totalClients}</div>
                            <div style={S.kpiSub}>cadastrados</div>
                        </div>
                        <div style={S.kpiCard}>
                            <div style={S.kpiLabel}>LEADS NOVOS</div>
                            <div style={{ ...S.kpiValue, color: '#00D4FF' }}>{data.newLeads}</div>
                            <div style={S.kpiSub}>aguardando contato</div>
                        </div>
                    </div>

                    {/* Two columns */}
                    <div style={S.cols}>

                        {/* Recent invoices */}
                        <div style={S.panel}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>INVOICES RECENTES</span>
                                <button onClick={() => router.push('/invoices')} style={S.btnLink}>Ver todos →</button>
                            </div>
                            {data.recentInvoices.length === 0 ? (
                                <p style={S.empty}>Nenhum invoice ainda.</p>
                            ) : (
                                <div style={S.list}>
                                    {data.recentInvoices.map(inv => {
                                        const st = STATUS[inv.status] || STATUS.pending
                                        return (
                                            <div key={inv.id} style={S.listRow}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={S.listPrimary}>{inv.clients ? inv.clients.name : <span style={{ color: '#3a3a3a' }}>Sem cliente</span>}</div>
                                                    <div style={S.listSub}>#{inv.number} · vence {formatDate(inv.due_date)}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{formatCurrency(inv.amount)}</div>
                                                    <div style={{ color: st.color, fontSize: '11px', marginTop: '2px' }}>{st.label}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* New leads */}
                        <div style={S.panel}>
                            <div style={S.panelHeader}>
                                <span style={S.panelTitle}>LEADS NOVOS</span>
                                <button onClick={() => router.push('/leads')} style={S.btnLink}>Ver todos →</button>
                            </div>
                            {data.recentLeads.length === 0 ? (
                                <p style={S.empty}>Nenhum lead novo.</p>
                            ) : (
                                <div style={S.list}>
                                    {data.recentLeads.map(lead => {
                                        const TYPE_ICONS = { 'Automacao': '⚡', 'Integracao': '🔗', 'Ferramenta sob medida': '🛠️' }
                                        return (
                                            <div key={lead.id} style={S.listRow}>
                                                <span style={{ fontSize: '18px', marginRight: '4px' }}>{TYPE_ICONS[lead.problem_type] || '📋'}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={S.listPrimary}>{lead.name || 'Sem nome'}</div>
                                                    <div style={S.listSub}>{lead.company || lead.problem_type || '—'} · {formatDate(lead.created_at)}</div>
                                                </div>
                                                <div style={{ color: '#00D4FF', fontSize: '11px', background: '#00D4FF10', border: '1px solid #00D4FF33', padding: '2px 8px', borderRadius: '100px' }}>
                                                    Novo
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Quick actions */}
                    <div style={S.panel}>
                        <div style={S.panelHeader}>
                            <span style={S.panelTitle}>AÇÕES RÁPIDAS</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', padding: '16px 20px' }}>
                            <button onClick={() => router.push('/invoices')} style={S.btnAction}>
                                <span style={{ fontSize: '18px' }}>📄</span>
                                <span>Novo Invoice</span>
                            </button>
                            <button onClick={() => router.push('/clients')} style={S.btnAction}>
                                <span style={{ fontSize: '18px' }}>👤</span>
                                <span>Novo Cliente</span>
                            </button>
                            <button onClick={() => router.push('/leads')} style={S.btnAction}>
                                <span style={{ fontSize: '18px' }}>📥</span>
                                <span>Ver Leads</span>
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </>
    )
}

const styles = {
    main:        { flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    content:     { padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
    kpiRow:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' },
    kpiCard:     { background: '#101010', border: '1px solid #1f1f1f', padding: '28px' },
    kpiLabel:    { fontSize: '10px', letterSpacing: '2px', color: '#3a3a3a', textTransform: 'uppercase', marginBottom: '12px' },
    kpiValue:    { fontSize: '32px', fontWeight: '700', color: '#fff', letterSpacing: '-1px', lineHeight: 1 },
    kpiSub:      { fontSize: '11px', color: '#3a3a3a', marginTop: '8px' },
    cols:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' },
    panel:       { background: '#101010', border: '1px solid #1f1f1f' },
    panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1f1f1f' },
    panelTitle:  { fontSize: '10px', letterSpacing: '2px', color: '#3a3a3a', textTransform: 'uppercase' },
    btnLink:     { background: 'transparent', border: 'none', color: '#00D4FF', fontSize: '11px', cursor: 'pointer', padding: 0 },
    list:        { display: 'flex', flexDirection: 'column' },
    listRow:     { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #0d0d0d' },
    listPrimary: { color: '#fff', fontSize: '13px', fontWeight: '500' },
    listSub:     { color: '#3a3a3a', fontSize: '11px', marginTop: '2px' },
    empty:       { color: '#3a3a3a', fontSize: '13px', padding: '24px 20px' },
    btnAction:   { display: 'flex', alignItems: 'center', gap: '8px', background: '#080808', border: '1px solid #1f1f1f', color: '#6b6b6b', fontSize: '12px', padding: '12px 20px', borderRadius: '4px', cursor: 'pointer' },
}