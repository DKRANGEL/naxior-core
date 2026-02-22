'use client'

import {useState, useEffect} from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import {createClient} from '@/lib/supabase'

const STATUS_LABELS = {
    new: {label: 'Novo', color: '#00D4FF'},
    contacted: {label: 'Contatado', color: '#f59e0b'},
    converted: {label: 'Convertido', color: '#22c55e'},
    lost: {label: 'Perdido', color: '#ff6b6b'},
}

const TYPE_ICONS = {
    'Automacao': '⚡',
    'Integracao': '🔗',
    'Ferramenta sob medida': '🛠️',
}

function waLink(whatsapp, name) {
    const num = whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent('Ola ' + name + ', vi seu contato pelo site da Naxior Tech.')
    return 'https://wa.me/55' + num + '?text=' + msg
}

export default function LeadsPage() {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [expanded, setExpanded] = useState(null)

    const supabase = createClient()

    useEffect(() => {
        fetchLeads()
    }, [])

    async function fetchLeads() {
        setLoading(true)
        const {data} = await supabase
            .from('leads')
            .select('*')
            .order('created_at', {ascending: false})
        setLeads(data || [])
        setLoading(false)
    }

    async function updateStatus(id, status) {
        await supabase.from('leads').update({status}).eq('id', id)
        setLeads(leads.map(l => l.id === id ? {...l, status} : l))
    }

    async function handleDelete(id) {
        if (!confirm('Deletar este lead?')) return
        await supabase.from('leads').delete().eq('id', id)
        setLeads(leads.filter(l => l.id !== id))
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})
    }

    const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)

    const counts = {
        all: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        converted: leads.filter(l => l.status === 'converted').length,
        lost: leads.filter(l => l.status === 'lost').length,
    }

    const S = styles

    return (
        <>
            <Sidebar/>
            <main style={S.main}>
                <TopBar title="LEADS"/>
                <div style={S.content}>

                    <div style={S.tabs}>
                        {[
                            {key: 'all', label: 'Todos'},
                            {key: 'new', label: 'Novos'},
                            {key: 'contacted', label: 'Contatados'},
                            {key: 'converted', label: 'Convertidos'},
                            {key: 'lost', label: 'Perdidos'},
                        ].map(t => (
                            <button key={t.key} onClick={() => setFilter(t.key)} style={{
                                ...S.tab,
                                color: filter === t.key ? '#00D4FF' : '#6b6b6b',
                                borderBottom: filter === t.key ? '2px solid #00D4FF' : '2px solid transparent',
                            }}>
                                {t.label}
                                <span style={S.count}>{counts[t.key]}</span>
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <p style={{color: '#6b6b6b', fontSize: '13px'}}>Carregando...</p>
                    ) : filtered.length === 0 ? (
                        <div style={S.empty}>
                            <p style={{color: '#6b6b6b', fontSize: '14px'}}>Nenhum lead encontrado.</p>
                            <p style={{color: '#3a3a3a', fontSize: '12px', marginTop: '8px'}}>
                                Os leads aparecem aqui quando alguem preencher o formulario da landing page.
                            </p>
                        </div>
                    ) : (
                        <div style={S.list}>
                            {filtered.map(lead => {
                                const st = STATUS_LABELS[lead.status] || STATUS_LABELS.new
                                const isOpen = expanded === lead.id
                                return (
                                    <div key={lead.id} style={S.card}>

                                        <div style={S.cardHeader} onClick={() => setExpanded(isOpen ? null : lead.id)}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1}}>
                        <span style={{fontSize: '20px'}}>
                          {TYPE_ICONS[lead.problem_type] || '📋'}
                        </span>
                                                <div>
                                                    <div style={{color: '#fff', fontWeight: '600', fontSize: '14px'}}>
                                                        {lead.name || 'Sem nome'}
                                                        {lead.company && (
                                                            <span style={{
                                                                color: '#6b6b6b',
                                                                fontWeight: '400'
                                                            }}> · {lead.company}</span>
                                                        )}
                                                    </div>
                                                    <div style={{color: '#3a3a3a', fontSize: '12px', marginTop: '2px'}}>
                                                        {lead.problem_type || 'Sem tipo'} · {formatDate(lead.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <span style={{
                            ...S.badge,
                            color: st.color,
                            borderColor: st.color + '33',
                            background: st.color + '10',
                        }}>
                          {st.label}
                        </span>
                                                <span style={{
                                                    color: '#3a3a3a',
                                                    fontSize: '12px'
                                                }}>{isOpen ? '▲' : '▼'}</span>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div style={S.cardBody}>
                                                <div style={S.grid2}>
                                                    <div>
                                                        <div style={S.detailLabel}>E-mail</div>
                                                        <div style={S.detailValue}>{lead.email || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={S.detailLabel}>WhatsApp</div>
                                                        <div style={S.detailValue}>{lead.whatsapp || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={S.detailLabel}>Prazo</div>
                                                        <div style={S.detailValue}>{lead.deadline || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={S.detailLabel}>Tipo</div>
                                                        <div style={S.detailValue}>{lead.problem_type || '—'}</div>
                                                    </div>
                                                </div>

                                                {lead.description && (
                                                    <div style={{marginTop: '16px'}}>
                                                        <div style={S.detailLabel}>Descricao do problema</div>
                                                        <div style={{
                                                            ...S.detailValue,
                                                            color: '#9b9b9b',
                                                            lineHeight: '1.6',
                                                            marginTop: '6px'
                                                        }}>
                                                            {lead.description}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{
                                                    marginTop: '20px',
                                                    display: 'flex',
                                                    gap: '8px',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center'
                                                }}>
                          <span style={{color: '#3a3a3a', fontSize: '11px', letterSpacing: '1px', marginRight: '4px'}}>
                            STATUS:
                          </span>
                                                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                                                        <button key={key} onClick={() => updateStatus(lead.id, key)}
                                                                style={{
                                                                    ...S.btnStatus,
                                                                    color: lead.status === key ? val.color : '#6b6b6b',
                                                                    borderColor: lead.status === key ? val.color + '66' : '#1f1f1f',
                                                                    background: lead.status === key ? val.color + '10' : 'transparent',
                                                                }}>
                                                            {val.label}
                                                        </button>
                                                    ))}
                                                    <div style={{flex: 1}}/>
                                                    {lead.whatsapp && (
                                                        <a
                                                            href={waLink(lead.whatsapp, lead.name || '')}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{
                                                                ...S.btnStatus,
                                                                color: '#22c55e',
                                                                borderColor: '#22c55e33',
                                                                textDecoration: 'none'
                                                            }}
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                    {lead.email && (
                                                        <a
                                                            href={'mailto:' + lead.email}
                                                            style={{
                                                                ...S.btnStatus,
                                                                color: '#00D4FF',
                                                                borderColor: '#00D4FF33',
                                                                textDecoration: 'none'
                                                            }}
                                                        >
                                                            E-mail
                                                        </a>
                                                    )}
                                                    <button onClick={() => handleDelete(lead.id)} style={{
                                                        ...S.btnStatus,
                                                        color: '#ff6b6b',
                                                        borderColor: '#ff6b6b33'
                                                    }}>
                                                        Deletar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
    main: {flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh'},
    content: {padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px'},
    tabs: {display: 'flex', borderBottom: '1px solid #1f1f1f'},
    tab: {
        background: 'transparent',
        border: 'none',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    count: {background: '#1f1f1f', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', color: '#6b6b6b'},
    list: {display: 'flex', flexDirection: 'column', gap: '2px'},
    card: {background: '#101010', border: '1px solid #1f1f1f', borderRadius: '4px', overflow: 'hidden'},
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        cursor: 'pointer'
    },
    cardBody: {padding: '0 24px 24px', borderTop: '1px solid #1f1f1f'},
    badge: {fontSize: '11px', letterSpacing: '1px', padding: '3px 10px', borderRadius: '100px', border: '1px solid'},
    grid2: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px'},
    detailLabel: {
        fontSize: '10px',
        letterSpacing: '1.5px',
        color: '#3a3a3a',
        textTransform: 'uppercase',
        marginBottom: '4px'
    },
    detailValue: {fontSize: '13px', color: '#fff'},
    btnStatus: {
        background: 'transparent',
        border: '1px solid #1f1f1f',
        borderRadius: '4px',
        padding: '6px 12px',
        fontSize: '11px',
        cursor: 'pointer',
        letterSpacing: '0.5px'
    },
    empty: {
        background: '#101010',
        border: '1px solid #1f1f1f',
        borderRadius: '4px',
        padding: '64px',
        textAlign: 'center'
    },
}