export interface DecodedVIN {
  make: string;
  model: string;
  year: string;
  country: string;
  productionYear: string;
  isModern: boolean;
  isValid: boolean;
}

const wmiMap: Record<string, { make: string; country: string }> = {
  '1GC': { make: 'Chevrolet', country: 'USA' },
  '1GT': { make: 'GMC', country: 'USA' },
  '1HG': { make: 'Honda', country: 'USA' },
  '1FT': { make: 'Ford', country: 'USA' },
  '1FM': { make: 'Ford', country: 'USA' },
  '1FA': { make: 'Ford', country: 'USA' },
  '2HK': { make: 'Honda', country: 'Canada' },
  '3VW': { make: 'Volkswagen', country: 'Mexico' },
  'JHM': { make: 'Honda', country: 'Japan' },
  'JH4': { make: 'Acura', country: 'Japan' },
  'JT2': { make: 'Toyota', country: 'Japan' },
  'JT3': { make: 'Toyota', country: 'Japan' },
  'JTD': { make: 'Toyota', country: 'Japan' },
  'JTE': { make: 'Toyota', country: 'Japan' },
  'JTH': { make: 'Lexus', country: 'Japan' },
  'JTJ': { make: 'Lexus', country: 'Japan' },
  'KNA': { make: 'Kia', country: 'South Korea' },
  'KNB': { make: 'Kia', country: 'South Korea' },
  'KMH': { make: 'Hyundai', country: 'South Korea' },
  'KMJ': { make: 'Hyundai', country: 'South Korea' },
  'SAL': { make: 'Land Rover', country: 'UK' },
  'SAJ': { make: 'Jaguar', country: 'UK' },
  'WBA': { make: 'BMW', country: 'Germany' },
  'WBS': { make: 'BMW M', country: 'Germany' },
  'WDB': { make: 'Mercedes-Benz', country: 'Germany' },
  'WD4': { make: 'Mercedes-Benz', country: 'USA' },
  'WVG': { make: 'Volkswagen', country: 'Germany' },
  'WVW': { make: 'Volkswagen', country: 'Germany' },
  'ZFF': { make: 'Ferrari', country: 'Italy' },
  'ZFA': { make: 'Fiat', country: 'Italy' },
  'VF1': { make: 'Renault', country: 'France' },
  'VF3': { make: 'Peugeot', country: 'France' },
  'VSS': { make: 'SEAT', country: 'Spain' },
  'WAU': { make: 'Audi', country: 'Germany' },
  'WDD': { make: 'Mercedes-Benz', country: 'Germany' },
  'WMW': { make: 'MINI', country: 'Germany' },
  'WP0': { make: 'Porsche', country: 'Germany' },
  'SHS': { make: 'Honda', country: 'UK' },
  'TMB': { make: 'Skoda', country: 'Czech Republic' },
  'TMT': { make: 'Tatra', country: 'Czech Republic' },
  'XTA': { make: 'Lada', country: 'Russia' },
  'YV1': { make: 'Volvo', country: 'Sweden' },
  'YS3': { make: 'Saab', country: 'Sweden' },
  'ZAM': { make: 'Maserati', country: 'Italy' },
  'ZAR': { make: 'Alfa Romeo', country: 'Italy' },
  'ZAP': { make: 'Piaggio', country: 'Italy' },
  '1G1': { make: 'Chevrolet', country: 'USA' },
  '1G2': { make: 'Pontiac', country: 'USA' },
  '1G3': { make: 'Oldsmobile', country: 'USA' },
  '1G4': { make: 'Buick', country: 'USA' },
  '1G6': { make: 'Cadillac', country: 'USA' },
  '1G8': { make: 'Saturn', country: 'USA' },
  '1GM': { make: 'GM', country: 'USA' },
  '1GY': { make: 'GM', country: 'USA' },
  '1C3': { make: 'Chrysler', country: 'USA' },
  '1C4': { make: 'Chrysler', country: 'USA' },
  '1C6': { make: 'Dodge', country: 'USA' },
  '1B3': { make: 'Dodge', country: 'USA' },
  '1J4': { make: 'Jeep', country: 'USA' },
  '1N4': { make: 'Nissan', country: 'USA' },
  '1N6': { make: 'Nissan', country: 'USA' },
  '1NX': { make: 'Toyota', country: 'USA' },
  '2T1': { make: 'Toyota', country: 'Canada' },
  '2T2': { make: 'Lexus', country: 'Canada' },
  '2T3': { make: 'Toyota', country: 'Canada' },
  '2FM': { make: 'Ford', country: 'Canada' },
  '2F1': { make: 'Ford', country: 'Canada' },
  '2G1': { make: 'Chevrolet', country: 'Canada' },
  '2G2': { make: 'Pontiac', country: 'Canada' },
  '2HG': { make: 'Honda', country: 'Canada' },
  '2HM': { make: 'Hyundai', country: 'Canada' },
  '3N1': { make: 'Nissan', country: 'Mexico' },
  '3N6': { make: 'Nissan', country: 'Mexico' },
  '3V4': { make: 'Volkswagen', country: 'Mexico' },
  '3V5': { make: 'Volkswagen', country: 'Mexico' },
  '5YJ': { make: 'Tesla', country: 'USA' },
  '5UX': { make: 'BMW', country: 'USA' },
  '5YM': { make: 'BMW M', country: 'USA' },
  '5FR': { make: 'Honda', country: 'USA' },
  '5FN': { make: 'Honda', country: 'USA' },
  '5J6': { make: 'Honda', country: 'USA' },
  '5J8': { make: 'Acura', country: 'USA' },
  '7FA': { make: 'Honda', country: 'USA' },
  '8AP': { make: 'Subaru', country: 'Argentina' },
  '9BW': { make: 'Volkswagen', country: 'Brazil' },
  '93H': { make: 'Honda', country: 'Brazil' },
  '93U': { make: 'Audi', country: 'Brazil' },
  'MAL': { make: 'Hyundai', country: 'India' },
  'MA3': { make: 'Maruti Suzuki', country: 'India' },
  'MEE': { make: 'Mercedes-Benz', country: 'India' },
  'MMC': { make: 'Mitsubishi', country: 'India' },
  'MRH': { make: 'Honda', country: 'India' },
  'NFB': { make: 'Ford', country: 'South Africa' },
  'NHS': { make: 'Hyundai', country: 'South Africa' },
  'NM0': { make: 'Ford', country: 'South Africa' },
  'NM1': { make: 'Volkswagen', country: 'South Africa' },
  'NM2': { make: 'Toyota', country: 'South Africa' },
  'NM3': { make: 'BMW', country: 'South Africa' },
  'NM4': { make: 'Mercedes-Benz', country: 'South Africa' },
  'NM5': { make: 'Nissan', country: 'South Africa' },
  'NM6': { make: 'Mazda', country: 'South Africa' },
  'NM7': { make: 'Isuzu', country: 'South Africa' },
  'NM8': { make: 'Opel', country: 'South Africa' },
  'NM9': { make: 'Renault', country: 'South Africa' },
  'NMT': { make: 'Toyota', country: 'South Africa' },
  'NNA': { make: 'Isuzu', country: 'South Africa' },
  'NNB': { make: 'Mitsubishi', country: 'South Africa' },
  'NNC': { make: 'Daihatsu', country: 'South Africa' },
  'NND': { make: 'Subaru', country: 'South Africa' },
  'NNE': { make: 'Land Rover', country: 'South Africa' },
  'NNJ': { make: 'Jeep', country: 'South Africa' },
  'NNK': { make: 'Kia', country: 'South Africa' },
  'NNL': { make: 'Honda', country: 'South Africa' },
  'NNM': { make: 'Mazda', country: 'South Africa' },
  'NNN': { make: 'Chrysler', country: 'South Africa' },
  'NNP': { make: 'Porsche', country: 'South Africa' },
  'NNR': { make: 'Volvo', country: 'South Africa' },
  'NNS': { make: 'SsangYong', country: 'South Africa' },
  'NNT': { make: 'Tata', country: 'South Africa' },
  'NNU': { make: 'Fiat', country: 'South Africa' },
  'NNV': { make: 'Citroen', country: 'South Africa' },
  'NNW': { make: 'Suzuki', country: 'South Africa' },
  'NNX': { make: 'Peugeot', country: 'South Africa' },
  'NNY': { make: 'Mahindra', country: 'South Africa' },
  'NNZ': { make: 'Chery', country: 'South Africa' },
};

