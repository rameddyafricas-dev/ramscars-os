export const VIN_DATABASE_VERSION = '1.0.0';
export const VIN_DECODER_VERSION = '2.0.0';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WMIEntry {
  wmi: string;
  manufacturer: string;
  country: string;
  region: string;
  confidence: Confidence;
  sourceType?: 'WMI';
  market?: string;
  notes?: string;
}

// Extensive WMI database for South African and international markets
export const WMI_DATABASE: Record<string, WMIEntry> = {
  // South Africa specific
  'AHT': { wmi: 'AHT', manufacturer: 'Toyota', country: 'South Africa', region: 'Africa', confidence: 'HIGH', market: 'South Africa' },
  'AHU': { wmi: 'AHU', manufacturer: 'Toyota', country: 'South Africa', region: 'Africa', confidence: 'HIGH', market: 'South Africa' },
  'AHV': { wmi: 'AHV', manufacturer: 'Toyota', country: 'South Africa', region: 'Africa', confidence: 'HIGH', market: 'South Africa' },
  'AFA': { wmi: 'AFA', manufacturer: 'Ford', country: 'South Africa', region: 'Africa', confidence: 'MEDIUM', market: 'South Africa' },
  'AFB': { wmi: 'AFB', manufacturer: 'Ford', country: 'South Africa', region: 'Africa', confidence: 'MEDIUM', market: 'South Africa' },
  'ADN': { wmi: 'ADN', manufacturer: 'Nissan', country: 'South Africa', region: 'Africa', confidence: 'MEDIUM', market: 'South Africa' },
  'ADM': { wmi: 'ADM', manufacturer: 'Isuzu', country: 'South Africa', region: 'Africa', confidence: 'MEDIUM', market: 'South Africa' },
  'AFM': { wmi: 'AFM', manufacturer: 'BMW', country: 'South Africa', region: 'Africa', confidence: 'MEDIUM', market: 'South Africa' },
  'ADW': { wmi: 'ADW', manufacturer: 'Mercedes-Benz', country: 'South Africa', region: 'Africa', confidence: 'MEDIUM', market: 'South Africa' },
  // Global / USA
  '1GC': { wmi: '1GC', manufacturer: 'Chevrolet', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1GT': { wmi: '1GT', manufacturer: 'GMC', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1HG': { wmi: '1HG', manufacturer: 'Honda', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1FT': { wmi: '1FT', manufacturer: 'Ford', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1FM': { wmi: '1FM', manufacturer: 'Ford', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1FA': { wmi: '1FA', manufacturer: 'Ford', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1G1': { wmi: '1G1', manufacturer: 'Chevrolet', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1G2': { wmi: '1G2', manufacturer: 'Pontiac', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1G3': { wmi: '1G3', manufacturer: 'Oldsmobile', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1G4': { wmi: '1G4', manufacturer: 'Buick', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1G6': { wmi: '1G6', manufacturer: 'Cadillac', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1G8': { wmi: '1G8', manufacturer: 'Saturn', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1GM': { wmi: '1GM', manufacturer: 'GMC', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1GY': { wmi: '1GY', manufacturer: 'Chevrolet', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1C3': { wmi: '1C3', manufacturer: 'Chrysler', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1C4': { wmi: '1C4', manufacturer: 'Chrysler', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1C6': { wmi: '1C6', manufacturer: 'Dodge', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1B3': { wmi: '1B3', manufacturer: 'Dodge', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1J4': { wmi: '1J4', manufacturer: 'Jeep', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1N4': { wmi: '1N4', manufacturer: 'Nissan', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1N6': { wmi: '1N6', manufacturer: 'Nissan', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '1NX': { wmi: '1NX', manufacturer: 'Toyota', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5YJ': { wmi: '5YJ', manufacturer: 'Tesla', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5UX': { wmi: '5UX', manufacturer: 'BMW', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5YM': { wmi: '5YM', manufacturer: 'BMW M', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5FR': { wmi: '5FR', manufacturer: 'Honda', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5FN': { wmi: '5FN', manufacturer: 'Honda', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5J6': { wmi: '5J6', manufacturer: 'Honda', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '5J8': { wmi: '5J8', manufacturer: 'Acura', country: 'USA', region: 'North America', confidence: 'HIGH' },
  '7FA': { wmi: '7FA', manufacturer: 'Honda', country: 'USA', region: 'North America', confidence: 'HIGH' },
  // Canada
  '2HK': { wmi: '2HK', manufacturer: 'Honda', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2T1': { wmi: '2T1', manufacturer: 'Toyota', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2T2': { wmi: '2T2', manufacturer: 'Lexus', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2T3': { wmi: '2T3', manufacturer: 'Toyota', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2FM': { wmi: '2FM', manufacturer: 'Ford', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2F1': { wmi: '2F1', manufacturer: 'Ford', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2G1': { wmi: '2G1', manufacturer: 'Chevrolet', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2G2': { wmi: '2G2', manufacturer: 'Pontiac', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2HG': { wmi: '2HG', manufacturer: 'Honda', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  '2HM': { wmi: '2HM', manufacturer: 'Hyundai', country: 'Canada', region: 'North America', confidence: 'HIGH' },
  // Mexico
  '3VW': { wmi: '3VW', manufacturer: 'Volkswagen', country: 'Mexico', region: 'North America', confidence: 'HIGH' },
  '3V4': { wmi: '3V4', manufacturer: 'Volkswagen', country: 'Mexico', region: 'North America', confidence: 'HIGH' },
  '3V5': { wmi: '3V5', manufacturer: 'Volkswagen', country: 'Mexico', region: 'North America', confidence: 'HIGH' },
  '3N1': { wmi: '3N1', manufacturer: 'Nissan', country: 'Mexico', region: 'North America', confidence: 'HIGH' },
  '3N6': { wmi: '3N6', manufacturer: 'Nissan', country: 'Mexico', region: 'North America', confidence: 'HIGH' },
  // Japan
  'JHM': { wmi: 'JHM', manufacturer: 'Honda', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JH4': { wmi: 'JH4', manufacturer: 'Acura', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JT2': { wmi: 'JT2', manufacturer: 'Toyota', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JT3': { wmi: 'JT3', manufacturer: 'Toyota', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JTD': { wmi: 'JTD', manufacturer: 'Toyota', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JTE': { wmi: 'JTE', manufacturer: 'Toyota', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JTH': { wmi: 'JTH', manufacturer: 'Lexus', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JTJ': { wmi: 'JTJ', manufacturer: 'Lexus', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JN1': { wmi: 'JN1', manufacturer: 'Nissan', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JN6': { wmi: 'JN6', manufacturer: 'Nissan', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JA3': { wmi: 'JA3', manufacturer: 'Mitsubishi', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JA4': { wmi: 'JA4', manufacturer: 'Mitsubishi', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JF1': { wmi: 'JF1', manufacturer: 'Subaru', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JF2': { wmi: 'JF2', manufacturer: 'Subaru', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JM1': { wmi: 'JM1', manufacturer: 'Mazda', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JM2': { wmi: 'JM2', manufacturer: 'Mazda', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  'JM3': { wmi: 'JM3', manufacturer: 'Mazda', country: 'Japan', region: 'Asia', confidence: 'HIGH' },
  // South Korea
  'KNA': { wmi: 'KNA', manufacturer: 'Kia', country: 'South Korea', region: 'Asia', confidence: 'HIGH' },
  'KNB': { wmi: 'KNB', manufacturer: 'Kia', country: 'South Korea', region: 'Asia', confidence: 'HIGH' },
  'KNC': { wmi: 'KNC', manufacturer: 'Kia', country: 'South Korea', region: 'Asia', confidence: 'HIGH' },
  'KMH': { wmi: 'KMH', manufacturer: 'Hyundai', country: 'South Korea', region: 'Asia', confidence: 'HIGH' },
  'KMJ': { wmi: 'KMJ', manufacturer: 'Hyundai', country: 'South Korea', region: 'Asia', confidence: 'HIGH' },
  'KM8': { wmi: 'KM8', manufacturer: 'Hyundai', country: 'South Korea', region: 'Asia', confidence: 'HIGH' },
  // Germany
  'WBA': { wmi: 'WBA', manufacturer: 'BMW', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WBS': { wmi: 'WBS', manufacturer: 'BMW M', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WDB': { wmi: 'WDB', manufacturer: 'Mercedes-Benz', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WDD': { wmi: 'WDD', manufacturer: 'Mercedes-Benz', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WDC': { wmi: 'WDC', manufacturer: 'Mercedes-Benz', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WMW': { wmi: 'WMW', manufacturer: 'MINI', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WVG': { wmi: 'WVG', manufacturer: 'Volkswagen', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WVW': { wmi: 'WVW', manufacturer: 'Volkswagen', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WV1': { wmi: 'WV1', manufacturer: 'Volkswagen', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WV2': { wmi: 'WV2', manufacturer: 'Volkswagen', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WAU': { wmi: 'WAU', manufacturer: 'Audi', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WP0': { wmi: 'WP0', manufacturer: 'Porsche', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  'WP1': { wmi: 'WP1', manufacturer: 'Porsche', country: 'Germany', region: 'Europe', confidence: 'HIGH' },
  // UK
  'SAL': { wmi: 'SAL', manufacturer: 'Land Rover', country: 'UK', region: 'Europe', confidence: 'HIGH' },
  'SAJ': { wmi: 'SAJ', manufacturer: 'Jaguar', country: 'UK', region: 'Europe', confidence: 'HIGH' },
  'SHS': { wmi: 'SHS', manufacturer: 'Honda', country: 'UK', region: 'Europe', confidence: 'HIGH' },
  'SCC': { wmi: 'SCC', manufacturer: 'Lotus', country: 'UK', region: 'Europe', confidence: 'HIGH' },
  // Italy
  'ZFF': { wmi: 'ZFF', manufacturer: 'Ferrari', country: 'Italy', region: 'Europe', confidence: 'HIGH' },
  'ZFA': { wmi: 'ZFA', manufacturer: 'Fiat', country: 'Italy', region: 'Europe', confidence: 'HIGH' },
  'ZAM': { wmi: 'ZAM', manufacturer: 'Maserati', country: 'Italy', region: 'Europe', confidence: 'HIGH' },
  'ZAR': { wmi: 'ZAR', manufacturer: 'Alfa Romeo', country: 'Italy', region: 'Europe', confidence: 'HIGH' },
  // France
  'VF1': { wmi: 'VF1', manufacturer: 'Renault', country: 'France', region: 'Europe', confidence: 'HIGH' },
  'VF3': { wmi: 'VF3', manufacturer: 'Peugeot', country: 'France', region: 'Europe', confidence: 'HIGH' },
  'VF7': { wmi: 'VF7', manufacturer: 'Citroen', country: 'France', region: 'Europe', confidence: 'HIGH' },
  // Sweden
  'YV1': { wmi: 'YV1', manufacturer: 'Volvo', country: 'Sweden', region: 'Europe', confidence: 'HIGH' },
  'YV2': { wmi: 'YV2', manufacturer: 'Volvo', country: 'Sweden', region: 'Europe', confidence: 'HIGH' },
  'YS3': { wmi: 'YS3', manufacturer: 'Saab', country: 'Sweden', region: 'Europe', confidence: 'HIGH' },
};

export const INVALID_VIN_CHARS = /[IOQ]/i;

export const YEAR_CODES_FIRST_CYCLE: Record<string, string> = {
  A: '1980', B: '1981', C: '1982', D: '1983', E: '1984', F: '1985',
  G: '1986', H: '1987', J: '1988', K: '1989', L: '1990', M: '1991',
  N: '1992', P: '1993', R: '1994', S: '1995', T: '1996', V: '1997',
  W: '1998', X: '1999', Y: '2000', '1': '2001', '2': '2002', '3': '2003',
  '4': '2004', '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
};

export function getRegionFromFirstChar(firstChar: string): string {
  const code = firstChar.toUpperCase();
  if (code >= 'A' && code <= 'H') return 'Africa';
  if (code >= 'J' && code <= 'R') return 'Asia';
  if (code >= 'S' && code <= 'Z') return 'Europe';
  if (code >= '1' && code <= '5') return 'North America';
  if (code === '6' || code === '7') return 'Oceania';
  if (code === '8' || code === '9') return 'South America';
  return 'Unknown';
}

export function getYearOptions(yearCode: string): string[] {
  if (!yearCode) return [];
  const firstYear = YEAR_CODES_FIRST_CYCLE[yearCode];
  if (!firstYear) return [];
  const first = parseInt(firstYear, 10);
  return [firstYear, (first + 30).toString()];
}
