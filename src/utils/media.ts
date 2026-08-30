import type { WeddingImage } from '../data/wedding';

export type PublicMediaAsset = {
  id: string;
  slot: 'HERO' | 'GALLERY' | 'OG' | 'BGM' | string;
  mimeType: string;
  sizeBytes: number;
  objectPosition: string;
  altText: string;
  sortOrder?: number | null;
  url: string;
};

export type PublicMediaState = {
  hero: WeddingImage | null;
  gallery: WeddingImage[];
  bgm: PublicMediaAsset | null;
  og: PublicMediaAsset | null;
};

export const emptyMediaState: PublicMediaState = {
  hero: null,
  gallery: [],
  bgm: null,
  og: null,
};

function imageFromAsset(asset: PublicMediaAsset, fallbackAlt: string, fallbackRatio: string): WeddingImage {
  return {
    src: asset.url,
    alt: asset.altText || fallbackAlt,
    ratio: fallbackRatio,
    position: asset.objectPosition || '50% 50%',
  };
}

export async function fetchPublicMedia(): Promise<PublicMediaState> {
  try {
    const response = await fetch('/api/media', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return emptyMediaState;

    const data = await response.json().catch(() => ({}));
    const assets: PublicMediaAsset[] = Array.isArray(data.assets) ? data.assets : [];
    const heroAsset = assets.find((asset) => asset.slot === 'HERO') || null;
    const galleryAssets = assets.filter((asset) => asset.slot === 'GALLERY');

    return {
      hero: heroAsset ? imageFromAsset(heroAsset, '승표와 제희의 대표 웨딩 사진', '4 / 5') : null,
      gallery: galleryAssets.map((asset, index) => imageFromAsset(asset, `승표와 제희의 웨딩 사진 ${index + 1}`, '4 / 5')),
      bgm: assets.find((asset) => asset.slot === 'BGM') || null,
      og: assets.find((asset) => asset.slot === 'OG') || null,
    };
  } catch (error) {
    console.error('PUBLIC_MEDIA_LOAD_FAILED', error);
    return emptyMediaState;
  }
}
