'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }
    
    setLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      email: email.trim(),
      password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Fetch session to determine role
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      setLoading(false);
      if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'AGENT') {
        router.push('/admin');
      } else {
        router.push('/client/dashboard');
      }
      router.refresh();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
      </div>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Link href="/" className={styles.logo} aria-label="TANGALY - Retour à l'accueil">
            <span className={styles.logoMark}>T</span>
            <span className={styles.logoText}>TANGALY</span>
          </Link>
        </div>

        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.sub}>Accédez à vos expéditions, documents et factures.</p>

        {error && (
          <div className={styles.errorBox} role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Adresse email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className="form-group">
            <div className={styles.labelRow}>
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <Link href="/client/forgot-password" className={styles.forgotLink}>
                Mot de passe oublié ?
              </Link>
            </div>
            <div className={styles.pwdWrap}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.pwdToggle}
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <span className="spinner" aria-hidden="true" />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className={styles.register}>
          Pas encore client ?{' '}
          <Link href="/contact" className={styles.registerLink}>
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}
