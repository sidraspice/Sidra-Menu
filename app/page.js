'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShoppingBag, Plus, Minus, Trash2, RefreshCw, X, Check, Phone, 
  ArrowRight, User, MapPin, FileText, AlertCircle, ChevronRight 
} from 'lucide-react';

const WHATSAPP_NUMBER = "201044760160";

export default function Home() {
  const [data, setData] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('كل المنتجات');
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  // Checkout & Review State
  const [currentStep, setCurrentStep] = useState('shop');
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

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

  // LocalStorage Cart Sync
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sedra_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading cart from storage', e);
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      try {
        localStorage.setItem('sedra_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Error saving cart to storage', e);
      }
    }
  }, [cart, isCartLoaded]);

  const filteredProducts = useMemo(() => {
    return data.products.filter(item => {
      const matchesCat = selectedCategory === 'كل المنتجات' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
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

  const removeCartItem = (key) => {
    setCart(prev => prev.filter(item => item.key !== key));
  };

  const clearEntireCart = () => {
    setCart([]);
    setShowClearConfirm(false);
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const validateForm = () => {
    const errors = {};
    if (!customer.name.trim()) {
      errors.name = 'يرجى إدخال الاسم الكامل';
    }
    const cleanPhone = customer.phone.replace(/\s+/g, '');
    if (!cleanPhone) {
      errors.phone = 'يرجى إدخال رقم الهاتف';
    } else if (!/^01[0125][0-9]{8}$/.test(cleanPhone) && cleanPhone.length < 10) {
      errors.phone = 'يرجى إدخال رقم هاتف صحيح (مثال: 01012345678)';
    }
    if (!customer.address.trim()) {
      errors.address = 'يرجى إدخال العنوان بالتفصيل';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setCurrentStep('review');
    }
  };

  const handleSendWhatsAppOrder = () => {
    let message = `*طلب جديد - عطارة سدرة بدمنهور*\n\n`;
    message += `*بيانات العميل:*\n`;
    message += `الاسم: ${customer.name.trim()}\n`;
    message += `الهاتف: ${customer.phone.trim()}\n`;
    message += `العنوان: ${customer.address.trim()}\n`;
    if (customer.notes.trim()) {
      message += `ملاحظات: ${customer.notes.trim()}\n`;
    }
    message += `\n*تفاصيل الطلب:*\n`;
    
    cart.forEach((item, index) => {
      const itemTotal = (item.price * item.qty).toFixed(2);
      message += `\n${index + 1}- ${item.name}\n`;
      message += `الوزن: ${item.weight}\n`;
      message += `الكمية: ${item.qty}\n`;
      message += `السعر: ${item.price} جنيه\n`;
      message += `الإجمالي: ${itemTotal} جنيه\n`;
    });

    message += `\n*إجمالي الطلب:* ${totalAmount} جنيه`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen pb-32 text-slate-800 selection:bg-brand-accent selection:text-white bg-[#fbf9f4]">
      {/* Big Full-Width Logo Header */}
      <header className="pt-6 pb-2 px-4 text-center max-w-xl mx-auto flex flex-col items-center">
        <div className="w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center mb-2">
          <img 
            src="/logo.png" 
            alt="عطارة سدرة بدمنهور" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-wide">
          عطارة سدرة بدمنهور
        </h1>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 mt-2">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xs p-2.5 flex items-center gap-2 border border-brand-border mb-4">
          <Search className="w-5 h-5 text-brand-light mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full bg-transparent focus:outline-none text-sm font-semibold text-brand-dark"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Grid (NO Horizontal Scroll) */}
        {!loading && !error && data.categories.length > 0 && (
          <div className="mb-5">
            <div className="text-xs font-black text-brand-dark mb-2 flex items-center gap-1.5">
              <span>الأقسام والتصنيفات</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {data.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center min-h-[44px] shadow-2xs active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-brand-primary text-white shadow-sm ring-2 ring-brand-primary/20'
                      : 'bg-white text-brand-dark border border-brand-border hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {loading && (
          <div className="text-center py-16 text-brand-primary font-bold">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-brand-accent" />
            جاري تحميل قائمة الأسعار...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center my-6 shadow-xs">
            <p className="text-xs font-bold mb-2.5">{error}</p>
            <button
              onClick={fetchData}
              className="bg-brand-primary text-white text-xs px-3.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 shadow"
            >
              <RefreshCw className="w-3 h-3" /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-bold text-slate-500">
                {selectedCategory} ({filteredProducts.length} منتج)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  className="bg-white rounded-2xl p-3 border border-brand-border shadow-2xs flex flex-col justify-between cursor-pointer hover:shadow-sm transition active:scale-[0.98]"
                >
                  <div>
                    <span className="text-[10px] text-brand-accent font-bold bg-[#fbf9f4] px-1.5 py-0.5 rounded border border-brand-border inline-block mb-1">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-brand-dark mb-2 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold mb-2.5">
                      {product.variants.map((v, i) => (
                        <div key={i} className="flex justify-between items-center py-0.5 border-t border-slate-50">
                          <span>{v.weight}</span>
                          <span className="font-bold text-brand-primary">{v.price} ج.م</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full bg-brand-primary text-white text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 shadow-2xs hover:bg-brand-dark transition">
                      <Plus className="w-3.5 h-3.5" /> اختيار
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-14 text-slate-400 font-bold text-xs">
            لا توجد منتجات مطابقة لعملية البحث
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-brand-border z-30 shadow-md">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentStep('cart');
              setIsCartOpen(true);
            }}
            className="w-full bg-brand-dark text-white p-3 rounded-2xl font-bold flex items-center justify-between shadow-md active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-brand-accent" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-brand-accent text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold">سلة الطلبات</span>
            </div>
            <span className="text-xs text-brand-accent font-black">{totalAmount} جنيه</span>
          </button>
        </div>
      </div>

      {/* Product Selection Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-brand-accent">{activeModalProduct.category}</span>
                <h2 className="text-base font-black text-brand-dark">{activeModalProduct.name}</h2>
              </div>
              <button onClick={() => setActiveModalProduct(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3.5">
              <label className="text-xs font-bold text-slate-600 block mb-1.5">الأوزان المتاحة:</label>
              <div className="grid grid-cols-2 gap-2">
                {activeModalProduct.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      selectedVariant?.weight === variant.weight
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-dark font-bold ring-2 ring-brand-primary/20'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{variant.weight}</div>
                    <div className="text-xs font-black text-brand-primary mt-0.5">{variant.price} ج.م</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-5 bg-brand-bg p-3 rounded-xl border border-brand-border">
              <span className="text-xs font-bold text-slate-700">الكمية المطلوبة:</span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-brand-border flex items-center justify-center font-bold text-brand-dark shadow-2xs"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-sm text-brand-dark w-5 text-center">{modalQty}</span>
                <button
                  onClick={() => setModalQty(modalQty + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-brand-border flex items-center justify-center font-bold text-brand-dark shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <button
              onClick={addToCart}
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold text-xs shadow-md hover:bg-brand-dark transition"
            >
              إضافة للسلة — {((selectedVariant?.price || 0) * modalQty).toFixed(2)} ج.م
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-[88vh] rounded-t-[2rem] sm:rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
            
            {/* Header of Drawer */}
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  {currentStep !== 'cart' && (
                    <button 
                      onClick={() => setCurrentStep(currentStep === 'review' ? 'checkout' : 'cart')} 
                      className="p-1 text-slate-500 hover:text-brand-dark ml-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <h2 className="text-sm font-black text-brand-dark">
                    {currentStep === 'cart' && 'سلة المشتريات'}
                    {currentStep === 'checkout' && 'بيانات توصيل الطلب'}
                    {currentStep === 'review' && 'مراجعة الطلب قبل الإرسال'}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  {currentStep === 'cart' && cart.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-0.5 bg-red-50 rounded-lg border border-red-100"
                    >
                      مسح السلة
                    </button>
                  )}
                  <button onClick={() => setIsCartOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step 1: Cart Items */}
              {currentStep === 'cart' && (
                <div className="overflow-y-auto max-h-[56vh] py-2.5 divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <div className="text-center py-14 text-slate-400 font-bold text-xs">
                      السلة فارغة حالياً
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.key} className="py-2.5 flex justify-between items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-brand-dark leading-snug">{item.name}</h4>
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            {item.weight} — <span className="text-brand-primary font-bold">{item.price} ج.م</span>
                          </div>
                          <div className="text-[10px] text-brand-accent font-bold mt-0.5">
                            الإجمالي: {(item.price * item.qty).toFixed(2)} ج.م
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateCartQty(item.key, -1)}
                            className="w-6.5 h-6.5 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center text-brand-dark">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.key, 1)}
                            className="w-6.5 h-6.5 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeCartItem(item.key)}
                            className="w-6.5 h-6.5 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 mr-1"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Step 2: Customer Checkout Form */}
              {currentStep === 'checkout' && (
                <form id="checkout-form" onSubmit={handleProceedToReview} className="overflow-y-auto max-h-[58vh] py-2.5 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-brand-primary" />
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="أدخل اسمك بالكامل"
                      className={`w-full p-2 text-xs font-semibold rounded-xl border ${
                        formErrors.name ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-brand-primary'
                      } outline-none`}
                    />
                    {formErrors.name && <span className="text-[10px] text-red-500 font-bold mt-0.5 block">{formErrors.name}</span>}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-brand-primary" />
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="01012345678"
                      className={`w-full p-2 text-xs font-semibold rounded-xl border text-right ${
                        formErrors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-brand-primary'
                      } outline-none`}
                    />
                    {formErrors.phone && <span className="text-[10px] text-red-500 font-bold mt-0.5 block">{formErrors.phone}</span>}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-primary" />
                      العنوان بالتفصيل <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="المحافظة - المدينة - المنطقة - الشارع - رقم المنزل"
                      className={`w-full p-2 text-xs font-semibold rounded-xl border ${
                        formErrors.address ? 'border-red-500 bg-red-50/50' : 'border-slate-200 focus:border-brand-primary'
                      } outline-none resize-none`}
                    />
                    {formErrors.address && <span className="text-[10px] text-red-500 font-bold mt-0.5 block">{formErrors.address}</span>}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-brand-primary" />
                      ملاحظات على الطلب (اختياري)
                    </label>
                    <textarea
                      rows={2}
                      value={customer.notes}
                      onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      placeholder="مثال: اتصل بي قبل التوصيل، بدون طحن، طحن ناعم..."
                      className="w-full p-2 text-xs font-semibold rounded-xl border border-slate-200 focus:border-brand-primary outline-none resize-none"
                    />
                  </div>
                </form>
              )}

              {/* Step 3: Order Review */}
              {currentStep === 'review' && (
                <div className="overflow-y-auto max-h-[58vh] py-2.5 space-y-3">
                  <div className="bg-brand-bg p-3 rounded-xl border border-brand-border">
                    <h4 className="text-xs font-black text-brand-dark mb-1.5 pb-1 border-b border-brand-border">
                      بيانات العميل والتوصيل:
                    </h4>
                    <div className="text-[11px] space-y-1 text-slate-700">
                      <div><strong className="text-brand-dark">الاسم:</strong> {customer.name}</div>
                      <div><strong className="text-brand-dark">الهاتف:</strong> {customer.phone}</div>
                      <div><strong className="text-brand-dark">العنوان:</strong> {customer.address}</div>
                      {customer.notes && (
                        <div><strong className="text-brand-dark">الملاحظات:</strong> {customer.notes}</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-black text-brand-dark mb-1.5 pb-1 border-b border-slate-100">
                      المنتجات المطلوبة:
                    </h4>
                    <div className="space-y-1.5 divide-y divide-slate-50">
                      {cart.map((item, idx) => (
                        <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-brand-dark">{item.name}</span>
                            <span className="text-[10px] text-slate-500 block">
                              {item.weight} × {item.qty} ({item.price} ج.م)
                            </span>
                          </div>
                          <span className="font-black text-brand-primary">
                            {(item.price * item.qty).toFixed(2)} ج.م
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center font-bold text-xs pb-0.5">
                <span className="text-slate-600">الإجمالي النهائي:</span>
                <span className="text-brand-primary text-base font-black">{totalAmount} جنيه</span>
              </div>

              {currentStep === 'cart' && (
                <button
                  disabled={cart.length === 0}
                  onClick={() => setCurrentStep('checkout')}
                  className="w-full bg-brand-primary disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-brand-dark transition"
                >
                  <span>متابعة إتمام الطلب</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}

              {currentStep === 'checkout' && (
                <button
                  form="checkout-form"
                  type="submit"
                  className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-brand-dark transition"
                >
                  <span>مراجعة الطلب قبل الإرسال</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}

              {currentStep === 'review' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep('checkout')}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                  >
                    تعديل الطلب
                  </button>
                  <button
                    onClick={handleSendWhatsAppOrder}
                    className="flex-[2] bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-[#1ebd5a] transition"
                  >
                    <Phone className="w-3.5 h-3.5 fill-white" />
                    <span>إرسال الطلب عبر واتساب</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-1.5" />
            <h3 className="font-black text-xs text-brand-dark mb-1">تأكيد مسح السلة</h3>
            <p className="text-[11px] text-slate-500 mb-3">هل أنت متأكد من رغبتك في حذف جميع المنتجات من السلة؟</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={clearEntireCart}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-2xs hover:bg-red-700"
              >
                نعم، امسح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
