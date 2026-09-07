import { describe, it, expect } from 'vitest'
import { recalcFinancial, calculateInspectionProgress, buildVehicleData } from './inspectionHelpers'
import { parseDecimalCoordinates, getCoordinatesForMap } from './locationUtils'
import type { FinancialInfo, Inspection } from '../types'

describe('recalcFinancial', () => {
  const baseFin: FinancialInfo = {
    purchasePrice: 100,
    sellingPrice: 150,
    estimatedProfit: null,
    expectedMargin: null,
    tradeValue: null,
    additionalCosts: [{ label: 'Repairs', amount: 10 }],
  }

  it('calculates profit and margin when purchase and selling positive', () => {
    const result = recalcFinancial({ ...baseFin })
    expect(result.estimatedProfit).toBe(40)
    expect(result.expectedMargin).toBe(40)
  })

  it('sets estimatedProfit and expectedMargin to null if purchase or selling missing', () => {
    const result = recalcFinancial({ ...baseFin, purchasePrice: 0 })
    expect(result.estimatedProfit).toBeNull()
    expect(result.expectedMargin).toBeNull()
  })
})

describe('calculateInspectionProgress', () => {
  const baseInspection = {
    ownerInfo: { name: 'Owner', contactNumber: '123', email: '', idNumber: '', physicalAddress: '' },
    vehicleInfo: {
      vehicleType: 'runner', make: 'Toyota', model: 'Corolla', year: '2020', color: 'White',
      bodyType: 'Sedan', mileage: '1000', transmission: 'manual', fuelType: 'petrol',
      registrationNumber: '', licenseExpiry: '', vin: 'ABC123', engineNumber: '',
      vehiclePapers: 'available', vehicleStatus: 'At yard', stockNumber: ''
    },
    checklist: [{ id: '1', category: 'documentation', label: 'Item', result: 'pass', mediaIds: [] }],
    faults: [{ id: 'f1', description: 'Fault' }],
    advertisementPhotos: [],
    advertisementSlots: [],
    location: { dms: '', decimal: '-26.195246, 28.034088', gps: { lat: -26.195246, lng: 28.034088 }, bay: '' },
    financial: { purchasePrice: 100, sellingPrice: 200, estimatedProfit: null, expectedMargin: null, tradeValue: null, additionalCosts: [] },
    marketing: { title: 'Title', description: '', seoKeywords: [], hashtags: [], channels: [] },
    id: 'insp1', createdAt: '', updatedAt: '', vehicleId: '', status: 'in_progress', inspector: '', inspectionDate: '',
    items: [], notes: '', score: { mechanical: null, interior: null, exterior: null, electrical: null, safety: null, body: null, engine: null, suspension: null },
    progress: 0
  } as unknown as Inspection

  it('returns 100 when all sections complete', () => {
    const result = calculateInspectionProgress(baseInspection)
    expect(result).toBe(100)
  })

  it('returns 0 when no sections complete', () => {
    const empty = {
      ...baseInspection,
      ownerInfo: { ...baseInspection.ownerInfo, name: '', contactNumber: '' },
      vehicleInfo: { ...baseInspection.vehicleInfo, make: '', model: '', vin: '' },
      checklist: [],
      faults: [],
      advertisementPhotos: [],
      advertisementSlots: [],
      location: { dms: '', decimal: '', gps: undefined, bay: '' },
      financial: { ...baseInspection.financial, purchasePrice: null, sellingPrice: null },
      marketing: { ...baseInspection.marketing, title: '' },
    } as unknown as Inspection
    expect(calculateInspectionProgress(empty)).toBe(0)
  })
})

describe('buildVehicleData', () => {
  const inspection = {
    id: 'insp1', vehicleInfo: {
      vehicleType: 'runner', make: 'Toyota', model: 'Corolla', year: '2020', color: 'White',
      bodyType: 'Sedan', mileage: '1000', transmission: 'manual', fuelType: 'petrol',
      registrationNumber: 'REG123', licenseExpiry: '', vin: 'VIN123', engineNumber: 'ENG',
      vehiclePapers: 'available', vehicleStatus: 'At yard', stockNumber: 'RC-001'
    },
    ownerInfo: { name: 'Owner', contactNumber: '123', email: '', idNumber: '', physicalAddress: '' },
    advertisementSlots: [{ id: 's1', label: 'Front', photo: 'photo1' }],
    advertisementPhotos: [],
    financial: { purchasePrice: 100, sellingPrice: 200, estimatedProfit: null, expectedMargin: null, tradeValue: null, additionalCosts: [] },
  } as unknown as Inspection

  it('builds vehicle data from inspection with default options', () => {
    const vehicle = buildVehicleData(inspection, undefined)
    expect(vehicle.make).toBe('Toyota')
    expect(vehicle.stockNumber).toBe('RC-001')
    expect(vehicle.photos).toEqual(['photo1'])
    expect(vehicle.ownerName).toBeUndefined()
    expect(vehicle.notes).toBe('')
  })

  it('includes ownerName when includeOwnerName true', () => {
    const vehicle = buildVehicleData(inspection, undefined, { includeOwnerName: true })
    expect(vehicle.ownerName).toBe('Owner')
  })
})

describe('parseDecimalCoordinates', () => {
  it('parses valid decimal coordinates', () => {
    expect(parseDecimalCoordinates('-26.195246, 28.034088')).toEqual({ lat: -26.195246, lng: 28.034088 })
  })

  it('returns undefined for invalid coordinates', () => {
    expect(parseDecimalCoordinates('invalid')).toBeUndefined()
    expect(parseDecimalCoordinates('123')).toBeUndefined()
  })
})

describe('getCoordinatesForMap', () => {
  it('prefers decimal over gps', () => {
    const loc = { dms: '', decimal: '1,2', gps: { lat: 3, lng: 4 }, bay: '' }
    expect(getCoordinatesForMap(loc)).toBe('1,2')
  })

  it('falls back to gps when decimal missing', () => {
    const loc = { dms: '', decimal: '', gps: { lat: 3, lng: 4 }, bay: '' }
    expect(getCoordinatesForMap(loc)).toBe('3,4')
  })

  it('returns undefined when no coordinates', () => {
    const loc = { dms: '', decimal: '', gps: undefined, bay: '' }
    expect(getCoordinatesForMap(loc)).toBeUndefined()
  })
})
