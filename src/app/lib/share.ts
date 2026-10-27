/** Shared trail/park content for native share + Instagram-friendly story cards. */

import { HAZARD_COLORS } from './hazards';

export type ShareStatus = 'green' | 'yellow' | 'red';

export type ShareHazard = {
  label: string;
  detail?: string | null;
  note?: string | null;
  kind?: 'downed-trees' | 'broken-bridge' | 'maintenance';
};

export type SharePayload = {
  title: string;
  text: string;
  url: string;
  subtitle?: string | null;
  status?: ShareStatus | null;
  statusLabel?: string | null;
  /** e.g. "Trail Conditions" / "Condiciones de Senderos" */
  conditionsLabel?: string | null;
  /** e.g. "Updated" / "Actualizado" */
  updatedLabel?: string | null;
  /** e.g. "8h ago" / "hace 8h" */
  updatedValue?: string | null;
  notes?: string | null;
  hazards?: ShareHazard[];
};

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Absolute URL for a trail or park share target. */
export function shareUrlFor(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://eltrillo.app';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

const STATUS_DOT: Record<ShareStatus, string> = {
  green: '#4A9E68',
  yellow: '#f59e0b',
  red: '#C96B6B',
};

const STATUS_TEXT: Record<ShareStatus, string> = {
  green: '#63B882',
  yellow: '#C9A84A',
  red: '#C97A7A',
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}

function drawTreeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.lineTo(0, size * 0.12);
  ctx.stroke();

  const drawCanopy = (top: number, halfW: number, bottom: number) => {
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(-halfW, bottom);
    ctx.lineTo(halfW, bottom);
    ctx.closePath();
    ctx.fill();
  };
  drawCanopy(-size * 0.42, size * 0.28, -size * 0.08);
  drawCanopy(-size * 0.22, size * 0.34, size * 0.14);

  ctx.restore();
}

function drawBridgeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Deck
  ctx.beginPath();
  ctx.moveTo(-size * 0.32, -size * 0.02);
  ctx.lineTo(size * 0.32, -size * 0.02);
  ctx.stroke();

  // Supports
  ctx.beginPath();
  ctx.moveTo(-size * 0.22, -size * 0.02);
  ctx.lineTo(-size * 0.22, size * 0.28);
  ctx.moveTo(size * 0.22, -size * 0.02);
  ctx.lineTo(size * 0.22, size * 0.28);
  ctx.stroke();

  // Arch
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, -size * 0.08);
  ctx.quadraticCurveTo(0, -size * 0.38, size * 0.28, -size * 0.08);
  ctx.stroke();

  ctx.restore();
}

function drawWrenchIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = 'round';

  // Handle
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.08);
  ctx.lineTo(0, size * 0.4);
  ctx.stroke();

  // Open jaw
  ctx.beginPath();
  ctx.arc(0, -size * 0.22, size * 0.16, -Math.PI / 2 + 0.6, Math.PI * 1.5 - 0.6, false);
  ctx.stroke();

  ctx.restore();
}

/**
 * Build a 9:16 story image that mirrors the in-app conditions card:
 * status + updated meta, hazard callout, and notes.
 */
