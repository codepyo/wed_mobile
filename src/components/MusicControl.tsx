import { useEffect, useRef, useState } from 'react';
import { wedding } from '../data/wedding';

type Props = {
  src?: string;
  title?: string;
  enabled?: boolean;
};

export function MusicControl({ src, title, enabled }: Props = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const resolvedSrc = src ?? wedding.music.src;
  const resolvedEnabled = enabled ?? (wedding.features.music && Boolean(wedding.music.src));

  useEffect(() => {
    setPlaying(false);
    setReady(false);
    if (!resolvedEnabled || !resolvedSrc) return;

    const audio = new Audio(resolvedSrc);
    audio.loop = true;
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onCanPlay = () => setReady(true);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.pause();
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audioRef.current = null;
    };
  }, [resolvedEnabled, resolvedSrc]);

  if (!resolvedEnabled || !resolvedSrc) return null;

  const toggle = async () => {
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

  return (
    <button
      type="button"
      className={`music-control ${playing ? 'is-playing' : ''}`}
      onClick={toggle}
      aria-label={playing ? '배경음악 일시정지' : '배경음악 재생'}
      title={title || wedding.music.title || '배경음악'}
    >
      <span aria-hidden="true">♪</span>
      <small>{playing ? 'PAUSE' : ready ? 'PLAY' : 'BGM'}</small>
    </button>
  );
}
