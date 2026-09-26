import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { VerifyEmailSchema } from '../shared';
import { api } from '../lib/api';

type VerifyLocationState = {
  justRegistered?: boolean;
};

export function VerifyPage() {
  const nav = useNavigate();
  const location = useLocation();
  const justRegistered =
    (location.state as VerifyLocationState | null)?.justRegistered === true ||
    Boolean(sessionStorage.getItem('pendingVerifyEmail'));

  const [email, setEmail] = useState(
    () => sessionStorage.getItem('pendingVerifyEmail') ?? '',
  );
  const [code, setCode] = useState(
    () => sessionStorage.getItem('pendingDevCode') ?? '',
  );
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    const parsed = VerifyEmailSchema.safeParse({ email, code });
    if (!parsed.success) {
      setError(parsed.error.errors.map((x) => x.message).join('; '));
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyEmail(parsed.data);
      setOk(res.message);
      sessionStorage.removeItem('pendingVerifyEmail');
      sessionStorage.removeItem('pendingDevCode');
      setTimeout(() => nav('/me'), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="card">
        <h1>Verify email</h1>
        {justRegistered ? (
          <p className="sub">
            验证码已发送到你的邮箱，请查收（含垃圾箱）。输入 6 位验证码完成验证。
          </p>
        ) : (
          <p className="sub">Enter the 6-digit code (dev mode may prefill).</p>
        )}
        {error && <div className="error">{error}</div>}
        {ok && <div className="ok">{ok}</div>}
        <form onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="code">Code</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        <div className="footer">
          <Link to="/me">Skip to profile</Link> · <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
