import type { InspectionScore } from '../types';

export function debounce<A extends any[]>(fn: (...args: A) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const initialScore: InspectionScore = {
  mechanical: null,
  interior: null,
  exterior: null,
  electrical: null,
  safety: null,
  body: null,
  engine: null,
  suspension: null,
}

export const commonMakes = [
  'Toyota', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Ford', 'Hyundai', 'Kia',
  'Nissan', 'Mazda', 'Honda', 'Lexus', 'Audi', 'Land Rover', 'Jaguar',
  'Chevrolet', 'Renault', 'Peugeot', 'Citroen', 'Fiat', 'Suzuki',
  'Mitsubishi', 'Volvo', 'Subaru', 'Isuzu', 'Opel', 'Daihatsu', 'Tata',
  'Mahindra', 'Chery', 'SsangYong', 'Porsche', 'Ferrari', 'Maserati',
  'Alfa Romeo', 'Jeep', 'Chrysler', 'Dodge', 'GMC', 'Tesla', 'MINI', 'SEAT', 'Skoda', 'Saab'
]

export const commonBodyTypes = [
  'Sedan', 'Hatchback', 'SUV', 'Pickup', 'Coupe', 'Convertible', 'Wagon',
  'Van', 'Minivan', 'MPV', 'Crossover', 'Truck'
]

export const commonColors = [
  'Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Yellow',
  'Orange', 'Brown', 'Beige', 'Gold', 'Purple', 'Burgundy', 'Champagne', 'Pearl White'
]
