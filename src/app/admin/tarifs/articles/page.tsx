'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Package, Tag, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast, useConfirm } from '@/components/ui/ToastProvider';
import {
  getArticlesTarifs,
  createArticleTarif,
  updateArticleTarif,
  deleteArticleTarif,
  ArticleTarifItem,
} from '@/actions/articles';

const UNITES = [
  { value: 'KG', label: 'Par kg' },
  { value: 'PIECE', label: 'Par pièce' },
  { value: 'KG_ET_PIECE', label: 'Par kg ET pièce' },
];

const DIRECTIONS = [
  { value: 'LES_DEUX', label: '🔄 USA ↔ Conakry (les deux sens)' },
  { value: 'USA_CONAKRY', label: '➡️ USA → Conakry' },
  { value: 'CONAKRY_USA', label: '⬅️ Conakry → USA' },
];

const SERVICES = [
  { value: 'LES_DEUX', label: '✈️🚢 Aérien & Maritime' },
  { value: 'AERIEN', label: '✈️ Fret Aérien' },
  { value: 'MARITIME', label: '🚢 Fret Maritime' },
];

const CATEGORIES = [
  'Électronique', 'Téléphonie', 'Vêtements & Textiles', 'Chaussures',
  'Fruits & Denrées', 'Liquides & Huiles', 'Médicaments', 'Cosmétiques & Beauté',
  'Électroménager', 'Mobilier', 'Jouets', 'Autre',
];

const emptyForm = {
  nom: '',
  description: '',
  categorie: 'Électronique',
  prixParKg: '' as string | number,
  prixParPiece: '' as string | number,
  unite: 'PIECE' as 'KG' | 'PIECE' | 'KG_ET_PIECE',
  direction: 'LES_DEUX' as 'USA_CONAKRY' | 'CONAKRY_USA' | 'LES_DEUX',
  service: 'LES_DEUX' as 'AERIEN' | 'MARITIME' | 'LES_DEUX',
  devise: 'USD',
  actif: true,
};

