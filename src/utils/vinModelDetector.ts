export function detectModelFromVIN(vin: string, make: string): string | undefined {
  const clean = vin.trim().toUpperCase();
  if (!clean || clean.length < 8) return undefined;

  // Common VIN pattern maps for popular models
  const patterns: { make: string; regex: RegExp; model: string }[] = [
    // Toyota Hilux / Fortuner (South Africa, Thailand)
    { make: 'Toyota', regex: /^AHT|^AHH|^MR0|^MR2|^JTF/, model: 'Hilux' },
    { make: 'Toyota', regex: /^AHT|^AHH|^MR0|^MR2|^JTF/, model: 'Hilux' }, // duplicate intentionally for other body? We'll refine later
    { make: 'Toyota', regex: /^AHT|^AHH/, model: 'Hilux' },
    { make: 'Toyota', regex: /^MR0|^JTF/, model: 'Hilux' },
    // Toyota Fortuner (often same as Hilux platform but we can guess)
    { make: 'Toyota', regex: /^AHT|^AHH|^MR0|^JTF/, model: 'Fortuner' }, // This will be overridden if we can distinguish later
    // Toyota Corolla / Auris
    { make: 'Toyota', regex: /^JTD|^2T1|^1NX|^5YF|^SB1/, model: 'Corolla' },
    { make: 'Toyota', regex: /^NMT|^JTN|^JT2/, model: 'Corolla' },
    // Toyota Land Cruiser / Prado
    { make: 'Toyota', regex: /^JTE|^JTJ|^RKT/, model: 'Land Cruiser' },
    { make: 'Toyota', regex: /^JTE|^JTJ/, model: 'Prado' }, // sometimes same
    // Ford Ranger
    { make: 'Ford', regex: /^6FP|^1FT|^2FM|^WF0|^AFA|^AFC/, model: 'Ranger' },
    { make: 'Ford', regex: /^WF0|^AFA/, model: 'Ranger' },
    // Ford Fiesta / Figo
    { make: 'Ford', regex: /^WF0|^AFA|^1FD|^2FD/, model: 'Fiesta' },
    // Volkswagen Polo
    { make: 'Volkswagen', regex: /^WVW|^WVG|^3VW|^9BW|^AAV/, model: 'Polo' },
    { make: 'Volkswagen', regex: /^WVW.*6R|^WVW.*6C/, model: 'Polo' },
    // Volkswagen Golf
    { make: 'Volkswagen', regex: /^WVW.*AU|^WVW.*1K|^WVW.*5G|^WVW.*CD/, model: 'Golf' },
    // Hyundai i20 / Accent
    { make: 'Hyundai', regex: /^MAL|^KMH|^KM8|^KM4/, model: 'i20' },
    { make: 'Hyundai', regex: /^KMH.*CN7|^KM8.*PB/, model: 'i20' },
    // Hyundai Tucson / Santa Fe
    { make: 'Hyundai', regex: /^KMH.*TL|^KM8.*SU2/, model: 'Tucson' },
    { make: 'Hyundai', regex: /^KMH.*TM|^KM8.*TM/, model: 'Santa Fe' },
    // Kia Picanto / Rio
    { make: 'Kia', regex: /^KNA|^KNB|^KNC|^KND/, model: 'Picanto' },
    { make: 'Kia', regex: /^KNA.*JA|^KNA.*YB/, model: 'Rio' },
    // Nissan NP200 / Navara
    { make: 'Nissan', regex: /^JN1|^JN6|^1N4|^3N1|^ADN/, model: 'NP200' },
    { make: 'Nissan', regex: /^JN1.*D23|^JN6.*D23|^1N6.*D23/, model: 'Navara' },
    // BMW 3 Series
    { make: 'BMW', regex: /^WBA.*3|^WBS.*3|^5UX.*3/, model: '3 Series' },
    // Mercedes-Benz C-Class
    { make: 'Mercedes-Benz', regex: /^WDD.*C|^WDB.*C/, model: 'C-Class' },
    // Land Rover Defender / Discovery
    { make: 'Land Rover', regex: /^SAL|^SALL|^SALV/, model: 'Defender' },
    { make: 'Land Rover', regex: /^SAL.*2|^SAL.*3/, model: 'Discovery' },
    // Honda Jazz / Civic
    { make: 'Honda', regex: /^JHM.*GE|^JHM.*GK|^5FN.*GE/, model: 'Jazz' },
    { make: 'Honda', regex: /^JHM.*FC|^JHM.*FK|^5FN.*FC/, model: 'Civic' },
    // Mazda BT-50 / Mazda3
    { make: 'Mazda', regex: /^JM0|^JM1|^MM0|^1YV/, model: 'BT-50' },
    { make: 'Mazda', regex: /^JM1.*BP|^JM1.*BM/, model: 'Mazda3' },
  ];

  // Exact match by make then regex
  const candidates = patterns.filter((p) => p.make === make);
  // Try to find a specific match; if multiple, choose the first (or refine later)
  for (const p of candidates) {
    if (p.regex.test(clean)) {
      return p.model;
    }
  }
  return undefined;
}
