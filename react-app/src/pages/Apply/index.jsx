import RevealWrapper from '../../components/UI/RevealWrapper';
import PageHero from '../../components/Sections/PageHero';
import ApplicationForm from '../../components/Sections/ApplicationForm';
import ApplySidebar from '../../components/Sections/ApplySidebar';
import SEOHead from '../../components/SEO/SEOHead';
import { SITE_URL, breadcrumbSchema } from '../../components/SEO/seoConfig';

const APPLY_BREADCRUMB = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Apply for Services', path: '/apply' }]);

export default function Apply() {
  return (
    <>
      <SEOHead
        title="Apply for Services | Bay Area Accounting Solutions"
        description="Tell us which accounting, bookkeeping, tax, payroll or formation services you need and how fast. Our team replies shortly with next steps."
        url={`${SITE_URL}/apply`}
        type="website"
        structuredData={APPLY_BREADCRUMB}
      />
      <PageHero
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Apply for Services' }]}
        label="Get Started"
        title="Apply for services"
        description="Choose the services you need and how fast you need them. We review every application and reply with next steps."
        showCta={false}
      />
      <div className="content">
        <div className="container">
          <RevealWrapper>
            <div className="apply-grid">
              <ApplicationForm />
              <ApplySidebar />
            </div>
          </RevealWrapper>
        </div>
      </div>
    </>
  );
}
