# PWA Icons

## Current Status
⚠️ **Placeholder icons are currently in use** (1x1 pixel PNGs)

These minimal placeholders allow PWA functionality to work for testing, but **MUST be replaced** with properly designed icons before production deployment.

## Required Icons

### Android/PWA
- **icon-192.png** (192x192px) - Standard Android icon
- **icon-512.png** (512x512px) - High-resolution, used for splash screens

### iOS
- **apple-touch-icon.png** (180x180px) - iOS home screen icon

### Browser
- **favicon.ico** (32x32px or 16x16px) - Browser tab icon

## Design Requirements (UX-03)

- **Primary Color**: Orange #FF6B00
- **Background**: Orange or transparent
- **Style**: Simple, recognizable, high contrast
- **Content**: Avoid fine details (small size)
- **Testing**: Test on both light and dark backgrounds

### Maskable Icon (Android Adaptive Icons)
The 512x512 icon should work as a maskable icon:
- Safe zone: central 80% of canvas
- Important content within central circle
- Borders may be cropped by system

## Generation Options

### Option 1: Use provided SVG template
```bash
cd public/icons
./generate-icons.sh  # Requires librsvg or ImageMagick
```

### Option 2: Design with tool
- Use Figma, Sketch, or similar
- Export at exact required sizes
- Ensure proper safe zones for maskable

### Option 3: Use icon generator
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- Upload base design, get all sizes

## Verification

After creating proper icons:
1. Check file sizes (should be reasonable, not 1x1 pixel!)
2. Test in DevTools > Application > Manifest
3. Verify icons appear correctly
4. Test installation on real devices (iOS + Android)
