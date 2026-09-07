import type { FinancialInfo, Inspection, Vehicle } from '../types';

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


export function buildVehicleData(
  form: Inspection,
  existingVehicle: Vehicle | undefined,
  opts?: { includeOwnerName?: boolean; preserveNotes?: boolean }
): Vehicle {
  const now = new Date().toISOString();
  return {
    id: existingVehicle?.id || `veh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    vin: form.vehicleInfo.vin,
    registration: form.vehicleInfo.registrationNumber,
    make: form.vehicleInfo.make,
    model: form.vehicleInfo.model,
    year: Number(form.vehicleInfo.year) || 0,
    mileage: Number(form.vehicleInfo.mileage) || 0,
    colour: form.vehicleInfo.color,
    fuelType: form.vehicleInfo.fuelType,
    transmission: form.vehicleInfo.transmission,
    classification: form.vehicleInfo.bodyType,
    status: existingVehicle?.status || 'available',
    notes: opts?.preserveNotes ? (existingVehicle?.notes || '') : '',
    ownerName: opts?.includeOwnerName ? form.ownerInfo.name : undefined,
    stockNumber: form.vehicleInfo.stockNumber,
    photos: form.advertisementSlots && form.advertisementSlots.length > 0 ? form.advertisementSlots.filter((slot) => slot.photo).map((slot) => slot.photo) : form.advertisementPhotos,
    inspectionId: form.id,
    listingPrice: form.financial.sellingPrice ?? undefined,
    createdAt: existingVehicle?.createdAt || now,
    updatedAt: now,
  };
}
