export type VinType = 'modern' | 'legacy' | 'unknown';
export type VinStatus = 'EMPTY' | 'INVALID' | 'POSSIBLE_LEGACY' | 'VALID' | 'VALID_WITH_WARNINGS' | 'CHECKSUM_FAILED' | 'UNKNOWN_WMI' | 'IDENTITY_CONFLICT' | 'PARTIALLY_DECODED' | 'FULLY_DECODED';

export type ConfidenceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' | 'UNKNOWN';

export interface EvidenceItem {
  type: string;
  detail: string;
}

export interface FieldConfidence {
  value: string;
  level: ConfidenceLevel;
  score: number; // 0-100
  evidence: EvidenceItem[];
}

export interface ValidationResult {
  structural: boolean;
  characterSet: boolean;
  length: boolean;
  checksumApplicable: boolean;
  checksumValid: boolean | null;
  wmiRecognized: boolean;
  manufacturerRecognized: boolean;
  manufacturerRulesAvailable: boolean;
  overallStatus: VinStatus;
}

export interface DecodedVIN {
  vin: string;
  normalizedVIN: string;
  vinType: VinType;
  vinStatus: VinStatus;
  validation: ValidationResult;
  wmi: string;
  vds: string;
  vis: string;
  serialNumber: string;
  manufacturer: FieldConfidence;
  country: FieldConfidence;
  region: string;
  modelYear: FieldConfidence;
  modelYearCandidates: string[];
  productionYear: string;
  vehicleCategory?: FieldConfidence;
  bodyStyle?: FieldConfidence;
  model?: FieldConfidence;
  variant?: FieldConfidence;
  trim?: FieldConfidence;
  engine?: FieldConfidence;
  engineCode?: FieldConfidence;
  fuel?: FieldConfidence;
  transmission?: FieldConfidence;
  driveType?: FieldConfidence;
  assemblyPlant?: FieldConfidence;
  doors?: FieldConfidence;
  seats?: FieldConfidence;
  gvm?: FieldConfidence;
  safety?: FieldConfidence;
  confidence: {
    overall: ConfidenceLevel;
    score: number;
  };
  evidence: EvidenceItem[];
  conflicts: string[];
  candidates: Record<string, any[]>;
  warnings: string[];
  decoderVersion: string;
  databaseVersion: string;
  decodedAt: string;
}
