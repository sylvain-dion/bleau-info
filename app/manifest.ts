import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bleau Info - Guide d\'escalade Fontainebleau',
    short_name: 'Bleau Info',
    description: 'Guide d\'escalade interactif pour la forêt de Fontainebleau',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF6B00', // Orange principal
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable', // Pour adaptive icons Android
      },
    ],
    categories: ['sports', 'lifestyle', 'travel'],
  }
}
