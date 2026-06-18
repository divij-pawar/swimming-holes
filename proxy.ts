import { NextRequest, NextResponse } from 'next/server'

/**
 * In-memory sliding-window rate limiter.
 *
 * On Netlify each function instance is isolated, so the Map resets per cold start.
 * This still provides strong protection against single-client burst scraping.
 * For multi-instance persistence, swap the Map with Upstash Redis:
 *   https://github.com/upstash/ratelimit-js
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

const LIMITS: Record<string, { requests: number; windowMs: number }> = {
  // Strict: list/search endpoints — prevent pagination dump
  '/api/spots':        { requests: 30, windowMs: 60_000 },
  '/api/spots/nearby': { requests: 20, windowMs: 60_000 },
  // Relaxed: detail page (ISR already caches these heavily)
  '/api/spots/':       { requests: 60, windowMs: 60_000 },
  '/api/states':       { requests: 10, windowMs: 60_000 },
}

function getLimit(pathname: string) {
  if (pathname === '/api/spots')         return LIMITS['/api/spots']
  if (pathname === '/api/spots/nearby')  return LIMITS['/api/spots/nearby']
  if (pathname === '/api/states')        return LIMITS['/api/states']
  if (pathname.startsWith('/api/spots/')) return LIMITS['/api/spots/']
  return null
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  )
}

// Prune entries older than 5 minutes to prevent unbounded growth
function pruneStore() {
  const cutoff = Date.now() - 300_000
  for (const [key, win] of store) {
    if (win.resetAt < cutoff) store.delete(key)
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only gate API routes
  if (!pathname.startsWith('/api/')) return NextResponse.next()

  const limit = getLimit(pathname)
  if (!limit) return NextResponse.next()

  const ip = getIP(req)
  const key = `${ip}:${pathname}`
  const now = Date.now()

  // Occasionally prune (roughly 1% of requests)
  if (Math.random() < 0.01) pruneStore()

  const win = store.get(key)
  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs })
    return NextResponse.next()
  }

  win.count++
  if (win.count > limit.requests) {
    const retryAfter = Math.ceil((win.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit.requests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(win.resetAt / 1000)),
        },
      }
    )
  }

  const res = NextResponse.next()
  res.headers.set('X-RateLimit-Limit', String(limit.requests))
  res.headers.set('X-RateLimit-Remaining', String(limit.requests - win.count))
  res.headers.set('X-RateLimit-Reset', String(Math.ceil(win.resetAt / 1000)))
  return res
}

export const config = {
  matcher: '/api/:path*',
}
