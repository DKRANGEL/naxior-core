'use client'

import {useState, useEffect} from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import {createClient} from '@/lib/supabase'

const empty = {
    name: '', company: '', email: '', whatsapp: '', cnpj: '', notes: '',
    tipo_pessoa: 'PJ', cpf: '', inscricao_municipal: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', municipio: '', codigo_municipio_ibge: '', uf: '',
}

// Mantem apenas as chaves de `empty`, para nao mandar colunas estranhas ao update.
function toForm(client) {
    const out = {}
    for (const key of Object.keys(empty)) {
        out[key] = client[key] ?? empty[key]
    }
    return out
}

export default function ClientsPage() {
    const [clients, setClients] = useState([])
    const [form, setForm] = useState(empty)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)
    const [lookup, setLookup] = useState({busy: false, msg: ''})

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
        setForm(toForm(client))
        setLookup({busy: false, msg: ''})
        setShowForm(true)
    }

    function handleNew() {
        setSelected(null)
        setForm(empty)
        setLookup({busy: false, msg: ''})
        setShowForm(true)
    }

    // Preenche endereco e codigo IBGE a partir do CNPJ (BrasilAPI).
    async function buscarPorCnpj() {
        const digits = (form.cnpj || '').replace(/\D/g, '')
        if (digits.length !== 14) {
            setLookup({busy: false, msg: 'Informe um CNPJ com 14 digitos.'})
            return
        }
        setLookup({busy: true, msg: ''})
        try {
            const res = await fetch('/api/lookup?cnpj=' + digits)
            const data = await res.json()
            if (!res.ok) {
                setLookup({busy: false, msg: data.error || 'Nao foi possivel consultar.'})
                return
            }
            setForm(prev => ({
                ...prev,
                tipo_pessoa: 'PJ',
                cnpj: digits,
                company: data.company || prev.company,
                name: prev.name || data.name || '',
                email: prev.email || data.email || '',
                cep: data.cep || prev.cep,
                logradouro: data.logradouro || prev.logradouro,
                numero: data.numero || prev.numero,
                complemento: data.complemento || prev.complemento,
                bairro: data.bairro || prev.bairro,
                municipio: data.municipio || prev.municipio,
                uf: data.uf || prev.uf,
                codigo_municipio_ibge: data.codigo_municipio_ibge || prev.codigo_municipio_ibge,
            }))
            const faltaIbge = !data.codigo_municipio_ibge
            setLookup({
                busy: false,
                msg: faltaIbge
                    ? 'Dados preenchidos, mas o codigo IBGE nao veio. Confira o CEP e busque por ele.'
                    : 'Dados preenchidos a partir do CNPJ.',
            })
        } catch {
            setLookup({busy: false, msg: 'Falha na consulta.'})
        }
    }

    // Busca so pelo CEP: usado para PF e para corrigir o codigo IBGE.
    async function buscarPorCep() {
        const digits = (form.cep || '').replace(/\D/g, '')
        if (digits.length !== 8) {
            setLookup({busy: false, msg: 'Informe um CEP com 8 digitos.'})
            return
        }
        setLookup({busy: true, msg: ''})
        try {
            const res = await fetch('/api/lookup?cep=' + digits)
            const data = await res.json()
            if (!res.ok) {
                setLookup({busy: false, msg: data.error || 'CEP nao encontrado.'})
                return
            }
            setForm(prev => ({
                ...prev,
                cep: data.cep,
                logradouro: data.logradouro || prev.logradouro,
                bairro: data.bairro || prev.bairro,
                municipio: data.municipio || prev.municipio,
                uf: data.uf || prev.uf,
                codigo_municipio_ibge: data.codigo_municipio_ibge || prev.codigo_municipio_ibge,
            }))
            setLookup({busy: false, msg: 'Endereco preenchido a partir do CEP.'})
        } catch {
            setLookup({busy: false, msg: 'Falha na consulta.'})
        }
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

                    <div style={S.row}>
                        <input
                            placeholder="Buscar por nome, empresa ou e-mail..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={S.search}
                        />
                        <button onClick={handleNew} style={S.btnPrimary}>+ Novo Cliente</button>
                    </div>

                    {showForm && (
                        <div style={S.formCard}>
                            <div style={{...S.row, marginBottom: '20px'}}>
                                <span style={S.formTitle}>{selected ? 'Editar Cliente' : 'Novo Cliente'}</span>
                                <button onClick={() => setShowForm(false)} style={S.btnGhost}>Fechar</button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div style={S.grid2}>
                                    <div style={S.field}>
                                        <label style={S.label}>Tipo</label>
                                        <select style={S.input} value={form.tipo_pessoa}
                                                onChange={e => setForm({...form, tipo_pessoa: e.target.value})}>
                                            <option value="PJ">Pessoa Juridica</option>
                                            <option value="PF">Pessoa Fisica</option>
                                        </select>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Nome *</label>
                                        <input required style={S.input} value={form.name}
                                               onChange={e => setForm({...form, name: e.target.value})}/>
                                    </div>

                                    {form.tipo_pessoa === 'PJ' ? (
                                        <>
                                            <div style={S.field}>
                                                <label style={S.label}>CNPJ</label>
                                                <div style={{display: 'flex', gap: '8px'}}>
                                                    <input style={{...S.input, flex: 1}} value={form.cnpj}
                                                           placeholder="00.000.000/0000-00"
                                                           onChange={e => setForm({...form, cnpj: e.target.value})}/>
                                                    <button type="button" onClick={buscarPorCnpj}
                                                            disabled={lookup.busy} style={S.btnGhost}>
                                                        {lookup.busy ? '...' : 'Buscar'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={S.field}>
                                                <label style={S.label}>Empresa</label>
                                                <input style={S.input} value={form.company}
                                                       onChange={e => setForm({...form, company: e.target.value})}/>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={S.field}>
                                            <label style={S.label}>CPF</label>
                                            <input style={S.input} value={form.cpf} placeholder="000.000.000-00"
                                                   onChange={e => setForm({...form, cpf: e.target.value})}/>
                                        </div>
                                    )}

                                    <div style={S.field}>
                                        <label style={S.label}>Inscricao Municipal</label>
                                        <input style={S.input} value={form.inscricao_municipal}
                                               onChange={e => setForm({
                                                   ...form,
                                                   inscricao_municipal: e.target.value
                                               })}/>
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

                                {lookup.msg && (
                                    <p style={S.lookupMsg}>{lookup.msg}</p>
                                )}

                                <div style={S.sectionTitle}>Endereco (obrigatorio para NFS-e)</div>

                                <div style={S.grid2}>
                                    <div style={S.field}>
                                        <label style={S.label}>CEP</label>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <input style={{...S.input, flex: 1}} value={form.cep}
                                                   placeholder="00000-000"
                                                   onChange={e => setForm({...form, cep: e.target.value})}/>
                                            <button type="button" onClick={buscarPorCep}
                                                    disabled={lookup.busy} style={S.btnGhost}>
                                                {lookup.busy ? '...' : 'Buscar'}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Logradouro</label>
                                        <input style={S.input} value={form.logradouro}
                                               onChange={e => setForm({...form, logradouro: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Numero</label>
                                        <input style={S.input} value={form.numero}
                                               onChange={e => setForm({...form, numero: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Complemento</label>
                                        <input style={S.input} value={form.complemento}
                                               onChange={e => setForm({...form, complemento: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Bairro</label>
                                        <input style={S.input} value={form.bairro}
                                               onChange={e => setForm({...form, bairro: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Municipio</label>
                                        <input style={S.input} value={form.municipio}
                                               onChange={e => setForm({...form, municipio: e.target.value})}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>UF</label>
                                        <input style={S.input} value={form.uf} maxLength={2} placeholder="DF"
                                               onChange={e => setForm({
                                                   ...form,
                                                   uf: e.target.value.toUpperCase()
                                               })}/>
                                    </div>
                                    <div style={S.field}>
                                        <label style={S.label}>Codigo IBGE</label>
                                        <input style={S.input} value={form.codigo_municipio_ibge} maxLength={7}
                                               placeholder="5300108"
                                               onChange={e => setForm({
                                                   ...form,
                                                   codigo_municipio_ibge: e.target.value.replace(/\D/g, '')
                                               })}/>
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
                                <span style={{flex: 2}}>CNPJ</span>
                                <span style={{flex: 2}}>E-mail</span>
                                <span style={{flex: 1}}>WhatsApp</span>
                                <span style={{flex: 1, textAlign: 'right'}}>Acoes</span>
                            </div>
                            {filtered.map(c => (
                                <div key={c.id} style={S.trow}>
                                    <span style={{flex: 2, color: '#fff', fontWeight: '500'}}>{c.name}</span>
                                    <span style={{flex: 2, color: '#6b6b6b'}}>{c.company || '—'}</span>
                                    <span style={{flex: 2, color: '#6b6b6b', fontSize: '12px'}}>{c.cnpj || '—'}</span>
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
    sectionTitle: {
        color: '#00D4FF',
        fontSize: '11px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        margin: '24px 0 12px',
        paddingTop: '20px',
        borderTop: '1px solid #1f1f1f'
    },
    lookupMsg: {color: '#6b6b6b', fontSize: '12px', marginTop: '12px'},
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
        alignItems: 'center'
    },
    empty: {
        background: '#101010',
        border: '1px solid #1f1f1f',
        borderRadius: '4px',
        padding: '48px',
        textAlign: 'center'
    },
}