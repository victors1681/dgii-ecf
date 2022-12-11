import dotenv from 'dotenv';
import P12Reader from './P12Reader';
import Signature from './Signature/Signature';
import ECF from './ecf';
export * from './networking';

dotenv.config();

if (process.env.CURRENT_ENV !== 'test') {
}

export { ECF, P12Reader, Signature };
export default ECF;
