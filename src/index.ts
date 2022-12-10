import dotenv from 'dotenv';
import P12Reader from './P12Reader';
dotenv.config();

if (process.env.CURRENT_ENV !== 'test') {
}

export { P12Reader };
