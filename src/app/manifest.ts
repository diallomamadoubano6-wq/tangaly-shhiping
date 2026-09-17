import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TANGALY Shipping',
    short_name: 'TANGALY',
    description: 'La référence du transport et de la logistique USA ↔ Guinée.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0052cc',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