export default function CatalogueArticlesPage() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [articles, setArticles] = useState<ArticleTarifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; isNew: boolean; id?: string }>({ open: false, isNew: true });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterDirection, setFilterDirection] = useState('');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const res = await getArticlesTarifs();
    if (res.success) setArticles(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await getArticlesTarifs();
      if (active && res.success) setArticles(res.data);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setModal({ open: true, isNew: true });
  };

  const openEdit = (a: ArticleTarifItem) => {
    setForm({
      nom: a.nom,
      description: a.description || '',
      categorie: a.categorie || 'Autre',
      prixParKg: a.prixParKg ?? '',
      prixParPiece: a.prixParPiece ?? '',
      unite: a.unite,
      direction: a.direction,
      service: a.service,
      devise: a.devise,
      actif: a.actif,
    });
    setModal({ open: true, isNew: false, id: a.id });
  };

  const handleSave = async () => {
    if (!form.nom.trim()) { addToast('error', 'Le nom de l\'article est obligatoire.'); return; }
    if (form.unite !== 'PIECE' && !form.prixParKg) { addToast('error', 'Prix par kg requis.'); return; }
    if (form.unite !== 'KG' && !form.prixParPiece) { addToast('error', 'Prix par pièce requis.'); return; }

    setSaving(true);
    const payload = {
      nom: form.nom.trim(),
      description: form.description || undefined,
      categorie: form.categorie || undefined,
      prixParKg: form.unite !== 'PIECE' && form.prixParKg !== '' ? Number(form.prixParKg) : null,
      prixParPiece: form.unite !== 'KG' && form.prixParPiece !== '' ? Number(form.prixParPiece) : null,
      unite: form.unite,
      direction: form.direction,
      service: form.service,
      devise: form.devise,
      actif: form.actif,
    };

    const res = modal.isNew
      ? await createArticleTarif(payload)
      : await updateArticleTarif(modal.id!, payload);

    setSaving(false);
    if (res.success) {
      addToast('success', modal.isNew ? 'Article créé avec succès.' : 'Article mis à jour.');
      setModal({ open: false, isNew: true });
      fetchArticles();
    } else {
      addToast('error', 'Erreur lors de l\'enregistrement.');
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    const ok = await confirm(`Supprimer l'article "${nom}" ?`, 'Cette action est irréversible.');
    if (!ok) return;
    const res = await deleteArticleTarif(id);
    if (res.success) {
      addToast('success', 'Article supprimé.');
      setArticles(prev => prev.filter(a => a.id !== id));
    } else {
      addToast('error', 'Erreur lors de la suppression.');
    }
  };

  const filtered = articles.filter(a => {
    if (filterCategorie && a.categorie !== filterCategorie) return false;
    if (filterDirection && a.direction !== filterDirection && a.direction !== 'LES_DEUX') return false;
    return true;
  });

  const dirLabel = (d: string) => DIRECTIONS.find(x => x.value === d)?.label || d;
  const srvLabel = (s: string) => SERVICES.find(x => x.value === s)?.label || s;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            📦 Catalogue des Articles & Tarifs
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Définissez les articles expédiés et leurs prix. Les agents les sélectionneront lors de chaque expédition.
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Nouvel Article
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterDirection}
          onChange={e => setFilterDirection(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}
        >
          <option value="">Tous les sens</option>
          <option value="USA_CONAKRY">USA → Conakry</option>
          <option value="CONAKRY_USA">Conakry → USA</option>
        </select>
        <span style={{ alignSelf: 'center', fontSize: 13, color: '#64748b' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 64, background: '#f8fafc',
          borderRadius: 12, border: '2px dashed #e2e8f0',
        }}>
          <Package size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Aucun article dans le catalogue.</p>
          <button onClick={openNew} style={{
            marginTop: 16, background: '#2563eb', color: 'white',
            border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14,
          }}>
            Ajouter le premier article
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(article => (
            <div key={article.id} style={{
              background: 'white', borderRadius: 12, padding: '16px 20px',
              border: `1px solid ${article.actif ? '#e2e8f0' : '#fecaca'}`,
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              opacity: article.actif ? 1 : 0.65,
            }}>
              {/* Icône catégorie */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Tag size={20} color="#2563eb" />
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 15, color: '#0f172a' }}>{article.nom}</strong>
                  {article.categorie && (
                    <span style={{
                      fontSize: 11, background: '#f1f5f9', color: '#64748b',
                      padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                    }}>{article.categorie}</span>
                  )}
                  {!article.actif && (
                    <span style={{
                      fontSize: 11, background: '#fee2e2', color: '#dc2626',
                      padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                    }}>Inactif</span>
                  )}
                </div>
                {article.description && (
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {article.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                  {article.prixParKg != null && (
                    <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
                      {article.prixParKg} {article.devise}/kg
                    </span>
                  )}
                  {article.prixParPiece != null && (
                    <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>
                      {article.prixParPiece} {article.devise}/pièce
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{dirLabel(article.direction)}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{srvLabel(article.service)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(article)}
                  style={{
                    background: '#f1f5f9', border: 'none', borderRadius: 8,
                    padding: '8px 12px', cursor: 'pointer', color: '#374151',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
                  }}
                >
                  <Edit2 size={14} /> Modifier
                </button>
                <button
                  onClick={() => handleDelete(article.id, article.nom)}
                  style={{
                    background: '#fee2e2', border: 'none', borderRadius: 8,
                    padding: '8px 12px', cursor: 'pointer', color: '#dc2626',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, isNew: true })}
        title={modal.isNew ? '➕ Nouvel Article' : '✏️ Modifier l\'Article'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nom */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Nom de l&apos;article *
            </label>
            <input
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: iPhone 15 Pro, Chaussures Nike..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          {/* Catégorie + Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Catégorie</label>
              <select
                value={form.categorie}
                onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description (optionnel)</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Précisions..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Unité de mesure */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Unité de tarification *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {UNITES.map(u => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unite: u.value as 'KG' | 'PIECE' | 'KG_ET_PIECE' }))}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `2px solid ${form.unite === u.value ? '#2563eb' : '#e2e8f0'}`,
                    background: form.unite === u.value ? '#eff6ff' : 'white',
                    color: form.unite === u.value ? '#1d4ed8' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(form.unite === 'KG' || form.unite === 'KG_ET_PIECE') && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Prix par kg ($) *
                </label>
                <input
                  type="number" min="0" step="0.5"
                  value={form.prixParKg}
                  onChange={e => setForm(f => ({ ...f, prixParKg: e.target.value }))}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            )}
            {(form.unite === 'PIECE' || form.unite === 'KG_ET_PIECE') && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Prix par pièce ($) *
                </label>
                <input
                  type="number" min="0" step="0.5"
                  value={form.prixParPiece}
                  onChange={e => setForm(f => ({ ...f, prixParPiece: e.target.value }))}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          {/* Direction + Service */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Direction</label>
              <select
                value={form.direction}
                onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'USA_CONAKRY' | 'CONAKRY_USA' | 'LES_DEUX' }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              >
                {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Service</label>
              <select
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value as 'AERIEN' | 'MARITIME' | 'LES_DEUX' }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              >
                {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Actif */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.actif}
              onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Article actif (visible aux agents)</span>
          </label>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              onClick={() => setModal({ open: false, isNew: true })}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 14 }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: saving ? '#93c5fd' : '#2563eb', color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Check size={16} /> {saving ? 'Enregistrement...' : modal.isNew ? 'Créer l\'article' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
