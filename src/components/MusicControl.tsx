import { useEffect, useRef, useState } from 'react';
import { wedding } from '../data/wedding';

export function MusicControl() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const enabled = wedding.features.music && Boolean(wedding.music.src);

  useEffect(() => {
    if (!enabled) return;
    const audio = new Audio(wedding.music.src);
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
  }, [enabled]);

  if (!enabled) return null;

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
      title={wedding.music.title || '배경음악'}
    >
      <span aria-hidden="true">♪</span>
      <small>{playing ? 'PAUSE' : ready ? 'PLAY' : 'BGM'}</small>
    </button>
  );
}
