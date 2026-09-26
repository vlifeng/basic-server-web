import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterSchema } from '../shared';
import { api, setToken } from '../lib/api';

export function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const parsed = RegisterSchema.safeParse({
      email,
      password,
      name: name || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.errors.map((x) => x.message).join('; '));
      return;
    }
    setLoading(true);
    try {
      const res = await api.register(parsed.data);
      setToken(res.accessToken);
      sessionStorage.setItem('pendingVerifyEmail', res.user.email);
      if (res.devCode) {
        setDevCode(res.devCode);
        sessionStorage.setItem('pendingDevCode', res.devCode);
      } else {
        sessionStorage.removeItem('pendingDevCode');
      }
      nav('/verify', { state: { justRegistered: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="card">
        <h1>Create account</h1>
        <p className="sub">
          注册后验证码会发到邮箱（约 10 秒内送达，请同时查看垃圾箱）。
        </p>
        {error && <div className="error">{error}</div>}
        {devCode && <div className="ok">Dev code: {devCode}</div>}
        <form onSubmit={onSubmit}>
          <label htmlFor="name">Name (optional)</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
        <div className="footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
