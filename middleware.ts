import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionValue = request.cookies.get('ict_session')?.value;
	const authed = !!(sessionValue && sessionValue.length > 10);

	// Root → executive dashboard
	if (pathname === '/') {
		return NextResponse.redirect(new URL('/executive', request.url));
	}

	// Already logged in → skip login page
	if (pathname.startsWith('/auth/login') && authed) {
		return NextResponse.redirect(new URL('/executive', request.url));
	}

	// Protect dashboard and executive routes
	if ((pathname.startsWith('/dashboard') || pathname.startsWith('/executive')) && !authed) {
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
  	matcher: ['/', '/dashboard/:path*', '/executive/:path*', '/auth/login'],
};
