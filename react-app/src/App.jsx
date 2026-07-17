import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PortalProvider } from './context/PortalContext';
import Layout from './components/Layout/Layout';

// Marketing pages
const Home          = lazy(() => import('./pages/Home'));
const About         = lazy(() => import('./pages/About'));
const Services      = lazy(() => import('./pages/Services'));
const Industries    = lazy(() => import('./pages/Industries'));
const Resources     = lazy(() => import('./pages/Resources'));
const Blog          = lazy(() => import('./pages/Blog'));
const BlogDetail    = lazy(() => import('./pages/BlogDetail'));
const Contact       = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms         = lazy(() => import('./pages/Terms'));
const Bookkeeping   = lazy(() => import('./pages/ServiceDetail/Bookkeeping'));
const TaxServices   = lazy(() => import('./pages/ServiceDetail/TaxServices'));
const Payroll       = lazy(() => import('./pages/ServiceDetail/Payroll'));
const Accounting    = lazy(() => import('./pages/ServiceDetail/Accounting'));
const Consulting     = lazy(() => import('./pages/ServiceDetail/Consulting'));
const RegisteredAgent = lazy(() => import('./pages/ServiceDetail/RegisteredAgent'));
const BookkeepingCleanup = lazy(() => import('./pages/ServiceDetail/BookkeepingCleanup'));
const NotFound      = lazy(() => import('./pages/NotFound'));

// Client Portal Auth pages
const PortalLogin          = lazy(() => import('./pages/Portal/Login'));
const PortalRegister       = lazy(() => import('./pages/Portal/Register'));
const PortalVerifyEmail    = lazy(() => import('./pages/Portal/VerifyEmail'));
const PortalForgotPassword = lazy(() => import('./pages/Portal/ForgotPassword'));
const PortalResetPassword  = lazy(() => import('./pages/Portal/ResetPassword'));

// Client Portal App pages
const PortalDashboard      = lazy(() => import('./pages/Portal/Dashboard'));
const PortalOrders         = lazy(() => import('./pages/Portal/Orders'));
const PortalOrderDetail    = lazy(() => import('./pages/Portal/OrderDetail'));
const PortalNewOrder       = lazy(() => import('./pages/Portal/NewOrder'));
const PortalCheckout       = lazy(() => import('./pages/Portal/Checkout'));
const PortalDocuments      = lazy(() => import('./pages/Portal/Documents'));
const PortalMessages       = lazy(() => import('./pages/Portal/Messages'));
const PortalChat           = lazy(() => import('./pages/Portal/Chat'));
const PortalInvoices       = lazy(() => import('./pages/Portal/Invoices'));
const PortalProfile        = lazy(() => import('./pages/Portal/Profile'));
const PortalNotifications  = lazy(() => import('./pages/Portal/Notifications'));

// Admin Portal pages
const AdminLogin           = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard       = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminClients         = lazy(() => import('./pages/Admin/AdminClients'));
const AdminClientDetail    = lazy(() => import('./pages/Admin/AdminClientDetail'));
const AdminOrders          = lazy(() => import('./pages/Admin/AdminOrders'));
const AdminOrderDetail     = lazy(() => import('./pages/Admin/AdminOrderDetail'));
const AdminMessages        = lazy(() => import('./pages/Admin/AdminMessages'));
const AdminChat            = lazy(() => import('./pages/Admin/AdminChat'));
const AdminNotifications   = lazy(() => import('./pages/Admin/AdminNotifications'));
const AdminActivity        = lazy(() => import('./pages/Admin/AdminActivity'));
const AdminBlogs           = lazy(() => import('./pages/Admin/AdminBlogs'));
const AdminBlogEditor      = lazy(() => import('./pages/Admin/AdminBlogEditor'));
const AdminPayments        = lazy(() => import('./pages/Admin/AdminPayments'));

