import {createServerClient} from '@supabase/ssr'
import {NextResponse} from 'next/server'

export async function middleware(request) {
    let response = NextResponse.next({request})

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value, options}) => {
                        request.cookies.set(name, value)
                        response = NextResponse.next({request})
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {data: {user}} = await supabase.auth.getUser()

    // Se não está logado e não está na página de login, redireciona
    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se está logado e tenta acessar o login, manda pro dashboard
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}