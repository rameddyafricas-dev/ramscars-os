export interface LocationInfo {
  dms: string;
  decimal: string;
  gps?: { lat: number; lng: number };
  bay?: string;
}

export function parseDecimalCoordinates(decimal: string): { lat: number; lng: number } | undefined {
  if (!decimal.trim()) return undefined;
  const parts = decimal.split(',').map(s => s.trim());
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return undefined;
}

export function getCoordinatesForMap(location: LocationInfo): string | undefined {
  if (location.decimal) {
    const coords = location.decimal.split(',').map(s => s.trim());
    if (coords.length === 2) return `${coords[0]},${coords[1]}`;
  }
  if (location.gps) return `${location.gps.lat},${location.gps.lng}`;
  return undefined;
}
