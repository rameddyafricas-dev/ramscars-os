import {
  WMI_DATABASE,
  VIN_DATABASE_VERSION,
  VIN_DECODER_VERSION,
  INVALID_VIN_CHARS,
  YEAR_CODES_FIRST_CYCLE,
  getRegionFromFirstChar,
} from './vinKnowledgeBase';
import { getManufacturerRules, VDSDecodeResult } from './vinManufacturerRules';
import {
  VinType,
  VinStatus,
  ConfidenceLevel,
  EvidenceItem,
  FieldConfidence,
  ValidationResult,
  DecodedVIN,
} from './vinTypes';

// Simple cache
const decodeCache = new Map<string, DecodedVIN>();

function sanitizeVIN(vin: string): string {
  return vin.trim().toUpperCase().replace(/[\s\-*]/g, '');
}

function containsInvalidChars(vin: string): boolean {
  return INVALID_VIN_CHARS.test(vin);
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
    if (c >= '0' && c <= '9') value = parseInt(c, 10);
    else value = translit[c] || 0;
    sum += value * weights[i];
  }
  const check = sum % 11;
  const checkChar = vin.charAt(8);
  if (check === 10) return checkChar === 'X';
  return checkChar === check.toString();
}

function getVinType(clean: string): VinType {
  if (clean.length === 17) return 'modern';
  if (clean.length > 0 && clean.length < 17) return 'legacy';
  return 'unknown';
}

function getStructuralValidity(clean: string): { structural: boolean; characterSet: boolean; length: boolean } {
  const structural = clean.length === 17 && !containsInvalidChars(clean);
  const characterSet = !containsInvalidChars(clean);
  const length = clean.length === 17;
  return { structural, characterSet, length };
}

function getModelYearCandidates(yearCode: string): string[] {
  if (!yearCode) return [];
  const firstYear = YEAR_CODES_FIRST_CYCLE[yearCode];
  if (!firstYear) return [];
  const first = parseInt(firstYear, 10);
  return [firstYear, (first + 30).toString()];
}

function selectModelYear(candidates: string[]): string {
  if (candidates.length === 0) return 'Unknown';
  const currentYear = new Date().getFullYear();
  const valid = candidates
    .map((y) => parseInt(y, 10))
    .filter((y) => y <= currentYear + 1);
  if (valid.length === 0) return candidates[0];
  return Math.max(...valid).toString();
}

function buildConfidence(value: string, level: ConfidenceLevel, evidence: EvidenceItem[] = [], score = 50): FieldConfidence {
  return { value, level, score, evidence };
}

