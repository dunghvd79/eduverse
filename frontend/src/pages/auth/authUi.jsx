import React from 'react';

export const inputCls = 'w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-body-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
export const btnCls = 'w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-all active:scale-[.98] disabled:opacity-60';

export function Field({ label, error, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-label-md text-slate-700">{label}</span>
      {children}
      {error && <span className="block text-body-sm text-error">{error}</span>}
    </label>
  );
}
