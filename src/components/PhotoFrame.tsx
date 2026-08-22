type PhotoFrameProps = {
  src?: string;
  alt: string;
  index?: string;
  className?: string;
};

export function PhotoFrame({ src, alt, index = '01', className = '' }: PhotoFrameProps) {
  return (
    <figure className={`photo-frame ${className}`.trim()}>
      {src ? (
        <img src={src} alt={alt} loading={className.includes('hero') ? 'eager' : 'lazy'} />
      ) : (
        <div className="photo-frame__placeholder" aria-label={`${alt} 사진 자리`}>
          <span className="photo-frame__cross photo-frame__cross--a" />
          <span className="photo-frame__cross photo-frame__cross--b" />
          <div className="photo-frame__placeholder-copy">
            <span>WEDDING EDITORIAL</span>
            <strong>PHOTO {index}</strong>
            <small>Replace later · B/W or black & orange</small>
          </div>
        </div>
      )}
    </figure>
  );
}
