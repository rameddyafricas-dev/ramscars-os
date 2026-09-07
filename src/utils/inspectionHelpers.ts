import type { FinancialInfo, Inspection } from '../types';

export function recalcFinancial(financial: FinancialInfo): FinancialInfo {
  const purchase = financial.purchasePrice || 0;
  const selling = financial.sellingPrice || 0;
  const additionalTotal = (financial.additionalCosts || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  if (purchase > 0 && selling > 0) {
    financial.estimatedProfit = selling - purchase - additionalTotal;
    financial.expectedMargin = (financial.estimatedProfit / purchase) * 100;
  } else {
    financial.estimatedProfit = null;
    financial.expectedMargin = null;
  }
  return financial;
}

export function calculateInspectionProgress(inspection: Inspection): number {
  let completed = 0;
  const sections = [
    inspection.ownerInfo.name && inspection.ownerInfo.contactNumber,
    inspection.vehicleInfo.make && inspection.vehicleInfo.model && inspection.vehicleInfo.vin,
    inspection.checklist.some((c) => c.result === 'pass' || c.result === 'advisory'),
    inspection.faults.length > 0 || inspection.advertisementPhotos.length > 0,
    inspection.location.decimal || inspection.location.dms,
    inspection.financial.purchasePrice && inspection.financial.sellingPrice,
    inspection.marketing.title,
  ];
  sections.forEach((s) => { if (s) completed++ });
  return Math.round((completed / sections.length) * 100);
}
