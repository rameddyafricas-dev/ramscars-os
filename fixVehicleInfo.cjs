const fs = require('fs');
let content = fs.readFileSync('src/pages/Inspection.tsx', 'utf8');

const start = content.indexOf('<CollapsibleCard title="Vehicle Information">');
const end = content.indexOf('</CollapsibleCard>', start);
if (start === -1 || end === -1) {
  console.error('Vehicle Information block not found');
  process.exit(1);
}
const endIndex = end + '</CollapsibleCard>'.length;

const newBlock = `      <CollapsibleCard title="Vehicle Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="vehicleType" value={form.vehicleInfo.vehicleType} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="runner">Runner</option>
            <option value="non-runner">Non-Runner</option>
          </select>
          <input name="vin" placeholder="VIN" value={form.vehicleInfo.vin} onChange={handleVINChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />

          {decodedVIN && (
            <div className="col-span-full bg-gray-50 p-3 rounded-xl text-sm space-y-1">
              <p><span className="font-medium">VIN Type:</span> {decodedVIN.vinType}</p>
              <p><span className="font-medium">Status:</span> {decodedVIN.vinStatus}</p>
              <p><span className="font-medium">Check Digit:</span> {decodedVIN.validation.checksumApplicable ? (decodedVIN.validation.checksumValid ? 'Valid' : 'Failed') : 'Not Applicable'}</p>
              <p><span className="font-medium">Manufacturer:</span> {decodedVIN.manufacturer.value} (Confidence: {decodedVIN.manufacturer.level}, Score: {decodedVIN.manufacturer.score})</p>
              <p><span className="font-medium">Country:</span> {decodedVIN.country.value} ({decodedVIN.region})</p>
              <p><span className="font-medium">Model Year:</span> {decodedVIN.modelYear.value}{decodedVIN.modelYearCandidates.length > 1 ? ' (Candidates: ' + decodedVIN.modelYearCandidates.join(', ') + ')' : ''}</p>
              {decodedVIN.model && decodedVIN.model.value !== 'Unknown' && <p><span className="font-medium">Model:</span> {decodedVIN.model.value}</p>}
              {decodedVIN.engine && decodedVIN.engine.value !== 'Unknown' && <p><span className="font-medium">Engine:</span> {decodedVIN.engine.value}</p>}
              {decodedVIN.bodyStyle && decodedVIN.bodyStyle.value !== 'Unknown' && <p><span className="font-medium">Body:</span> {decodedVIN.bodyStyle.value}</p>}
              {decodedVIN.transmission && decodedVIN.transmission.value !== 'Unknown' && <p><span className="font-medium">Transmission:</span> {decodedVIN.transmission.value}</p>}
              {decodedVIN.fuel && decodedVIN.fuel.value !== 'Unknown' && <p><span className="font-medium">Fuel:</span> {decodedVIN.fuel.value}</p>}
              <p className="text-xs text-gray-500 mt-1">Decoder v{decodedVIN.decoderVersion} | DB v{decodedVIN.databaseVersion}</p>
            </div>
          )}

          <input name="make" placeholder="Make" value={form.vehicleInfo.make} onChange={handleVehicleChange} list="make-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="make-suggestions">{commonMakes.map((m) => <option key={m} value={m} />)}</datalist>
          <input name="model" placeholder="Model" value={form.vehicleInfo.model} onChange={handleVehicleChange} list="model-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="model-suggestions">{modelSuggestions.map((m) => <option key={m} value={m} />)}</datalist>
          <input name="year" placeholder="Year" value={form.vehicleInfo.year} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="color" placeholder="Color" value={form.vehicleInfo.color} onChange={handleVehicleChange} list="color-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="color-suggestions">{commonColors.map((c) => <option key={c} value={c} />)}</datalist>
          <input name="bodyType" placeholder="Body Type" value={form.vehicleInfo.bodyType} onChange={handleVehicleChange} list="body-type-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="body-type-suggestions">{commonBodyTypes.map((b) => <option key={b} value={b} />)}</datalist>
          <input name="mileage" placeholder="Mileage" value={form.vehicleInfo.mileage} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <select name="transmission" value={form.vehicleInfo.transmission} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="cvt">CVT</option>
            <option value="other">Other</option>
          </select>
          <select name="fuelType" value={form.vehicleInfo.fuelType} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="lpg">LPG</option>
            <option value="other">Other</option>
          </select>
          <input name="registrationNumber" placeholder="Registration Number" value={form.vehicleInfo.registrationNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Licence Disc Validity</label>
            <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
            {form.vehicleInfo.licenseExpiry && (() => {
              const expiry = new Date(form.vehicleInfo.licenseExpiry);
              const now = new Date();
              const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;
              const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
              return (
                <p className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-green-600'}`}>
                  {isExpired ? `Expired ${Math.abs(diffDays)} day(s) ago` : isExpiringSoon ? `Expires in ${diffDays} day(s)` : `Valid for ${diffDays} day(s)`}
                </p>
              );
            })()}
          </div>

          <input name="engineNumber" placeholder="Engine Number" value={form.vehicleInfo.engineNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <select name="vehiclePapers" value={form.vehicleInfo.vehiclePapers} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="available">Papers Available</option>
            <option value="pending">Papers Pending</option>
            <option value="missing">Papers Missing</option>
          </select>
          <input name="vehicleStatus" placeholder="Vehicle Status" value={form.vehicleInfo.vehicleStatus} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="stockNumber" placeholder="Stock Number" value={form.vehicleInfo.stockNumber} readOnly className="border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 cursor-not-allowed" />
        </div>
      </CollapsibleCard>`;

content = content.substring(0, start) + newBlock + content.substring(endIndex);
fs.writeFileSync('src/pages/Inspection.tsx', content);
console.log('Vehicle Information section fixed');
