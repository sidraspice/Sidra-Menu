import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  const categoryIdx = headers.findIndex(h => h.includes('قسم') || h.includes('تصنيف'));
  const nameIdx = headers.findIndex(h => h.includes('منتج') || h.includes('اسم') || h.includes('صنف'));
  const weightIdx = headers.findIndex(h => h.includes('وزن') || h.includes('حجم'));
  const priceIdx = headers.findIndex(h => h.includes('سعر') || h.includes('ثمن'));
  
  // البحث عن عمود التوفر أو الحالة بأي مسمى
  let statusIdx = headers.findIndex(h => 
    h.includes('حالة') || 
    h.includes('توفر') || 
    h.includes('متوفر') || 
    h.includes('متاح') || 
    h.includes('status') || 
    h.includes('المتاح') ||
    h.includes('التوفر')
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // التعامل مع الفواصل داخل النصوص
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (!values[nameIdx] || !values[priceIdx]) continue;

    const rawWeight = values[weightIdx] ? values[weightIdx].trim() : '';
    if (rawWeight === '1000' || rawWeight === '1000g' || rawWeight === '1 كجم' || rawWeight === '1كجم' || rawWeight === '1 كيلو' || rawWeight === 'كيلو') {
      continue;
    }

    // التحقق من حالة التوفر
    let isAvailable = true;
    
    // فحص العمود المكتشف أو فحص كل الحقول للسطر
    if (statusIdx !== -1 && values[statusIdx] !== undefined) {
      const statusVal = values[statusIdx].trim();
      if (
        statusVal.includes('غير') || 
        statusVal.includes('لا') || 
        statusVal.includes('نفذ') || 
        statusVal.includes('خلص') || 
        statusVal.toLowerCase() === 'out' || 
        statusVal.toLowerCase() === 'false' || 
        statusVal === '0'
      ) {
        isAvailable = false;
      }
    } else {
      // بحث شامل في كل قيم الصف عن كلمة "غير متوفر"
      const rowText = lines[i];
      if (rowText.includes('غير متوفر') || rowText.includes('غير متاح') || rowText.includes('نفذ')) {
        isAvailable = false;
      }
    }

    rows.push({
      category: values[categoryIdx] || 'أخرى',
      name: values[nameIdx],
      weight: rawWeight ? `${rawWeight} جرام` : 'حسب الطلب',
      price: parseFloat(values[priceIdx]) || 0,
      available: isAvailable
    });
  }

  const productsMap = {};
  rows.forEach(item => {
    const key = `${item.category}_${item.name}`;
    if (!productsMap[key]) {
      productsMap[key] = {
        id: key,
        name: item.name,
        category: item.category,
        variants: []
      };
    }
    productsMap[key].variants.push({
      weight: item.weight,
      price: item.price,
      available: item.available
    });
  });

  return Object.values(productsMap).map(product => ({
    ...product,
    isAvailable: product.variants.some(v => v.available)
  }));
}

export async function GET() {
  try {
    const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0KMamBEhCgLLWA4TEsYLz9uvxBE-EShQ0kBON0tYut-dZrBm4BDfuDgf23rD4KlWTt_PgCf--4vQz/pub?output=csv";
    
    // منع التخزين المؤقت لجلب التعديلات فوراً
    const urlWithCacheBust = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'timestamp=' + Date.now();
    
    const res = await fetch(urlWithCacheBust, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error('فشل جلب البيانات من Google Sheets');
    }

    const csvData = await res.text();
    const products = parseCSV(csvData);
    const rawCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const categories = ['كل المنتجات', ...rawCategories];

    return NextResponse.json({
      success: true,
      categories,
      products,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data Fetch Error:', error);
    return NextResponse.json({
      success: false,
      error: 'تعذر تحميل قائمة المنتجات حاليًا.'
    }, { status: 500 });
  }
}
