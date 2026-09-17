'use client';

import { useState, useEffect, useCallback } from 'react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getArticles, createArticle, updateArticle, deleteArticle } from '@/actions/cms';
import styles from './blog.module.css';

type BlogPost = {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  contenu: string;
  image_url: string;
  publie: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const emptyPost: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'> = {
  titre: '', slug: '', extrait: '', contenu: '', image_url: '', publie: false, tags: []
};

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function BlogAdminPage() {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; post: Partial<BlogPost> | null; isNew: boolean }>({ open: false, post: null, isNew: false });
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`;
  const getAuthHeader = () => ({ 'Authorization': 'Bearer fake-token-for-dev', 'Content-Type': 'application/json' });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getArticles();
      const mapped = data.map(p => ({
        ...p,
        image_url: p.image || '',
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
        tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : []
      }));
      setPosts(mapped as any);
    } catch (e) {
      addToast('error', 'Erreur chargement articles');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openCreate = () => setModal({ open: true, post: { ...emptyPost }, isNew: true });
  const openEdit = (post: BlogPost) => setModal({ open: true, post: { ...post }, isNew: false });

  const handleChange = (key: keyof BlogPost, value: string | boolean) => {
    setModal(prev => {
      if (!prev.post) return prev;
      const updated = { ...prev.post, [key]: value };
      if (key === 'titre' && prev.isNew) updated.slug = slugify(value as string);
      return { ...prev, post: updated };
    });
  };

  const savePost = async () => {
    if (!modal.post) return;
    setSaving(true);
    try {
      const dbPost = {
        titre: modal.post.titre,
        slug: modal.post.slug,
        extrait: modal.post.extrait,
        contenu: modal.post.contenu,
        image: modal.post.image_url,
        publie: modal.post.publie,
        tags: JSON.stringify(modal.post.tags || [])
      };
      
      if (modal.isNew) {
        await createArticle(dbPost);
        addToast('success', 'Article créé et publié !');
      } else {
        const { id } = modal.post as BlogPost;
        await updateArticle(id, dbPost);
        addToast('success', 'Article mis à jour !');
      }
      setModal({ open: false, post: null, isNew: false });
      fetchPosts();
    } catch (e) {
      addToast('error', 'Erreur sauvegarde');
    }
    setSaving(false);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await deleteArticle(id);
      addToast('success', 'Article supprimé');
      fetchPosts();
    } catch (e) {
      addToast('error', 'Erreur suppression');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gestion du Blog</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvel article</button>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className={styles.postsList}>
          {posts.map(post => (
            <div key={post.id} className={styles.postCard}>
              {post.image_url && (
                <div className={styles.postImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image_url} alt={post.titre} />
                </div>
              )}
              <div className={styles.postContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ margin: 0 }}>{post.titre}</h3>
                  <span className={post.publie ? styles.badgePublie : styles.badgeBrouillon}>
                    {post.publie ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <p className={styles.extrait}>{post.extrait}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(post.created_at).toLocaleDateString('fr-FR')} · /blog/{post.slug}
                </span>
              </div>
              <div className={styles.postActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(post)}>Modifier</button>
                <button className="btn btn-sm" style={{ background: '#fff1f2', color: '#e11d48', border: 'none' }} onClick={() => handleDeletePost(post.id)}>Supprimer</button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Aucun article. Créez le premier !</p>}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, post: null, isNew: false })} title={modal.isNew ? 'Nouvel Article' : 'Modifier l\'Article'}>
        {modal.post && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Titre</label>
              <input type="text" className="form-input" value={modal.post.titre || ''} onChange={e => handleChange('titre', e.target.value)} placeholder="Titre de l&apos;article..." />
            </div>
            <div className="form-group">
              <label className="form-label">Slug (URL)</label>
              <input type="text" className="form-input" value={modal.post.slug || ''} onChange={e => handleChange('slug', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input type="text" className="form-input" value={modal.post.image_url || ''} onChange={e => handleChange('image_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">Extrait (résumé court)</label>
              <textarea className="form-textarea" value={modal.post.extrait || ''} onChange={e => handleChange('extrait', e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Contenu complet</label>
              <textarea className="form-textarea" value={modal.post.contenu || ''} onChange={e => handleChange('contenu', e.target.value)} rows={8} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="publie" checked={modal.post.publie || false} onChange={e => handleChange('publie', e.target.checked)} />
              <label htmlFor="publie" className="form-label" style={{ margin: 0 }}>Publier sur le site</label>
            </div>
            <button className="btn btn-primary" onClick={savePost} disabled={saving}>
              {saving ? 'Sauvegarde...' : (modal.isNew ? 'Créer l\'article' : 'Enregistrer les modifications')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
