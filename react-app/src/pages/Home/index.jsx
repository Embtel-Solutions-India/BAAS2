import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Moon,
  Clock,
  MessageCircleQuestion,
  BarChart3,
  HeartPulse,
  BookOpen,
  Calculator,
  Users,
  Building2,
  ShieldCheck,
  Globe,
} from "lucide-react";
import FaqItem from "../../components/UI/FaqItem";
import { usePortal } from "../../hooks/usePortal";

const BOOK =
  "https://api.leadconnectorhq.com/widget/booking/r0BX2vT5kOTt0jjgAaVt";

const FAQS = [
  {
    q: "Do you work with all industries?",
    a: "Yes — from tech startups and e-commerce to restaurants, construction, healthcare, and beyond. We've worked with 500+ businesses across every major industry.",
  },
  {
    q: "Are you based in California only?",
    a: "We're headquartered in Fremont, CA, but serve clients across all 50 U.S. states. Our secure client portal makes remote collaboration seamless.",
  },
  {
    q: "Can you handle messy books or late filings?",
    a: 'Absolutely. We specialize in bookkeeping cleanup and "rescue accounting" — no judgment, just results.',
  },
  {
    q: "How is BAAS different from other Bay Area firms?",
    a: "We don't just crunch numbers — we translate your finances into decisions. Our focus is on your peace of mind and growth.",
  },
  {
    q: "How does the client portal work?",
    a: "After onboarding, you get a secure login to upload documents, view reports, track deadlines, and message our team.",
  },
  {
    q: "What happens in a free clarity session?",
    a: "A 30-minute call where we assess your situation, identify pain points, and recommend a path forward. No obligation.",
  },
];

const INDUSTRIES = [
  "Technology & SaaS",
  "E-commerce & Retail",
  "Real Estate",
  "Professional Services",
  "Restaurants & Food",
  "Healthcare",
  "Construction",
  "Transportation & Logistics",
  "Creative & Media",
  "Education & Training",
  "Manufacturing",
  "Non-Profit",
];

