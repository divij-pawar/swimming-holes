import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://waterspots.netlify.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block API routes and raw data endpoints from crawlers
        disallow: ['/api/'],
      },
      // Block known aggressive scrapers / AI training crawlers
      {
        userAgent: [
          'GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai',
          'Claude-Web', 'cohere-ai', 'PerplexityBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
