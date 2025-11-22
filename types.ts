export enum Country {
  KR = "South Korea",
  JP = "Japan",
  OTHER = "Other"
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  country: Country;
  city: string;      // e.g., Seoul, Tokyo
  district: string;  // e.g., Gangnam-gu, Shibuya-ku
  description: string;
  coordinates: Coordinates;
  tags: string[];
  originalImage: string; // Base64
  createdAt: number;
}

export interface MapViewState {
  center: [number, number]; // [lng, lat] for D3
  zoom: number;
}

export type FilterLevel = 'country' | 'city' | 'district' | 'all';
