import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, HandCoins, Bank, ArrowRight } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatINR } from "@/lib/format";

// Standard amortisation helpers
const emiFor = (P, rate, years) => {
  const r = rate / 1200, n = years * 12;
  if (!P || P <= 0 || !n) return 0;
  if (!r) return P / n;
  return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
};
const loanFor = (emi, rate, years) => { // present value of an annuity
  const r = rate / 1200, n = years * 12;
  if (!emi || emi <= 0 || !n) return 0;
  if (!r) return emi * n;
  return emi * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
};

const MODES = [
  { k: "emi", label: "Home Loan EMI", Icon: Calculator },
  { k: "eligibility", label: "Eligibility", Icon: HandCoins },
  { k: "mortgage", label: "Mortgage / LAP", Icon: Bank },
];

function Field({ label, tid, value, onChange, min, max, step, sliderMin, sliderMax, sliderStep, prefix = "₹" }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-xs text-slate-400">{prefix}</span>}
          <Input data-testid={tid} type="number" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="h-9 w-36 rounded-lg border-slate-200 text-right text-sm font-semibold" />
        </div>
      </div>
      <Slider value={[Math.min(Math.max(value || 0, sliderMin), sliderMax)]} min={sliderMin} max={sliderMax} step={sliderStep}
        onValueChange={([v]) => onChange(v)} data-testid={`${tid}-slider`} />
    </div>
  );
}

function Result({ label, value, strong = false, testid }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-2" : "border-b border-white/20 pb-3"}`}>
      <span className="text-blue-100 text-sm">{label}</span>
      <span data-testid={testid} className={`${strong ? "font-bold text-lg" : "font-semibold"} text-white rupee`}>{value}</span>
    </div>
  );
}

/**
 * ONE reusable Smart Loan Calculator — Home Loan EMI / Eligibility / Mortgage-LAP.
 * Used on: Home, Property Detail, Project Detail, /loan-calculator, /emi-calculator.
 * `defaultAmount` seeds the amount from the listing's existing price (still editable).
 * `context` ({ propertyId, projectId, name }) prefills the existing /home-loan lead form.
 */
