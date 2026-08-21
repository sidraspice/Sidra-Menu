import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^[\"\']|[\"\']$/g, ''));
  const categoryIdx = headers.findIndex(h => h.includes('قسم'));
  const nameIdx = headers.findIndex(h => h.includes('منتج') || h.includes('اسم'));
  const weightIdx = headers.findIndex(h => h.includes('وزن'));
  const priceIdx = headers.findIndex(h => h.includes('سعر'));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^[\"\']|[\"\']$/g, ''));
    if (!values[nameIdx] || !values[priceIdx]) continue;

    rows.push({
      category: values[categoryIdx] || 'أخرى',
      name: values[nameIdx],
      weight: values[weightIdx] ? `${values[weightIdx]} جرام` : 'حسب الطلب',
      price: parseFloat(values[priceIdx]) || 0
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
      price: item.price
    });
  });

  return Object.values(productsMap);
}

export async function GET() {
  try {
    const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0KMamBEhCgLLWA4TEsYLz9uvxBE-EShQ0kBON0tYut-dZrBm4BDfuDgf23rD4KlWTt_PgCf--4vQz/pub?output=csv";
    
    const res = await fetch(sheetUrl, {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('فشل جلب البيانات من Google Sheets');
    }

    const csvData = await res.text();
    const products = parseCSV(csvData);
    const categories = ['كل المنتجات', ...new Set(products.map(p => p.category))];

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
      error: 'تعذر تحميل قائمة المنتجات حاليًا. يرجى المحاولة مرة أخرى.'
    }, { status: 500 });
  }
}
