const fs = require('fs');

// ===== 1. Fix Inspection.tsx =====
let insp = fs.readFileSync('src/pages/Inspection.tsx', 'utf8');

// 1a. Add missing generateAutoListing import
if (!insp.includes("import { generateAutoListing }")) {
  insp = insp.replace(
    "import { generateStockNumber } from '../utils/stockNumber'",
    "import { generateStockNumber } from '../utils/stockNumber'\nimport { generateAutoListing } from '../utils/autoListing'"
  );
}

// 1b. Fix handleFinancialChange calculation
insp = insp.replace(
  `    const repair = updatedFinancial.repairCost || 0
    const transport = updatedFinancial.transportCost || 0
    if (purchase > 0 && selling > 0) {
      updatedFinancial.estimatedProfit = selling - purchase - repair - transport`,
  `    const additionalTotal = (updatedFinancial.additionalCosts || []).reduce((sum, c) => sum + (c.amount || 0), 0)
    if (purchase > 0 && selling > 0) {
      updatedFinancial.estimatedProfit = selling - purchase - additionalTotal`
);

// 1c. Remove repair/transport input lines
const repairLine = `          <input type="number" placeholder="Repair Cost" value={form.financial.repairCost ?? ''} onChange={(e) => handleFinancialChange('repairCost', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />`;
const transportLine = `          <input type="number" placeholder="Transport Cost" value={form.financial.transportCost ?? ''} onChange={(e) => handleFinancialChange('transportCost', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />`;
insp = insp.split(repairLine).join('');
insp = insp.split(transportLine).join('');

// 1d. Add additional costs UI after Trade Value input
const tradeLine = `<input type="number" placeholder="Trade Value" value={form.financial.tradeValue ?? ''} onChange={(e) => handleFinancialChange('tradeValue', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" />`;
const additionalCostsHtml = tradeLine + `
          <div className="col-span-full space-y-2">
            <p className="font-medium text-gray-700">Additional Costs</p>
            {form.financial.additionalCosts?.map((cost, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl">
                <span className="flex-1 text-sm">{cost.label}</span>
                <span className="font-semibold">R {cost.amount.toLocaleString()}</span>
                <button onClick={() => handleRemoveAdditionalCost(idx)} className="text-red-600">✕</button>
              </div>
            ))}
            <button onClick={handleAddAdditionalCost} className="text-indigo-600 text-sm hover:underline">+ Add Other Cost</button>
          </div>`;
insp = insp.split(tradeLine).join(additionalCostsHtml);

// 1e. Add additional cost functions after handleFinancialChange function block
const oldHandleFinancialEnd = `    setForm({ ...form, financial: updatedFinancial })
  }`;
const newHandleFinancialEnd = `    setForm({ ...form, financial: updatedFinancial })
  }

  const handleAddAdditionalCost = () => {
    const label = window.prompt('Specify cost label:')
    if (!label) return
    const amountStr = window.prompt('Amount:')
    const amount = Number(amountStr)
    if (isNaN(amount)) return
    const newCost = { label, amount }
    setForm((prev) => prev ? ({
      ...prev,
      financial: {
        ...prev.financial,
        additionalCosts: [...(prev.financial.additionalCosts || []), newCost],
      }
    }) : prev)
    handleFinancialChange('purchasePrice', String(form.financial.purchasePrice || ''))
    handleFinancialChange('sellingPrice', String(form.financial.sellingPrice || ''))
  }

  const handleRemoveAdditionalCost = (index: number) => {
    setForm((prev) => prev ? ({
      ...prev,
      financial: {
        ...prev.financial,
        additionalCosts: prev.financial.additionalCosts?.filter((_, i) => i !== index),
      }
    }) : prev)
    handleFinancialChange('purchasePrice', String(form.financial.purchasePrice || ''))
    handleFinancialChange('sellingPrice', String(form.financial.sellingPrice || ''))
  }`;
insp = insp.split(oldHandleFinancialEnd).join(newHandleFinancialEnd);

// 1f. Remove unused marketing functions
const marketingFunc1 = `  const handleMarketingChange = (field: 'title' | 'description', value: string) => setForm({ ...form, marketing: { ...form.marketing, [field]: value } })\n`;
const marketingFunc2 = `  const handleHashtagsChange = (value: string) => setForm({ ...form, marketing: { ...form.marketing, hashtags: value.split(',').map((s) => s.trim()).filter(Boolean) } })\n`;
const marketingFunc3 = `  const handleChannelsToggle = (channel: string) => {\n    const channels = form.marketing.channels.includes(channel) ? form.marketing.channels.filter((c) => c !== channel) : [...form.marketing.channels, channel]\n    setForm({ ...form, marketing: { ...form.marketing, channels } })\n  }\n`;
insp = insp.split(marketingFunc1).join('');
insp = insp.split(marketingFunc2).join('');
insp = insp.split(marketingFunc3).join('');

fs.writeFileSync('src/pages/Inspection.tsx', insp);

// ===== 2. Fix InspectionView.tsx =====
let view = fs.readFileSync('src/pages/InspectionView.tsx', 'utf8');
view = view.split(`          <p><span className="font-medium">Repair:</span> R {inspection.financial.repairCost ?? '—'}</p>\n`).join('');
view = view.split(`          <p><span className="font-medium">Transport:</span> R {inspection.financial.transportCost ?? '—'}</p>\n`).join('');
// add additional costs display
const oldFinanceEnd = `          <p><span className="font-medium">Profit:</span> R {inspection.financial.estimatedProfit ?? '—'}</p>`;
const newFinanceEnd = `          {inspection.financial.additionalCosts && inspection.financial.additionalCosts.length > 0 && (
            <div className="col-span-2">
              <p className="font-medium">Additional Costs</p>
              {inspection.financial.additionalCosts.map((cost, idx) => (
                <p key={idx} className="text-sm">{cost.label}: R {cost.amount.toLocaleString()}</p>
              ))}
            </div>
          )}
          <p><span className="font-medium">Profit:</span> R {inspection.financial.estimatedProfit ?? '—'}</p>`;
view = view.split(oldFinanceEnd).join(newFinanceEnd);
fs.writeFileSync('src/pages/InspectionView.tsx', view);

// ===== 3. Fix Reports.tsx =====
let reports = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
reports = reports.split(`                  <p><span class="label">Repair Cost:</span> R ${selectedInspection.financial.repairCost ?? 0}</p>\n`).join('');
reports = reports.split(`                  <p><span class="label">Transport Cost:</span> R ${selectedInspection.financial.transportCost ?? 0}</p>\n`).join('');
fs.writeFileSync('src/pages/Reports.tsx', reports);

console.log('All remaining fixes applied');
