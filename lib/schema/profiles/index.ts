import profiles11Strict from './1.1-strict';
import profiles12Strict from './1.2-strict';
import profiles13Strict from './1.3-strict';
import profiles13Relax from './1.3-relax';
import profiles13 from './1.3';
import profiles14 from './1.4';
import profiles15 from './1.5';
import { ProfileType } from './profile.type';

const profiles: Record<string, ProfileType> = {
  1.5: profiles15,
  1.4: profiles14,
  1.3: profiles13,
  '1.3-relax': profiles13Relax,
  '1.3-strict': profiles13Strict,
  '1.2-strict': profiles12Strict,
  '1.1-strict': profiles11Strict,
};

export default profiles;
