'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collection, setCollection] = useState('Signature');
  const [fulfillmentType, setFulfillmentType] = useState('ready_to_wear');
  const [priceNgn, setPriceNgn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadAdminData();
    }
  }, [session]);

  async function loadAdminData() {
    const [{ data: prodData }, { data: orderData }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);
    if (prodData) setProducts(prodData);
    if (orderData) setOrders(orderData);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!name || !priceNgn) return;
    setSaving(true);

    const { error } = await supabase.from('products').insert([
      {
        name,
        description,
        collection: collection || 'Signature',
        fulfillment_type: fulfillmentType,
        price_ngn: Number(priceNgn),
        image_url: imageUrl || null,
        in_stock: true,
      },
    ]);

    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }

    setName('');
    setDescription('');
    setPriceNgn('');
    setImageUrl('');
    loadAdminData();
  }

  async function handleDeleteProduct(id) {
    await supabase.from('products').delete().eq('id', id);
    loadAdminData();
  }

  if (authLoading) {
    return <div className="min-h-screen bg-[#121212] text-[#FAF8F5] p-8 text-sm">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#FAF8F5] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-[#1B1B1B] border border-[#E5C659]/30 rounded-2xl p-6 space-y-4"
        >
          <h1 className="font-serif text-2xl text-[#E5C659] tracking-wider">ENI&apos;S EMPIRE ADMIN</h1>
          <p className="text-xs text-[#FAF8F5]/70">Sign in with your Supabase administrator credentials.</p>
          {authError && <p className="text-xs text-red-400">{authError}</p>}
          <input
            type="email"
            required
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#121212] border border-white/15 rounded text-sm"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#121212] border border-white/15 rounded text-sm"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#E5C659] text-[#121212] text-xs font-semibold uppercase tracking-widest rounded"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#121212] p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#121212]/15 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">ENI&apos;S EMPIRE — Atelier Admin</h1>
          <p className="text-xs text-[#121212]/60">{session.user.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 rounded text-xs uppercase tracking-widest ${
              tab === 'products' ? 'bg-[#121212] text-[#E5C659]' : 'bg-white border'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 rounded text-xs uppercase tracking-widest ${
              tab === 'orders' ? 'bg-[#121212] text-[#E5C659]' : 'bg-white border'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-3 py-2 rounded text-xs uppercase tracking-widest border border-red-600/40 text-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>

      {tab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-xl border space-y-3">
            <h2 className="font-serif text-xl">Publish New Garment</h2>
            <input
              type="text"
              required
              placeholder="Garment Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Collection (e.g., Signature, Bridal)"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <select
              value={fulfillmentType}
              onChange={(e) => setFulfillmentType(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm bg-white"
            >
              <option value="ready_to_wear">Ready-to-Wear</option>
              <option value="made_to_order">Made-to-Order</option>
            </select>
            <input
              type="number"
              required
              placeholder="Price in NGN (₦)"
              value={priceNgn}
              onChange={(e) => setPriceNgn(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <textarea
              rows={2}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#121212] text-[#E5C659] text-xs uppercase tracking-widest rounded"
            >
              {saving ? 'Publishing...' : 'Publish Garment'}
            </button>
          </form>

          <div className="space-y-3">
            <h2 className="font-serif text-xl">Published Catalog</h2>
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-xl border flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-serif text-lg">{p.name}</p>
                  <p className="text-xs text-[#121212]/60">
                    {p.collection} • {p.fulfillment_type} • ₦{Number(p.price_ngn).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="text-xs text-red-600 underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-[#121212]/60 bg-white p-6 rounded-xl border">No orders yet.</p>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="bg-white p-4 rounded-xl border space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-serif text-lg">{ord.customer_name}</p>
                  <p className="text-sm font-semibold">₦{Number(ord.total_ngn).toLocaleString()}</p>
                </div>
                <p className="text-xs text-[#121212]/70">
                  {ord.customer_phone} • {ord.customer_address}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
        }
              

