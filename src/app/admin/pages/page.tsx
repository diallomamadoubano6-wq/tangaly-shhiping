'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@/components/ui/ToastProvider';
import { getPages, updatePage, createPage } from '@/actions/cms';
import styles from './seo.module.css';

type SeoPage = {
  id: string;
  page_slug: string;
  titre: string;
  meta_description: string;
  og_image: string;
};

const PAGE_NAMES: Record<string, string> = {
  '/': 'Accueil',
  '/services': 'Nos Services',
  '/devis': 'Demande de Devis',
  '/tracking': 'Suivi de Colis',
  '/blog': 'Blog / Actualités',
  '/about': 'À Propos',
  '/contact': 'Contact',
};

export default function SeoAdminPage() {
  const { addToast } = useToast();
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`;
  const getAuthHeader = () => ({ 'Authorization': 'Bearer fake-token-for-dev', 'Content-Type': 'application/json' });

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPages();
      const mapped = data.map(p => {
        const seoData = p.seo ? JSON.parse(p.seo) : {};
        return {
          id: p.id,
          page_slug: p.slug,
          titre: p.titre,
          meta_description: seoData.meta_description || '',
          og_image: seoData.og_image || ''
        };
      });
      // Add default pages if they don't exist yet
      for (const slug of Object.keys(PAGE_NAMES)) {
        if (!mapped.find(m => m.page_slug === slug)) {
          const newPage = await createPage({ slug, titre: PAGE_NAMES[slug], contenu: '', seo: '{}' });
          mapped.push({ id: newPage.id, page_slug: newPage.slug, titre: newPage.titre, meta_description: '', og_image: '' });
        }
      }
      setPages(mapped);
    } catch (e) {
      addToast('error', 'Erreur de chargement SEO');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleChange = (id: string, key: keyof SeoPage, value: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
  };

  const savePage = async (page: SeoPage) => {
    setSaving(page.id);
    try {
      const { id, page_slug, titre, meta_description, og_image } = page;
      await updatePage(id, {
        titre,
        seo: JSON.stringify({ meta_description, og_image })
      });
      addToast('success', `SEO "${PAGE_NAMES[page_slug] || page_slug}" sauvegardé !`);
    } catch (e) {
      addToast('error', 'Erreur sauvegarde');
    }
    setSaving(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Pages & SEO</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Gérez les titres et descriptions de chaque page pour améliorer votre référencement Google.
        </p>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className={styles.seoList}>
          {pages.map(page => (
            <div key={page.id} className={styles.seoCard}>
              <div className={styles.seoHeader}>
                <div>
                  <h3 className={styles.pageName}>{PAGE_NAMES[page.page_slug] || page.page_slug}</h3>
                  <code className={styles.pageSlug}>{page.page_slug}</code>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => savePage(page)} disabled={saving === page.id}>
                  {saving === page.id ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>

              <div className={styles.seoPreview}>
                <p className={styles.previewTitle}>{page.titre || 'Titre non défini'}</p>
                <p className={styles.previewSlug}>tangaly.com{page.page_slug}</p>
                <p className={styles.previewDesc}>{page.meta_description || 'Description non définie...'}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Balise &lt;title&gt; <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(50-60 caractères)</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={page.titre || ''}
                    onChange={e => handleChange(page.id, 'titre', e.target.value)}
                    maxLength={70}
                  />
                  <span style={{ fontSize: '0.75rem', color: (page.titre?.length || 0) > 60 ? 'red' : 'var(--color-text-muted)' }}>
                    {page.titre?.length || 0}/60 caractères
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Description <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(150-160 caractères)</span></label>
                  <textarea
                    className="form-textarea"
                    value={page.meta_description || ''}
                    onChange={e => handleChange(page.id, 'meta_description', e.target.value)}
                    rows={2}
                    maxLength={180}
                  />
                  <span style={{ fontSize: '0.75rem', color: (page.meta_description?.length || 0) > 160 ? 'red' : 'var(--color-text-muted)' }}>
                    {page.meta_description?.length || 0}/160 caractères
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Image OG (partage réseaux sociaux)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={page.og_image || ''}
                    onChange={e => handleChange(page.id, 'og_image', e.target.value)}
                    placeholder="https://tangaly.com/og-image.jpg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
