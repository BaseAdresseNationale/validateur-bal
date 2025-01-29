export interface Profile {
  code: string;
  name: string;
  isUsed: boolean;
  relax: boolean;
  errors: string[];
  warnings: string[];
  infos?: string[];
  format: string;
}
