import { Calculator } from "@phosphor-icons/react";
import SmartLoanCalculator from "@/components/SmartLoanCalculator";

export default function LoanCalculator() {
  return (
    <div>
      <div className="section-blue py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-4"><Calculator size={14} weight="bold" /> Financial Tools</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Smart Loan Calculator</h1>
          <p className="text-slate-600 mt-3">Plan your purchase or refinance — EMI, eligibility and mortgage estimates in one place.</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
        <SmartLoanCalculator />
      </div>
    </div>
  );
}
