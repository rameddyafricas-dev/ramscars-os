import { detectModelFromVIN } from './vinModelDetector';

export interface DecodedVIN {
  wmi: string;
  make: string;
  model: string;
  year: string;
  productionYear: string;
  country: string;
  region: string;
  isModern: boolean;
  isValid: boolean;
  possibleYears?: string[];
  errorMessage?: string;
  checkDigit: string;
  checkDigitValid: boolean | null;
  plantCode: string;
  serialNumber: string;
  bodyType?: string;
  engineType?: string;
  transmission?: string;
  vehicleDescriptorSection: string;
  vehicleIdentifierSection: string;
}

const wmiMap: Record<string, { make: string; country: string }> = {
  '1GC': { make: 'Chevrolet', country: 'USA' },
  '1GT': { make: 'GMC', country: 'USA' },
  '1HG': { make: 'Honda', country: 'USA' },
  '1FT': { make: 'Ford', country: 'USA' },
  '1FM': { make: 'Ford', country: 'USA' },
  '1FA': { make: 'Ford', country: 'USA' },
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
  '5YJ': { make: 'Tesla', country: 'USA' },
  '5UX': { make: 'BMW', country: 'USA' },
  '5YM': { make: 'BMW M', country: 'USA' },
  '5FR': { make: 'Honda', country: 'USA' },
  '5FN': { make: 'Honda', country: 'USA' },
  '5J6': { make: 'Honda', country: 'USA' },
  '5J8': { make: 'Acura', country: 'USA' },
  '7FA': { make: 'Honda', country: 'USA' },
  '2HK': { make: 'Honda', country: 'Canada' },
  '2T1': { make: 'Toyota', country: 'Canada' },
  '2T2': { make: 'Lexus', country: 'Canada' },
  '2T3': { make: 'Toyota', country: 'Canada' },
  '2FM': { make: 'Ford', country: 'Canada' },
  '2F1': { make: 'Ford', country: 'Canada' },
  '2G1': { make: 'Chevrolet', country: 'Canada' },
  '2G2': { make: 'Pontiac', country: 'Canada' },
  '2HG': { make: 'Honda', country: 'Canada' },
  '2HM': { make: 'Hyundai', country: 'Canada' },
  '3VW': { make: 'Volkswagen', country: 'Mexico' },
  '3V4': { make: 'Volkswagen', country: 'Mexico' },
  '3V5': { make: 'Volkswagen', country: 'Mexico' },
  '3N1': { make: 'Nissan', country: 'Mexico' },
  '3N6': { make: 'Nissan', country: 'Mexico' },
  'JHM': { make: 'Honda', country: 'Japan' },
  'JH4': { make: 'Acura', country: 'Japan' },
  'JT2': { make: 'Toyota', country: 'Japan' },
  'JT3': { make: 'Toyota', country: 'Japan' },
  'JTD': { make: 'Toyota', country: 'Japan' },
  'JTE': { make: 'Toyota', country: 'Japan' },
  'JTH': { make: 'Lexus', country: 'Japan' },
  'JTJ': { make: 'Lexus', country: 'Japan' },
  'JN1': { make: 'Nissan', country: 'Japan' },
  'JN6': { make: 'Nissan', country: 'Japan' },
  'JA3': { make: 'Mitsubishi', country: 'Japan' },
  'JA4': { make: 'Mitsubishi', country: 'Japan' },
  'JF1': { make: 'Subaru', country: 'Japan' },
  'JF2': { make: 'Subaru', country: 'Japan' },
  'JM1': { make: 'Mazda', country: 'Japan' },
  'JM2': { make: 'Mazda', country: 'Japan' },
  'JM3': { make: 'Mazda', country: 'Japan' },
  'KNA': { make: 'Kia', country: 'South Korea' },
  'KNB': { make: 'Kia', country: 'South Korea' },
  'KNC': { make: 'Kia', country: 'South Korea' },
  'KMH': { make: 'Hyundai', country: 'South Korea' },
  'KMJ': { make: 'Hyundai', country: 'South Korea' },
  'KM8': { make: 'Hyundai', country: 'South Korea' },
  'SAL': { make: 'Land Rover', country: 'UK' },
  'SAJ': { make: 'Jaguar', country: 'UK' },
  'SHS': { make: 'Honda', country: 'UK' },
  'SCC': { make: 'Lotus', country: 'UK' },
  'WBA': { make: 'BMW', country: 'Germany' },
  'WBS': { make: 'BMW M', country: 'Germany' },
  'WDB': { make: 'Mercedes-Benz', country: 'Germany' },
  'WDD': { make: 'Mercedes-Benz', country: 'Germany' },
  'WDC': { make: 'Mercedes-Benz', country: 'Germany' },
  'WMW': { make: 'MINI', country: 'Germany' },
  'WVG': { make: 'Volkswagen', country: 'Germany' },
  'WVW': { make: 'Volkswagen', country: 'Germany' },
  'WV1': { make: 'Volkswagen', country: 'Germany' },
  'WV2': { make: 'Volkswagen', country: 'Germany' },
  'WAU': { make: 'Audi', country: 'Germany' },
  'WP0': { make: 'Porsche', country: 'Germany' },
  'WP1': { make: 'Porsche', country: 'Germany' },
  'ZFF': { make: 'Ferrari', country: 'Italy' },
  'ZFA': { make: 'Fiat', country: 'Italy' },
  'ZAM': { make: 'Maserati', country: 'Italy' },
  'ZAR': { make: 'Alfa Romeo', country: 'Italy' },
  'VF1': { make: 'Renault', country: 'France' },
  'VF3': { make: 'Peugeot', country: 'France' },
  'VF7': { make: 'Citroen', country: 'France' },
  'YV1': { make: 'Volvo', country: 'Sweden' },
  'YV2': { make: 'Volvo', country: 'Sweden' },
  'YS3': { make: 'Saab', country: 'Sweden' },
  'TMB': { make: 'Skoda', country: 'Czech Republic' },
  'MAL': { make: 'Hyundai', country: 'India' },
  'MA3': { make: 'Maruti Suzuki', country: 'India' },
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

const wmiPrefixMap: Record<string, { make: string; country: string }> = {
  '1G': { make: 'General Motors', country: 'USA' },
  '2G': { make: 'General Motors', country: 'Canada' },
  '3G': { make: 'General Motors', country: 'Mexico' },
  '1C': { make: 'Chrysler', country: 'USA' },
  '2C': { make: 'Chrysler', country: 'Canada' },
  '3C': { make: 'Chrysler', country: 'Mexico' },
  '1F': { make: 'Ford', country: 'USA' },
  '2F': { make: 'Ford', country: 'Canada' },
  '3F': { make: 'Ford', country: 'Mexico' },
  '1H': { make: 'Honda', country: 'USA' },
  '2H': { make: 'Honda', country: 'Canada' },
  '3H': { make: 'Honda', country: 'Mexico' },
  '1N': { make: 'Nissan', country: 'USA' },
  '2N': { make: 'Nissan', country: 'Canada' },
  '3N': { make: 'Nissan', country: 'Mexico' },
  '1T': { make: 'Toyota', country: 'USA' },
  '2T': { make: 'Toyota', country: 'Canada' },
  '3T': { make: 'Toyota', country: 'Mexico' },
  'JA': { make: 'Mitsubishi', country: 'Japan' },
  'JF': { make: 'Subaru', country: 'Japan' },
  'JH': { make: 'Honda', country: 'Japan' },
  'JK': { make: 'Kawasaki', country: 'Japan' },
  'JL': { make: 'Isuzu', country: 'Japan' },
  'JM': { make: 'Mazda', country: 'Japan' },
  'JN': { make: 'Nissan', country: 'Japan' },
  'JS': { make: 'Suzuki', country: 'Japan' },
  'JT': { make: 'Toyota', country: 'Japan' },
  'JY': { make: 'Yamaha', country: 'Japan' },
  'KM': { make: 'Hyundai', country: 'South Korea' },
  'KN': { make: 'Kia', country: 'South Korea' },
  'SA': { make: 'Jaguar / Land Rover', country: 'UK' },
  'SC': { make: 'Lotus', country: 'UK' },
  'SH': { make: 'Honda', country: 'UK' },
  'TR': { make: 'Skoda', country: 'Czech Republic' },
  'VA': { make: 'Audi', country: 'Germany' },
  'VB': { make: 'BMW', country: 'Germany' },
  'VF': { make: 'Renault / Peugeot', country: 'France' },
  'VW': { make: 'Volkswagen', country: 'Germany' },
  'WA': { make: 'Audi', country: 'Germany' },
  'WB': { make: 'BMW', country: 'Germany' },
  'WD': { make: 'Mercedes-Benz', country: 'Germany' },
  'WM': { make: 'MINI', country: 'Germany' },
  'WP': { make: 'Porsche', country: 'Germany' },
  'WV': { make: 'Volkswagen', country: 'Germany' },
  'YS': { make: 'Saab', country: 'Sweden' },
  'YV': { make: 'Volvo', country: 'Sweden' },
  'ZA': { make: 'Alfa Romeo', country: 'Italy' },
  'ZF': { make: 'Ferrari', country: 'Italy' },
  'ZM': { make: 'Maserati', country: 'Italy' },
  'NM': { make: 'Various (South Africa)', country: 'South Africa' },
  'NN': { make: 'Various (South Africa)', country: 'South Africa' },
  'NF': { make: 'Ford', country: 'South Africa' },
  'NH': { make: 'Hyundai', country: 'South Africa' },
};

const yearCodesFirstCycle: Record<string, string> = {
  A: '1980', B: '1981', C: '1982', D: '1983', E: '1984', F: '1985',
  G: '1986', H: '1987', J: '1988', K: '1989', L: '1990', M: '1991',
  N: '1992', P: '1993', R: '1994', S: '1995', T: '1996', V: '1997',
  W: '1998', X: '1999', Y: '2000', '1': '2001', '2': '2002', '3': '2003',
  '4': '2004', '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
};

const invalidChars = /[IOQ]/i;

function getYearOptions(yearCode: string): string[] {
  if (!yearCode) return [];
  const firstYear = yearCodesFirstCycle[yearCode];
  if (!firstYear) return [];
  const first = parseInt(firstYear, 10);
  const second = (first + 30).toString();
  return [firstYear, second];
}

function selectBestYear(possibleYears: string[]): string {
  const currentYear = new Date().getFullYear();
  const valid = possibleYears
    .map((y) => parseInt(y, 10))
    .filter((y) => y <= currentYear);
  if (valid.length === 0) return possibleYears[0];
  return Math.max(...valid).toString();
}

function getRegion(firstChar: string): string {
  const code = firstChar.toUpperCase();
  if (code >= 'A' && code <= 'H') return 'Africa';
  if (code >= 'J' && code <= 'R') return 'Asia';
  if (code >= 'S' && code <= 'Z') return 'Europe';
  if (code >= '1' && code <= '5') return 'North America';
  if (code === '6' || code === '7') return 'Oceania';
  if (code === '8' || code === '9') return 'South America';
  return 'Unknown';
}

function validateCheckDigit(vin: string): boolean | null {
  if (vin.length !== 17) return null;
  const translit: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin.charAt(i);
    let value: number;
    if (c >= '0' && c <= '9') {
      value = parseInt(c, 10);
    } else {
      value = translit[c] || 0;
    }
    sum += value * weights[i];
  }
  const check = sum % 11;
  const checkChar = vin.charAt(8);
  if (check === 10) return checkChar === 'X';
  return checkChar === check.toString();
}

