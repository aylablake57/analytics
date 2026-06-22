export interface HCRecord {
  FID: number;
  Category: string;
  Sub_Cat: string;
  Gov_Pvt: 'GOVERNMENT' | 'PRIVATE';
  Name: string;
  Town: string;
  Tehsil: string;
  District: string;
  Province: string;
  Latitude: number;
  Longitude: number;
}

export interface HospitalRecord {
  FID: number;
  Province: string;
  HF_Name: string;
  Dist_Name: string;
  HF_Type: string;
  LONG: number;
  LAT: number;
}

export interface IndustryRecord {
  FID: number;
  Company_Na: string;
  Registered: string;
  Sectoral_C: string;
  Major_Sect: string;
  Fire: number;
  Explosion: number;
  ToxicRelea: number;
  Health: number;
  Environmen: number;
  Overall_Ri: number;
  lat: number;
  long: number;
}

export type TabId = 'hc' | 'hos' | 'ind' | 'g6tp' | 'nallah' | 'encr' | 'illegalSoc' | 'illegalSlum' | 'waterBodies' | 'approvedSoc' | 'roads' | 'tehsil' | 'safeCity';

export interface G6Options { subSectors: string[]; parcelTypes: string[]; landuses: string[]; luStatuses: string[]; govtApprovals: string[]; landUseTypes: string[]; }
export interface G6FeatureStat { type: string; count: number; color: string; }
export interface G6Stats { total: number; byType: G6FeatureStat[]; }
export type AnyRecord = HCRecord | HospitalRecord | IndustryRecord;

export interface NallahOptions {
  subSectors: string[];
  parcelTypes: string[];
  landuses: string[];
  landueStatuses: string[];
}

export interface EncrOptions {
  types: string[];
  existOnPlans: string[];
  existOnImageries: string[];
}

export interface IllegalSocOptions {
  names: string[];
}

export interface IllegalSlumOptions {
  names: string[];
}

export interface WaterBodiesOptions {
  types: string[];
  names: string[];
}

export interface ApprovedSocOptions {
  names: string[];
}

export interface RoadsOptions {
  types: string[];
  names: string[];
}

export interface Column {
  key: string;
  label: string;
  width: string;
  badge?: boolean;
}

export interface KPIItem {
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
}

export type MapLayerId = 'ictBoundary' | 'sectors' | 'dhair' | 'airports' | 'hcMarkers' | 'hosMarkers' | 'indMarkers' | 'g6Parcels' | 'nallahLayer' | 'encrLayer' | 'illegalSocLayer' | 'illegalSlumLayer' | 'waterBodiesLayer' | 'approvedSocLayer' | 'roadsLayer' | 'tehsilLayer' | 'safeCityLayer';

export interface TehsilOptions { provinces: string[]; districts: string[]; tehsils: string[]; }
export interface SafeCityOptions { areas: string[]; types: string[]; }
export type MapLayers  = Record<MapLayerId, boolean>;
