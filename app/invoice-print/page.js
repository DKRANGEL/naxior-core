'use client'

import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase'

function formatCurrency(val) {
    return Number(val).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})
}

function formatDate(iso) {
    if (!iso) return ''
    const parts = iso.split('T')[0].split('-')
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0]
    return iso
}

function todayString() {
    const d = new Date()
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
}

export default function InvoicePrintPage() {
    const [invoice, setInvoice] = useState(null)
    const [client, setClient] = useState(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const id = params.get('id')
        if (!id) return

        const supabase = createClient()
        supabase
            .from('invoices')
            .select('*, clients(name, company, cnpj, email)')
            .eq('id', id)
            .single()
            .then(({data}) => {
                if (data) {
                    setInvoice(data)
                    setClient(data.clients || null)
                    setReady(true)
                }
            })
    }, [])

    useEffect(() => {
        if (ready) {
            setTimeout(() => window.print(), 800)
        }
    }, [ready])

    if (!ready || !invoice) {
        return (
            <div style={{
                background: '#0A0A0A',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <p style={{color: '#6b6b6b', fontFamily: 'Inter, sans-serif'}}>Carregando invoice...</p>
            </div>
        )
    }

    const money = formatCurrency(invoice.amount)
    const dateStr = invoice.due_date ? formatDate(invoice.due_date) : todayString()

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

        :root {
          --invoice-bg: #0A0A0A;
          --text-white: #FFFFFF;
          --text-gray:  #A1A1AA;
          --accent:     #00D4FF;
          --border:     #27272A;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          font-family: Inter, sans-serif;
          background: #1a1a1a;
        }

        body {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px;
          min-height: 100vh;
        }

        .invoice-paper {
          width: 210mm;
          background: var(--invoice-bg);
          padding: 18mm 20mm;
          box-shadow: 0 0 0 1px #333, 0 8px 40px rgba(0,0,0,0.6);
        }

        .logo-icon {
          width: 40px; height: 40px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .logo-icon::before, .logo-icon::after {
          content: '';
          position: absolute;
          width: 4px; height: 100%;
          background: var(--text-white);
          border-radius: 2px;
        }
        .logo-icon::before { transform: rotate(45deg); }
        .logo-icon::after  {
          transform: rotate(-45deg);
          background: linear-gradient(180deg, var(--text-white) 40%, var(--accent) 100%);
          box-shadow: 0 0 10px var(--accent);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--border);
          padding-bottom: 28px;
          margin-bottom: 36px;
        }
        .logo-wrapper { display: flex; align-items: center; gap: 15px; }
        .invoice-label { font-size: 32px; color: var(--text-gray); font-weight: 300; letter-spacing: 5px; }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 36px;
        }
        .info-col h3 { font-size: 11px; color: var(--accent); margin-bottom: 10px; letter-spacing: 1px; text-transform: uppercase; }
        .info-col strong { color: var(--text-white); display: block; margin-bottom: 5px; font-size: 14px; }
        .info-col p { font-size: 13px; color: var(--text-gray); line-height: 1.6; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
        th {
          text-align: left; font-size: 11px; color: var(--text-gray);
          border-bottom: 1px solid var(--border); padding-bottom: 14px;
          text-transform: uppercase; letter-spacing: 1px;
        }
        td { padding: 18px 0; border-bottom: 1px solid var(--border); color: var(--text-gray); }
        td strong { color: var(--text-white); font-weight: 600; display: block; margin-bottom: 4px; }
        .price-cell { text-align: right; color: var(--text-white); font-weight: 600; vertical-align: middle; }

        .total-box { display: flex; justify-content: flex-end; margin-bottom: 36px; }
        .total-content { background: #111; padding: 18px 36px; border-left: 4px solid var(--accent); text-align: right; }
        .total-label  { font-size: 11px; color: var(--text-gray); letter-spacing: 1px; text-transform: uppercase; }
        .total-amount { font-size: 28px; font-weight: 700; color: var(--text-white); margin-top: 4px; }

        .payment-box {
          background: #111; padding: 24px; border-radius: 8px;
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; gap: 24px;
        }
        .pix-code {
          background: rgba(0,212,255,0.1); color: var(--accent);
          padding: 10px 15px; font-family: monospace; border-radius: 4px;
          display: inline-block; margin-top: 8px; font-size: 13px; letter-spacing: 1px;
        }
        .qr-img { width: 90px; height: 90px; border-radius: 4px; border: 3px solid white; background: white; display: block; }

        footer { margin-top: 40px; text-align: center; border-top: 1px solid var(--border); padding-top: 18px; }
        .slogan { color: var(--accent); letter-spacing: 2px; font-size: 11px; text-transform: uppercase; }

        @media print {
          body {
            background: #0A0A0A;
            padding: 0;
            display: block;
          }
          .invoice-paper {
            width: 100%;
            box-shadow: none;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

            <div className="invoice-paper">

                <div className="header">
                    <div className="logo-wrapper">
                        <div className="logo-icon"/>
                        <div>
                            <div
                                style={{fontSize: '24px', fontWeight: 700, letterSpacing: '2px', color: '#fff'}}>NAXIOR
                            </div>
                            <span style={{fontSize: '10px', letterSpacing: '4px', color: '#00D4FF'}}>TECH</span>
                        </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <div className="invoice-label">INVOICE</div>
                        <p style={{
                            color: '#A1A1AA',
                            fontSize: '13px',
                            marginTop: '6px'
                        }}>#{invoice.number} &bull; {dateStr}</p>
                    </div>
                </div>

                <div className="info-grid">
                    <div className="info-col">
                        <h3>Emissor</h3>
                        <strong>Naxior Tech</strong>
                        <p>Derick Rangel - Programador MEI</p>
                        <p>CNPJ: 65.090.118/0001-01</p>
                        <p>Brasilia, DF</p>
                    </div>
                    <div className="info-col">
                        <h3>Cliente</h3>
                        <strong>{client ? client.name : '—'}</strong>
                        {client?.company && <p>{client.company}</p>}
                        {client?.cnpj && <p>CNPJ: {client.cnpj}</p>}
                        {client?.email && <p>{client.email}</p>}
                        <p>A/C Financeiro</p>
                    </div>
                </div>

                <table>
                    <thead>
                    <tr>
                        <th width="70%">Servico</th>
                        <th width="30%" style={{textAlign: 'right'}}>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>
                            <strong>{invoice.description || '—'}</strong>
                            <span
                                style={{fontSize: '11px', color: '#555'}}>Referencia ao mes de competencia atual.</span>
                        </td>
                        <td className="price-cell">{money}</td>
                    </tr>
                    </tbody>
                </table>

                <div className="total-box">
                    <div className="total-content">
                        <div className="total-label">Total a Pagar</div>
                        <div className="total-amount">{money}</div>
                    </div>
                </div>

                <div className="payment-box">
                    <img className="qr-img" src="/pix-naxior.jpeg" alt="QR Code PIX"/>
                    <div>
                        <h4 style={{
                            fontSize: '12px',
                            color: '#fff',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>Pagamento via PIX</h4>
                        <div className="pix-code">65.090.118/0001-01</div>
                    </div>
                </div>

                <footer>
                    <div className="slogan">High-End Engineering &amp; AI Automation</div>
                </footer>

            </div>
        </>
    )
}