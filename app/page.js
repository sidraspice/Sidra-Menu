'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Search, ShoppingBag, Plus, Minus, Trash2, Share2, RefreshCw, X, Check, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201044760160";

export default function Home() {
  const [data, setData] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('كل المنتجات');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData({ products: json.products, categories: json.categories });
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return data.products.filter(item => {
      const matchesCat = selectedCategory === 'كل المنتجات' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [data.products, selectedCategory, search]);

  const openProductModal = (product) => {
    setActiveModalProduct(product);
    setSelectedVariant(product.variants[0] || null);
    setModalQty(1);
  };

  const addToCart = () => {
    if (!activeModalProduct || !selectedVariant) return;
    const itemKey = `${activeModalProduct.id}_${selectedVariant.weight}`;
    setCart(prev => {
      const exists = prev.find(i => i.key === itemKey);
      if (exists) {
        return prev.map(i => i.key === itemKey ? { ...i, qty: i.qty + modalQty } : i);
      }
      return [...prev, {
        key: itemKey,
        name: activeModalProduct.name,
        category: activeModalProduct.category,
        weight: selectedVariant.weight,
        price: selectedVariant.price,
        qty: modalQty
      }];
    });
    setActiveModalProduct(null);
  };

  const updateCartQty = (key, delta) => {
    setCart(prev => prev.map(item => {
      if (item.key === key) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'عطارة سدرة بدمنهور',
          text: 'قائمة منتجات وأسعار عطارة سدرة بدمنهور',
          url: window.location.href,
        });
      } catch (err) {
        // user cancelled share
      }
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;
    let message = `*طلب جديد من عطارة سدرة بدمنهور:*\n\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}- ${item.name} (${item.weight}) × ${item.qty} = ${(item.price * item.qty).toFixed(2)} جنيه\n`;
    });
    message += `\n*الإجمالي النهائي:* ${totalAmount} جنيه`;
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen pb-28 text-slate-800 selection:bg-brand-accent selection:text-white">
      {/* Header */}
      <header className="bg-brand-dark text-white pt-6 pb-8 px-4 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-3 bg-white p-2 rounded-full shadow-md border-2 border-brand-accent flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="عطارة سدرة بدمنهور" width={80} height={80} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-[#e8e2d5]">عطارة سدرة بدمنهور</h1>
          <p className="text-xs text-[#c89d56] mt-1.5 font-medium max-w-sm">
            بهارات وتوابل وأعشاب مختارة بعناية — طحن وتجهيز حسب الطلب
          </p>
        </div>
      </header>

      {/* Search & Main Content */}
      <main className="max-w-xl mx-auto px-4 -mt-5">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-md p-2 flex items-center gap-2 border border-brand-border mb-4">
          <Search className="w-5 h-5 text-brand-light mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full bg-transparent focus:outline-none text-sm font-semibold text-brand-dark"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Bar */}
        {!loading && !error && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {data.categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-white text-brand-dark border border-brand-border hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Status Handling */}
        {loading && (
          <div className="text-center py-16 text-brand-primary font-bold">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-accent" />
            جاري تحميل قائمة الأسعار والمنتجات...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl text-center my-8">
            <p className="text-sm font-bold mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="bg-brand-primary text-white text-xs px-4 py-2 rounded-lg font-bold inline-flex items-center gap-1 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className="bg-white rounded-2xl p-3 border border-brand-border shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition active:scale-[0.98]"
              >
                <div>
                  <span className="text-[10px] text-brand-accent font-bold bg-[#fbf9f4] px-2 py-0.5 rounded-md border border-brand-border">
                    {product.category}
                  </span>
                  <h3 className="font-bold text-sm text-brand-dark mt-2 mb-2 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                </div>

                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-2">
                    {product.variants.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] py-0.5 border-t border-slate-50">
                        <span>{v.weight}</span>
                        <span className="font-bold text-brand-primary">{v.price} ج.م</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full bg-brand-primary text-white text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm hover:bg-brand-dark">
                    <Plus className="w-3.5 h-3.5" /> اختيار
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-bold text-sm">
            لا توجد منتجات مطابقة لعملية البحث
          </div>
        )}
      </main>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-brand-border z-40">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex-1 bg-brand-dark text-white p-3 rounded-2xl font-bold flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-brand-accent" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs">سلة الطلبات</span>
            </div>
            <span className="text-xs text-brand-accent font-black">{totalAmount} جنيه</span>
          </button>

          <button
            onClick={handleShare}
            className="p-3 bg-brand-bg border border-brand-border rounded-2xl text-brand-dark hover:bg-slate-100 flex items-center justify-center"
            title="مشاركة المنيو"
          >
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Product Options Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-brand-accent">{activeModalProduct.category}</span>
                <h2 className="text-lg font-black text-brand-dark">{activeModalProduct.name}</h2>
              </div>
              <button onClick={() => setActiveModalProduct(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 block mb-2">اختر الوزن:</label>
              <div className="grid grid-cols-2 gap-2">
                {activeModalProduct.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl border text-right transition ${
                      selectedVariant?.weight === variant.weight
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-dark font-bold ring-2 ring-brand-primary/20'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs">{variant.weight}</div>
                    <div className="text-sm font-black text-brand-primary mt-1">{variant.price} ج.م</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 bg-brand-bg p-3 rounded-xl border border-brand-border">
              <span className="text-xs font-bold text-slate-700">الكمية المطلوبة:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-brand-border flex items-center justify-center font-bold text-brand-dark shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm text-brand-dark w-4 text-center">{modalQty}</span>
                <button
                  onClick={() => setModalQty(modalQty + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-brand-border flex items-center justify-center font-bold text-brand-dark shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={addToCart}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brand-dark transition"
            >
              أضف إلى الطلب — {((selectedVariant?.price || 0) * modalQty).toFixed(2)} ج.م
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md h-[80vh] rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-lg font-black text-brand-dark">سلة المشتريات</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[48vh] py-3 divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-sm">السلة فارغة حالياً</div>
                ) : (
                  cart.map(item => (
                    <div key={item.key} className="py-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-xs text-brand-dark">{item.name}</h4>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {item.weight} × {item.qty} = {(item.price * item.qty).toFixed(2)} ج.م
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.key, -1)}
                          className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700"
                        >
                          {item.qty === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.key, 1)}
                          className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>الإجمالي:</span>
                  <span className="text-brand-primary text-base font-black">{totalAmount} جنيه</span>
                </div>
                <button
                  onClick={sendWhatsAppOrder}
                  className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#1ebd5a] transition"
                >
                  <Phone className="w-4 h-4 fill-white" /> اطلب عبر WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
