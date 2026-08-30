const fs = require('fs');
let content = fs.readFileSync('src/pages/Inspection.tsx', 'utf8');

const oldBlock = `          <div>
            <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
            {form.vehicleInfo.licenseExpiry && (() => {
              const expiry = new Date(form.vehicleInfo.licenseExpiry);
              const now = new Date();
              const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;
              const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
              return (
                <p className={`text-xs mt-1 font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-green-600"}`}>
                  {isExpired
                    ? `Expired ${Math.abs(diffDays)} day(s) ago`
                    : isExpiringSoon
                      ? `Expires in ${diffDays} day(s)`
                      : `Valid for ${diffDays} day(s)`}
                </p>
              );
            })()}
          </div>`;

const newBlock = `          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Licence Disc Validity</label>
            <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
            {form.vehicleInfo.licenseExpiry && (() => {
              const expiry = new Date(form.vehicleInfo.licenseExpiry);
              const now = new Date();
              const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;
              const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
              return (
                <p className={`text-xs mt-1 font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-green-600"}`}>
                  {isExpired
                    ? `Expired ${Math.abs(diffDays)} day(s) ago`
                    : isExpiringSoon
                      ? `Expires in ${diffDays} day(s)`
                      : `Valid for ${diffDays} day(s)`}
                </p>
              );
            })()}
          </div>`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/pages/Inspection.tsx', content);
console.log('licence label added');