function Spinner() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'40px',height:'40px',border:'3px solid rgba(212,0,31,.2)',borderTopColor:'#d4001f',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const pageTransition = {
  initial:{ opacity:0, y:16 },
  animate:{ opacity:1, y:0, transition:{ duration:.45, ease:[.16,1,.3,1] } },
  exit:{ opacity:0, y:-12, transition:{ duration:.3, ease:[.16,1,.3,1] } }
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition} style={{ minHeight: '100vh' }}>
        <Suspense fallback={<Spinner />}>
          <Routes location={location}>
            {/* Marketing Routes */}
            <Route path="/"                      element={<Home />} />
            <Route path="/about"                 element={<About />} />
            <Route path="/services"              element={<Services />} />
            <Route path="/industries"            element={<Industries />} />
            <Route path="/resources"             element={<Resources />} />
            <Route path="/blog"                  element={<Blog />} />
            <Route path="/blog/:slug"            element={<BlogDetail />} />
            <Route path="/contact"               element={<Contact />} />
            <Route path="/privacy-policy"        element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions"  element={<Terms />} />
            <Route path="/services/bookkeeping"  element={<Bookkeeping />} />
            <Route path="/services/tax-services" element={<TaxServices />} />
            <Route path="/services/payroll"      element={<Payroll />} />
            <Route path="/services/accounting"   element={<Accounting />} />
            <Route path="/services/consulting"    element={<Consulting />} />
            <Route path="/services/registered-agent" element={<RegisteredAgent />} />
            <Route path="/services/bookkeeping-cleanup" element={<BookkeepingCleanup />} />

            {/* Client Portal Auth Routes */}
            <Route path="/client-portal/login"           element={<PortalLogin />} />
            <Route path="/client-portal/register"        element={<PortalRegister />} />
            <Route path="/client-portal/verify-email"    element={<PortalVerifyEmail />} />
            <Route path="/client-portal/forgot-password" element={<PortalForgotPassword />} />
            <Route path="/client-portal/reset-password"  element={<PortalResetPassword />} />

            {/* Client Portal App Routes */}
            <Route path="/client-portal/dashboard"       element={<PortalDashboard />} />
            <Route path="/client-portal/orders"          element={<PortalOrders />} />
            <Route path="/client-portal/orders/:id"      element={<PortalOrderDetail />} />
            <Route path="/client-portal/new-order"       element={<PortalNewOrder />} />
            <Route path="/client-portal/checkout/:orderId" element={<PortalCheckout />} />
            <Route path="/client-portal/documents"       element={<PortalDocuments />} />
            <Route path="/client-portal/messages"        element={<PortalMessages />} />
            <Route path="/client-portal/chat"            element={<PortalChat />} />
            <Route path="/client-portal/invoices"        element={<PortalInvoices />} />
            <Route path="/client-portal/profile"         element={<PortalProfile />} />
            <Route path="/client-portal/notifications"   element={<PortalNotifications />} />

            {/* Admin Portal Routes */}
            <Route path="/admin/login"                   element={<AdminLogin />} />
            <Route path="/admin/dashboard"               element={<AdminDashboard />} />
            <Route path="/admin/clients"                 element={<AdminClients />} />
            <Route path="/admin/clients/:id"             element={<AdminClientDetail />} />
            <Route path="/admin/orders"                  element={<AdminOrders />} />
            <Route path="/admin/orders/:id"              element={<AdminOrderDetail />} />
            <Route path="/admin/messages"                element={<AdminMessages />} />
            <Route path="/admin/chat"                    element={<AdminChat />} />
            <Route path="/admin/notifications"           element={<AdminNotifications />} />
            <Route path="/admin/activity"                element={<AdminActivity />} />
            <Route path="/admin/blogs"                   element={<AdminBlogs />} />
            <Route path="/admin/blogs/new"               element={<AdminBlogEditor />} />
            <Route path="/admin/payments"                 element={<AdminPayments />} />
            <Route path="/admin/blogs/:id/edit"          element={<AdminBlogEditor />} />

            <Route path="*"                              element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PortalProvider>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </PortalProvider>
    </BrowserRouter>
  );
}
