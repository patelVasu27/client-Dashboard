import { NextRequest, NextResponse } from 'next/server'

// Environment variables for edge runtime
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const response = new NextResponse()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  // Set Content Security Policy
  const csp = "default-src 'self'; connect-src 'self' https://*.supabase.co https://*.vercel-analytics.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;"
  response.headers.set('Content-Security-Policy', csp)
  
  // Add rate limiting headers
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', '90')
  response.headers.set('X-RateLimit-Reset', '3600')
  
  // Handle authentication for protected routes
  const protectedRoutes = ['/dashboard', '/clients', '/reports', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  if (isProtectedRoute) {
    // Check for Supabase auth token
    const authHeader = request.headers.get('Authorization')
    const cookie = request.cookies.get('sb-auth-token')
    
    const token = authHeader?.replace('Bearer ', '') || cookie?.value
    
    if (!token) {
      // Redirect to login page
      url.pathname = '/login'
      url.search = ''
      
      // Preserve original path for redirect after login
      response.cookies.set('redirect-after-login', url.pathname)
      response.cookies.set('redirect-after-login-search', url.search)
      
      return NextResponse.redirect(url)
    }
    
    try {
      // Verify token using Supabase Edge Functions
      const isValidToken = await verifyTokenEdge(token)
      
      if (!isValidToken) {
        // Clear auth cookies
        response.cookies.delete('sb-auth-token')
        
        url.pathname = '/login'
        url.search = ''
        response.cookies.set('redirect-after-login', url.pathname)
        
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      response.cookies.delete('sb-auth-token')
      
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }
  
  // Handle login page redirect if already authenticated
  if (url.pathname === '/login') {
    const authHeader = request.headers.get('Authorization')
    const cookie = request.cookies.get('sb-auth-token')
    const token = authHeader?.replace('Bearer ', '') || cookie?.value
    
    if (token) {
      try {
        const isValidToken = await verifyTokenEdge(token)
        if (isValidToken) {
          // Redirect to dashboard if already logged in
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error('Token verification failed:', error)
      }
    }
  }
  
  // Handle API routes - add CORS
  if (url.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers
      })
    }
  }
  
  return response
}

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    // Use the Supabase JWT verification
    const { jwtVerify } = await import('jose')
    
    const secret = new TextEncoder().encode(SUPABASE_ANON_KEY)
    
    const result = await jwtVerify(token, secret, {
      issuer: `${SUPABASE_URL}/auth/v1`,
      audience: SUPABASE_URL,
      algorithms: ['HS256']
    })
    
    return true
  } catch (error) {
    console.error('JWT verification failed:', error)
    return false
  }
}

export const config = {
  matcher: ['/((?!api/|static/|favicon.ico).*)']
}