import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'res.cloudinary.com',
  'asset.cloudinary.com',
]);

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('url');
  if (!source) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  if (imageUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(imageUrl.hostname)) {
    return NextResponse.json({ error: 'Image host not allowed' }, { status: 403 });
  }

  const response = await fetch(imageUrl, { cache: 'force-cache' });
  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to load image' }, { status: 502 });
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid image response' }, { status: 415 });
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000',
    },
  });
}
