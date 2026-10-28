import { Link } from 'react-router-dom';
import RevealWrapper from '../../components/UI/RevealWrapper';
import PageHero from '../../components/Sections/PageHero';
import SEOHead from '../../components/SEO/SEOHead';
import { SITE_URL, breadcrumbSchema } from '../../components/SEO/seoConfig';

const PRIVACY_BREADCRUMB = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Privacy Policy', path: '/privacy-policy' }]);

export default function PrivacyPolicy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Bay Area Accounting Solutions"
        description="How Bay Area Accounting Solutions collects, uses, and protects the personal and financial information you share with us through our website and services."
        url={`${SITE_URL}/privacy-policy`}
        type="website"
        structuredData={PRIVACY_BREADCRUMB}
      />
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Privacy Policy'}]}
        label="Legal"
        title="Privacy Policy"
        description="Last updated: October 28, 2026"
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
            <p>If you choose to receive text messages, we use your phone number to send messages about your request, appointments, document requests and your account. Consent to texts is optional and is not a condition of buying any service. Message and data rates may apply. Message frequency varies. Reply STOP to opt out at any time. Reply HELP for help. Mobile phone numbers and text-messaging consent are not shared with third parties or affiliates for their marketing purposes. See our <Link to="/terms-and-conditions#sms-terms" style={{color:'var(--accent)'}}>SMS Terms</Link> for full details.</p>
            <h2>7. Cookies, Analytics and Third-Party Tools</h2>
            <p>Our website uses cookies and similar technologies to make the site work, understand how it is used, measure our advertising and provide features such as chat and booking. These include:</p>
            <ul>
              <li><strong>Google Analytics and Google Ads</strong>, to measure site traffic and the performance of our ads (for example, which pages you view and whether you submit a form).</li>
              <li><strong>Contentsquare</strong>, to understand how visitors use our pages (for example, clicks and scrolling) so we can improve them.</li>
              <li><strong>Zoho SalesIQ</strong>, for the live chat feature on our website.</li>
              <li><strong>LeadConnector (HighLevel)</strong>, for appointment booking and follow-up.</li>
              <li><strong>Google reviews widget</strong>, to display our public Google reviews.</li>
            </ul>
            <p>These providers may collect information such as your IP address, device and browser type, pages visited and the time of your visit, under their own privacy policies. Some of these tools load only after you first interact with the page. You can block or delete cookies through your browser settings, though some features may stop working, and you can opt out of Google Analytics with Google&apos;s browser add-on at tools.google.com/dlpage/gaoptout.</p>
            <h2>8. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href="mailto:info@bayareaaccountingsolutions.com" style={{color:'var(--accent)'}}>info@bayareaaccountingsolutions.com</a>.</p>
            <h2>9. California Privacy Rights</h2>
            <p>If you are a California resident, the California Consumer Privacy Act, as amended by the California Privacy Rights Act (CCPA/CPRA), gives you the right to:</p>
            <ul>
              <li>know what personal information we collect, use, disclose and share, and why;</li>
              <li>request a copy of the personal information we hold about you;</li>
              <li>request that we correct inaccurate personal information;</li>
              <li>request that we delete your personal information, subject to legal exceptions (for example, records we must keep for tax and accounting purposes);</li>
              <li>opt out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information; and</li>
              <li>not be treated unfairly for using these rights.</li>
            </ul>
            <p>In the past 12 months we collected identifiers (such as name, email address, phone number and IP address), commercial information (such as the services you request), financial information you give us to provide our services, internet activity (such as pages viewed) and, for clients, the documents you upload. We collect this directly from you and from the tools listed in Section 7, and we use it for the purposes in Section 2. We do not sell personal information for money. Our use of advertising and analytics tools such as Google Ads may count as &quot;sharing&quot; under California law. To opt out of that, or to make any other request, email <a href="mailto:info@bayareaaccountingsolutions.com" style={{color:'var(--accent)'}}>info@bayareaaccountingsolutions.com</a> or call (510) 962-7300. We will verify your identity before acting on a request, and you may use an authorized agent. We do not knowingly collect personal information from children under 16.</p>
            <h2>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The date at the top of this page shows when it was last changed.</p>
            <h2>11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:<br/><br/>Bay Area Accounting Solutions<br/>39159 Paseo Padre Parkway, Suite 115<br/>Fremont, CA 94538<br/>Phone: (510) 962-7300<br/>Email: info@bayareaaccountingsolutions.com</p>
          </RevealWrapper>
        </div>
      </div>
    </>
  );
}
