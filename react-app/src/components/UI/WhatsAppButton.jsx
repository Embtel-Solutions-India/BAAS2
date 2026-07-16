/**
 * Floating WhatsApp support button (fixed bottom-right).
 * Number comes from the VITE_WHATSAPP_NUMBER env var (country code, digits only).
 * Renders nothing when the number isn't configured.
 */
export default function WhatsAppButton({ message = "Hi! I'd like some help with your accounting services." }) {
  const number = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 1000,
        width: '58px',
        height: '58px',
        borderRadius: '50%',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(37,211,102,.45), 0 2px 6px rgba(0,0,0,.2)',
        transition: 'transform .2s ease, box-shadow .2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="#fff" aria-hidden="true">
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.57-1.72a12.74 12.74 0 006.23 1.62h.01c7.06 0 12.8-5.74 12.8-12.8 0-3.42-1.33-6.63-3.75-9.05a12.71 12.71 0 00-9.06-3.65zm0 23.02h-.01a10.6 10.6 0 01-5.4-1.48l-.39-.23-3.9 1.02 1.04-3.8-.25-.4a10.6 10.6 0 01-1.62-5.65c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.5 1.11 7.51 3.12a10.56 10.56 0 013.11 7.52c0 5.86-4.77 10.63-10.63 10.63zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37z"/>
      </svg>
    </a>
  );
}
