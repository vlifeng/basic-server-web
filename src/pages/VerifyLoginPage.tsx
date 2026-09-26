import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VerifyLoginSchema } from '../shared';
import { api, setToken } from '../lib/api';

export function VerifyLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState(
    () => sessionStorage.getItem('pendingLoginEmail') ?? '',
  );
  const [code, setCode] = useState(
    () => sessionStorage.getItem('pendingLoginDevCode') ?? '',
  );
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    const parsed = VerifyLoginSchema.safeParse({ email, code });
    if (!parsed.success) {
      setError(parsed.error.errors.map((x) => x.message).join('; '));
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyLogin(parsed.data);
      setToken(res.accessToken);
      sessionStorage.removeItem('pendingLoginEmail');
      sessionStorage.removeItem('pendingLoginDevCode');
      setOk('登录成功');
      setTimeout(() => nav('/workspace'), 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="card">
        <h1>登录验证</h1>
        <p className="sub">登录验证码已发送到邮箱。请输入 6 位验证码完成登录。</p>
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
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Login'}
          </button>
        </form>
        <div className="footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
