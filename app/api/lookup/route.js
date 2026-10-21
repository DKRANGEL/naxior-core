import {NextResponse} from 'next/server'

// Consulta de CNPJ e CEP via BrasilAPI, normalizada para as colunas de `clients`.
//
// O endpoint de CNPJ devolve `codigo_municipio` no padrao SIAFI/Receita, que NAO
// serve para a DPS. O codigo IBGE sai da consulta de CEP (`ibge.city`), por isso
// as duas chamadas sao encadeadas aqui.

const BRASIL_API = 'https://brasilapi.com.br/api'

function onlyDigits(value) {
    return (value || '').replace(/\D/g, '')
}

async function fetchJson(url) {
    const res = await fetch(url, {next: {revalidate: 86400}})
    if (!res.ok) return null
    return res.json()
}

async function lookupCep(cep) {
    const digits = onlyDigits(cep)
    if (digits.length !== 8) return null

    const data = await fetchJson(`${BRASIL_API}/cep/v2/${digits}`)
    if (!data) return null

    return {
        cep: digits,
        logradouro: data.street || '',
        bairro: data.neighborhood || '',
        municipio: data.city || '',
        uf: data.state || '',
        codigo_municipio_ibge: data.ibge?.city || '',
    }
}

async function lookupCnpj(cnpj) {
    const digits = onlyDigits(cnpj)
    if (digits.length !== 14) return null

    const data = await fetchJson(`${BRASIL_API}/cnpj/v1/${digits}`)
    if (!data) return null

    const base = {
        tipo_pessoa: 'PJ',
        cnpj: digits,
        company: data.razao_social || '',
        name: data.nome_fantasia || data.razao_social || '',
        email: data.email || '',
        cep: onlyDigits(data.cep),
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        codigo_municipio_ibge: '',
        situacao_cadastral: data.descricao_situacao_cadastral || '',
        opcao_pelo_mei: Boolean(data.opcao_pelo_mei),
    }

    // O IBGE so vem pela consulta de CEP.
    const porCep = await lookupCep(base.cep)
    if (porCep) {
        base.codigo_municipio_ibge = porCep.codigo_municipio_ibge
        // O cadastro da Receita costuma estar mais desatualizado que a base de CEP.
        if (!base.municipio) base.municipio = porCep.municipio
        if (!base.uf) base.uf = porCep.uf
    }

    return base
}

export async function GET(request) {
    const {searchParams} = new URL(request.url)
    const cnpj = searchParams.get('cnpj')
    const cep = searchParams.get('cep')

    try {
        if (cnpj) {
            const data = await lookupCnpj(cnpj)
            if (!data) return NextResponse.json({error: 'CNPJ nao encontrado'}, {status: 404})
            return NextResponse.json(data)
        }

        if (cep) {
            const data = await lookupCep(cep)
            if (!data) return NextResponse.json({error: 'CEP nao encontrado'}, {status: 404})
            return NextResponse.json(data)
        }

        return NextResponse.json({error: 'Informe cnpj ou cep'}, {status: 400})
    } catch (err) {
        return NextResponse.json({error: 'Falha na consulta externa'}, {status: 502})
    }
}
