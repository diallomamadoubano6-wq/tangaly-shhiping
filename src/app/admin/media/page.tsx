'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import { getMedias } from '@/actions/cms';
import styles from './media.module.css';

interface MediaItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeOriginal: number;
  sizeOptimized: number;
  urlWebp: string;
  urlAvif: string;
  createdAt: string;
}

export default function MediaManager() {
  const [medias, setMedias] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedias = async () => {
    try {
      const data = await getMedias();
      setMedias(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMedias();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      alert("L'upload de fichiers nécessite une API configurée (S3, Cloudinary ou locale). La fonctionnalité UI est prête.");
      // const formData = new FormData();
      // formData.append('file', e.target.files[0]);
      // await uploadMedia(formData); // A implémenter dans les Server Actions
      await fetchMedias();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce média ?')) return;
    try {
      alert("La suppression nécessite la configuration de l'API de stockage.");
      // await deleteMedia(id);
      setMedias(medias.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}><ImageIcon className={styles.icon} /> Médiathèque Optimisée</h1>
        <div className={styles.uploadBtnWrapper}>
          <button className={`btn btn-primary ${styles.uploadBtn}`} disabled={uploading}>
            <UploadCloud size={20} />
            {uploading ? 'Optimisation...' : 'Ajouter un média'}
          </button>
          <input type="file" onChange={handleUpload} accept="image/*" className={styles.fileInput} />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsPanel}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Médias</p>
          <p className={styles.statValue}>{medias.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Poids Original Cumulé</p>
          <p className={styles.statValue}>{formatSize(medias.reduce((acc, m) => acc + m.sizeOriginal, 0))}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Bande passante économisée</p>
          <p className={styles.statValueSave}>
            {formatSize(medias.reduce((acc, m) => acc + (m.sizeOriginal - m.sizeOptimized), 0))}
          </p>
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className={styles.grid}>
          {medias.map(media => (
            <div key={media.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <Image 
                  src={media.urlWebp || '/placeholder-image.jpg'} 
                  alt={media.originalName} 
                  fill 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <div className={styles.info}>
                <p className={styles.name} title={media.originalName}>{media.originalName}</p>
                <div className={styles.sizes}>
                  <span className={styles.sizeOld}>{formatSize(media.sizeOriginal)}</span>
                  <span>→</span>
                  <span className={styles.sizeNew}>{formatSize(media.sizeOptimized)}</span>
                </div>
                <div className={styles.formats}>
                  <span className={styles.badge}>WebP</span>
                  <span className={styles.badge}>AVIF</span>
                </div>
                <button onClick={() => handleDelete(media.id)} className={styles.deleteBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
