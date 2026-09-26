import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginSchema } from '../shared';
import { api, setToken } from '../lib/api';

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors.map((x) => x.message).join('; '));
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(parsed.data);
      if ('requiresEmailVerification' in res && res.requiresEmailVerification) {
        sessionStorage.setItem('pendingLoginEmail', res.email);
        if (res.devCode) {
          sessionStorage.setItem('pendingLoginDevCode', res.devCode);
        } else {
          sessionStorage.removeItem('pendingLoginDevCode');
        }
        nav('/verify-login');
        return;
      }
      if ('accessToken' in res && res.accessToken) {
        setToken(res.accessToken);
        nav('/workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="card">
        <h1>Sign in</h1>
        <p className="sub">
          输入邮箱和密码后，将向邮箱发送登录验证码。
        </p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <div className="footer">
          No account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
