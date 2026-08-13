import { useState } from "react";
import { Calculator } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";

export default function EMICalculator() {
  const [amt, setAmt] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const r = rate / 12 / 100;
  const n = tenure * 12;
  const emi = amt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - amt;

  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-4"><Calculator size={14} weight="bold" /> Financial Tools</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Home Loan EMI Calculator</h1>
          <p className="text-slate-600 mt-3">Plan your home purchase with a clear picture of monthly EMI, interest and total outflow.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-premium p-8 space-y-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Loan Amount (₹)</label>
              <Input data-testid="emi-amount" type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} className="rounded-lg border-slate-200 h-12" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Interest Rate (% p.a.)</label>
              <Input data-testid="emi-rate" type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} className="rounded-lg border-slate-200 h-12" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Tenure (years)</label>
              <Input data-testid="emi-tenure" type="number" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="rounded-lg border-slate-200 h-12" />
            </div>
          </div>
          <div className="rounded-2xl border border-blue-500 shadow-xl shadow-blue-500/25 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-8">
            <div className="text-xs uppercase tracking-widest text-blue-100 font-semibold mb-2">Monthly EMI</div>
            <div className="text-5xl font-bold mb-8 text-white">{formatINR(Math.round(emi))}</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/20 pb-3"><span className="text-blue-100">Principal</span><span className="font-semibold text-white">{formatINR(amt)}</span></div>
              <div className="flex justify-between border-b border-white/20 pb-3"><span className="text-blue-100">Total Interest</span><span className="font-semibold text-white">{formatINR(Math.round(interest))}</span></div>
              <div className="flex justify-between pt-2"><span className="text-blue-100">Total Payment</span><span className="font-bold text-lg text-white">{formatINR(Math.round(total))}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