export function decodeVIN(rawVin: string): DecodedVIN {
  const clean = sanitizeVIN(rawVin);
  const cacheKey = clean;
  const cached = decodeCache.get(cacheKey);
  if (cached) return cached;

  const vinType = getVinType(clean);
  const structural = getStructuralValidity(clean);
  const validation: ValidationResult = {
    structural: structural.structural,
    characterSet: structural.characterSet,
    length: structural.length,
    checksumApplicable: vinType === 'modern',
    checksumValid: vinType === 'modern' ? validateCheckDigit(clean) : null,
    wmiRecognized: false,
    manufacturerRecognized: false,
    manufacturerRulesAvailable: false,
    overallStatus: 'EMPTY',
  };

  let wmi = clean.slice(0, 3);
  let vds = clean.slice(3, 8);
  let vis = clean.slice(8);
  let serialNumber = clean.slice(11);

  let manufacturer: FieldConfidence = buildConfidence('Unknown', 'UNKNOWN');
  let country: FieldConfidence = buildConfidence('Unknown', 'UNKNOWN');
  let region = getRegionFromFirstChar(clean.charAt(0));

  if (clean.length >= 3) {
    const wmiEntry = WMI_DATABASE[wmi];
    if (wmiEntry) {
      validation.wmiRecognized = true;
      validation.manufacturerRecognized = true;
      const confidenceLevel: ConfidenceLevel = wmiEntry.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM';
      manufacturer = buildConfidence(
        wmiEntry.manufacturer,
        confidenceLevel,
        [{ type: 'WMI', detail: `WMI ${wmi} matches ${wmiEntry.manufacturer}` }],
        confidenceLevel === 'HIGH' ? 95 : 80
      );
      country = buildConfidence(
        wmiEntry.country,
        confidenceLevel,
        [{ type: 'WMI', detail: `Country ${wmiEntry.country} from WMI ${wmi}` }],
        confidenceLevel === 'HIGH' ? 90 : 75
      );
      // Check if manufacturer rules available
      const rules = getManufacturerRules(wmiEntry.manufacturer);
      if (rules?.decodeVDS) {
        validation.manufacturerRulesAvailable = true;
      }
    }
  }

  // Model Year
  let modelYear = buildConfidence('Unknown', 'UNKNOWN');
  let modelYearCandidates: string[] = [];
  if (vinType === 'modern' && validation.structural) {
    const yearCode = clean.charAt(9);
    modelYearCandidates = getModelYearCandidates(yearCode);
    const selectedYear = selectModelYear(modelYearCandidates);
    modelYear = buildConfidence(
      selectedYear,
      modelYearCandidates.length > 1 ? 'MEDIUM' : 'HIGH',
      [{ type: 'ISO_3779', detail: `Year code ${yearCode} corresponds to ${modelYearCandidates.join(' / ')}` }],
      modelYearCandidates.length > 1 ? 70 : 95
    );
  }

  // Check if we have manufacturer rules for VDS
  let spec: VDSDecodeResult | undefined;
  if (manufacturer.value !== 'Unknown') {
    const rules = getManufacturerRules(manufacturer.value);
    if (rules?.decodeVDS && vinType === 'modern') {
      spec = rules.decodeVDS(clean, vds, { manufacturer: manufacturer.value, country: country.value });
    }
  }

  // Build field confidences from spec (if any)
  let model = buildConfidence('Unknown', 'UNKNOWN');
  let engine = buildConfidence('Unknown', 'UNKNOWN');
  let bodyStyle = buildConfidence('Unknown', 'UNKNOWN');
  let transmission = buildConfidence('Unknown', 'UNKNOWN');
  let fuel = buildConfidence('Unknown', 'UNKNOWN');
  let assemblyPlant = buildConfidence('Unknown', 'UNKNOWN');
  if (spec) {
    model = spec.model ? buildConfidence(spec.model, 'HIGH', [{ type: 'ManufacturerDecoder', detail: 'Decoded from VDS' }], 95) : model;
    engine = spec.engine ? buildConfidence(spec.engine, 'HIGH', [{ type: 'ManufacturerDecoder', detail: 'Decoded from VDS' }], 95) : engine;
    bodyStyle = spec.bodyStyle ? buildConfidence(spec.bodyStyle, 'HIGH', [{ type: 'ManufacturerDecoder', detail: 'Decoded from VDS' }], 95) : bodyStyle;
    transmission = spec.transmission ? buildConfidence(spec.transmission, 'HIGH', [{ type: 'ManufacturerDecoder', detail: 'Decoded from VDS' }], 95) : transmission;
    fuel = spec.fuel ? buildConfidence(spec.fuel, 'HIGH', [{ type: 'ManufacturerDecoder', detail: 'Decoded from VDS' }], 95) : fuel;
    assemblyPlant = spec.assemblyPlant ? buildConfidence(spec.assemblyPlant, 'MEDIUM', [{ type: 'ManufacturerDecoder', detail: 'Decoded from plant code' }], 70) : assemblyPlant;
  }

  // Determine overall status
  let overallStatus: VinStatus = 'EMPTY';
  const hasInvalidChars = containsInvalidChars(clean);
  if (clean.length === 0) {
    overallStatus = 'EMPTY';
  } else if (hasInvalidChars || (clean.length !== 17 && clean.length < 6)) {
    overallStatus = 'INVALID';
  } else if (vinType === 'legacy') {
    overallStatus = 'POSSIBLE_LEGACY';
  } else if (vinType === 'modern') {
    if (!validation.structural) {
      overallStatus = 'INVALID';
    } else if (validation.checksumValid === false) {
      overallStatus = 'CHECKSUM_FAILED';
    } else if (!validation.wmiRecognized) {
      overallStatus = 'UNKNOWN_WMI';
    } else if (spec && Object.keys(spec).length > 0) {
      overallStatus = 'FULLY_DECODED';
    } else {
      overallStatus = 'PARTIALLY_DECODED';
    }
  }
  validation.overallStatus = overallStatus;

  // Confidence overall
  let overallConfidence: ConfidenceLevel = 'UNKNOWN';
  let overallScore = 0;
  if (validation.manufacturerRecognized) {
    overallConfidence = 'HIGH';
    overallScore = 85;
    if (spec && Object.keys(spec).length > 0) {
      overallConfidence = 'VERY_HIGH';
      overallScore = 95;
    }
  } else if (validation.wmiRecognized) {
    overallConfidence = 'MEDIUM';
    overallScore = 60;
  }

  const decoded: DecodedVIN = {
    vin: rawVin,
    normalizedVIN: clean,
    vinType,
    vinStatus: overallStatus,
    validation,
    wmi,
    vds,
    vis,
    serialNumber,
    manufacturer,
    country,
    region,
    modelYear,
    modelYearCandidates,
    productionYear: modelYear.value !== 'Unknown' ? modelYear.value : '',
    model,
    engine,
    bodyStyle,
    transmission,
    fuel,
    assemblyPlant,
    confidence: { overall: overallConfidence, score: overallScore },
    evidence: [
      ...manufacturer.evidence,
      ...country.evidence,
      ...modelYear.evidence,
      ...model.evidence,
    ],
    conflicts: [],
    candidates: {},
    warnings: [],
    decoderVersion: VIN_DECODER_VERSION,
    databaseVersion: VIN_DATABASE_VERSION,
    decodedAt: new Date().toISOString(),
  };

  decodeCache.set(cacheKey, decoded);
  return decoded;
}

