import type { VehicleInfo, MarketingInfo } from '../types'

export function generateAutoListing(vehicleInfo: VehicleInfo, existing: MarketingInfo): MarketingInfo {
  const v = vehicleInfo
  const year = v.year || ''
  const make = v.make || ''
  const model = v.model || ''
  const body = v.bodyType || ''
  const fuel = v.fuelType || ''
  const mileage = v.mileage || ''
  const trans = v.transmission || ''
  const color = v.color || ''

  const title = `${year} ${make} ${model}`.trim()
  const description = [
    'This well-maintained vehicle is ready for its next owner.',
    title,
    body ? `Body type: ${body}` : '',
    fuel ? `Fuel: ${fuel}` : '',
    mileage ? `Mileage: ${mileage} km` : '',
    trans ? `Transmission: ${trans}` : '',
    color ? `Colour: ${color}` : '',
  ].filter(Boolean).join('. ') + '.'

  const hashtags = [
    make.replace(/\s+/g, ''),
    model.replace(/\s+/g, ''),
    'RamsCars',
    'UsedCars',
    'ForSale',
  ].filter(Boolean).map((tag) => '#' + tag)

  return {
    ...existing,
    title: existing.title || title,
    description: existing.description || description,
    hashtags: existing.hashtags && existing.hashtags.length > 0 ? existing.hashtags : hashtags,
    seoKeywords: existing.seoKeywords && existing.seoKeywords.length > 0 ? existing.seoKeywords : [year, make, model, body, fuel, trans].filter(Boolean),
  }
}
