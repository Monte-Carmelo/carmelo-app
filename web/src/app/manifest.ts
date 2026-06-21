import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Carmelo • Gestão de GCs',
    short_name: 'Carmelo',
    description:
      'Gestão de Grupos de Crescimento da Igreja Monte Carmelo — encontros, presença, lições e pessoas.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    background_color: '#FAF6EF',
    theme_color: '#00A499',
    categories: ['productivity', 'lifestyle'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
