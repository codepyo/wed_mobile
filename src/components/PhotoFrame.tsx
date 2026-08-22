type PhotoFrameProps = {
  src?: string;
  alt: string;
  ratio?: string;
  position?: string;
  className?: string;
  priority?: boolean;
};

export function PhotoFrame({
  src,
  alt,
  ratio = '4 / 5',
  position = '50% 50%',
  className = '',
  priority = false,
}: PhotoFrameProps) {
  return (
    <figure className={`photo-frame ${className}`.trim()} style={{ aspectRatio: ratio }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          style={{ objectPosition: position }}
        />
      ) : (
        <div className="photo-frame__placeholder" aria-label={`${alt} 사진 준비 중`}>
          <span className="photo-frame__placeholder-mark">S · J</span>
          <span className="photo-frame__placeholder-note">PHOTO COMING SOON</span>
        </div>
      )}
    </figure>
  );
}
