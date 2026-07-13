import { useEffect } from 'react';
import RevealWrapper from '../../components/UI/RevealWrapper';
import PageHero from '../../components/Sections/PageHero';

export default function PrivacyPolicy() {
  useEffect(() => { document.title = 'Privacy Policy | Bay Area Accounting Solutions'; }, []);
  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Privacy Policy'}]}
        label="Legal"
        title="Privacy Policy"
        description="Last updated: January 1, 2025"
        showCta={false}
      />
      <div className="content">
        <div className="container">
          <RevealWrapper className="prose" style={{maxWidth:'760px'}}>
            <h2>1. Information We Collect</h2>
            <p>Bay Area Accounting Solutions ("BAAS," "we," "us," or "our") collects information you provide directly to us, such as when you fill out a contact form, register for the client portal, or communicate with us. This may include your name, email address, phone number, business name, and financial documents.</p>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to provide our accounting and financial services, communicate with you about your account, comply with legal obligations, and improve our services. We do not sell your personal information to third parties.</p>
            <h2>3. Information Sharing</h2>
            <p>We may share your information with trusted service providers who assist us in operating our business (such as cloud storage providers), as required by law (such as in response to a subpoena or court order), or with your consent.</p>
            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information, including 256-bit SSL encryption for all data transmissions and secure, access-controlled storage of financial documents. However, no method of transmission over the Internet is 100% secure.</p>
            <h2>5. Client Portal</h2>
            <p>Our client portal uses encryption and secure authentication to protect your financial documents. All uploaded files are encrypted at rest and in transit. Access is limited to authorized BAAS staff members assigned to your account.</p>
            <h2>6. SMS Communications</h2>
            <p>By providing your phone number, you consent to receive SMS messages from Bay Area Accounting Solutions regarding your account and services. Message and data rates may apply. Message frequency varies. Reply STOP to opt out at any time. Reply HELP for help.</p>
            <h2>7. Cookies</h2>
            <p>Our website uses cookies to enhance your browsing experience and analyze site traffic. You can disable cookies through your browser settings, though this may affect some features of our website.</p>
            <h2>8. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href="mailto:info@bayareaaccountingsolutions.com" style={{color:'var(--accent)'}}>info@bayareaaccountingsolutions.com</a>.</p>
            <h2>9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:<br/><br/>Bay Area Accounting Solutions<br/>39159 Paseo Padre Parkway, Suite 115<br/>Fremont, CA 94538<br/>Phone: (510) 962-7300<br/>Email: info@bayareaaccountingsolutions.com</p>
          </RevealWrapper>
        </div>
      </div>
    </>
  );
}
