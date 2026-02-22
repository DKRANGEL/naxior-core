'use client'

import {useState, useEffect} from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import {createClient} from '@/lib/supabase'

const empty = {name: '', company: '', email: '', whatsapp: '', notes: ''}

export default function ClientsPage() {
    const [clients, setClients] = useState([])
    const [form, setForm] = useState(empty)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)

    const supabase = createClient()

    useEffect(() => {
        fetchClients()
    }, [])

    async function fetchClients() {
        setLoading(true)
        const {data} = await supabase.from('clients').select('*').order('created_at', {ascending: false})
        setClients(data || [])
        setLoading(false)
    }

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        if (selected) {
            await supabase.from('clients').update(form).eq('id', selected.id)
        } else {
            await supabase.from('clients').insert(form)
        }
        setSaving(false)
        setForm(empty)
        setShowForm(false)
        setSelected(null)
        fetchClients()
    }

    async function handleDelete(id) {
        if (!confirm('Deletar este cliente?')) return
        await supabase.from('clients').delete().eq('id', id)
        fetchClients()
    }

    function handleEdit(client) {
        setSelected(client)
        setForm({
            name: client.name,
            company: client.company || '',
            email: client.email || '',
            whatsapp: client.whatsapp || '',
            notes: client.notes || ''
        })
        setShowForm(true)
    }

    function handleNew() {
        setSelected(null)
        setForm(empty)
        setShowForm(true)
    }

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase())
    )

    const S = styles

    return (
        <>
            <Sidebar/>
            <main style={S.main}>
                <TopBar title="CLIENTES"/>
                <div style={S.content}>

                    {/* Header row */}
                    <div style={S.row}>
                        <input
                            placeholder="Buscar por nome, empresa ou e-mail..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={S.search}
                        />
                        <button onClick={handleNew} style={S.btnPrimary}>+ Novo Cliente</button>
                    </div>

                    {/* Form */}
                    {showForm && (
                        <div style={S.formCard}>
                            <div style={{...S.row, marginBottom: '20px'}}>
                                <span style={S.formTitle}>{selected ? 'Editar Cliente' : 'Novo Cliente'}</span>
                                <button onClick={() => setShowForm(false)} style={S.btnGhost}>✕ Fechar</button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div style={S.grid2}>
                                    <div style={S.field}>
                                        <label style={S.label}>Nome *</label>
                                        <input required style={S.input} value={form.name}
                                               onChange={e => setForm({...form, name: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Empresa</label>
                                        <input style={S.input} value={form.company}
                                               onChange={e => setForm({...form, company: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>E-mail</label>
                                        <input type="email" style={S.input} value={form.email}
                                               onChange={e => setForm({...form, email: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>WhatsApp</label>
                                        <input style={S.input} value={form.whatsapp}
                                               onChange={e => setForm({...form, whatsapp: e.target.value})}/>
                                    </div>
                                </div>
                                <div style={{...S.field, marginTop: '4px'}}>
                                    <label style={S.label}>Notas</label>
                                    <textarea style={{...S.input, minHeight: '80px', resize: 'vertical'}}
                                              value={form.notes}
                                              onChange={e => setForm({...form, notes: e.target.value})}/>
                                </div>
                                <div style={{marginTop: '20px', display: 'flex', gap: '12px'}}>
                                    <button type="submit" style={S.btnPrimary} disabled={saving}>
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} style={S.btnGhost}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Table */}
                    {loading ? (
                        <p style={{color: '#6b6b6b', fontSize: '13px'}}>Carregando...</p>
                    ) : filtered.length === 0 ? (
                        <div style={S.empty}>
                            <p style={{color: '#6b6b6b', fontSize: '14px'}}>
                                {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                            </p>
                        </div>
                    ) : (
                        <div style={S.table}>
                            <div style={S.thead}>
                                <span style={{flex: 2}}>Nome</span>
                                <span style={{flex: 2}}>Empresa</span>
                                <span style={{flex: 2}}>E-mail</span>
                                <span style={{flex: 1}}>WhatsApp</span>
                                <span style={{flex: 1, textAlign: 'right'}}>Ações</span>
                            </div>
                            {filtered.map(c => (
                                <div key={c.id} style={S.trow}>
                                    <span style={{flex: 2, color: '#fff', fontWeight: '500'}}>{c.name}</span>
                                    <span style={{flex: 2, color: '#6b6b6b'}}>{c.company || '—'}</span>
                                    <span style={{flex: 2, color: '#6b6b6b'}}>{c.email || '—'}</span>
                                    <span style={{flex: 1, color: '#6b6b6b'}}>{c.whatsapp || '—'}</span>
                                    <span style={{flex: 1, display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    <button onClick={() => handleEdit(c)} style={S.btnSmall}>Editar</button>
                    <button onClick={() => handleDelete(c.id)}
                            style={{...S.btnSmall, color: '#ff6b6b', borderColor: '#ff6b6b33'}}>Del</button>
                  </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

const styles = {
    main: {flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh'},
    content: {padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px'},
    row: {display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'},
    search: {
        flex: 1,
        background: '#101010',
        border: '1px solid #1f1f1f',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '4px',
        fontSize: '13px',
        outline: 'none',
        maxWidth: '400px'
    },
    btnPrimary: {
        background: '#00D4FF',
        color: '#000',
        fontWeight: '700',
        fontSize: '12px',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap'
    },
    btnGhost: {
        background: 'transparent',
        color: '#6b6b6b',
        fontSize: '12px',
        padding: '10px 16px',
        border: '1px solid #1f1f1f',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    btnSmall: {
        background: 'transparent',
        color: '#6b6b6b',
        fontSize: '11px',
        padding: '4px 10px',
        border: '1px solid #1f1f1f',
        borderRadius: '3px',
        cursor: 'pointer'
    },
    formCard: {background: '#101010', border: '1px solid #1f1f1f', padding: '32px', borderRadius: '4px'},
    formTitle: {color: '#fff', fontSize: '14px', fontWeight: '600'},
    grid2: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'},
    field: {display: 'flex', flexDirection: 'column', gap: '8px'},
    label: {color: '#6b6b6b', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase'},
    input: {
        background: '#080808',
        border: '1px solid #1f1f1f',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        outline: 'none',
        fontFamily: 'inherit'
    },
    table: {background: '#101010', border: '1px solid #1f1f1f', borderRadius: '4px', overflow: 'hidden'},
    thead: {
        display: 'flex',
        padding: '12px 20px',
        borderBottom: '1px solid #1f1f1f',
        fontSize: '11px',
        color: '#3a3a3a',
        letterSpacing: '1px',
        textTransform: 'uppercase'
    },
    trow: {
        display: 'flex',
        padding: '16px 20px',
        borderBottom: '1px solid #1f1f1f',
        fontSize: '13px',
        alignItems: 'center',
        transition: 'background 0.15s'
    },
    empty: {
        background: '#101010',
        border: '1px solid #1f1f1f',
        borderRadius: '4px',
        padding: '48px',
        textAlign: 'center'
    },
}