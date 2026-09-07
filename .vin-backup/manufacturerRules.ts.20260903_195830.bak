export interface VDSDecodeResult {
  model?: string;
  engine?: string;
  body?: string;
  transmission?: string;
  fuel?: string;
  trim?: string;
  // Additional fields possible, but never guessed
}

export type VDSDecodeFunction = (vin: string, vds: string) => VDSDecodeResult | undefined;

interface ManufacturerRuleEntry {
  decodeVDS?: VDSDecodeFunction;
}

const registry: Record<string, ManufacturerRuleEntry> = {};

export function registerManufacturerRules(manufacturer: string, rules: ManufacturerRuleEntry): void {
  registry[manufacturer] = rules;
}

export function getManufacturerRules(manufacturer: string): ManufacturerRuleEntry | undefined {
  return registry[manufacturer];
}

// No rules registered yet — this is intentional.
