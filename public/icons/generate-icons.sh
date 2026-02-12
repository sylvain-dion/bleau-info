#!/bin/bash
# Script to generate PWA icons from SVG
# Requires: librsvg (rsvg-convert) or ImageMagick

if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert to generate icons..."
    rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
    rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
    rsvg-convert -w 180 -h 180 icon.svg -o apple-touch-icon.png
    rsvg-convert -w 32 -h 32 icon.svg -o favicon-32x32.png
    rsvg-convert -w 16 -h 16 icon.svg -o favicon-16x16.png
    echo "✓ Icons generated successfully"
elif command -v magick &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    magick icon.svg -resize 192x192 icon-192.png
    magick icon.svg -resize 512x512 icon-512.png
    magick icon.svg -resize 180x180 apple-touch-icon.png
    magick icon.svg -resize 32x32 favicon-32x32.png
    magick icon.svg -resize 16x16 favicon-16x16.png
    echo "✓ Icons generated successfully"
else
    echo "❌ Error: Neither rsvg-convert nor ImageMagick found"
    echo "Install one of:"
    echo "  - librsvg: brew install librsvg"
    echo "  - ImageMagick: brew install imagemagick"
    exit 1
fi