/* ── animation variants ────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const Reveal = ({ children, delay = 0, className = "", style }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

export default function Home() {
  const { open } = usePortal();
  useEffect(() => {
    document.title = "Bay Area Accounting Solutions | Bookkeeping & Tax";
  }, []);

  return (
    <>
      {/* ═══ LIGHT HERO ══════════════════════════════════════════════ */}
      <section className="hero-light">
        <div className="hero-light-glow" aria-hidden="true" />

        <div
          className="container"
          style={{ position: "relative", zIndex: 2, width: "100%" }}
        >
          <div
            className="hero-grid"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(40px,5vw,64px)",
              flexWrap: "wrap",
            }}
          >
            {/* left copy */}
            <div style={{ flex: "1 1 460px", maxWidth: "640px" }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span className="pill-light">
                  <span className="pill-dot" aria-hidden="true" />
                  Serving 500+ businesses across all 50 states
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.75,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="hero-title-light"
              >
                You built the business.
                <br />
                <span className="accent">Let us protect it.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="hero-desc-light"
              >
                You didn&apos;t start a business to wrestle with spreadsheets,
                chase receipts, or decode tax law. But financial chaos left
                unchecked becomes the silent threat to everything you&apos;ve
                built — your growth, your time, your peace of mind.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="hero-desc-light"
              >
                We give Bay Area business owners one thing their competitors
                lack: <span className="accent">total financial clarity.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                  display: "flex",
                  gap: "14px",
                  flexWrap: "wrap",
                  marginTop: "32px",
                }}
              >
                <a
                  href={BOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pl"
                >
                  Get Your Free Clarity Session
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 9h10M10 5l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a href="tel:+15109627300" className="btn-ol">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  (510) 962-7300
                </a>
              </motion.div>
            </div>

            {/* stat highlight card */}
            <motion.div
              style={{
                flex: "1 1 300px",
                display: "flex",
                justifyContent: "center",
              }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="hero-card">
                <div className="hero-card-line" aria-hidden="true" />
                <div className="hero-card-label">The BAAS Difference</div>
                {[
                  "Proactive tax planning that can save you thousands",
                  "We take 40+ hours of monthly bookkeeping off your plate",
                  "Clear, easy-to-understand monthly financial reporting",
                  "A strong track record resolving IRS notices and issues",
                ].map((t, i, arr) => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 0",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid var(--cb)" : "none",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: "1px" }}
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--tm)",
                        lineHeight: 1.5,
                      }}
                    >
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ROW ════════════════════════════════════════════════ */}
      <section
        className="bg-surface mt-10"
        style={{ padding: "0 0 clamp(48px,7vw,88px)" }}
      >
        <div className="container">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="stats-row"
            style={{ marginTop: 0 }}
          >
            {[
              ["500+", "Businesses Served"],

              ["90%+", "Client Retention"],
              ["All 50", "States Served"],
              ["24hr", "Average Response Time"],
            ].map(([n, l]) => (
              <motion.div variants={fadeUp} key={l} className="stat-card">
                <div className="stat-num">{n}</div>
                <div className="stat-label">{l}</div>
              </motion.div>
            ))}
          </motion.div>
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "var(--tf)",
              marginTop: "20px",
              fontStyle: "italic",
            }}
          >
            Results vary by business. Figures reflect typical client outcomes
            and are not guaranteed.
          </p>
        </div>
      </section>

      {/* ═══ PAIN POINTS ══════════════════════════════════════════════ */}
      <section className="section bg-surface">
        <div className="container">
          <Reveal className="tc" style={{ marginBottom: "48px" }}>
            <div className="slabel">Sound Familiar?</div>
            <h2 className="stitle">
              These aren&apos;t just accounting problems. They&apos;re life
              problems.
            </h2>
            <p className="ssub">
              And most Bay Area business owners face every single one.
            </p>
          </Reveal>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="pain-grid"
          >
            {[
              [
                Moon,
                "You can't sleep at night",
                "wondering if your books are right, if you're overpaying taxes, or if the IRS will come knocking.",
              ],
              [
                Clock,
                "You're working 70-hour weeks",
                "but still can't find time to reconcile accounts, file returns, or understand your cash flow.",
              ],
              [
                MessageCircleQuestion,
                "Your accountant speaks jargon",
                "and you leave every meeting more confused than before. You deserve answers, not acronyms.",
              ],
              [
                BarChart3,
                "You don't know your real numbers",
                "Revenue is up, but somehow money is always tight. You're flying blind without a financial dashboard.",
              ],
              [
                HeartPulse,
                "Your health is paying the price",
                "The stress of financial uncertainty doesn't stay at work. It follows you home, affects your sleep, your family, your wellbeing.",
              ],
            ].map(([Icon, title, desc]) => (
              <motion.div variants={fadeUp} key={title} className="pain-card">
                <Icon
                  size={32}
                  color="var(--accent)"
                  style={{ marginBottom: "14px" }}
                  strokeWidth={1.6}
                />
                <h3
                  className="serif"
                  style={{
                    fontSize: "19px",
                    fontWeight: 600,
                    marginBottom: "10px",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--td)",
                  }}
                >
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
          <Reveal delay={0.2}>
            <blockquote
              style={{
                maxWidth: "720px",
                margin: "48px auto 0",
                padding: "28px 32px",
                borderLeft: "4px solid var(--accent)",
                borderRadius: "0 16px 16px 0",
                background: "rgba(212,0,31,.04)",
                fontSize: "17px",
                lineHeight: 1.7,
                fontStyle: "italic",
                color: "var(--tm)",
              }}
            >
              &ldquo;You didn&apos;t start your business to become an
              accountant. You started it to build something meaningful. We exist
              so you can get back to that mission.&rdquo;
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ═══ WHY BAAS ═════════════════════════════════════════════════ */}
      <section className="section bg-white">
        <div className="container">
          <Reveal className="tc" style={{ marginBottom: "56px" }}>
            <div className="slabel">Not another accounting firm.</div>
            <h2 className="stitle">Why Bay Area business owners trust BAAS</h2>
          </Reveal>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="why-grid"
          >
            {[
              [
                "01",
                "All-in-One Partner",
                "Bookkeeping to taxes, payroll to LLC setup — one team, one relationship, total coverage.",
              ],
              [
                "02",
                "Local Expertise, National Reach",
                "Based in Fremont, CA. We understand Bay Area business but serve clients in all 50 states.",
              ],
              [
                "03",
                "Fast Response. No Hidden Fees.",
                "Transparent pricing, clear communication, and real humans who respond within hours — not days.",
              ],
              [
                "04",
                "Solutions That Scale",
                "From solo founder to 50-employee company, our services grow alongside your business.",
              ],
            ].map(([n, t, d]) => (
              <motion.div variants={fadeUp} key={n} className="card">
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "16px",
                    background: "rgba(212,0,31,.08)",
                    color: "var(--accent)",
                  }}
                >
                  {n}
                </div>
                <h3
                  className="serif"
                  style={{ fontSize: "18px", marginBottom: "8px" }}
                >
                  {t}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--td)",
                  }}
                >
                  {d}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ SERVICES ═════════════════════════════════════════════════ */}
      <section className="section bg-surface">
        <div className="container">
          <Reveal className="tc" style={{ marginBottom: "56px" }}>
            <h2 className="stitle">Every financial worry. One team.</h2>
            <p className="ssub">
              We handle the essentials so you can focus on what you started your
              business to do.
            </p>
          </Reveal>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="services-grid"
          >
            {[
              [
                BookOpen,
                "Bookkeeping & Accounting",
                "Crystal-clear books, monthly reports that actually make sense, and year-end confidence.",
                "/services/bookkeeping",
              ],
              [
                Calculator,
                "Business & Individual Taxes",
                "Proactive tax strategy that saves you thousands — not reactive filing that costs you penalties.",
                "/services/tax-services",
              ],
              [
                Users,
                "Payroll Management",
                "Employees paid correctly and on time. Compliance handled. Direct deposits done.",
                "/services/payroll",
              ],
              [
                Building2,
                "Business Formation",
                "LLC, S-Corp, C-Corp — set up correctly from day one with EIN and state filings.",
                "/services/consulting",
              ],
              [
                ShieldCheck,
                "Registered Agent Services",
                "Stay compliant in California and every state you operate in.",
                "/services/registered-agent",
              ],
              [
                Globe,
                "Foreign Subsidiary Setup",
                "Expanding into the U.S.? We handle incorporation, EIN, banking setup, and compliance.",
                "/services",
              ],
            ].map(([Icon, title, desc, href]) => (
              <motion.div
                variants={fadeUp}
                key={title}
                className="card-lg"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 8px 32px rgba(212,0,31,0.15)",
                }}
              >
                <Link
                  to={href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <div style={{ marginBottom: "16px", color: "var(--accent)" }}>
                    <Icon size={34} strokeWidth={1.6} />
                  </div>
                  <h3
                    className="serif"
                    style={{ fontSize: "20px", marginBottom: "8px" }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: "15px",
                      lineHeight: 1.6,
                      flex: 1,
                      color: "var(--td)",
                    }}
                  >
                    {desc}
                  </p>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    Learn more
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 9h10M10 5l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ STEPS ════════════════════════════════════════════════════ */}
      <section className="section bg-white">
        <div className="container">
          <Reveal className="tc" style={{ marginBottom: "56px" }}>
            <h2 className="stitle">Four steps to financial peace of mind</h2>
          </Reveal>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="steps-grid"
          >
            {[
              [
                "01",
                "Free Clarity Session",
                "A 30-minute call where we listen to your challenges and give you honest answers — not a sales pitch.",
              ],
              [
                "02",
                "Custom Plan",
                "We design a tailored package: exactly the services you need, at a price that makes sense.",
              ],
              [
                "03",
                "We Take Over",
                "Our team handles your bookkeeping, taxes, payroll, or compliance. Monthly reports in plain English.",
              ],
              [
                "04",
                "You Grow",
                "With clear finances and a trusted partner, you make better decisions, sleep better, and scale.",
              ],
            ].map(([n, t, d]) => (
              <motion.div variants={fadeUp} key={n} className="step-card">
                <div className="step-bg" aria-hidden="true">
                  {n}
                </div>
                <div className="step-num">{n}</div>
                <h3
                  className="serif"
                  style={{
                    fontSize: "19px",
                    marginBottom: "10px",
                    position: "relative",
                  }}
                >
                  {t}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    position: "relative",
                    color: "var(--td)",
                  }}
                >
                  {d}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ PORTAL PROMO (light) ═════════════════════════════════════ */}
      <section className="section cta-light">
        <div className="hero-light-glow" aria-hidden="true" />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div
            className="portal-promo"
            style={{ borderRadius: "24px", padding: "clamp(32px,5vw,56px)" }}
          >
            <div style={{ flex: "1 1 400px" }}>
              <Reveal>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d4001f"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".18em",
                      color: "var(--accent)",
                    }}
                  >
                    Secure Client Portal
                  </span>
                </div>
                <h2
                  className="serif"
                  style={{
                    fontSize: "clamp(28px,3.5vw,44px)",
                    color: "#111",
                    lineHeight: 1.15,
                    letterSpacing: "-.02em",
                    marginBottom: "16px",
                  }}
                >
                  Your financial documents.
                  <br />
                  One secure place.
                </h2>
                <p
                  style={{
                    color: "var(--tm)",
                    fontSize: "17px",
                    lineHeight: 1.7,
                    marginBottom: "28px",
                    maxWidth: "460px",
                  }}
                >
                  Upload bank statements, receipts, tax forms — securely. Our
                  team downloads and processes everything. No more email
                  attachments.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "32px",
                  }}
                >
                  {[
                    "Drag & drop upload",
                    "256-bit encryption",
                    "Document tracking",
                    "Team messaging",
                  ].map((f) => (
                    <div key={f} className="portal-feat">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 10l4 4 8-8"
                          stroke="#d4001f"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
                <motion.button
                  onClick={open}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-pl"
                  style={{ fontSize: "16px", padding: "14px 28px" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Access Client Portal
                </motion.button>
              </Reveal>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                flex: "1 1 280px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div className="mockup">
                <div className="mockup-bar">
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ff5f57",
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ffbd2e",
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#28c840",
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--td)",
                      marginLeft: "auto",
                    }}
                  >
                    portal.baas.com
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  {[
                    "W-2_Forms_2025.pdf",
                    "Bank_Statement_Q4.pdf",
                    "Receipts_Dec.zip",
                  ].map((f, i) => (
                    <motion.div
                      key={f}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.15 }}
                      className="mockup-file"
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 10l4 4 8-8"
                          stroke="#0a7c42"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  ))}
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px dashed rgba(212,0,31,.3)",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "rgba(212,0,31,.7)",
                    }}
                  >
                    + Drop files here
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ INDUSTRIES ═══════════════════════════════════════════════ */}
      <section className="section bg-surface" style={{ paddingTop: "40px" }}>
        <div className="container">
          <Reveal className="tc" style={{ marginBottom: "48px" }}>
            <div className="slabel">Expertise Across Sectors</div>
            <h2 className="stitle">Industries we serve</h2>
          </Reveal>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="ind-grid"
          >
            {INDUSTRIES.map((ind) => (
              <motion.div variants={fadeUp} key={ind} className="ind-tag">
                {ind}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <script src="https://elfsightcdn.com/platform.js" async></script>
      <div
        class="elfsight-app-8c3a1505-8573-49f8-a9ca-e0959d3c787a"
        data-elfsight-app-lazy
      ></div>
      {/* ═══ FAQ ══════════════════════════════════════════════════════ */}
      <section className="section bg-white">
        <div className="container">
          <Reveal className="tc" style={{ marginBottom: "48px" }}>
            <h2 className="stitle">Common questions</h2>
          </Reveal>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            {FAQS.map(({ q, a }) => (
              <FaqItem key={q} question={q} answer={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BAR (light) ══════════════════════════════════════════ */}
      <section className="cta-bar cta-light">
        <div className="hero-light-glow" aria-hidden="true" />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <Reveal>
            <div
              className="pill-light"
              style={{
                textTransform: "uppercase",
                letterSpacing: ".16em",
                fontSize: "12px",
                marginBottom: "24px",
              }}
            >
              <span className="pill-dot" aria-hidden="true" />
              Take the next step
            </div>
            <h2 style={{ maxWidth: "680px", margin: "0 auto 20px" }}>
              Stop surviving your finances.
              <br />
              <span className="accent">Start thriving because of them.</span>
            </h2>
            <p>
              Join 500+ Bay Area business owners who traded financial anxiety
              for financial clarity.
            </p>
            <div className="cta-buttons">
              <motion.a
                href={BOOK}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-pl"
              >
                Book Free Clarity Session →
              </motion.a>
              <motion.a
                href="tel:+15109627300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ol"
              >
                (510) 962-7300
              </motion.a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
