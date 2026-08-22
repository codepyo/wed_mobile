type SectionLabelProps = {
  index: string;
  eyebrow: string;
  title: string;
  inverted?: boolean;
};

export function SectionLabel({ index, eyebrow, title, inverted = false }: SectionLabelProps) {
  return (
    <div className={`section-label ${inverted ? 'section-label--inverted' : ''}`}>
      <span className="section-label__index">{index}</span>
      <div>
        <p className="section-label__eyebrow">{eyebrow}</p>
        <h2 className="section-label__title">{title}</h2>
      </div>
    </div>
  );
}