const yearCodes: Record<string, string> = {
  A: '1980', B: '1981', C: '1982', D: '1983', E: '1984', F: '1985',
  G: '1986', H: '1987', J: '1988', K: '1989', L: '1990', M: '1991',
  N: '1992', P: '1993', R: '1994', S: '1995', T: '1996', V: '1997',
  W: '1998', X: '1999', Y: '2000', '1': '2001', '2': '2002', '3': '2003',
  '4': '2004', '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
  A2: '2010', B2: '2011', C2: '2012', D2: '2013', E2: '2014', F2: '2015',
  G2: '2016', H2: '2017', J2: '2018', K2: '2019', L2: '2020', M2: '2021',
  N2: '2022', P2: '2023', R2: '2024', S2: '2025',
};

export function decodeVIN(vin: string): DecodedVIN {
  const clean = vin.trim().toUpperCase();
  const isModern = clean.length === 17;
  const wmi = clean.slice(0, 3);
  const entry = wmiMap[wmi];
  let make = entry?.make || 'Unknown';
  let country = entry?.country || 'Unknown';
  let year = '';
  let productionYear = '';

  if (isModern) {
    const yearCode = clean.charAt(9);
    productionYear = yearCodes[yearCode] || yearCodes[`${yearCode}2`] || 'Unknown';
    year = productionYear;
  } else {
    const matches = clean.match(/(19|20)\d{2}/);
    if (matches) {
      productionYear = matches[0];
      year = productionYear;
    }
  }

  return {
    make,
    model: 'Unknown',
    year,
    country,
    productionYear,
    isModern,
    isValid: clean.length > 0,
  };
}

export function generateStockNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `STK-${y}${m}${d}-${rand}`;
}
