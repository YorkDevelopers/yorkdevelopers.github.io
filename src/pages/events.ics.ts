import { upcoming, groupById } from '../lib/york';

const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
const esc = (s = '') => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
// Lines over 75 bytes must be folded.
const fold = (line: string) => line.match(/.{1,70}/gu)!.join('\r\n ');

export const GET = () => {
  const now = stamp(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//yorkdevelopers.org//York tech events//EN',
    'CALSCALE:GREGORIAN', 'X-WR-CALNAME:York tech events',
    ...upcoming().flatMap(e => [
      'BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`,
      `SUMMARY:${esc(`${e.title} (${groupById(e.group).name})`)}`,
      `LOCATION:${esc([e.venue, e.address].filter(Boolean).join(', '))}`,
      `DESCRIPTION:${esc(e.summary)}`, `URL:${e.url ?? ''}`, 'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', { headers: { 'content-type': 'text/calendar; charset=utf-8' } });
};
