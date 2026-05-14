import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''

  // When accessed via hassad.khormi.site, rewrite / → /hassad
  if (host.startsWith('hassad.')) {
    const url = request.nextUrl.clone()
    if (url.pathname === '/') {
      url.pathname = '/hassad'
      return NextResponse.rewrite(url)
    }
    // Pass through any sub-paths like /hassad/... as-is
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
