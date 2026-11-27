'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Ruler, X, Upload, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Luxury Collection',
  'Abayas',
  'Corporate Wear',
  'Dresses',
  'Casual Wear',
  'Tops & Blouses',
];

const BANK_DETAILS = {
  bankName: 'GTBank / Access Bank (Update in Admin)',
  accountName: "ENI'S EMPIRE",
  accountNumber: '0123456789',
};

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);

  // Made-to-Order Measurement Drawer State
  const [bespokeProduct, setBespokeProduct] = useState(null);
  const [measurements, setMeasurements] = useState({
    bust: '',
    waist: '',
    hip: '',
    length: '',
    notes: '',
  });

  // Checkout State
  const [checkoutStep, setCheckoutStep] = useState('bag'); // 'bag' | 'checkout' | 'done'
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'bank_transfer',
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  function addReadyToWear(product, size = 'M') {
    setCart((prev) => [
      ...prev,
      {
        cartId: `${product.id}-${Date.now()}`,
        id: product.id,
        name: product.name,
        price_ngn: product.price_ngn,
        fulfillment_type: 'ready_to_wear',
        size,
        image_url: product.image_url,
      },
    ]);
    setBagOpen(true);
    setCheckoutStep('bag');
  }

  function addMadeToOrder(e) {
    e.preventDefault();
    if (!bespokeProduct) return;
    setCart((prev) => [
      ...prev,
      {
        cartId: `${bespokeProduct.id}-${Date.now()}`,
        id: bespokeProduct.id,
        name: bespokeProduct.name,
        price_ngn: bespokeProduct.price_ngn,
        fulfillment_type: 'made_to_order',
        measurements: { ...measurements },
        image_url: bespokeProduct.image_url,
      },
    ]);
    setBespokeProduct(null);
    setMeasurements({ bust: '', waist: '', hip: '', length: '', notes: '' });
    setBagOpen(true);
    setCheckoutStep('bag');
  }

  function removeFromCart(cartId) {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }

  const totalNgn = cart.reduce((sum, item) => sum + Number(item.price_ngn || 0), 0);

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      let paymentProofUrl = null;

      if (customer.paymentMethod === 'bank_transfer' && receiptFile) {
        const ext = receiptFile.name.split('.').pop();
        const filePath = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('empire-media')
          .upload(filePath, receiptFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('empire-media')
            .getPublicUrl(filePath);
          paymentProofUrl = publicUrlData.publicUrl;
        }
      }

      const combinedMeasurements = cart
        .filter((i) => i.fulfillment_type === 'made_to_order')
        .map((i) => ({ item: i.name, ...i.measurements }));

      const { error } = await supabase.from('orders').insert([
        {
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          delivery_address: customer.address,
          items: cart,
          measurements: combinedMeasurements.length > 0 ? combinedMeasurements : null,
          total_ngn: totalNgn,
          payment_method: customer.paymentMethod,
          payment_proof_url: paymentProofUrl,
          status: 'pending_payment',
        },
      ]);

      if (error) throw error;

      setCart([]);
      setReceiptFile(null);
      setCheckoutStep('done');
    } catch (err) {
      alert('Could not place order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Editorial Header */}
      <header className="sticky top-0 z-30 bg-[#121212] text-[#FAF8F5] border-b border-[#C5A059]/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-serif text-xl sm:text-2xl tracking-[0.22em] font-semibold">
            ENI&apos;S EMPIRE
          </a>

          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xs uppercase tracking-widest text-[#C5A059] hover:underline"
            >
              Admin
            </a>
            <button
              onClick={() => {
                setBagOpen(true);
                setCheckoutStep('bag');
              }}
              className="relative p-2 text-[#FAF8F5] hover:text-[#C5A059] transition"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C5A059] text-[#121212] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Luxury Hero Banner */}
      <section className="bg-[#121212] text-[#FAF8F5] px-4 py-14 sm:py-20 text-center border-b border-[#C5A059]/20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#C5A059] mb-3">
          Abuja &bull; Nationwide Delivery
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-wide max-w-2xl mx-auto leading-tight">
          Timeless Silhouettes, Tailored to Your Presence.
        </h1>
        <p className="mt-4 text-sm text-[#FAF8F5]/75 max-w-md mx-auto">
          Explore curated Ready-to-Wear staples or commission bespoke Made-to-Order pieces crafted to your exact measurements.
        </p>
      </section>

      {/* Thumb-Friendly Category Filter Bar */}
      <nav className="sticky top-16 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#121212]/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 text-xs uppercase tracking-wider rounded-full transition ${
                  active
                    ? 'bg-[#121212] text-[#C5A059] font-semibold'
                    : 'bg-white text-[#121212]/80 border border-[#121212]/15 hover:border-[#C5A059]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Product Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[3/4] bg-[#121212]/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#121212]/10 p-6">
            <Sparkles className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
            <h2 className="font-serif text-2xl">New Collection Arriving Soon</h2>
            <p className="text-sm text-[#121212]/65 mt-1 max-w-sm mx-auto">
              No pieces listed in {selectedCategory} yet. Sign in to your Admin Hub to publish your first garment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-7">
            {filteredProducts.map((product) => {
              const isBespoke = product.fulfillment_type === 'made_to_order';
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg overflow-hidden border border-[#121212]/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[3/4] bg-[#121212]/5 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-sm text-[#121212]/40">
                          ENI&apos;S EMPIRE
                        </div>
                      )}
                      <span
                        className={`absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded ${
                          isBespoke
                            ? 'bg-[#121212] text-[#C5A059]'
                            : 'bg-[#FAF8F5]/95 text-[#121212]'
                        }`}
                      >
                        {isBespoke ? 'Made-to-Order' : 'Ready-to-Wear'}
                      </span>
                    </div>

                    <div className="p-3.5">
                      <p className="text-[10px] uppercase tracking-widest text-[#121212]/50">
                        {product.category}
                      </p>
                      <h3 className="font-serif text-lg sm:text-xl font-medium mt-0.5 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-sm font-semibold text-[#121212] mt-1">
                        ₦{Number(product.price_ngn).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#121212]/60 mt-1">
                        Dispatch: {product.lead_time_days || '1-3 working days'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 pt-0">
                    {isBespoke ? (
                      <button
                        onClick={() => setBespokeProduct(product)}
                        className="w-full py-2.5 px-3 bg-[#121212] text-[#C5A059] text-xs uppercase tracking-wider font-semibold rounded flex items-center justify-center gap-1.5 hover:bg-[#121212]/90 transition"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                        Enter Measurements
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        {(product.sizes || ['S', 'M', 'L', 'XL']).slice(0, 4).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => addReadyToWear(product, sz)}
                            className="flex-1 py-2 text-xs font-medium border border-[#121212]/20 rounded hover:bg-[#121212] hover:text-[#FAF8F5] transition"
                            title={`Add Size ${sz}`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Private Measurement Drawer (Made-to-Order) */}
      {bespokeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#121212]/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-semibold">
                  Private Atelier Fit
                </span>
                <h3 className="font-serif text-2xl">{bespokeProduct.name}</h3>
              </div>
              <button onClick={() => setBespokeProduct(null)} className="p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addMadeToOrder} className="mt-4 space-y-3.5">
              <p className="text-xs text-[#121212]/70">
                Enter your measurements in inches. Your measurements are shared privately only with the ENI&apos;S EMPIRE atelier.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'bust', label: 'Bust (in)' },
                  { key: 'waist', label: 'Waist (in)' },
                  { key: 'hip', label: 'Hip (in)' },
                  { key: 'length', label: 'Full Length (in)' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium mb-1">{field.label}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 36"
                      value={measurements[field.key]}
                      onChange={(e) =>
                        setMeasurements({ ...measurements, [field.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#121212]/20 rounded text-sm"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Styling / Height / Sleeve Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="E.g. 5'7 height, prefer ankle-length or modest neckline..."
                  value={measurements.notes}
                  onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#121212]/20 rounded text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#121212] text-[#C5A059] text-xs uppercase tracking-widest font-semibold rounded"
              >
                Add Custom Piece — ₦{Number(bespokeProduct.price_ngn).toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shopping Bag & Checkout Drawer */}
      {bagOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="bg-[#FAF8F5] w-full max-w-md h-full flex flex-col justify-between p-5 overflow-y-auto
              <div>
        <div className="flex items-center justify-between border-b border-[#121212]/10 pb-3">
          <h2 className="font-serif text-2xl">
            {checkoutStep === 'bag'
              ? 'Your Shopping Bag'
              : checkoutStep === 'checkout'
              ? 'Delivery & Payment'
              : 'Order Received'}
          </h2>
          <button onClick={() => setBagOpen(false)} className="p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {checkoutStep === 'done' ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="font-serif text-2xl">Thank You for Choosing ENI'S EMPIRE</h3>
            <p className="text-sm text-[#121212]/70">
              We have received your order and payment details. Our team will confirm via WhatsApp or phone shortly.
            </p>
            <button
              onClick={() => setBagOpen(false)}
              className="mt-4 px-6 py-2.5 bg-[#121212] text-[#E5C659] text-xs uppercase tracking-widest rounded"
            >
              Continue Shopping
            </button>
          </div>
        ) : checkoutStep === 'bag' ? (
          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-[#121212]/60 py-12 text-center">
                Your bag is currently empty.
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="bg-white p-3 rounded-lg border border-[#121212]/10 flex justify-between items-start"
                >
                  <div>
                    <p className="font-serif text-lg leading-tight">{item.name}</p>
                    <p className="text-xs text-[#121212]/60 mt-0.5">
                      {item.fulfillment_type === 'made_to_order'
                        ? `Custom Fit (B:${item.measurements.bust} W:${item.measurements.waist} H:${item.measurements.hips})`
                        : `Ready-to-Wear • Size ${item.size}`}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      ₦{Number(item.price_ngn).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-xs text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="mt-4 space-y-3">
            <input
              type="text"
              required
              placeholder="Full Name"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-[#121212]/20 rounded text-sm"
            />
            <input
              type="tel"
              required
              placeholder="Phone / WhatsApp Number"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-[#121212]/20 rounded text-sm"
            />
            <textarea
              required
              rows={2}
              placeholder="Delivery Address (City, State & Street)"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-[#121212]/20 rounded text-sm"
            />
            <button
              type="submit"
              disabled={submittingOrder}
              className="w-full py-3 bg-[#121212] text-[#E5C659] text-xs uppercase tracking-widest rounded disabled:opacity-50"
            >
              {submittingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
                }
