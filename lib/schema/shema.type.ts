export type ParsedValue =
  | string
  | string[]
  | boolean
  | number
  | PositionTypeEnum
  | Date
  | undefined;

export type ReadValueType = {
  parsedValue: ParsedValue;
  additionalValues: any;
  errors: string[];
  remediation: RemediationValue<any>;
};

export enum PositionTypeEnum {
  ENTREE = 'entrée',
  BATIMENT = 'bâtiment',
  CAGE_ESCALIER = 'cage d’escalier',
  LOGEMENT = 'logement',
  SERVICE_TECHNIQUE = 'service technique',
  DELIVRANCE_POSTALE = 'délivrance postale',
  PARCELLE = 'parcelle',
  SEGMENT = 'segment',
}

export type CommuneNomIsoCodeKey = `commune_nom_${string}`;
export type CommuneDelegueeNomIsoCodeKey = `commune_deleguee_nom_${string}`;
export type VoieNomIsoCodeKey = `voie_nom_${string}`;
export type LieuditComplementNomIsoCodeKey = `lieudit_complement_nom_${string}`;

export type ParsedValues = {
  uid_adresse?: string;
  id_ban_commune?: string;
  id_ban_toponyme?: string;
  id_ban_adresse?: string;
  cle_interop?: string;
  commune_insee?: string;
  commune_nom?: string;
  commune_deleguee_insee?: string;
  commune_deleguee_nom?: string;
  voie_nom?: string;
  toponyme?: string;
  lieudit_complement_nom?: string;
  numero?: number;
  suffixe?: string;
  position?: PositionTypeEnum;
  x?: number;
  y?: number;
  long?: number;
  lat?: number;
  cad_parcelles?: string[];
  source?: string;
  date_der_maj?: Date;
  certification_commune?: boolean;
  [key: CommuneNomIsoCodeKey]: string;
  [key: CommuneDelegueeNomIsoCodeKey]: string;
  [key: VoieNomIsoCodeKey]: string;
  [key: LieuditComplementNomIsoCodeKey]: string;
};

export type RemediationValue<T> = {
  errors: string[];
  value: T;
};

export type RemediationsType = {
  id_ban_commune?: RemediationValue<string>;
  id_ban_toponyme?: RemediationValue<string>;
  id_ban_adresse?: RemediationValue<string>;
  commune_insee?: RemediationValue<string>;
  commune_nom?: RemediationValue<string>;
  date_der_maj?: RemediationValue<Date>;
};
