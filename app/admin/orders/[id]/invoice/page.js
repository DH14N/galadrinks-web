'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InvoicePage() {
  const { id } = useParams(); // order id
  const [order, setOrder] = useState(null);
  const [cust, setCust] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // order
        const { data: o, error: oErr } = await supabase
          .from('orders')
          .select('id, customer_id, status, created_at, notes')
          .eq('id', id)
          .single();
        if (oErr) throw oErr;
        setOrder(o);

        // customer
        const { data: c, error: cErr } = await supabase
          .from('customers')
          .select('customer_number, name, contact_email, contact_phone')
          .eq('id', o.customer_id)
          .single();
        if (cErr) throw cErr;
        setCust(c);

        // items
        const { data: its, error: iErr } = await supabase
          .from('order_items')
          .select('qty, unit_price_pence, products(name, sku)')
          .eq('order_id', id);
        if (iErr) throw iErr;
        setItems(its);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  const totalPence = items.reduce((s, it) => s + it.qty * it.unit_price_pence, 0);

  return (
    <main className="p-6 bg-white text-black">
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print mb-4">
        <button onClick={() => window.print()} className="rounded-xl px-4 py-2 border">Print</button>
      </div>

      {err && <p className="text-red-600">Error: {err}</p>}
      {!order ? (
        <p>Loading…</p>
      ) : (
        <div className="max-w-3xl mx-auto border p-6 rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <img src="/logo.png" alt="Gala Drinks" style={{height: 60}} />
              <div className="text-sm text-gray-600 mt-2">
                Gala Drinks Ltd<br/>
                (Address line 1)<br/>
                (Address line 2)<br/>
                Phone: 0116 296 1537
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">INVOICE</div>
              <div className="text-sm text-gray-600">Order ID: <span className="font-mono">{order.id}</span></div>
              <div className="text-sm text-gray-600">Date: {new Date(order.created_at).toLocaleDateString()}</div>
              <div className="text-sm">Status: {order.status}</div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mt-6">
            <div className="font-semibold">Bill To</div>
            <div className="text-gray-800">
              {cust?.name || 'Customer'} (#{cust?.customer_number || '—'})
            </div>
            <div className="text-sm text-gray-600">
              Email: {cust?.contact_email || '—'} • Phone: {cust?.contact_phone || '—'}
            </div>
          </div>

          {/* Items */}
          <table className="w-full mt-6 text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">SKU</th>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{it.products?.sku}</td>
                  <td className="py-2">{it.products?.name}</td>
                  <td className="py-2 text-right">{it.qty}</td>
                  <td className="py-2 text-right">£{(it.unit_price_pence/100).toFixed(2)}</td>
                  <td className="py-2 text-right">£{((it.qty*it.unit_price_pence)/100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 text-right">
            <div className="text-lg font-semibold">Total: £{(totalPence/100).toFixed(2)}</div>
            {/* Add VAT breakdown here if needed */}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 text-sm">
              <div className="font-semibold">Notes:</div>
              <div className="whitespace-pre-wrap">{order.notes}</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
