const fs = require('fs');
let content = fs.readFileSync('src/pages/Inspection.tsx', 'utf8');

// Remove nhtsaResult state (already gone likely) but ensure no leftover
content = content.replace("  const [nhtsaResult, setNhtsaResult] = useState<NHTSADecodedResult | null>(null)\n", "");

// Replace handleVINChange to only auto-fill make and year, no model/body/engine/transmission
const oldHandle = `  const handleVINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase()
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, vin } })
    if (vin.length > 0) {
      const decoded = decodeVIN(vin)
      setDecodedVIN(decoded)
      if (decoded.make !== 'Unknown') {
        setForm((prev) => prev ? ({
          ...prev,
          vehicleInfo: {
            ...prev.vehicleInfo,
            make: decoded.make,
            year: decoded.year || prev.vehicleInfo.year,
            bodyType: decoded.bodyType || prev.vehicleInfo.bodyType,
            transmission: mapDecodedTransmission(decoded.transmission) || prev.vehicleInfo.transmission,
            fuelType: mapDecodedFuelType(decoded.engineType) || prev.vehicleInfo.fuelType,
          },
        }) : prev)
      } else if (decoded.year) {
        setForm((prev) => prev ? ({ ...prev, vehicleInfo: { ...prev.vehicleInfo, year: decoded.year } }) : prev)
      }
    } else {
      setDecodedVIN(null)
    }
  }`;

const newHandle = `  const handleVINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase()
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, vin } })
    if (vin.length > 0) {
      const decoded = decodeVIN(vin)
      setDecodedVIN(decoded)
      if (decoded.manufacturer !== 'Unknown') {
        setForm((prev) => prev ? ({
          ...prev,
          vehicleInfo: {
            ...prev.vehicleInfo,
            make: decoded.manufacturer,
            year: decoded.modelYear !== 'Unknown' ? decoded.modelYear : prev.vehicleInfo.year,
          },
        }) : prev)
      } else if (decoded.modelYear !== 'Unknown') {
        setForm((prev) => prev ? ({ ...prev, vehicleInfo: { ...prev.vehicleInfo, year: decoded.modelYear } }) : prev)
      }
    } else {
      setDecodedVIN(null)
    }
  }`;

content = content.replace(oldHandle, newHandle);

// Replace decoded VIN display block
const oldDisplay = content.indexOf('          {decodedVIN && (');
const endDisplay = content.indexOf('          )}', oldDisplay);
if (oldDisplay === -1 || endDisplay === -1) {
  console.error('decoded display block not found');
  process.exit(1);
}

const newDisplay = `          {decodedVIN && (
            <div className="col-span-full bg-gray-50 p-3 rounded-xl text-sm space-y-1">
              <p><span className="font-medium">VIN Type:</span> {decodedVIN.vinType}</p>
              <p><span className="font-medium">Status:</span> {decodedVIN.vinStatus} {decodedVIN.invalidReason ? `(${decodedVIN.invalidReason})` : ''}</p>
              <p><span className="font-medium">Check Digit:</span> {decodedVIN.checkDigitStatus}</p>
              <p><span className="font-medium">Manufacturer:</span> {decodedVIN.manufacturer} (Confidence: {decodedVIN.manufacturerConfidence})</p>
              <p><span className="font-medium">Country:</span> {decodedVIN.countryOfManufacture} ({decodedVIN.region})</p>
              <p><span className="font-medium">Model Year:</span> {decodedVIN.modelYear}</p>
              {decodedVIN.note && <p className="text-xs text-gray-500 mt-1">{decodedVIN.note}</p>}
            </div>
          )}`;

content = content.substring(0, oldDisplay) + newDisplay + content.substring(endDisplay + '          )}'.length);

fs.writeFileSync('src/pages/Inspection.tsx', content);
console.log('Inspection.tsx updated for strict VIN decoder');
