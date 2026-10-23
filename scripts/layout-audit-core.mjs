// The layout checks shared by scripts/layout-audit.mjs (all pages) and scripts/agent-check.mjs (one page).
// auditPage(page, width) → { overflow, clipped, tap, tiny, overlap } for the page as currently loaded.
export async function auditPage(page, w) {
  await page.addStyleTag({ content: '.rv,.reveal,.js .rv,.js .reveal{opacity:1!important;transform:none!important} *,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}' });
  await page.evaluate(() => document.querySelectorAll('.lane,.journey,.sector-cols,.track,.towers').forEach((e) => e.classList.add('is-in')));
  await page.waitForTimeout(400);
  return page.evaluate((W) => {
    const out = { overflow: [], clipped: [], tap: [], tiny: [], overlap: [] };
    const name = (el) => (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase());
    const where = (el) => (el.closest('section[id],header,footer,aside')?.id || el.closest('section,header,footer,aside')?.className?.split(' ')[0] || '?');
    const hidden = (el) => { const d = el.closest('details:not([open])'); if (d && !el.closest('summary')) return true; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0 || e.getAttribute('aria-hidden') === 'true' || e.classList?.contains('sr-only')) return true; } return false; };
    const clippedBy = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (/hidden|clip|auto|scroll/.test(cs.overflowX)) return e; } return null; };
    const all = [...document.body.querySelectorAll('*')];
    for (const el of all) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if ((r.right > W + 1 || r.left < -1) && !clippedBy(el) && !['fixed'].includes(getComputedStyle(el).position) && !hidden(el)) out.overflow.push(`${where(el)} ${name(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
    const texts = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !hidden(el));
    for (const el of texts) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (!r.width) continue;
      if (parseFloat(cs.fontSize) < 11) out.tiny.push(`${where(el)} ${name(el)} ${cs.fontSize} "${el.textContent.trim().slice(0, 24)}"`);
      if ((el.scrollWidth > el.clientWidth + 2 && /hidden|clip/.test(cs.overflowX)) || (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1)) out.clipped.push(`${where(el)} ${name(el)} "${el.textContent.trim().slice(0, 30)}"`);
    }
    if (W < 800) for (const el of document.querySelectorAll('a[href], button, input, select, [role="tab"]')) {
      if (hidden(el) || el.tabIndex < 0) continue;
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      const inline = getComputedStyle(el).display === 'inline' && el.closest('p');
      if (!inline && r.height < 40) out.tap.push(`${where(el)} ${name(el)} ${Math.round(r.width)}×${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}"`);
    }
    // Text line boxes (one per rendered line), clipped by overflow-hidden ancestors; fixed/sticky layers are excluded.
    const floating = (el) => { for (let e = el; e; e = e.parentElement) if (/fixed|sticky/.test(getComputedStyle(e).position)) return true; return false; };
    const clip = (el, r) => { let { left, top, right, bottom } = r; for (let e = el; e && e !== document.body; e = e.parentElement) { if (!/hidden|clip/.test(getComputedStyle(e).overflow)) continue; const c = e.getBoundingClientRect(); left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom); } return { left, top, right, bottom, width: right - left, height: bottom - top }; };
    const boxes = [];
    for (const el of texts) {
      if (floating(el)) continue;
      for (const n of el.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const lr of rg.getClientRects()) { const r = clip(el, lr); if (r.width > 4 && r.height > 4) boxes.push({ el, r }); } }
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (x > 4 && y > 4 && x * y > 0.2 * Math.min(a.r.width * a.r.height, b.r.width * b.r.height)) out.overlap.push(`${where(a.el)} ${name(a.el)} "${a.el.textContent.trim().slice(0, 18)}" × ${name(b.el)} "${b.el.textContent.trim().slice(0, 18)}"`);
    }
    for (const k of Object.keys(out)) out[k] = [...new Set(out[k])].slice(0, 25);
    return out;
  }, w);
}
