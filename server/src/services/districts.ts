export type District = { name: string; lat: number; lng: number; division: string };

export const DISTRICTS: District[] = [
  { name: "Ranchi", lat: 23.34, lng: 85.31, division: "South Chotanagpur" },
  { name: "Khunti", lat: 23.07, lng: 85.28, division: "South Chotanagpur" },
  { name: "Gumla", lat: 23.04, lng: 84.54, division: "South Chotanagpur" },
  { name: "Simdega", lat: 22.62, lng: 84.51, division: "South Chotanagpur" },
  { name: "Lohardaga", lat: 23.43, lng: 84.68, division: "South Chotanagpur" },
  { name: "Palamu", lat: 24.03, lng: 84.07, division: "Palamu" },
  { name: "Garhwa", lat: 24.16, lng: 83.81, division: "Palamu" },
  { name: "Latehar", lat: 23.74, lng: 84.5, division: "Palamu" },
  { name: "Hazaribagh", lat: 23.99, lng: 85.36, division: "North Chotanagpur" },
  { name: "Ramgarh", lat: 23.63, lng: 85.52, division: "North Chotanagpur" },
  { name: "Chatra", lat: 24.21, lng: 84.87, division: "North Chotanagpur" },
  { name: "Koderma", lat: 24.47, lng: 85.59, division: "North Chotanagpur" },
  { name: "Giridih", lat: 24.18, lng: 86.3, division: "North Chotanagpur" },
  { name: "Bokaro", lat: 23.67, lng: 86.15, division: "North Chotanagpur" },
  { name: "Dhanbad", lat: 23.8, lng: 86.43, division: "North Chotanagpur" },
  { name: "Deoghar", lat: 24.48, lng: 86.7, division: "Santhal Pargana" },
  { name: "Dumka", lat: 24.27, lng: 87.25, division: "Santhal Pargana" },
  { name: "Jamtara", lat: 23.96, lng: 86.8, division: "Santhal Pargana" },
  { name: "Godda", lat: 24.83, lng: 87.21, division: "Santhal Pargana" },
  { name: "Sahibganj", lat: 25.25, lng: 87.65, division: "Santhal Pargana" },
  { name: "Pakur", lat: 24.63, lng: 87.85, division: "Santhal Pargana" },
  { name: "East Singhbhum", lat: 22.8, lng: 86.2, division: "Kolhan" },
  { name: "West Singhbhum", lat: 22.57, lng: 85.82, division: "Kolhan" },
  { name: "Seraikela-Kharsawan", lat: 22.7, lng: 85.93, division: "Kolhan" },
];

export const DISTRICT_NAMES = DISTRICTS.map((d) => d.name);

export function districtByName(name: string): District | undefined {
  return DISTRICTS.find((d) => d.name.toLowerCase() === name.toLowerCase());
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function districtDistanceKm(a: string, b: string): number {
  const da = districtByName(a);
  const dbb = districtByName(b);
  if (!da || !dbb) return 9999;
  return distanceKm(da.lat, da.lng, dbb.lat, dbb.lng);
}
