import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const url = request.nextUrl.clone()

  if (host.startsWith('hassad.')) {
    // hassad.khormi.site → rewrite / to /hassad
    if (url.pathname === '/') {
      url.pathname = '/hassad'
      return NextResponse.rewrite(url)
    }
  } else {
    // Main domain → redirect root to hassad.khormi.site
    if (url.pathname === '/') {
      return NextResponse.redirect('https://hassad.khormi.site', 308)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
