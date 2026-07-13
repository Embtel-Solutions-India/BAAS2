import { useEffect } from 'react';

/**
 * SEOHead — sets document title, meta tags, and JSON-LD structured data.
 * Uses direct DOM manipulation (no react-helmet dependency).
 */
export default function SEOHead({ title, description, image, url, type = 'article', author, publishedTime, tags }) {
  useEffect(() => {
    // Title
    if (title) document.title = title;

    const metaTags = {
      'description':        description,
      'og:title':           title,
      'og:description':     description,
      'og:image':           image,
      'og:url':             url,
      'og:type':            type,
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

    // JSON-LD Structured Data
    const existingLd = document.querySelector('script[data-seo-ld]');
    if (existingLd) existingLd.remove();

    if (title && type === 'article') {
      const ld = document.createElement('script');
      ld.setAttribute('type', 'application/ld+json');
      ld.setAttribute('data-seo-ld', 'true');
      ld.textContent = JSON.stringify({
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
      document.head.appendChild(ld);
    }

    // Cleanup
    return () => {
      const ld = document.querySelector('script[data-seo-ld]');
      if (ld) ld.remove();
    };
  }, [title, description, image, url, type, author, publishedTime, tags]);

  return null;
}
