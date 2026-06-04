// Supabase 미들웨어 헬퍼 — 세션 갱신 및 인증 보호 처리
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 세션 갱신 — getUser()를 반드시 호출해야 세션이 유지됨
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 로그인하지 않은 사용자가 보호된 페이지에 접근하면 로그인으로 리디렉트
    const isAuthPage =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup');

    if (!user && !isAuthPage && request.nextUrl.pathname !== '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 로그인한 사용자가 auth 페이지에 접근하면 홈으로 리디렉트
    if (user && isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/home';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
