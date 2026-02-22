'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { createClient } from '@/lib/supabase'

const STATUS_LABELS = {
    pending:   { label: 'Pendente',  color: '#f59e0b' },
    paid:      { label: 'Pago',      color: '#22c55e' },
    cancelled: { label: 'Cancelado', color: '#ff6b6b' },
}

const empty = {
    client_id:   '',
    number:      '',
    description: '',
    amount:      '',
    status:      'pending',
    due_date:    '',
}

function formatCurrency(val) {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso) {
    if (!iso) return '—'
    const parts = iso.split('T')[0].split('-')
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0]
    return iso
}

function todayString() {
    const d = new Date()
    return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear()
}

function openInvoicePDF(invoice) {
    window.open('/invoice-print?id=' + invoice.id, '_blank')
}


export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([])
    const [clients, setClients]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [saving, setSaving]     = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm]         = useState(empty)
    const [selected, setSelected] = useState(null)
    const [filter, setFilter]     = useState('all')

    const supabase = createClient()

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        setLoading(true)
        const [inv, cli] = await Promise.all([
            supabase.from('invoices').select('*, clients(name, company, email, cnpj)').order('created_at', { ascending: false }),
            supabase.from('clients').select('id, name, company').order('name'),
        ])
        setInvoices(inv.data || [])
        setClients(cli.data || [])
        setLoading(false)
    }

    function nextNumber() {
        if (invoices.length === 0) return 'NX-001'
        const nums = invoices.map(i => parseInt((i.number || '').replace(/\D/g, '')) || 0)
        return 'NX-' + String(Math.max(...nums) + 1).padStart(3, '0')
    }

    function handleNew() {
        setSelected(null)
        setForm({ ...empty, number: nextNumber() })
        setShowForm(true)
    }

    function handleEdit(inv) {
        setSelected(inv)
        setForm({
            client_id:   inv.client_id   || '',
            number:      inv.number      || '',
            description: inv.description || '',
            amount:      inv.amount      || '',
            status:      inv.status      || 'pending',
            due_date:    inv.due_date    || '',
        })
        setShowForm(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        const payload = {
            ...form,
            amount:    parseFloat(form.amount),
            client_id: form.client_id || null,
            due_date:  form.due_date  || null,
        }
        if (selected) {
            await supabase.from('invoices').update(payload).eq('id', selected.id)
        } else {
            await supabase.from('invoices').insert(payload)
        }
        setSaving(false)
        setShowForm(false)
        setSelected(null)
        setForm(empty)
        fetchAll()
    }

    async function handleDelete(id) {
        if (!confirm('Deletar este invoice?')) return
        await supabase.from('invoices').delete().eq('id', id)
        fetchAll()
    }

    async function handleStatusChange(id, status) {
        const update = { status }
        if (status === 'paid') update.paid_at = new Date().toISOString()
        await supabase.from('invoices').update(update).eq('id', id)
        setInvoices(invoices.map(i => i.id === id ? { ...i, ...update } : i))
    }

    const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

    const totals = {
        pending: invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0),
        paid:    invoices.filter(i => i.status === 'paid').reduce((s, i)    => s + Number(i.amount), 0),
    }

    const S = styles

    return (
        <>
            <Sidebar />
            <main style={S.main}>
                <TopBar title="INVOICES" />
                <div style={S.content}>

                    <div style={S.summaryRow}>
                        <div style={S.summaryCard}>
                            <div style={S.summaryLabel}>A RECEBER</div>
                            <div style={{ ...S.summaryValue, color: '#f59e0b' }}>{formatCurrency(totals.pending)}</div>
                        </div>
                        <div style={S.summaryCard}>
                            <div style={S.summaryLabel}>RECEBIDO</div>
                            <div style={{ ...S.summaryValue, color: '#22c55e' }}>{formatCurrency(totals.paid)}</div>
                        </div>
                        <div style={S.summaryCard}>
                            <div style={S.summaryLabel}>TOTAL DE INVOICES</div>
                            <div style={S.summaryValue}>{invoices.length}</div>
                        </div>
                    </div>

                    <div style={S.row}>
                        <div style={S.tabs}>
                            {[
                                { key: 'all',       label: 'Todos' },
                                { key: 'pending',   label: 'Pendentes' },
                                { key: 'paid',      label: 'Pagos' },
                                { key: 'cancelled', label: 'Cancelados' },
                            ].map(t => (
                                <button key={t.key} onClick={() => setFilter(t.key)} style={{
                                    ...S.tab,
                                    color:        filter === t.key ? '#00D4FF' : '#6b6b6b',
                                    borderBottom: filter === t.key ? '2px solid #00D4FF' : '2px solid transparent',
                                }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleNew} style={S.btnPrimary}>+ Novo Invoice</button>
                    </div>

                    {showForm && (
                        <div style={S.formCard}>
                            <div style={{ ...S.row, marginBottom: '24px' }}>
                                <span style={S.formTitle}>{selected ? 'Editar Invoice' : 'Novo Invoice'}</span>
                                <button onClick={() => setShowForm(false)} style={S.btnGhost}>Fechar</button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div style={S.grid2}>
                                    <div style={S.field}>
                                        <label style={S.label}>Numero *</label>
                                        <input required style={S.input} value={form.number}
                                               onChange={e => setForm({ ...form, number: e.target.value })} />
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Cliente</label>
                                        <select style={S.input} value={form.client_id}
                                                onChange={e => setForm({ ...form, client_id: e.target.value })}>
                                            <option value="">Sem cliente vinculado</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}{c.company ? ' · ' + c.company : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Valor (R$) *</label>
                                        <input required type="number" step="0.01" min="0" style={S.input} value={form.amount}
                                               onChange={e => setForm({ ...form, amount: e.target.value })} />
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Vencimento</label>
                                        <input type="date" style={S.input} value={form.due_date}
                                               onChange={e => setForm({ ...form, due_date: e.target.value })} />
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Status</label>
                                        <select style={S.input} value={form.status}
                                                onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="pending">Pendente</option>
                                            <option value="paid">Pago</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ ...S.field, marginTop: '4px' }}>
                                    <label style={S.label}>Descricao do servico *</label>
                                    <textarea required style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
                                              value={form.description}
                                              onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                                    <button type="submit" style={S.btnPrimary} disabled={saving}>
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} style={S.btnGhost}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <p style={{ color: '#6b6b6b', fontSize: '13px' }}>Carregando...</p>
                    ) : filtered.length === 0 ? (
                        <div style={S.empty}>
                            <p style={{ color: '#6b6b6b', fontSize: '14px' }}>Nenhum invoice encontrado.</p>
                        </div>
                    ) : (
                        <div style={S.table}>
                            <div style={S.thead}>
                                <span style={{ width: '100px' }}>Numero</span>
                                <span style={{ flex: 2 }}>Cliente</span>
                                <span style={{ flex: 3 }}>Descricao</span>
                                <span style={{ width: '130px' }}>Valor</span>
                                <span style={{ width: '100px' }}>Venc.</span>
                                <span style={{ width: '110px' }}>Status</span>
                                <span style={{ width: '130px', textAlign: 'right' }}>Acoes</span>
                            </div>
                            {filtered.map(inv => {
                                const st     = STATUS_LABELS[inv.status] || STATUS_LABELS.pending
                                const client = inv.clients
                                return (
                                    <div key={inv.id} style={S.trow}>
                    <span style={{ width: '100px', color: '#00D4FF', fontWeight: '600', fontSize: '12px' }}>
                      {inv.number}
                    </span>
                                        <span style={{ flex: 2, color: '#fff' }}>
                      {client ? client.name : <span style={{ color: '#3a3a3a' }}>sem cliente</span>}
                    </span>
                                        <span style={{ flex: 3, color: '#6b6b6b', fontSize: '12px' }}>
                      {inv.description ? inv.description.slice(0, 55) + (inv.description.length > 55 ? '...' : '') : '—'}
                    </span>
                                        <span style={{ width: '130px', color: '#fff', fontWeight: '500' }}>
                      {formatCurrency(inv.amount)}
                    </span>
                                        <span style={{ width: '100px', color: '#6b6b6b', fontSize: '12px' }}>
                      {formatDate(inv.due_date)}
                    </span>
                                        <span style={{ width: '110px' }}>
                      <select
                          value={inv.status}
                          onChange={e => handleStatusChange(inv.id, e.target.value)}
                          style={{
                              background:   st.color + '10',
                              border:       '1px solid ' + st.color + '33',
                              color:        st.color,
                              padding:      '3px 8px',
                              borderRadius: '4px',
                              fontSize:     '11px',
                              cursor:       'pointer',
                              outline:      'none',
                          }}
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </span>
                                        <span style={{ width: '130px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openInvoicePDF(inv)} style={{ ...S.btnSmall, color: '#00D4FF', borderColor: '#00D4FF33' }}>
                        PDF
                      </button>
                      <button onClick={() => handleEdit(inv)} style={S.btnSmall}>Editar</button>
                      <button onClick={() => handleDelete(inv.id)} style={{ ...S.btnSmall, color: '#ff6b6b', borderColor: '#ff6b6b33' }}>
                        Del
                      </button>
                    </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

const styles = {
    main:         { flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    content:      { padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
    row:          { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
    summaryRow:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' },
    summaryCard:  { background: '#101010', border: '1px solid #1f1f1f', padding: '24px 28px' },
    summaryLabel: { fontSize: '10px', letterSpacing: '2px', color: '#3a3a3a', textTransform: 'uppercase', marginBottom: '8px' },
    summaryValue: { fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-1px' },
    tabs:         { display: 'flex', borderBottom: '1px solid #1f1f1f' },
    tab:          { background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer', fontSize: '13px' },
    btnPrimary:   { background: '#00D4FF', color: '#000', fontWeight: '700', fontSize: '12px', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' },
    btnGhost:     { background: 'transparent', color: '#6b6b6b', fontSize: '12px', padding: '10px 16px', border: '1px solid #1f1f1f', borderRadius: '4px', cursor: 'pointer' },
    btnSmall:     { background: 'transparent', color: '#6b6b6b', fontSize: '11px', padding: '4px 8px', border: '1px solid #1f1f1f', borderRadius: '3px', cursor: 'pointer' },
    formCard:     { background: '#101010', border: '1px solid #1f1f1f', padding: '32px', borderRadius: '4px' },
    formTitle:    { color: '#fff', fontSize: '14px', fontWeight: '600' },
    grid2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    field:        { display: 'flex', flexDirection: 'column', gap: '8px' },
    label:        { color: '#6b6b6b', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' },
    input:        { background: '#080808', border: '1px solid #1f1f1f', color: '#fff', padding: '10px 12px', borderRadius: '4px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' },
    table:        { background: '#101010', border: '1px solid #1f1f1f', borderRadius: '4px', overflow: 'hidden' },
    thead:        { display: 'flex', padding: '12px 20px', borderBottom: '1px solid #1f1f1f', fontSize: '10px', color: '#3a3a3a', letterSpacing: '1px', textTransform: 'uppercase', gap: '12px' },
    trow:         { display: 'flex', padding: '16px 20px', borderBottom: '1px solid #0d0d0d', fontSize: '13px', alignItems: 'center', gap: '12px' },
    empty:        { background: '#101010', border: '1px solid #1f1f1f', borderRadius: '4px', padding: '48px', textAlign: 'center' },
}