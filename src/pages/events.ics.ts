import { upcoming, calendar } from '../lib/york';

export const GET = () => calendar(upcoming());
