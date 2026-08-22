import { wedding } from '../data/wedding';

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function downloadWeddingIcs() {
  const start = new Date(wedding.ceremony.isoDate);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Seungpyo & Jehee Wedding//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:wedding-${wedding.ceremony.year}${String(wedding.ceremony.month).padStart(2, '0')}${String(wedding.ceremony.day).padStart(2, '0')}@wed-mobile`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${wedding.couple.groom.name} & ${wedding.couple.bride.name} 결혼식`,
    `LOCATION:${wedding.ceremony.venue} ${wedding.ceremony.floor}\\, ${wedding.ceremony.address}`,
    `DESCRIPTION:${wedding.ceremony.year}년 ${wedding.ceremony.month}월 ${wedding.ceremony.day}일 ${wedding.ceremony.weekday} ${wedding.ceremony.time}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'seungpyo-jehee-wedding.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
