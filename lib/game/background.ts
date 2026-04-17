export interface BackgroundLayer {
  src: string;
  speed: number;
  alpha: number;
  yOffset: number;
}

export interface LoadedBackgrounds {
  [src: string]: HTMLImageElement;
}

export const BACKGROUND_LAYERS: BackgroundLayer[] = [
  {
    src: "/environment/space_background_pack/parallax-space-backgound.png",
    speed: 0.05,
    alpha: 1,
    yOffset: 0,
  },
  {
    src: "/environment/space_background_pack/parallax-space-stars.png",
    speed: 0.12,
    alpha: 0.9,
    yOffset: 0,
  },
  {
    src: "/environment/space_background_pack/parallax-space-far-planets.png",
    speed: 0.22,
    alpha: 0.85,
    yOffset: 10,
  },
  {
    src: "/environment/space_background_pack/parallax-space-ring-planet.png",
    speed: 0.35,
    alpha: 0.9,
    yOffset: 20,
  },
];

export async function preloadBackgrounds(layers: BackgroundLayer[]): Promise<LoadedBackgrounds> {
  const entries = await Promise.all(
    layers.map(
      (layer) =>
        new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const image = new Image();
          image.src = layer.src;
          image.onload = () => resolve([layer.src, image]);
          image.onerror = () => reject(new Error(`Failed to load background: ${layer.src}`));
        }),
    ),
  );

  return Object.fromEntries(entries);
}
