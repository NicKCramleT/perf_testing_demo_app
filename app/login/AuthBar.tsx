'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState { token: string | null; candidateId: string | null; username?: string | null; }

export default function AuthBar() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ token: null, candidateId: null, username: null });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [revealTimeoutId, setRevealTimeoutId] = useState<any>(null);
  const masked = auth.token ? auth.token.slice(0,4) + '••••' + auth.token.slice(-4) : '';

  function reveal() {
    if (!auth.token) return;
    setShowToken(true);
    if (revealTimeoutId) clearTimeout(revealTimeoutId);
    const id = setTimeout(()=> setShowToken(false), 5000);
    setRevealTimeoutId(id);
  }

  async function copy() {
    if (!auth.token) return;
    try { await navigator.clipboard.writeText(auth.token); } catch {/* ignore */}
  }

  useEffect(() => {
    // try to read from localStorage to persist across reloads
    const storedToken = localStorage.getItem('candidate_token');
    const storedId = localStorage.getItem('candidate_id');
    const storedUsername = localStorage.getItem('candidate_username');
    if (storedToken && storedId) {
      let username = storedUsername || null;
      if (!username) {
        try {
          const payloadPart = storedToken.split('.')[1];
          const json = JSON.parse(atob(payloadPart.replace(/-/g,'+').replace(/_/g,'/')));
          username = json.sub || null;
        } catch { /* ignore */ }
      }
      setAuth({ token: storedToken, candidateId: storedId, username });
      if (username && !storedUsername) localStorage.setItem('candidate_username', username);
    }
  }, []);

  async function login() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Auth failed');
      }
  const rawToken: string = json.data.token;
  let decodedUsername: string | null = null;
  try {
    const payloadPart = rawToken.split('.')[1];
    const decoded = JSON.parse(atob(payloadPart.replace(/-/g,'+').replace(/_/g,'/')));
    decodedUsername = decoded.sub || null;
  } catch { /* ignore */ }
	localStorage.setItem('candidate_token', rawToken);
	localStorage.setItem('candidate_id', json.data.candidateId);
	localStorage.setItem('candidate_is_admin', String(!!json.data.isAdmin));
  if (decodedUsername) localStorage.setItem('candidate_username', decodedUsername);
      // Mirror cookie set client-side as fallback (same name used in middleware)
  try { document.cookie = `candidate_jwt=${rawToken}; path=/; SameSite=Lax; max-age=${60*60*8}`; } catch {}
      // Notify other components in same tab (storage event won't fire locally)
      window.dispatchEvent(new Event('candidate-auth-changed'));
  setAuth({ token: rawToken, candidateId: json.data.candidateId, username: decodedUsername });
      setPassword('');
      // Force refresh of any server components relying on auth cookie and client nav state
      try { router.refresh(); } catch {}
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true); setError(null);
    try {
  await fetch('/api/auth', { method: 'DELETE' });
    } catch { /* ignore */ }
    // No direct token revocation endpoint yet; token removed client-side and cookie cleared server-side
  localStorage.removeItem('candidate_token');
  localStorage.removeItem('candidate_id');
  localStorage.removeItem('candidate_username');
	setAuth({ token: null, candidateId: null, username: null });
	localStorage.removeItem('candidate_is_admin');
  try { document.cookie = 'candidate_jwt=; path=/; max-age=0'; } catch {}
    window.dispatchEvent(new Event('candidate-auth-changed'));
  try { router.refresh(); } catch {}
    // Redirect user to home after logout for clarity
    try { router.push('/'); } catch {}
    setUsername('');
    setPassword('');
    setLoading(false);
  }

  if (auth.token) {
    return (
      <div className='auth-bar'>
        <div className='auth-row'>
          <span style={{fontSize:'0.6rem'}}>User: <strong>{auth.username || auth.candidateId}</strong></span>
          <div className='token-box'>
            <span>{showToken ? auth.token : masked}</span>
            <button type='button' className='btn' style={{fontSize:'0.55rem', padding:'0.25rem 0.4rem'}} onClick={reveal} title='Reveal token'>👁</button>
            <button type='button' className='btn' style={{fontSize:'0.55rem', padding:'0.25rem 0.4rem'}} onClick={copy} title='Copy token'>⧉</button>
          </div>
          <button className='btn' type='button' disabled={loading} onClick={logout}>Logout</button>
        </div>
        {error && <span style={{color:'#c62828', fontSize:'0.55rem'}}>{error}</span>}
      </div>
    );
  }

  return (
    <form onSubmit={e=>{e.preventDefault(); login();}} className='auth-login-form'>
      <div style={{display:'flex', flexDirection:'column'}}>
        <input
          style={{padding:'0.35rem 0.5rem', fontSize:'0.65rem'}}
          placeholder='username'
          value={username}
          onChange={e=>setUsername(e.target.value)}
          autoComplete='username'
          required
        />
      </div>
      <div style={{display:'flex', flexDirection:'column'}}>
        <input
          type='password'
            style={{padding:'0.35rem 0.5rem', fontSize:'0.65rem'}}
          placeholder='password'
          value={password}
          onChange={e=>setPassword(e.target.value)}
          autoComplete='current-password'
          required
        />
      </div>
      <button className='btn btn-primary' type='submit' disabled={loading || !username || !password}>{loading? '...' : 'Login'}</button>
      {error && <span style={{color:'#c62828', fontSize:'0.6rem'}}>{error}</span>}
    </form>
  );
}
