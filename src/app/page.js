'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, X, CheckCircle2, Sparkles, Ruler } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [unit, setUnit] = useState('in');
  const [measurements, setMeasurements] = useState({ bust: '', waist: '', hips: '', length: '' });
  const [cart, setCart] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('bag');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  const collections = ['All', ...new Set(products.map((p) => p.collection).filter(Boolean))];
  const filteredProducts =
    selectedCollection === 'All'
      ? products
      : products.filter((p) => p.collection === selectedCollection);

  function openProductModal(product) {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[0] || 'M');
    setMeasurements({ bust: '', waist: '', hips: '', length: '' });
  }

  function addToCart() {
    if (!selectedProduct) return;
    if (
      selectedProduct.fulfillment_type === 'made_to_order' &&
      (!measurements.bust || !measurements.waist || !measurements.hips)
    ) {
      alert('Please enter your Bust, Waist, and Hips measurements.');
      return;
    }

    const item = {
      ...selectedProduct,
      cartId: `${selectedProduct.id}-${Date.now()}`,
      size: selectedSize,
      measurements: { ...measurements, unit },
    };

    setCart((prev) => [...prev, item]);
    setSelectedProduct(null);
    setCheckoutStep('bag');
    setBagOpen(true);
  }

  function removeFromCart(cartId) {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }

  const totalNgn = cart.reduce((sum, item) => sum + Number(item.price_ngn || 0), 0);

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmittingOrder(true);

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        items: cart,
        total_ngn: totalNgn,
      },
    ]);

    setSubmittingOrder(false);
    if (error) {
      alert('Could not submit order. Please try again.');
      return;
    }

    setCart([]);
    setCustomer({ name: '', phone: '', address: '' });
    setCheckoutStep('done');
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#121212] font-sans">
      <header className="sticky top-0 z-30 bg-[#121212] text-[#FAF8F5] border-b border-[#E5C659]/25">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl tracking-[0.2em] text-[#E5C659]">
              ENI&apos;S EMPIRE
            </h1>
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#FAF8F5]/70">
              Luxury Ready-to-Wear &amp; Bespoke
            </p>
          </div>
          <button
            onClick={() => {
              setCheckoutStep('bag');
              setBagOpen(true);
            }}
            className="relative flex items-center gap-2 px-3.5 py-2 border border-[#E5C659]/50 rounded text-xs uppercase tracking-widest text-[#E5C659] hover:bg-[#E5C659] hover:text-[#121212] transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag ({cart.length})</span>
          </button>
        </div>
      </header>

      <section className="bg-[#121212] text-[#FAF8F5] py-14 px-4 text-center border-b border-[#E5C659]/20">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-[#E5C659]">
            <Sparkles className="w-3.5 h-3.5" />
            Atelier &amp; Boutique
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-tight">
            All you need to do is pick a style and we will make it happen.
          </h2>
          <p className="text-sm text-[#FAF8F5]/75 max-w-lg mx-auto">
            Explore curated Ready-to-Wear pieces or commission a Made-to-Order silhouette tailored to your exact measurements.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {collections.map((col) => (
            <button
              key={col}
              onClick={() => setSelectedCollection(col)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest whitespace-nowrap transition ${
                selectedCollection === col
                  ? 'bg-[#121212] text-[#E5C659]'
                  : 'bg-white border border-[#121212]/15 text-[#121212]/80 hover:border-[#121212]'
              }`}
            >
              {col}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-20 text-sm text-[#121212]/60">Loading collection...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#121212]/10 p-6">
            <p className="font-serif text-2xl">New Pieces Arriving Soon</p>
            <p className="text-sm text-[#121212]/60 mt-2">
              Sign in at <span className="font-mono">/admin</span> to publish your first garment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden border border-[#121212]/10 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[3/4] bg-[#121212]/5 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-[#121212]/40">
                        ENI&apos;S EMPIRE
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#121212]/90 text-[#E5C659] text-[10px] uppercase tracking-widest rounded">
                      {product.fulfillment_type === 'made_to_order' ? 'Made-to-Order' : 'Ready-to-Wear'}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-widest text-[#121212]/50">
                      {product.collection}
                    </p>
                    <h3 className="font-serif text-xl mt-0.5">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-[#121212]/70 mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-base font-semibold mt-3">
                      ₦{Number(product.price_ngn).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => openProductModal(product)}
                    className="w-full py-2.5 bg-[#121212] text-[#E5C659] text-xs uppercase tracking-widest rounded hover:opacity-90 transition"
                  >
                    {product.fulfillment_type === 'made_to_order' ? 'Customize & Order' : 'Select Size'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-2xl">{selectedProduct.name}</h3>
                <p className="text-sm font-semibold text-[#121212]/80">
                  ₦{Number(selectedProduct.price_ngn).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedProduct.fulfillment_type === 'made_to_order' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest flex items-center gap-1.5 font-medium">
                    <Ruler className="w-3.5 h-3.5" /> Custom Measurements
                  </span>
                  <div className="flex border border-[#121212]/20 rounded overflow-hidden text-xs">
                    {['in', 'cm'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-2.5 py-1 uppercase ${
                          unit === u ? 'bg-[#121212] text-[#E5C659]' : 'bg-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {['bust', 'waist', 'hips', 'length'].map((field) => (
                    <input
                      key={field}
                      type="number"
                      step="0.1"
                      placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} (${unit})`}
                      value={measurements[field]}
                      onChange={(e) => setMeasurements({ ...measurements, [field]: e.target.value })}
                      className="px-3 py-2 bg-white border border-[#121212]/20 rounded text-sm"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest font-medium">Select Size</p>
                <div className="flex gap-2 flex-wrap">
                  {(selectedProduct.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded border text-xs font-medium ${
                        selectedSize === sz
                          ? 'bg-[#121212] text-[#E5C659] border-[#121212]'
                          : 'bg-white border-[#121212]/20'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={addToCart}
              className="w-full py-3 bg-[#121212] text-[#E5C659] text-xs uppercase tracking-widest rounded"
            >
              Add to Bag
            </button>
          </div>
        </div>
      )}

      {bagOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="bg-[#FAF8F5] w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto">
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
                  <h3 className="font-serif text-2xl">Thank You for Choosing ENI&apos;S EMPIRE</h3>
                  <p className="text-sm text-[#121212]/70">
                    We have received your order details. Our team will confirm via WhatsApp or phone shortly.
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
                              ? `Custom Fit (${item.measurements.unit}: B:${item.measurements.bust} W:${item.measurements.waist} H:${item.measurements.hips})`
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

            {checkoutStep === 'bag' && cart.length > 0 && (
              <div className="border-t border-[#121212]/10 pt-4 space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>₦{totalNgn.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setCheckoutStep('checkout')}
                  className="w-full py-3 bg-[#121212] text-[#E5C659] text-xs uppercase tracking-widest rounded"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
  
