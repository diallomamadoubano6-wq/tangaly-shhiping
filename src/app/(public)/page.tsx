import type { Metadata } from 'next';
import Link from 'next/link';
import { Plane, Ship, Package, Building2, ShieldCheck, Zap, MessageSquareText, BadgeDollarSign, MapPin, Search, CheckCircle2, ArrowRight, ArrowLeftRight } from 'lucide-react';
import styles from './home.module.css';
import Image from 'next/image';


export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transport USA ↔ Guinée (Dans les 2 sens) — Rapide, Fiable, Sécurisé',
  description: 'TANGALY, la référence du transport et de la logistique bilatérale entre les États-Unis et la Guinée. Expéditions dans les deux sens : USA ➔ Guinée et Guinée ➔ USA.',
};

import { getHomeData } from '@/actions/public';

export default async function HomePage() {
  const { data } = await getHomeData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LogisticsService",
            "name": "TANGALY Shipping",
            "url": "https://tangaly.com",
            "description": data.hero.subheadline,
            "areaServed": ["US", "GN"],
          })
        }}
      />

      {/* ---- HERO ---- */}
      <section className={styles.hero} aria-label="Présentation TANGALY">
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.heroBgGradient} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <div className={styles.heroTag}>Logistique Premium USA ↔ Guinée · Dans les 2 sens</div>
            <h1 className={styles.heroTitle}>{data.hero.headline}</h1>
            <p className={styles.heroSub}>{data.hero.subheadline}</p>
            <div className="flex gap-4 flex-wrap">
              <Link href={data.hero.cta1.href} className="btn btn-primary btn-lg">{data.hero.cta1.label}</Link>
              <Link href={data.hero.cta2.href} className={`btn btn-outline btn-lg ${styles.heroOutlineBtn}`}>{data.hero.cta2.label}</Link>
            </div>
            <div className={styles.heroTrust}>
              <span className={styles.heroTrustIcon}><CheckCircle2 size={18} /> Garanti sans frais cachés</span>
              <span className={styles.heroTrustIcon}><CheckCircle2 size={18} /> Support 7j/7</span>
            </div>
          </div>

          <div className={styles.trackingWidget}>
            <h2>Suivez votre colis</h2>
            <p>Saisissez votre numéro de suivi TANGALY pour localiser votre colis en temps réel (départ USA ou départ Guinée).</p>
            <form className={styles.trackingForm} action="/tracking" method="get" role="search">
              <label htmlFor="tracking-hero" className="sr-only">Numéro de tracking</label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 text-gray-400" size={20} />
                <input id="tracking-hero" name="numero" type="text" className={`form-input ${styles.trackingInput}`} placeholder="Ex: TNX-9021-USA" style={{ paddingLeft: '44px' }} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2">
                <Search size={20} /> Localiser mon colis
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ---- STATS ---- */}
      {data.stats.length > 0 && (
        <section className={styles.statsBar} aria-label="Chiffres clés">
          <div className="container">
            <ul className={styles.statsGrid} role="list">
              {data.stats.map((s: any) => (
                <li key={s.label} className={styles.statItem}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---- PROCESS ---- */}
      <section className={styles.section} aria-labelledby="process-title">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Simple et Efficace</span>
            <h2 id="process-title">Comment envoyer avec TANGALY ?</h2>
            <p>Notre processus est optimisé pour vous faire gagner du temps et de l&apos;argent en seulement 4 étapes.</p>
          </div>
          <div className={styles.processGrid}>
            <div className={styles.processLine} aria-hidden="true" />
            {data.process.map((step, idx) => (
              <div key={step.title} className={styles.processCard}>
                <div className={styles.processIconWrap}>
                  <div className={styles.processNum}>{idx + 1}</div>
                  {idx === 0 && <Building2 size={32} className="text-primary" />}
                  {idx === 1 && <Package size={32} className="text-primary" />}
                  {idx === 2 && <Plane size={32} className="text-primary" />}
                  {idx === 3 && <MapPin size={32} className="text-primary" />}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- SERVICES (depuis Supabase) ---- */}
      {data.services.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="services-title">
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Nos Solutions</span>
              <h2 id="services-title">Des services adaptés à tous vos besoins</h2>
              <p>Que vous soyez un particulier achetant sur Amazon ou une entreprise important des marchandises, nous avons la solution.</p>
            </div>
            <ul className={styles.servicesGrid} role="list">
              {data.services.map((s: any) => (
                <li key={s.id}>
                  <Link href={s.href || '/services'} className={styles.serviceCard}>
                    <div className={styles.serviceImageWrap}>
                      <Image src={s.image_url} alt={s.titre} fill sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                    <div className={styles.serviceContent}>
                      <h3 className={styles.serviceTitle}>{s.titre}</h3>
                      <p className={styles.serviceDesc}>{s.description}</p>
                      <span className={styles.serviceArrow}>Découvrir <ArrowRight size={16} /></span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---- WHY US ---- */}
      <section className={styles.section} aria-labelledby="why-title">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>La Différence TANGALY</span>
            <h2 id="why-title">Pourquoi nous sommes le choix numéro 1</h2>
            <p>Nous ne transportons pas seulement des colis, nous livrons de la tranquillité d&apos;esprit.</p>
          </div>
          <div className={styles.whySplit}>
            <div className={styles.whyImageWrap}>
              <Image src="/images/why-us.jpg" alt="Equipe logistique TANGALY" fill sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <ul className={styles.whyContent} role="list">
              {data.whyUs.map((w, idx) => (
                <li key={w.title} className={styles.whyItem}>
                  <span className={styles.whyIcon} aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {idx === 0 ? <ArrowLeftRight size={24} /> : idx === 1 ? <ShieldCheck size={24} /> : <MessageSquareText size={24} />}
                  </span>
                  <div className={styles.whyText}>
                    <h3>{w.title}</h3>
                    <p>{w.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- FAQ (depuis Supabase) ---- */}
      {data.faq.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="faq-title">
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Support</span>
              <h2 id="faq-title">Questions Fréquentes</h2>
              <p>Retrouvez rapidement les réponses à vos questions les plus courantes.</p>
            </div>
            <div className={styles.faqContainer}>
              {data.faq.map((item, idx) => (
                <div key={idx} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{item.q}</h3>
                  <p className={styles.faqAnswer}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- FINAL CTA ---- */}
      <section className={styles.finalCta} aria-label="Appel à l&apos;action">
        <div className="container">
          <h2>Prêt à expédier avec TANGALY ?</h2>
          <p>Bénéficiez de nos adresses relais à New York et Conakry et expédiez vos colis en toute sérénité dans les deux sens.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/client/dashboard" className="btn btn-primary btn-lg">Mon Espace</Link>
            <Link href="/devis" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>Demander un devis</Link>
          </div>
        </div>
      </section>
    </>
  );
}
