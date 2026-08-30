const fs = require('fs');

// ========= 1. Update vinDecoder.ts generateStockNumber =========
let vin = fs.readFileSync('src/utils/vinDecoder.ts', 'utf8');

const oldGen = `let stockSequence = 0;

export function generateStockNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  stockSequence += 1;
  const seq = stockSequence.toString().padStart(2, '0');
  return \`RC-\${y}\${m}\${d}-\${seq}\`;
}`;

const newGen = `function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return \`\${y}\${m}\${d}\`;
}

export function generateStockNumber(): string {
  const key = 'ramscars_stock_seq';
  const today = getTodayKey();
  let stored = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    stored = null;
  }

  let sequence = 1;
  if (stored && stored.date === today) {
    sequence = (stored.sequence || 0) + 1;
  }

  localStorage.setItem(key, JSON.stringify({ date: today, sequence }));

  const seq = sequence.toString().padStart(2, '0');
  return \`RC-\${today}-\${seq}\`;
}`;

vin = vin.replace(oldGen, newGen);
fs.writeFileSync('src/utils/vinDecoder.ts', vin);

// ========= 2. Update Inspection.tsx stock number and license expiry =========
let insp = fs.readFileSync('src/pages/Inspection.tsx', 'utf8');

// Replace stock number input with read-only
insp = insp.replace(
  `<input name="stockNumber" placeholder="Stock Number" value={form.vehicleInfo.stockNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50" />`,
  `<input name="stockNumber" placeholder="Stock Number" value={form.vehicleInfo.stockNumber} readOnly className="border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 cursor-not-allowed" />`
);

// Add license expiry detail below the date input
insp = insp.replace(
  `          <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          {form.vehicleInfo.licenseExpiry && new Date(form.vehicleInfo.licenseExpiry) < new Date() && <span className="text-red-600 text-sm self-center">Expired</span>}`,
  `          <div>
            <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
            {form.vehicleInfo.licenseExpiry && (() => {
              const expiry = new Date(form.vehicleInfo.licenseExpiry);
              const now = new Date();
              const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;
              const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
              return (
                <p className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-green-600'}`}>
                  {isExpired
                    ? `Expired ${Math.abs(diffDays)} day(s) ago`
                    : isExpiringSoon
                      ? `Expires in ${diffDays} day(s)`
                      : `Valid for ${diffDays} day(s)`}
                </p>
              );
            })()}
          </div>`
);

fs.writeFileSync('src/pages/Inspection.tsx', insp);
console.log('stock and license fixed');
