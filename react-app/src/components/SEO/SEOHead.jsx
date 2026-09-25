import { useEffect } from 'react';
import { SITE_URL } from './seoConfig';

const DEFAULT_IMAGE = `${SITE_URL}/logo-512.png`;

/**
 * SEOHead — sets document title, meta tags, canonical link, robots directive,
 * and JSON-LD structured data. Uses direct DOM manipulation (no react-helmet
 * dependency) so it also works against the prerendered (puppeteer) build —
 * whatever it writes into <head> gets captured into the static HTML that
 * ships to crawlers.
 */
export default function SEOHead({
  title, description, image = DEFAULT_IMAGE, url, type = 'article',
  author, publishedTime, tags, noindex = false, structuredData
}) {
  useEffect(() => {
    // Title
    if (title) document.title = title;

    const metaTags = {
      'description':        description,
      'og:title':           title,
      'og:description':     description,
      'og:image':           image,
      'og:url':             url,
      'og:type':            type === 'article' ? 'article' : 'website',
      'og:site_name':       'Bay Area Accounting Solutions',
      'twitter:card':       image ? 'summary_large_image' : 'summary',
      'twitter:title':      title,
      'twitter:description': description,
      'twitter:image':      image
    };

    // Set or create meta tags
    Object.entries(metaTags).forEach(([key, value]) => {
      if (!value) return;
      const isOg = key.startsWith('og:');
      const isTwitter = key.startsWith('twitter:');
      const attr = (isOg || isTwitter) ? 'property' : 'name';

      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    });

    // Robots directive — lets us keep unlisted/utility pages out of the index
    // without pulling them from the sitemap or breaking client-side routing.
    let robotsEl = document.querySelector('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.setAttribute('name', 'robots');
      document.head.appendChild(robotsEl);
    }
    robotsEl.setAttribute('content', noindex ? 'noindex, follow' : 'index, follow');

    // Canonical URL
    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }

    // JSON-LD Structured Data — replace whatever the previous page left behind.
    document.querySelectorAll('script[data-seo-ld]').forEach((el) => el.remove());

    const ldBlocks = [];
    if (title && type === 'article') {
      ldBlocks.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description || '',
        image: image || undefined,
        url: url || undefined,
        author: author ? { '@type': 'Person', name: author } : undefined,
        datePublished: publishedTime || undefined,
        keywords: (tags || []).join(', ') || undefined,
        publisher: {
          '@type': 'Organization',
          name: 'Bay Area Accounting Solutions',
          url: 'https://bayareaaccountingsolutions.com'
        }
      });
    }
    if (structuredData) {
      ldBlocks.push(...(Array.isArray(structuredData) ? structuredData : [structuredData]));
    }

    ldBlocks.forEach((block) => {
      const ld = document.createElement('script');
      ld.setAttribute('type', 'application/ld+json');
      ld.setAttribute('data-seo-ld', 'true');
      ld.textContent = JSON.stringify(block);
      document.head.appendChild(ld);
    });

    // Cleanup
    return () => {
      document.querySelectorAll('script[data-seo-ld]').forEach((el) => el.remove());
    };
  }, [title, description, image, url, type, author, publishedTime, tags, noindex, structuredData]);

  return null;
}
