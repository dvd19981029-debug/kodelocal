import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawName = (searchParams.get('name') || 'ESENCIA').trim();
  const name = rawName.replace(/\s+[HFU]$/i, '').trim().toUpperCase();
  
  const { protocol, host } = new URL(request.url);
  const baseUrl = `${protocol}//${host}`;
  const imgUrl = `${baseUrl}/images/essence_bottle_blank.png`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          alt="bottle"
        />
        <div
          style={{
            position: 'absolute',
            top: '585px',
            left: '0px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: name.length > 25 ? '19px' : name.length > 15 ? '22px' : '26px',
              fontWeight: 800,
              color: '#111111',
              letterSpacing: '0.6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '350px',
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: '6px',
              width: '100px',
              height: '3px',
              backgroundColor: '#111111',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 768,
      height: 1024,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    }
  );
}