function getBodyType(make: string, vin: string): string | undefined {
  const char4 = vin.charAt(3);
  if (make === 'Toyota' || make === 'Lexus') {
    const map: Record<string, string> = {
      A: 'Sedan', B: 'Hatchback', C: 'Coupe', D: 'Wagon', E: 'Convertible',
      F: 'SUV', G: 'Minivan', H: 'Pickup', J: 'Coupe', K: 'Liftback',
    };
    return map[char4];
  }
  if (make === 'Honda' || make === 'Acura') {
    const map: Record<string, string> = {
      C: 'Sedan', E: 'Coupe', F: 'Sedan', G: 'Hatchback', H: 'SUV', J: 'Minivan',
      K: 'Coupe', M: 'Hatchback', N: 'SUV', P: 'Sedan', R: 'Pickup', S: 'Coupe',
    };
    return map[char4];
  }
  if (make === 'Ford' || make === 'Mercury') {
    const map: Record<string, string> = {
      A: 'Sedan', B: 'Sedan', C: 'Coupe', D: 'Wagon', E: 'Convertible',
      F: 'SUV', H: 'Hatchback', J: 'Van', K: 'Pickup', M: 'Minivan', N: 'SUV',
    };
    return map[char4];
  }
  if (make === 'BMW') {
    const map: Record<string, string> = {
      '3': 'Sedan', '5': 'Sedan', '7': 'Sedan', 'X': 'SUV', 'Z': 'Coupe',
    };
    return map[char4];
  }
  return undefined;
}

