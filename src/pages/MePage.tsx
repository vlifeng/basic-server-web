import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { UserPublic } from '../shared';
import { api, clearToken, getToken } from '../lib/api';

export function MePage() {
  const nav = useNavigate();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      nav('/login');
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        clearToken();
      })
      .finally(() => setLoading(false));
  }, [nav]);

  async function onLogout() {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    nav('/login');
  }

  if (loading) {
    return (
      <div className="shell">
        <div className="card">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="card">
        <h1>Your profile</h1>
        <p className="sub">Authenticated via JWT + Redis session.</p>
        {error && <div className="error">{error}</div>}
        {user && (
          <dl className="profile">
            <dt>ID</dt>
            <dd>{user.id}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Name</dt>
            <dd>{user.name || '—'}</dd>
            <dt>Email verified</dt>
            <dd>
              <span className={`badge ${user.emailVerified ? 'yes' : 'no'}`}>
                {user.emailVerified ? 'verified' : 'not verified'}
              </span>
            </dd>
            <dt>Created</dt>
            <dd>{String(user.createdAt)}</dd>
          </dl>
        )}
        {!user?.emailVerified && (
          <div className="footer" style={{ marginTop: 16 }}>
            <Link to="/verify">Verify email</Link>
          </div>
        )}
        <button className="secondary" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
