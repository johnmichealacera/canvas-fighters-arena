export const ATLAS_GUIDE = `
Atlas support is enabled in this project.

Expected files in public:
- /sprites/<character>/atlas.png
- /sprites/<character>/atlas.json

Supported atlas JSON shapes:
1) Object frames (TexturePacker style):
{
  "frames": {
    "idle_0.png": { "frame": { "x": 0, "y": 0, "w": 80, "h": 96 } }
  }
}

2) Array frames:
{
  "frames": [
    { "filename": "idle_0.png", "frame": { "x": 0, "y": 0, "w": 80, "h": 96 } }
  ]
}

How to wire a character:
- Use SpriteClip kind "atlas"
- Set imageSrc + atlasSrc
- Provide frameKeys in desired playback order
`;
