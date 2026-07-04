export interface School {
  ecole: string;
  commune: string;
  rne: string;
  circo: string;
  niveau: string;
  adresse: string;
  codePostal: string;
  id: string;
  latitude?: number;
  longitude?: number;
}

export interface GeoPoint {
  lat: number;
  lon: number;
}
