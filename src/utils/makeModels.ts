export const makeModelMap: Record<string, string[]> = {
  'Toyota': ['Corolla', 'Hilux', 'Fortuner', 'Yaris', 'Land Cruiser', 'Prado', 'Avanza', 'Rumion', 'Starlet', 'RAV4', 'Camry', 'C-HR', 'Corolla Cross', 'Hiace', 'Dyna'],
  'Volkswagen': ['Polo', 'Golf', 'T-Cross', 'T-Roc', 'Tiguan', 'Amarok', 'Passat', 'Jetta', 'Caddy', 'Transporter'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'CLA', 'CLS'],
  'Ford': ['Figo', 'Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Everest', 'Mustang', 'Transit'],
  'Hyundai': ['i10', 'i20', 'i30', 'Accent', 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Creta', 'Venue', 'Kona'],
  'Kia': ['Picanto', 'Rio', 'Cerato', 'Seltos', 'Sportage', 'Sorento', 'Pegas', 'Sonet'],
  'Nissan': ['Micra', 'Almera', 'Sentra', 'Qashqai', 'X-Trail', 'Navara', 'Patrol', 'Juke'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-9', 'BT-50'],
  'Honda': ['Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'Ballade', 'BR-V'],
  'Lexus': ['IS', 'ES', 'GS', 'LS', 'RX', 'NX', 'UX', 'LX'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace'],
  'Chevrolet': ['Spark', 'Sonic', 'Cruze', 'Malibu', 'Trailblazer', 'Captiva', 'Aveo', 'Optra', 'Lumina'],
  'Renault': ['Kwid', 'Triber', 'Kiger', 'Clio', 'Captur', 'Duster', 'Sandero', 'Megane'],
  'Peugeot': ['107', '108', '206', '207', '208', '301', '308', '3008', '5008', 'Partner'],
  'Citroen': ['C1', 'C3', 'C4', 'C5', 'Berlingo', 'C3 Aircross', 'C5 Aircross'],
  'Fiat': ['500', 'Panda', 'Tipo', 'Doblo', 'Fullback'],
  'Suzuki': ['Alto', 'Celerio', 'Swift', 'Dzire', 'Baleno', 'Ignis', 'Vitara', 'Jimny', 'Ertiga'],
  'Mitsubishi': ['Mirage', 'Lancer', 'ASX', 'Eclipse Cross', 'Outlander', 'Pajero', 'Triton'],
  'Volvo': ['S60', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
  'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'XV', 'WRX'],
};

export function getModelSuggestions(make: string): string[] {
  return makeModelMap[make] || [];
}
