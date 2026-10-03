import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { content } from '@/lib/content';
import { COURSE_LEVEL_LABEL } from '@/lib/course-categories';

/**
 * Social preview card for a course (1200x630): title, level and duration over the course photo, with the
 * Jetking wordmark. Used as the course page's og:image / twitter:image so a shared link shows the course,
 * not the generic site card.
 */
export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;
const RED = '#c7141c';

async function dataUri(publicPath: string, mime: string): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), 'public', publicPath.replace(/^\//, '')));
    return `data:${mime};base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await content.getCourse(slug);
  if (!course) return new Response('Not found', { status: 404 });

  const logo = await dataUri('/brand/jetking-wordmark.png', 'image/png');
  const title = course.shortTitle || course.title;
  const fontSize = title.length > 60 ? 54 : title.length > 36 ? 64 : 76;

  return new ImageResponse(
    (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', background: '#ffffff', fontFamily: 'sans-serif' }}>
        <div style={{ width: 14, height: HEIGHT, background: RED, display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 56px 56px 64px', width: 746 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img>
            <img src={logo} alt="" width={200} height={63} />
          ) : (
            <div style={{ fontSize: 44, fontWeight: 800, color: RED, display: 'flex' }}>Jetking</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
              <div style={{ display: 'flex', background: RED, color: '#fff', fontSize: 26, fontWeight: 700, padding: '8px 22px', borderRadius: 999 }}>
                {COURSE_LEVEL_LABEL[course.level]}
              </div>
              <div style={{ display: 'flex', background: '#f3f4f6', color: '#1d2939', fontSize: 26, fontWeight: 700, padding: '8px 22px', borderRadius: 999 }}>
                {course.duration}
              </div>
            </div>
            <div style={{ display: 'flex', fontSize, fontWeight: 800, lineHeight: 1.08, color: '#101828', letterSpacing: -1 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#475467', fontWeight: 600 }}>jetking.com</div>
        </div>
        <div style={{ display: 'flex', width: 440, height: HEIGHT, background: '#f4f5f7', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -120, top: -120, width: 420, height: 420, borderRadius: 999, background: RED, display: 'flex' }} />
          <div style={{ position: 'absolute', right: 150, bottom: -90, width: 260, height: 260, borderRadius: 999, background: 'rgba(199,20,28,0.14)', display: 'flex' }} />
          <div style={{ position: 'absolute', left: 48, bottom: 56, display: 'flex', flexDirection: 'column', color: '#101828' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#475467', display: 'flex' }}>Training IT talent</div>
            <div style={{ fontSize: 64, fontWeight: 800, color: RED, display: 'flex' }}>since 1947</div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, headers: { 'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' } },
  );
}
