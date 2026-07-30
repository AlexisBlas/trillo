/** Shared trail/park content for native share + Instagram-friendly story cards. */

export type ShareStatus = 'green' | 'yellow' | 'red';

export type SharePayload = {
  title: string;
  text: string;
  url: string;
  subtitle?: string | null;
  status?: ShareStatus | null;
  statusLabel?: string | null;
};

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

const STATUS_FILL: Record<ShareStatus, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
};

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }
  if (current && lines.length < maxLines) {
    let last = current;
    while (ctx.measureText(last).width > maxWidth && last.length > 1) {
      last = `${last.slice(0, -2)}…`;
    }
    lines.push(last);
  }
  return lines.length ? lines : [text];
}

/** Build a 9:16 story card (PNG) for Instagram / social share sheets. */
export async function createStoryImageFile(payload: SharePayload): Promise<File | null> {
  try {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#F5F0E8');
    gradient.addColorStop(0.55, '#EDE6D8');
    gradient.addColorStop(1, '#D8E0D0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Soft accent blob
    ctx.fillStyle = 'rgba(44, 74, 30, 0.08)';
    ctx.beginPath();
    ctx.ellipse(width * 0.85, height * 0.18, 340, 280, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width * 0.1, height * 0.75, 420, 320, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brand
    ctx.fillStyle = '#1a3010';
    ctx.font = '700 42px system-ui, -apple-system, sans-serif';
    const brand = 'TRILLO';
    let brandX = 88;
    for (const ch of brand) {
      ctx.fillText(ch, brandX, 160);
      brandX += ctx.measureText(ch).width + 10;
    }

    // Eyebrow
    ctx.fillStyle = '#687588';
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('CONDITION REPORT', 88, 520);

    // Title
    ctx.fillStyle = '#1a3010';
    ctx.font = '800 78px system-ui, -apple-system, sans-serif';
    const titleLines = wrapLines(ctx, payload.title, width - 176, 3);
    let y = 620;
    for (const line of titleLines) {
      ctx.fillText(line, 88, y);
      y += 92;
    }

    // Subtitle
    if (payload.subtitle) {
      ctx.fillStyle = '#4b5563';
      ctx.font = '500 36px system-ui, -apple-system, sans-serif';
      const subLines = wrapLines(ctx, payload.subtitle, width - 176, 2);
      y += 20;
      for (const line of subLines) {
        ctx.fillText(line, 88, y);
        y += 48;
      }
    }

    // Status pill
    if (payload.status && payload.statusLabel) {
      const label = payload.statusLabel.toUpperCase();
      ctx.font = '700 34px system-ui, -apple-system, sans-serif';
      const padX = 36;
      const pillH = 72;
      const textW = ctx.measureText(label).width;
      const pillW = textW + padX * 2 + 28;
      const pillX = 88;
      const pillY = y + 48;

      ctx.fillStyle = STATUS_FILL[payload.status];
      const r = 36;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(pillX, pillY, pillW, pillH, r);
      } else {
        ctx.moveTo(pillX + r, pillY);
        ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, r);
        ctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, r);
        ctx.arcTo(pillX, pillY + pillH, pillX, pillY, r);
        ctx.arcTo(pillX, pillY, pillX + pillW, pillY, r);
        ctx.closePath();
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, pillX + padX + 14, pillY + 48);
    }

    // Footer
    ctx.fillStyle = '#2c4a1e';
    ctx.font = '600 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('eltrillo.app', 88, height - 160);
    ctx.fillStyle = '#687588';
    ctx.font = '500 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('Real-time trail conditions for Puerto Rico', 88, height - 110);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return null;

    return new File([blob], 'trillo-story.png', { type: 'image/png' });
  } catch {
    return null;
  }
}

async function copyLink(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Share via native sheet (prefers story image for Instagram when supported),
 * otherwise copies the link.
 */
export async function shareContent(payload: SharePayload): Promise<ShareResult> {
  const shareDataBase: ShareData = {
    title: payload.title,
    text: `${payload.text}\n${payload.url}`,
    url: payload.url,
  };

  const file = await createStoryImageFile(payload);
  const withFile: ShareData | null =
    file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
      ? {
          title: payload.title,
          text: `${payload.text}\n${payload.url}`,
          files: [file],
        }
      : null;

  if (typeof navigator.share === 'function') {
    try {
      if (withFile) {
        await navigator.share(withFile);
        return 'shared';
      }
      if (!navigator.canShare || navigator.canShare(shareDataBase)) {
        await navigator.share(shareDataBase);
        return 'shared';
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'AbortError') return 'cancelled';
      // Fall through to copy if share failed for other reasons.
    }
  }

  const copied = await copyLink(payload.url);
  return copied ? 'copied' : 'failed';
}
