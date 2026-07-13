import { useEffect } from 'react';
import RevealWrapper from '../../components/UI/RevealWrapper';
import PageHero from '../../components/Sections/PageHero';

export default function Terms() {
  useEffect(() => { document.title = 'Terms & Conditions | Bay Area Accounting Solutions'; }, []);
  return (
    <>
      <PageHero
        breadcrumb={[{label:'Home',to:'/'},{label:'Terms & Conditions'}]}
        label="Legal"
        title="Terms & Conditions"
        description="Last updated: January 1, 2025"
        showCta={false}
      />
      <div className="content">
        <div className="container">
          <RevealWrapper className="prose" style={{maxWidth:'760px'}}>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the website of Bay Area Accounting Solutions ("BAAS"), you accept and agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our website or services.</p>
            <h2>2. Services</h2>
            <p>BAAS provides accounting, bookkeeping, tax preparation, payroll, and business formation services. The specific services to be provided, fees, and terms are outlined in individual engagement letters or service agreements signed between BAAS and each client.</p>
            <h2>3. Client Portal</h2>
            <p>Access to our client portal is subject to registration and acceptance of portal-specific terms. You are responsible for maintaining the confidentiality of your login credentials. You agree not to share your account with unauthorized parties.</p>
            <h2>4. Accuracy of Information</h2>
            <p>You agree to provide accurate, complete, and timely information required for us to perform our services. BAAS is not responsible for errors or delays caused by inaccurate or incomplete information provided by the client.</p>
            <h2>5. Confidentiality</h2>
            <p>BAAS maintains strict confidentiality of all client information in accordance with professional accounting standards and applicable laws. All staff are bound by confidentiality agreements.</p>
            <h2>6. Limitation of Liability</h2>
            <p>BAAS&apos;s liability for any claim arising from our services is limited to the fees paid for those specific services. BAAS is not liable for indirect, consequential, or punitive damages.</p>
            <h2>7. Intellectual Property</h2>
            <p>All content on this website, including text, graphics, logos, and software, is the property of Bay Area Accounting Solutions and is protected by applicable intellectual property laws.</p>
            <h2>8. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of California. Any disputes shall be resolved in the courts of Alameda County, California.</p>
            <h2>9. Changes to Terms</h2>
            <p>We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance of the new terms.</p>
            <h2>10. Contact</h2>
            <p>Questions about these Terms? Contact us at:<br/><br/>Bay Area Accounting Solutions<br/>39159 Paseo Padre Parkway, Suite 115<br/>Fremont, CA 94538<br/>Phone: (510) 962-7300<br/>Email: info@bayareaaccountingsolutions.com</p>
          </RevealWrapper>
        </div>
      </div>
    </>
  );
}