export function explainVIN(rawVin: string): string {
  const result = decodeVIN(rawVin);
  const lines = [
    `VIN: ${result.vin}`,
    `Normalized: ${result.normalizedVIN}`,
    `Type: ${result.vinType}`,
    `Status: ${result.vinStatus}`,
    `Validation: ${JSON.stringify(result.validation, null, 2)}`,
    `WMI: ${result.wmi}`,
    `Manufacturer: ${result.manufacturer.value} (Confidence: ${result.manufacturer.level}, Score: ${result.manufacturer.score})`,
    `Country: ${result.country.value} (${result.region})`,
    `Model Year: ${result.modelYear.value} (Candidates: ${result.modelYearCandidates.join(', ') || 'None'})`,
    `Model: ${result.model?.value !== 'Unknown' ? result.model?.value : 'Not decodable from available verified rules'}`,
    `Engine: ${result.engine?.value !== 'Unknown' ? result.engine?.value : 'Not decodable'}`,
    `Body: ${result.bodyStyle?.value !== 'Unknown' ? result.bodyStyle?.value : 'Not decodable'}`,
    `Transmission: ${result.transmission?.value !== 'Unknown' ? result.transmission?.value : 'Not decodable'}`,
    `Fuel: ${result.fuel?.value !== 'Unknown' ? result.fuel?.value : 'Not decodable'}`,
    `Assembly Plant: ${result.assemblyPlant?.value !== 'Unknown' ? result.assemblyPlant?.value : 'Not decodable'}`,
    `Evidence: ${result.evidence.map(e => e.detail).join('; ')}`,
    `Conflicts: ${result.conflicts.join(', ') || 'None'}`,
    `Warnings: ${result.warnings.join(', ') || 'None'}`,
  ];
  return lines.join('\n');
}

export function clearVINCache(): void {
  decodeCache.clear();
}
