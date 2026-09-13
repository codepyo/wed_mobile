import { useEffect, useRef, useState } from 'react';
import { wedding } from '../data/wedding';

type Props = {
  src?: string;
  title?: string;
  enabled?: boolean;
  variant?: 'floating' | 'dock';
};

export function MusicControl({ src, title, enabled, variant = 'floating' }: Props = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolvedSrc = src ?? wedding.music.src;
  const resolvedEnabled = enabled ?? (wedding.features.music && Boolean(wedding.music.src));
  const available = resolvedEnabled && Boolean(resolvedSrc) && !failed;

  useEffect(() => {
    setPlaying(false);
    setReady(false);
    setFailed(false);
    if (!resolvedEnabled || !resolvedSrc) return;

    const audio = new Audio(resolvedSrc);
    audio.loop = true;
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onCanPlay = () => setReady(true);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onError = () => {
      setPlaying(false);
      setReady(false);
      setFailed(true);
    };
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [resolvedEnabled, resolvedSrc]);

  if (variant === 'floating' && !available) return null;

  const toggle = async () => {
    if (!available) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };

  const label = playing ? '음소거' : available ? '재생' : 'BGM';
  const ariaLabel = !available ? '배경음악이 아직 준비되지 않았습니다.' : playing ? '배경음악 음소거' : '배경음악 재생';

  return (
    <button
      type="button"
      className={`music-control music-control--${variant} ${playing ? 'is-playing' : ''} ${!available ? 'is-unavailable' : ''}`}
      onClick={toggle}
      aria-label={ariaLabel}
      aria-pressed={available ? playing : undefined}
      title={!available ? '배경음악 준비 중' : title || wedding.music.title || '배경음악'}
      disabled={!available}
    >
      <span aria-hidden="true">{playing ? 'Ⅱ' : '♪'}</span>
      <small>{label}</small>
    </button>
  );
}