export default function SmartLoanCalculator({ defaultAmount, context }) {
  const [mode, setMode] = useState("emi");
  const [touched, setTouched] = useState(false);

  // EMI mode
  const [amount, setAmount] = useState(defaultAmount || 5000000);
  const [down, setDown] = useState(0);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  // Eligibility mode
  const [income, setIncome] = useState(100000);
  const [existingEmi, setExistingEmi] = useState(0);
  const [eRate, setERate] = useState(8.5);
  const [eTenure, setETenure] = useState(20);
  const [own, setOwn] = useState(500000);

  // Mortgage / LAP mode
  const [propValue, setPropValue] = useState(defaultAmount || 10000000);
  const [existingLoan, setExistingLoan] = useState(0);
  const [mRate, setMRate] = useState(9.5);
  const [mTenure, setMTenure] = useState(15);

  // seed from the listing's price once it loads, until the user edits
  useEffect(() => {
    if (defaultAmount && !touched) { setAmount(defaultAmount); setPropValue(defaultAmount); }
  }, [defaultAmount, touched]);
  const edit = (setter) => (v) => { setTouched(true); setter(v); };

  // EMI mode results
  const principal = Math.max(0, (amount || 0) - (down || 0));
  const emi = emiFor(principal, rate, tenure);
  const total = emi * tenure * 12;
  const interest = total - principal;

  // Eligibility mode results (50% FOIR norm — estimate only)
  const capacity = Math.max(0, (income || 0) * 0.5 - (existingEmi || 0));
  const eligibleLoan = loanFor(capacity, eRate, eTenure);
  const budget = eligibleLoan + (own || 0);

  // Mortgage / LAP results (~60% LTV norm — estimate only)
  const lapLoan = Math.max(0, (propValue || 0) * 0.6 - (existingLoan || 0));
  const lapEmi = emiFor(lapLoan, mRate, mTenure);
  const lapTotal = lapEmi * mTenure * 12;
  const lapInterest = lapTotal - lapLoan;

  const ctaAmount = mode === "emi" ? principal : mode === "eligibility" ? Math.round(eligibleLoan) : Math.round(lapLoan);
  const ctaType = mode === "mortgage" ? "Loan Against Property" : "Home Loan";
  const ctaParams = new URLSearchParams();
  if (context?.propertyId) ctaParams.set("property_id", context.propertyId);
  if (context?.projectId) ctaParams.set("project_id", context.projectId);
  if (context?.name) ctaParams.set("property_name", context.name);
  if (ctaAmount) ctaParams.set("property_cost", String(Math.round(ctaAmount)));
  ctaParams.set("loan_type", ctaType);

  return (
    <div className="card-premium overflow-hidden" data-testid="smart-loan-calculator">
      {/* mode tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/60 overflow-x-auto">
        {MODES.map(m => (
          <button key={m.k} type="button" data-testid={`slc-tab-${m.k}`} onClick={() => setMode(m.k)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${mode === m.k ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <m.Icon size={16} weight={mode === m.k ? "fill" : "regular"} /> {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
        {/* inputs */}
        <div className="space-y-5">
          {mode === "emi" && (<>
            <Field label="Property / Loan Amount" tid="slc-amount" value={amount} onChange={edit(setAmount)} sliderMin={500000} sliderMax={100000000} sliderStep={100000} />
            <Field label="Down Payment" tid="slc-down" value={down} onChange={edit(setDown)} sliderMin={0} sliderMax={Math.max(amount || 0, 1000000)} sliderStep={50000} />
            <Field label="Interest Rate (% p.a.)" tid="slc-rate" value={rate} onChange={edit(setRate)} step={0.05} sliderMin={6} sliderMax={15} sliderStep={0.05} prefix="" />
            <Field label="Loan Tenure (years)" tid="slc-tenure" value={tenure} onChange={edit(setTenure)} sliderMin={1} sliderMax={30} sliderStep={1} prefix="" />
          </>)}
          {mode === "eligibility" && (<>
            <Field label="Monthly Income" tid="slc-income" value={income} onChange={edit(setIncome)} sliderMin={10000} sliderMax={1000000} sliderStep={5000} />
            <Field label="Existing Monthly EMIs" tid="slc-existing-emi" value={existingEmi} onChange={edit(setExistingEmi)} sliderMin={0} sliderMax={300000} sliderStep={1000} />
            <Field label="Interest Rate (% p.a.)" tid="slc-erate" value={eRate} onChange={edit(setERate)} step={0.05} sliderMin={6} sliderMax={15} sliderStep={0.05} prefix="" />
            <Field label="Loan Tenure (years)" tid="slc-etenure" value={eTenure} onChange={edit(setETenure)} sliderMin={1} sliderMax={30} sliderStep={1} prefix="" />
            <Field label="Down Payment / Own Contribution" tid="slc-own" value={own} onChange={edit(setOwn)} sliderMin={0} sliderMax={20000000} sliderStep={50000} />
          </>)}
          {mode === "mortgage" && (<>
            <Field label="Property Value" tid="slc-prop-value" value={propValue} onChange={edit(setPropValue)} sliderMin={1000000} sliderMax={200000000} sliderStep={100000} />
            <Field label="Existing Loan (if any)" tid="slc-existing-loan" value={existingLoan} onChange={edit(setExistingLoan)} sliderMin={0} sliderMax={100000000} sliderStep={100000} />
            <Field label="Interest Rate (% p.a.)" tid="slc-mrate" value={mRate} onChange={edit(setMRate)} step={0.05} sliderMin={7} sliderMax={16} sliderStep={0.05} prefix="" />
            <Field label="Loan Tenure (years)" tid="slc-mtenure" value={mTenure} onChange={edit(setMTenure)} sliderMin={1} sliderMax={20} sliderStep={1} prefix="" />
          </>)}
          {(mode === "eligibility" || mode === "mortgage") && (
            <p className="text-[11px] text-slate-400 leading-relaxed">Indicative estimate only — based on standard lending norms (50% income obligation / ~60% property value). Not a bank sanction or offer.</p>
          )}
        </div>

        {/* results */}
        <div className="rounded-2xl border border-blue-500 shadow-xl shadow-blue-500/25 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 sm:p-8 h-fit">
          {mode === "emi" && (<>
            <div className="text-xs uppercase tracking-widest text-blue-100 font-semibold mb-2">Monthly EMI</div>
            <div className="text-4xl sm:text-5xl font-bold mb-6 text-white" data-testid="slc-emi-result">{formatINR(Math.round(emi))}</div>
            <div className="space-y-3 text-sm">
              <Result label="Total Principal" value={formatINR(Math.round(principal))} testid="slc-principal" />
              <Result label="Total Interest" value={formatINR(Math.round(interest))} testid="slc-interest" />
              <Result label="Total Amount Payable" value={formatINR(Math.round(total))} strong testid="slc-total" />
            </div>
          </>)}
          {mode === "eligibility" && (<>
            <div className="text-xs uppercase tracking-widest text-blue-100 font-semibold mb-2">Estimated Eligible Loan</div>
            <div className="text-4xl sm:text-5xl font-bold mb-6 text-white" data-testid="slc-eligible-result">{formatINR(Math.round(eligibleLoan))}</div>
            <div className="space-y-3 text-sm">
              <Result label="Estimated Property Budget" value={formatINR(Math.round(budget))} testid="slc-budget" />
              <Result label="Estimated EMI" value={formatINR(Math.round(capacity))} testid="slc-est-emi" />
              <Result label="Monthly Repayment Capacity" value={formatINR(Math.round(capacity))} strong testid="slc-capacity" />
            </div>
          </>)}
          {mode === "mortgage" && (<>
            <div className="text-xs uppercase tracking-widest text-blue-100 font-semibold mb-2">Estimated Loan Amount</div>
            <div className="text-4xl sm:text-5xl font-bold mb-6 text-white" data-testid="slc-lap-result">{formatINR(Math.round(lapLoan))}</div>
            <div className="space-y-3 text-sm">
              <Result label="Monthly EMI" value={formatINR(Math.round(lapEmi))} testid="slc-lap-emi" />
              <Result label="Total Interest" value={formatINR(Math.round(lapInterest))} testid="slc-lap-interest" />
              <Result label="Total Repayment" value={formatINR(Math.round(lapTotal))} strong testid="slc-lap-total" />
            </div>
          </>)}
          <div className="mt-6">
            <div className="text-xs text-blue-100 mb-2">Need Help With Your Loan?</div>
            <Link to={`/home-loan?${ctaParams.toString()}`} data-testid="slc-loan-cta"
              className="w-full inline-flex items-center justify-center gap-2 bg-white text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md">
              Get Loan Assistance <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
