# NAXIOR CORE

> Sistema interno de gestão operacional da [Naxior Tech](https://naxiortech.com.br)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)

---

## O que é

Back-office privado para gerenciamento das operações da Naxior Tech. Acesso restrito por autenticação.

## Funcionalidades

- **Dashboard** — visão geral de receita, clientes e leads em tempo real
- **Clientes** — cadastro completo com CNPJ, e-mail e WhatsApp
- **Invoices** — geração, controle de status e exportação em PDF com layout profissional
- **Leads** — captura automática do formulário da landing page, com pipeline de acompanhamento

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + App Router |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Deploy | Vercel |

## Estrutura

```
app/
├── dashboard/        # Visão geral e métricas
├── clients/          # CRUD de clientes
├── invoices/         # Gestão de invoices + geração de PDF
├── leads/            # Pipeline de leads
├── invoice-print/    # Rota de impressão de invoice
├── login/            # Autenticação
└── components/
    ├── Sidebar.js
    └── TopBar.js
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

<p align="center">
  <img src="https://img.shields.io/badge/Naxior-Tech-00D4FF?style=flat-square" />
  <br/>
  <sub>Uso interno · Acesso restrito</sub>
</p>