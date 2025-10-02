'use client';
import { useEffect, useState } from 'react';

export default function NavLinks() {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  useEffect(()=>{
    const t = localStorage.getItem('candidate_token');
    if (t) setToken(t);
    const adminFlag = localStorage.getItem('candidate_is_admin');
    setIsAdmin(adminFlag === 'true');
    const update = () => {
      setToken(localStorage.getItem('candidate_token'));
      setIsAdmin(localStorage.getItem('candidate_is_admin') === 'true');
    };
    window.addEventListener('storage', update);
    window.addEventListener('candidate-auth-changed', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('candidate-auth-changed', update);
    };
  },[]);

  return (
    <nav className="nav nav-flex-wrap">
      <a href="/">Home</a>
      {token && <a href="/users">Users</a>}
      {token && <a href="/products">Products</a>}
      {token && <a href="/orders">Checkout</a>}
      {token && <a href="/orders-list">Orders</a>}
      {token && isAdmin && <a href="/admin">Admin</a>}
    </nav>
  );
}