function getEngineType(make: string, vin: string): string | undefined {
  const char8 = vin.charAt(7);
  if (make === 'Toyota' || make === 'Lexus') {
    const map: Record<string, string> = {
      '1': 'Petrol', '2': 'Petrol', '3': 'Diesel', '4': 'Hybrid', '5': 'Electric',
    };
    return map[char8];
  }
  if (make === 'Honda' || make === 'Acura') {
    const map: Record<string, string> = {
      '1': 'Petrol', '2': 'Petrol', '3': 'Diesel', '4': 'Hybrid', '5': 'Electric',
    };
    return map[char8];
  }
  if (make === 'BMW') {
    const map: Record<string, string> = {
      '1': 'Petrol', '2': 'Diesel', '3': 'Diesel', '4': 'Hybrid', '5': 'Electric',
    };
    return map[char8];
  }
  if (make === 'Mercedes-Benz') {
    const map: Record<string, string> = {
      '1': 'Petrol', '2': 'Petrol', '3': 'Diesel', '4': 'Hybrid', '5': 'Electric',
    };
    return map[char8];
  }
  return undefined;
}

export function decodeVIN(vin: string): DecodedVIN {
  const clean = vin.trim().toUpperCase();
  const isModern = clean.length === 17;
  const wmi = clean.slice(0, 3);
  let entry = wmiMap[wmi];
  if (!entry) {
    const prefix = clean.slice(0, 2);
    entry = wmiPrefixMap[prefix];
  }
  const make = entry?.make || 'Unknown';
  const country = entry?.country || 'Unknown';
  const detectedModel = make !== 'Unknown' ? detectModelFromVIN(clean, make) : undefined;
  const region = getRegion(clean.charAt(0));
  let year = '';
  let productionYear = '';
  let errorMessage = '';

  if (invalidChars.test(clean)) {
    errorMessage = 'VIN contains invalid characters (I, O, Q).';
  } else if (clean.length > 0 && clean.length < 17) {
    errorMessage = 'VIN is shorter than 17 characters (legacy VIN).';
  }

  if (isModern && !errorMessage) {
    const yearCode = clean.charAt(9);
    const possibleYears = getYearOptions(yearCode);
    if (possibleYears.length > 0) {
      year = selectBestYear(possibleYears);
      productionYear = year;
    } else {
      year = 'Unknown';
      productionYear = 'Unknown';
    }
  } else if (clean.length > 0) {
    const matches = clean.match(/(19|20)\d{2}/);
    if (matches) {
      productionYear = matches[0];
      year = productionYear;
    }
  }

  const checkDigit = isModern ? clean.charAt(8) : '';
  const checkDigitValid = isModern ? validateCheckDigit(clean) : null;
  const plantCode = isModern ? clean.charAt(10) : '';
  const serialNumber = isModern ? clean.slice(11) : '';
  const bodyType = getBodyType(make, clean);
  const engineType = getEngineType(make, clean);
  const possibleYears = isModern ? getYearOptions(clean.charAt(9)) : undefined;

  let transmission: string | undefined;
  if (bodyType === 'SUV') transmission = 'automatic';
  if (engineType === 'Diesel') transmission = 'manual';
  if (engineType === 'Electric') transmission = 'automatic';

  return {
    wmi,
    make,
    model: detectedModel || 'Unknown',
    year,
    country,
    region,
    productionYear,
    isModern,
    isValid: clean.length > 0 && !errorMessage,
    possibleYears,
    errorMessage: errorMessage || undefined,
    checkDigit,
    checkDigitValid,
    plantCode,
    serialNumber,
    bodyType,
    engineType,
    transmission,
    vehicleDescriptorSection: clean.slice(3, 9),
    vehicleIdentifierSection: clean.slice(9),
  };
}

let stockSequence = 0;

export function generateStockNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  stockSequence += 1;
  const seq = stockSequence.toString().padStart(2, '0');
  return `RC-${y}${m}${d}-${seq}`;
}
