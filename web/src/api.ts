const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const TOKEN_KEY = 'inv_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(getToken() ? { authorization: 'Bearer ' + getToken() } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'تعذّر الاتصال بالسيرفر. تأكد من الإنترنت أو من تشغيل الـ API.');
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') onUnauthorized();
    const msg = Array.isArray(data?.message) ? data.message.join('، ') : data?.message || 'حدث خطأ غير متوقع';
    throw new ApiError(res.status, msg);
  }
  return data as T;
}
export const get = <T = any>(p: string) => api<T>('GET', p);
export const post = <T = any>(p: string, b?: unknown) => api<T>('POST', p, b ?? {});
export const patch = <T = any>(p: string, b?: unknown) => api<T>('PATCH', p, b ?? {});
export const del = <T = any>(p: string) => api<T>('DELETE', p);

export const qs = (o: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? '?' + s : '';
};

/* ---------- types ---------- */
export type DocType = 'in' | 'out' | 'transfer';
export interface User { id: string; name: string; username: string; permissions: string[]; isActive: boolean; mustChangePassword: boolean }
export interface Warehouse { id: string; name: string; location: string | null; isActive: boolean }
export interface Item { id: string; code: string; name: string; barcode: string | null; category: string | null; unit: string; minQty: number; notes: string | null; isActive: boolean }
export interface Party { id: string; type: 'supplier' | 'customer'; name: string; phone: string | null; notes: string | null; isActive: boolean }
export interface DocLine { id: string; itemId: string; qty: number; item: Item }
export interface StockDoc {
  id: string; number: string; type: DocType; date: string; reference: string | null; notes: string | null;
  fromWarehouse: Warehouse | null; toWarehouse: Warehouse | null; party: Party | null;
  createdBy: { id: string; name: string } | null; createdAt: string; lines: DocLine[];
}
export interface BalanceRow { item: Item; perWarehouse: Record<string, number>; total: number; qty: number; low: boolean }

export const PERMS: { key: string; label: string }[] = [
  { key: 'items', label: 'إدارة الأصناف' },
  { key: 'warehouses', label: 'إدارة المخازن' },
  { key: 'in', label: 'إذن إضافة' },
  { key: 'out', label: 'إذن صرف' },
  { key: 'transfer', label: 'تحويل بين المخازن' },
  { key: 'parties', label: 'الموردين والعملاء' },
  { key: 'reports', label: 'التقارير وحركة الأصناف' },
  { key: 'users', label: 'المستخدمين والصلاحيات' },
];
export const DOC_LABEL: Record<DocType, string> = { in: 'إذن إضافة', out: 'إذن صرف', transfer: 'تحويل' };
export const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 3 }));
export const today = () => new Date().toISOString().slice(0, 10);

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
