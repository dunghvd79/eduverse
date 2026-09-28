import React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

export { toast };

export default function Toast() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      theme="light"
      toastOptions={{
        className: 'font-sans shadow-lg rounded-xl border border-slate-200',
        style: {
          fontFamily: 'Inter, sans-serif',
        },
      }}
    />
  );
}