export async function createStoryImageFile(payload: SharePayload): Promise<File | null> {
  try {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Page background
    ctx.fillStyle = '#0E1510';
    ctx.fillRect(0, 0, width, height);

    // Keep main content clear of Instagram / Stories chrome
    // (progress bars + avatar on top, reply/share tray on bottom).
    const TOP_SAFE = 460;
    const BOTTOM_SAFE = 280;

    // Soft green wash
    ctx.fillStyle = 'rgba(52, 101, 56, 0.07)';
    ctx.beginPath();
    ctx.ellipse(width * 0.82, height * 0.28, 360, 300, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width * 0.12, height * 0.78, 420, 340, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brand
    ctx.fillStyle = '#63B882';
    ctx.font = '700 40px system-ui, -apple-system, sans-serif';
    const brand = 'TRILLO';
    let brandX = 80;
    for (const ch of brand) {
      ctx.fillText(ch, brandX, TOP_SAFE);
      brandX += ctx.measureText(ch).width + 12;
    }

    // Park / trail title above the card
    ctx.fillStyle = '#63B882';
    ctx.font = '800 64px system-ui, -apple-system, sans-serif';
    const titleLines = wrapLines(ctx, payload.title, width - 160, 2);
    let titleY = TOP_SAFE + 88;
    for (const line of titleLines) {
      ctx.fillText(line, 80, titleY);
      titleY += 74;
    }
    if (payload.subtitle) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '500 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(payload.subtitle, 80, titleY + 8);
      titleY += 52;
    }

    // Conditions card
    const cardX = 56;
    const cardY = titleY + 40;
    const cardW = width - cardX * 2;
    const cardPad = 48;
    let contentY = cardY + cardPad;

    // Estimate card height from content, then draw card bg
    const hazards = (payload.hazards || []).slice(0, 2);
    const notes = payload.notes?.trim() || '';
    const hasStatus = !!(payload.status && payload.statusLabel);
    let estimatedH = cardPad * 2 + 160; // header block
    if (hazards.length) estimatedH += hazards.length * 210 + 24;
    if (notes) estimatedH += 180;
    estimatedH = Math.min(Math.max(estimatedH, 420), height - cardY - BOTTOM_SAFE - 100);

    ctx.fillStyle = '#151C18';
    roundRect(ctx, cardX, cardY, cardW, estimatedH, 48);
    ctx.fill();
    ctx.strokeStyle = '#24302A';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardY, cardW, estimatedH, 48);
    ctx.stroke();

    // Conditions label
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(payload.conditionsLabel || 'Trail Conditions', cardX + cardPad, contentY + 8);
    contentY += 56;

    // Status row: left status · divider · right updated
    const rowTop = contentY;
    const dividerX = cardX + cardW * 0.62;

    if (hasStatus) {
      const dotR = 28;
      const dotX = cardX + cardPad + dotR;
      const dotY = rowTop + 36;
      ctx.fillStyle = STATUS_DOT[payload.status!];
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = STATUS_TEXT[payload.status!];
      ctx.font = '800 72px system-ui, -apple-system, sans-serif';
      const statusText = payload.statusLabel!;
      ctx.fillText(statusText, dotX + dotR + 22, rowTop + 58);
    }

    // Vertical divider
    ctx.strokeStyle = '#24302A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dividerX, rowTop - 8);
    ctx.lineTo(dividerX, rowTop + 88);
    ctx.stroke();

    if (payload.updatedLabel || payload.updatedValue) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '500 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(payload.updatedLabel || '', dividerX + 28, rowTop + 18);
      ctx.fillStyle = '#E6EBE6';
      ctx.font = '700 40px system-ui, -apple-system, sans-serif';
      ctx.fillText(payload.updatedValue || '—', dividerX + 28, rowTop + 68);
    }

    contentY = rowTop + 120;

    // Hazard callouts
    for (const hazard of hazards) {
      const boxX = cardX + cardPad;
      const boxW = cardW - cardPad * 2;
      const boxY = contentY;
      const innerPad = 28;
      const iconSize = 64;

      ctx.fillStyle = HAZARD_COLORS.cardBg;
      roundRect(ctx, boxX, boxY, boxW, 188, 28);
      ctx.fill();
      ctx.strokeStyle = HAZARD_COLORS.cardBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, boxX, boxY, boxW, 188, 28);
      ctx.stroke();

      // Icon circle
      const icx = boxX + innerPad + iconSize / 2;
      const icy = boxY + 40 + iconSize / 2;
      ctx.fillStyle = HAZARD_COLORS.iconBg;
      ctx.beginPath();
      ctx.arc(icx, icy, iconSize / 2, 0, Math.PI * 2);
      ctx.fill();
      if (hazard.kind === 'broken-bridge') {
        drawBridgeIcon(ctx, icx, icy, iconSize * 0.72);
      } else if (hazard.kind === 'maintenance') {
        drawWrenchIcon(ctx, icx, icy, iconSize * 0.72);
      } else {
        drawTreeIcon(ctx, icx, icy, iconSize * 0.72);
      }

      const textX = boxX + innerPad + iconSize + 22;
      const textW = boxW - innerPad * 2 - iconSize - 22;
      let ty = boxY + 48;

      ctx.fillStyle = HAZARD_COLORS.ink;
      ctx.font = '700 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(hazard.label, textX, ty);
      ty += 40;

      if (hazard.detail) {
        ctx.font = '700 28px system-ui, -apple-system, sans-serif';
        const detailLine = wrapLines(ctx, hazard.detail, textW, 1)[0];
        ctx.fillText(detailLine, textX, ty);
        ty += 36;
      }

      if (hazard.note) {
        ctx.font = '500 26px system-ui, -apple-system, sans-serif';
        const noteLines = wrapLines(ctx, hazard.note, textW, 2);
        for (const line of noteLines) {
          ctx.fillText(line, textX, ty);
          ty += 34;
        }
      }

      contentY += 188 + 20;
    }

    // Notes box
    if (notes) {
      const boxX = cardX + cardPad;
      const boxW = cardW - cardPad * 2;
      const boxY = contentY;
      const boxH = Math.min(160, cardY + estimatedH - contentY - cardPad);

      if (boxH > 60) {
        ctx.fillStyle = '#1A221C';
        roundRect(ctx, boxX, boxY, boxW, boxH, 28);
        ctx.fill();

        ctx.fillStyle = '#9AA39C';
        ctx.font = '500 30px system-ui, -apple-system, sans-serif';
        const maxLines = Math.max(1, Math.floor((boxH - 48) / 40));
        const noteLines = wrapLines(ctx, notes, boxW - 56, maxLines);
        let ny = boxY + 48;
        for (const line of noteLines) {
          ctx.fillText(line, boxX + 28, ny);
          ny += 40;
        }
      }
    }

    // Footer — above Stories bottom tray
    ctx.fillStyle = '#63B882';
    ctx.font = '700 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('eltrillo.app', 80, height - BOTTOM_SAFE + 40);
    ctx.fillStyle = '#8B958C';
    ctx.font = '500 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('Real-time trail conditions', 80, height - BOTTOM_SAFE + 84);

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
