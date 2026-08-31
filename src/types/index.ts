export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleStatus = 'available' | 'reserved' | 'sold' | 'withdrawn';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'other';
export type Transmission = 'manual' | 'automatic' | 'cvt' | 'other';

export interface Vehicle extends BaseEntity {
  vin: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  colour: string;
  fuelType: FuelType;
  transmission: Transmission;
  classification: string;
  status: VehicleStatus;
  notes?: string;
  stockNumber?: string;
  photos?: string[];
  inspectionId?: string;
  ownerName?: string;
  listingPrice?: number;
}

export interface OwnerInfo {
  name: string;
  contactNumber: string;
  email: string;
  idNumber: string;
  physicalAddress: string;
}

export interface VehicleInfo {
  vehicleType: 'runner' | 'non-runner';
  make: string;
  model: string;
  year: string;
  color: string;
  bodyType: string;
  mileage: string;
  transmission: Transmission;
  fuelType: FuelType;
  registrationNumber: string;
  licenseExpiry: string;
  vin: string;
  engineNumber: string;
  vehiclePapers: 'available' | 'pending' | 'missing';
  vehicleStatus: string;
  stockNumber: string;
}

export type InspectionResult = 'pass' | 'advisory' | 'fail' | 'na';
export type InspectionStatus = 'draft' | 'in_progress' | 'completed';

export interface InspectionItem {
  id: string;
  category: string;
  item: string;
  result: InspectionResult;
  notes?: string;
  mediaIds?: string[];
  photoLabels?: string[];
  defaultPhotoCount?: number;
}

export interface Fault {
  id: string;
  description: string;
}

export interface AdvertisementSlot {
  id: string;
  label: string;
  photo: string;
}

export interface ChecklistItem {
  id: string;
  category: 'documentation' | 'exterior' | 'interior' | 'engine_bay' | 'underbody';
  label: string;
  checked: boolean;
  result?: 'pass' | 'advisory' | 'fail' | 'na';
  note?: string;
  mediaIds?: string[];
  photoLabels?: string[];
  defaultPhotoCount?: number;
}

export interface InspectionScore {
  mechanical: number | null;
  interior: number | null;
  exterior: number | null;
  electrical: number | null;
  safety: number | null;
  body: number | null;
  engine: number | null;
  suspension: number | null;
}

export interface LocationInfo {
  dms: string;
  decimal: string;
  gps?: { lat: number; lng: number };
  bay?: string;
}

export interface AdditionalCost {
  label: string;
  amount: number;
}

export interface FinancialInfo {
  purchasePrice: number | null;
  sellingPrice: number | null;
  estimatedProfit: number | null;
  expectedMargin: number | null;
  tradeValue: number | null;
  additionalCosts?: AdditionalCost[];
}

export interface MarketingInfo {
  title: string;
  description: string;
  seoKeywords: string[];
  hashtags: string[];
  channels: string[];
}

export interface Inspection extends BaseEntity {
  vehicleId: string;
  status: InspectionStatus;
  inspector?: string;
  inspectionDate: string;
  items: InspectionItem[];
  notes?: string;
  ownerInfo: OwnerInfo;
  vehicleInfo: VehicleInfo;
  faults: Fault[];
  checklist: ChecklistItem[];
  score: InspectionScore;
  location: LocationInfo;
  financial: FinancialInfo;
  marketing: MarketingInfo;
  progress: number;
  advertisementPhotos: string[];
  advertisementSlots?: AdvertisementSlot[];
}

export type MediaType = 'advertisement' | 'evidence' | 'document' | 'other';
export interface Media extends BaseEntity { vehicleId?: string; inspectionId?: string; type: MediaType; filename: string; mimeType: string; size: number; url?: string; blob?: Blob; }
export interface Document extends BaseEntity { vehicleId?: string; saleId?: string; type: string; title: string; fileUrl?: string; metadata?: Record<string, unknown>; }
export type CustomerRole = 'owner' | 'buyer' | 'other';
export interface Customer extends BaseEntity { name: string; phone?: string; email?: string; address?: string; role: CustomerRole; notes?: string; }
export interface Payment extends BaseEntity {
  saleId: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

export type SaleStatus = 'reserved' | 'in_progress' | 'agreed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export interface Sale extends BaseEntity {
  vehicleId: string;
  buyerId: string;
  consignmentId?: string;
  status: SaleStatus;
  salePrice: number;
  deposit?: number;
  paymentStatus: PaymentStatus;
  dateReserved?: string;
  dateAgreed?: string;
  dateCompleted?: string;
  notes?: string;
}

export type ConsignmentPeriod = '30' | '60' | '90';
export type ConsignmentStatus = 'active' | 'expiring' | 'expired' | 'cancelled' | 'completed';

export interface Consignment extends BaseEntity {
  vehicleId: string;
  ownerId: string;
  startDate: string;
  expiryDate: string;
  period: ConsignmentPeriod;
  targetPrice: number;
  listingPrice: number;
  status: ConsignmentStatus;
  notes?: string;
}

export type ReportType = 'internal' | 'customer';
export interface Report extends BaseEntity { type: ReportType; vehicleId?: string; saleId?: string; generatedAt: string; data: Record<string, unknown>; fileUrl?: string; }
export interface Reminder extends BaseEntity {
  title: string;
  vehicleId?: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
}

export type AuditAction = 'created' | 'updated' | 'deleted' | 'completed' | 'cancelled' | 'payment_received';

export interface AuditLog extends BaseEntity {
  entityType: string;
  entityId: string;
  action: AuditAction;
  message: string;
  metadata?: Record<string, unknown>;
}

export type ID = string;
