type CalendarProps = {
  year: number;
  month: number;
  selectedDay: number;
};

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function Calendar({ year, month, selectedDay }: CalendarProps) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="calendar" aria-label={`${year}년 ${month}월 달력`}>
      <div className="calendar__weekdays">
        {weekdays.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className={index === 0 ? 'is-sunday' : ''}>
            {weekday}
          </span>
        ))}
      </div>
      <div className="calendar__days">
        {cells.map((day, index) => (
          <span
            key={`${day ?? 'empty'}-${index}`}
            className={`${day === selectedDay ? 'is-selected' : ''} ${index % 7 === 0 ? 'is-sunday' : ''}`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}
