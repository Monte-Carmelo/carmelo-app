import { ImageResponse } from 'next/og';

// Ícone para a tela inicial do iOS — PNG 180x180 gerado do "monte" da marca.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#00A499"/><g fill="#FFFFFF"><path d="M96 372 L176 250 L256 372 Z"/><path d="M256 372 L336 250 L416 372 Z"/><path d="M176 372 L256 180 L336 372 Z"/><circle cx="256" cy="150" r="22"/></g></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <img
          width={180}
          height={180}
          src={`data:image/svg+xml,${encodeURIComponent(ICON_SVG)}`}
          alt=""
        />
      </div>
    ),
    { ...size },
  );
}
