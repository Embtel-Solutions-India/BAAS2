export const SITE_URL = 'https://bayareaaccountingsolutions.com';

// Shared LocalBusiness block — spread this into a page's structuredData so
// every service/location page carries the same NAP (name/address/phone)
// data Google uses for local pack and knowledge panel matching.
export const LOCAL_BUSINESS = {
  '@context': 'https://schema.org',
  '@type': 'AccountingService',
  '@id': `${SITE_URL}/#organization`,
  name: 'Bay Area Accounting Solutions',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-512.png`,
  image: `${SITE_URL}/logo-512.png`,
  telephone: '+1-510-962-7300',
  email: 'info@bayareaaccountingsolutions.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '39159 Paseo Padre Parkway, Suite 115',
    addressLocality: 'Fremont',
    addressRegion: 'CA',
    postalCode: '94538',
    addressCountry: 'US'
  },
  areaServed: { '@type': 'Country', name: 'United States' },
  priceRange: '$$'
};

export function serviceSchema({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    name,
    description,
    url: `${SITE_URL}${path}`,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'Country', name: 'United States' }
  };
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  };
}
