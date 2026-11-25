'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Plus, Package, ShoppingCart, Trash2, Upload } from 'lucide-react';

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();

const CATEGORIES = [
  'Luxury Collection',
  'Abayas',
  'Corporate Wear',
  'Dresses',
  'Casual Wear',
  'Tops & Blouses',
];

export default function AdminHub() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [tab, setTab] = useState('orders'); // 'orders' | 'add' | 'catalog'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Luxury Collection',
    price_ngn: '',
    fulfillment_type: 'ready_to_wear',
    lead_time_days: '1-3 working days',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const userEmail = (session?.user?.email || '').toLowerCase().trim();
  const isAuthorizedAdmin = Boolean(session && ADMIN_EMAIL && userEmail === ADMIN_EMAIL);

  useEffect(() => {
    if (isAuthorizedAdmin) {
      loadDashboardData();
    }
  }, [isAuthorizedAdmin]);

  async function loadDashboardData() {
    const [{ data: ordersData }, { data: productsData }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setOrders(ordersData || []);
    setProducts(productsData || []);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setSavingProduct(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const filePath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('empire-media')
          .upload(filePath, imageFile);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('empire-media').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('products').insert([
        {
          name: newProduct.name,
          category: newProduct.category,
          price_ngn: Number(newProduct.price_ngn),
          fulfillment_type: newProduct.fulfillment_type,
          lead_time_days: newProduct.lead_time_days,
          description: newProduct.description,
          image_url: imageUrl,
          in_stock: true,
        },
      ]);

      if (error) throw error;

      setNewProduct({
        name: '',
        category: 'Luxury Collection',
        price_ngn: '',
        fulfillment_type: 'ready_to_wear',
        lead_time_days: '1-3 working days',
        description: '',
      });
      setImageFile(null);
      await loadDashboardData();
      setTab('catalog');
    } catch (err) {
      alert('Error adding product: ' + err.message);
    } finally {
      setSavingProduct(false);
    }
  }

  async function updateOrderStatus(orderId, status) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    loadDashboardData();
  }

  async function toggleStock(product) {
    await supabase.from('products').update({ in_stock: !product.in_stock }).eq('id', product.id);
    loadDashboardData();
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this item?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadDashboardData();
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm">Loading...</div>;
  }

  // Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#FAF8F5] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-[#1A1A1A] border border-[#C5A059]/30 rounded-xl p-6 space-y-4"
        >
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059]">Admin Access</p>
            <h1 className="font-serif text-2xl mt-1">ENI&apos;S EMPIRE</h1>
          </div>

          {authError && (
            <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded">{authError}</p>
          )}

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
            className="w-full py-3 bg-[#C5A059] text-[#121212] text-xs uppercase tracking-widest font-bold rounded"
          >
            Enter Admin Hub
          </button>
        </form>
      </div>
    );
  }

  // Wrong Email Guard
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h1 className="font-serif text-2xl">Unauthorized Account</h1>
        <p className="text-sm text-[#121212]/70">
          Signed in as <strong>{session.user.email}</strong>, which does not match your authorized admin email.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-5 py-2.5 bg-[#121212] text-[#C5A059] text-xs uppercase rounded"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-16">
      {/* Admin Top Bar */}
      <header className="bg-[#121212] text-[#FAF8F5] px-4 h-14 flex items-center justify-between">
        <span className="font-serif text-lg tracking-widest text-[#C5A059]">EMPIRE ADMIN</span>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs underline text-[#FAF8F5]/80">
            View Store
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 text-[#C5A059]"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3 Mobile Tabs */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-lg border border-[#121212]/10">
          <button
            onClick={() => setTab('orders')}
            className={`py-2 text-xs font-semibold rounded flex items-center justify-center gap-1.5 ${
              tab === 'orders' ? 'bg-[#121212] text-[#C5A059]' : 'text-[#121212]/70'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab('add')}
            className={`py-2 text-xs font-semibold rounded flex items-center justify-center gap-1.5 ${
              tab === 'add' ? 'bg-[#121212] text-[#C5A059]' : 'text-[#121212]/70'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Piece
          </button>
          <button
            onClick={() => setTab('catalog')}
            className={`py-2 text-xs font-semibold rounded flex items-center justify-center gap-1.5 ${
              tab === 'catalog' ? 'bg-[#121212] text-[#C5A059]' : 'text-[#121212]/70'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Catalog ({products.length})
          </button>
        </div>

        {/* TAB 1: ORDERS & MEASUREMENTS */}
        {tab === 'orders' && (
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-center py-12 text-[#121212]/60">No orders yet.</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-[#121212]/10 space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm">{order.customer_name}</h3>
                      <p className="text-xs text-[#121212]/65">{order.customer_phone}</p>
                      <p className="text-xs text-[#121212]/65">{order.delivery_address}</p>
                    </div>
                    <span className="font-bold text-sm">
                      ₦{Number(order.total_ngn).toLocaleString()}
                    </span>
                  </div>

                  {/* Items & Measurements */}
                  <div className="bg-[#FAF8F5] p-2.5 rounded text-xs space-y-1">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx}>
                        <strong>{it.name}</strong> —{' '}
                        {it.fulfillment_type === 'made_to_order'
                          ? `Bespoke (Bust: ${it.measurements?.bust}, Waist: ${it.measurements?.waist}, Hip: ${it.measurements?.hip}, Length: ${it.measurements?.length}) ${
                              it.measurements?.notes ? `[Note: ${it.measurements.notes}]` : ''
                            }`
                          : `Ready-to-Wear (Size ${it.size})`}
                      </div>
                    ))}
                  </div>

                  {/* Receipt & Status Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {order.payment_proof_url ? (
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#C5A059] underline"
                      >
                        View Payment Receipt
                      </a>
                    ) : (
                      <span className="text-xs text-[#121212]/50">
                        Method: {order.payment_method}
                      </span>
                    )}

                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-xs border border-[#121212]/20 rounded px-2.5 py-1.5 bg-white font-medium"
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_production">In Production</option>
                      <option value="shipped">Shipped / Delivered</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADD PRODUCT */}
        {tab === 'add' && (
          <form
            onSubmit={handleAddProduct}
            className="mt-4 bg-white p-5 rounded-xl border border-[#121212]/10 space-y-3.5"
          >
            <h2 className="font-serif text-xl">Publish New Garment</h2>

            <input
              type="text"
              required
              placeholder="Garment Name (e.g. Zaria Silk Abaya)"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-[#121212]/20 rounded text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#121212]/20 rounded text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                type="number"
                required
                placeholder="Price in NGN (e.g. 65000)"
                value={newProduct.price_ngn}
                onChange={(e) => setNewProduct({ ...newProduct, price_ngn: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#121212]/20 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={newProduct.fulfillment_type}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    fulfillment_type: e.target.value,
                    lead_time_days:
                      e.target.value === 'made_to_order' ? '7-10 working days' : '1-3 working days',
                  })
                }
                className="w-full px-3 py-2.5 border border-[#121212]/20 rounded text-sm bg-white"
              >
                <option value="ready_to_wear">Ready-to-Wear</option>
                <option value="made_to_order">Made-to-Order (Bespoke)</option>
              </select>

              <input
                type="text"
                placeholder="Lead Time"
                value={newProduct.lead_time_days}
                onChange={(e) => setNewProduct({ ...newProduct, lead_time_days: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#121212]/20 rounded text-sm"
              />
            </div>

            <label className="flex items-center gap-2 px-3 py-3 bg-[#FAF8F5] border border-dashed border-[#121212]/30 rounded cursor-pointer text-xs">
              <Upload className="w-4 h-4 text-[#C5A059]" />
              <span>{imageFile ? imageFile.name : 'Select Garment Photo from Phone'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={savingProduct}
              className="w-full py-3 bg-[#121212] text-[#C5A059] text-xs uppercase tracking-widest font-semibold rounded disabled:opacity-50"
            >
              {savingProduct ? 'Publishing...' : 'Publish to Storefront'}
            </button>
          </form>
        )}

        {/* TAB 3: MANAGE CATALOG */}
        {tab === 'catalog' && (
          <div className="mt-4 space-y-2.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-xl border border-[#121212]/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-12 h-14 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-serif text-base font-medium">{p.name}</h3>
                    <p className="text-xs text-[#121212]/60">
                      {p.category} &bull; ₦{Number(p.price_ngn).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStock(p)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-semibold rounded ${
                      p.in_stock
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {p.in_stock ? 'In Stock' : 'Sold Out'}
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-1.5 text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
