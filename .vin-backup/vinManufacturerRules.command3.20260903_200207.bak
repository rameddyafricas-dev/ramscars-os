export interface VDSDecodeResult {
  model?: string;
  variant?: string;
  trim?: string;
  bodyStyle?: string;
  vehicleCategory?: string;
  engine?: string;
  engineCode?: string;
  fuel?: string;
  transmission?: string;
  driveType?: string;
  assemblyPlant?: string;
  doors?: string;
  seats?: string;
  gvm?: string;
  safety?: string;
  confidence?: string;
  evidence?: string[];
}

export type VDSDecoderFunction = (vin: string, vds: string, context?: any) => VDSDecodeResult | undefined;

interface ManufacturerRules {
  decodeVDS?: VDSDecoderFunction;
}

const registry: Record<string, ManufacturerRules> = {};

export function registerManufacturerRules(manufacturer: string, rules: ManufacturerRules): void {
  registry[manufacturer] = rules;
}

export function getManufacturerRules(manufacturer: string): ManufacturerRules | undefined {
  return registry[manufacturer];
}

// No rules registered yet — this is intentional.
