import { ParseError, ParseResult } from 'papaparse';
export const IS_TOPO_NB = '99999';

export type ParseReturn = ParseResult<Record<string, string>> & {
  encoding: string;
};

export type ParseFileType = {
  encoding: string;
  linebreak: string;
  delimiter: string;
  originalFields: string[];
  parseOk: boolean;
  parseErrors: ParseError[];
  parsedRows: Record<string, string>[];
};

export enum ErrorLevelEnum {
  ERROR = 'E',
  WARNING = 'W',
  INFO = 'I',
}

export type ProfileErrorType = {
  code: string;
  level: ErrorLevelEnum;
};

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
};

export type ValidateRowFullType = ValidateRowType & { isValid: boolean };

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

export type ValidateRowType = {
  rawValues: Record<string, string>;
  parsedValues: ParsedValues;
  additionalValues: Record<string, any>;
  localizedValues: Record<string, any>;
  errors: { code: string; schemaName?: string; level?: ErrorLevelEnum }[];
  line: number;
};

export type ProfilesValidationType = {
  code: string;
  name: string;
  isValid: boolean;
};

export type FieldType = {
  name: string;
  schemaName?: string; // voie_nom
  localizedSchemaName?: string; // voie_nom_bre
  locale?: string; // bre
};

export type NotFoundFieldType = {
  schemaName: string;
  level?: string;
};

export type ValueIsValidType = {
  value: string;
  isValid: boolean;
};

export type ValidateFileType = {
  encoding: ValueIsValidType;
  delimiter: ValueIsValidType;
  linebreak: ValueIsValidType;
};

export type PrevalidateType = Omit<ParseFileType, 'parsedRows'> & {
  fields: FieldType[];
  notFoundFields: NotFoundFieldType[];
  rows: ValidateRowType[];
  fileValidation: ValidateFileType;
  profilesValidation: Record<string, ProfilesValidationType>;
  globalErrors: string[];
  rowsErrors: string[];
  uniqueErrors: string[];
};

export type ValidateProfileType = PrevalidateType & {
  profilErrors: ProfileErrorType[];
};
