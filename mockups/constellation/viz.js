// Canvas constellation renderer. Rings = access depth (5 innermost).
// Glow = current ask capacity. Halo = network openness ≥ 2 (an opener).
// Unrated roster people render as "unknown" (hollow), never as "dim" —
// absence of evidence is absence of evidence.

class Constellation {
  constructor(canvas, contacts, unrated) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.contacts = contacts;
    this.unrated = unrated;
    this.nodes = [];
    this.dust = [];
    this.matches = null;   // Map id -> match result when a company is selected
    this.companyHue = null;
    this.top3 = [];
    this.hover = null;
    this.selected = null;
    this.t = 0;
    this._pulse = new Map(); // id -> pulse start time (voice-demo highlight)
    this.onHover = () => {};
    this.onSelect = () => {};
    this._bind();
    this.resize();
  }

  _bind() {
    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("mousemove", (e) => {
      const n = this._hit(e.offsetX, e.offsetY);
      const id = n ? n.id : null;
      if (id !== this.hover) { this.hover = id; this.onHover(n, e); }
      else if (n) this.onHover(n, e);
      this.canvas.style.cursor = n ? "pointer" : "default";
    });
    this.canvas.addEventListener("click", (e) => {
      const n = this._hit(e.offsetX, e.offsetY);
      this.selected = n ? n.id : null;
      this.onSelect(n);
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.parentElement.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.canvas.width = r.width * dpr; this.canvas.height = r.height * dpr;
    this.canvas.style.width = r.width + "px"; this.canvas.style.height = r.height + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout();
  }

  ringR(access) {
    // ring 1 plus the unrated band (×1.25) must fit inside the viewport
    const R = (Math.min(this.w, this.h) / 2 - 44) / 1.27;
    return R * (0.26 + (5 - access) * 0.185);
  }

  layout() {
    this.cx = this.w * 0.5; this.cy = this.h * 0.53;
    const byRing = {};
    for (const c of this.contacts) (byRing[c.access] ||= []).push(c);
    const angleOf = {};
    // seed per ring so layouts differ but stay deterministic
    for (const [access, list] of Object.entries(byRing)) {
      const n = list.length, offset = (parseInt(access) * 1.7) % (Math.PI * 2);
      list.forEach((c, i) => { angleOf[c.id] = offset + (i / n) * Math.PI * 2; });
    }
    // pull children toward their first referrer's angle
    for (let pass = 0; pass < 2; pass++) {
      for (const c of this.contacts) {
        const p = c.referredBy && c.referredBy[0];
        if (p && angleOf[p] !== undefined) {
          let d = angleOf[p] - angleOf[c.id];
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          angleOf[c.id] += d * 0.45;
        }
      }
    }
    // de-collide within each ring
    for (const list of Object.values(byRing)) {
      list.sort((a, b) => angleOf[a.id] - angleOf[b.id]);
      const minGap = (Math.PI * 2) / Math.max(list.length * 1.6, 8);
      for (let i = 1; i < list.length; i++) {
        const prev = angleOf[list[i - 1].id];
        if (angleOf[list[i].id] - prev < minGap) angleOf[list[i].id] = prev + minGap;
      }
    }
    this.nodes = this.contacts.map((c) => {
      const r = this.ringR(c.access), a = angleOf[c.id];
      return { ...c, x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r, a, r,
               phase: (c.id.length * 2.3) % 6.28, rated: true };
    });
    // unrated band + dust
    const R1 = this.ringR(1);
    let s = 42;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    this.unratedNodes = this.unrated.map(([name, role, org], i) => {
      const a = (i / this.unrated.length) * Math.PI * 2 + rnd() * 0.3;
      const r = R1 * (1.09 + rnd() * 0.16);
      return { id: "u" + i, name, role, org, rated: false,
               x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r, phase: rnd() * 6.28 };
    });
    this.dust = [];
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, r = R1 * (1.05 + rnd() * 0.45);
      this.dust.push({ x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r,
                       s: 0.4 + rnd() * 0.8, p: rnd() * 6.28 });
    }
    this.nodeById = Object.fromEntries(this.nodes.map((n) => [n.id, n]));
  }

  setCompany(matches, hue, top3) { this.matches = matches; this.companyHue = hue; this.top3 = top3 || []; }
  pulse(id) { this._pulse.set(id, this.t); }

  _hit(mx, my) {
    let best = null, bd = 16;
    for (const n of [...this.nodes, ...this.unratedNodes]) {
      const d = Math.hypot(n.x - mx, n.y - my);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  _hex(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  draw() {
    const { ctx, w, h } = this;
    this.t += 0.016;
    ctx.clearRect(0, 0, w, h);

    // rings — numeral only; the full access-depth key lives in the legend
    ctx.font = "10px system-ui, -apple-system, sans-serif";
    for (let a = 5; a >= 1; a--) {
      const r = this.ringR(a);
      ctx.beginPath(); ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.055)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(137,135,129,0.8)";
      const lx = this.cx + Math.cos(-2.35) * r, ly = this.cy + Math.sin(-2.35) * r;
      ctx.fillText(String(a), lx - 3, ly - 3);
    }

    // dust (the 21k LinkedIn field)
    for (const d of this.dust) {
      const tw = 0.25 + 0.15 * Math.sin(this.t * 0.7 + d.p);
      ctx.fillStyle = `rgba(195,194,183,${tw * 0.35})`;
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }

    // referral edges
    for (const n of this.nodes) {
      for (const p of n.referredBy || []) {
        const pn = this.nodeById[p]; if (!pn) continue;
        const hot = [this.hover, this.selected].includes(n.id) || [this.hover, this.selected].includes(p);
        ctx.beginPath(); ctx.moveTo(pn.x, pn.y);
        const mx = (pn.x + n.x) / 2 + (this.cx - (pn.x + n.x) / 2) * 0.15;
        const my = (pn.y + n.y) / 2 + (this.cy - (pn.y + n.y) / 2) * 0.15;
        ctx.quadraticCurveTo(mx, my, n.x, n.y);
        ctx.strokeStyle = hot ? "rgba(144,133,233,0.55)" : "rgba(255,255,255,0.07)";
        ctx.lineWidth = hot ? 1.4 : 1; ctx.stroke();
      }
    }

    // unrated (unknown, not dim): small hollow marks
    for (const u of this.unratedNodes) {
      const tw = 0.5 + 0.2 * Math.sin(this.t + u.phase);
      ctx.beginPath(); ctx.arc(u.x, u.y, 2.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(195,194,183,${0.45 * tw})`; ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      if (this.hover === u.id || this.selected === u.id) {
        ctx.beginPath(); ctx.arc(u.x, u.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      }
    }

    // Jacob at center
    const jg = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, 26);
    jg.addColorStop(0, "rgba(255,250,235,0.95)"); jg.addColorStop(0.25, "rgba(255,240,200,0.35)"); jg.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = jg; ctx.beginPath(); ctx.arc(this.cx, this.cy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(this.cx, this.cy, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillText("JACOB", this.cx - ctx.measureText("JACOB").width / 2, this.cy + 20);

    // rated nodes
    for (const n of this.nodes) {
      const m = this.matches ? this.matches.get(n.id) : null;
      const score = m ? m.score : null;
      const isTop = this.top3.includes(n.id);
      const hot = this.hover === n.id || this.selected === n.id;
      const tw = 1 + 0.12 * Math.sin(this.t * 1.3 + n.phase);

      let alpha = 1, glowColor = "255,250,238";
      if (this.matches) {
        alpha = score > 0.45 ? 1 : score > 0.25 ? 0.7 : 0.22;
        if (score > 0.25 && this.companyHue) {
          const c = this.companyHue;
          glowColor = `${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)}`;
        }
      }
      if (hot) alpha = 1;

      const cap = n.flags?.paid ? 1 : n.capacity;
      const glowR = (7 + 15 * cap) * (n.hub ? 1.5 : 1) * tw;
      const coreR = (n.hub ? 3.6 : 2.6) + (hot ? 0.8 : 0);

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
      g.addColorStop(0, `rgba(${glowColor},${0.85 * alpha * (0.35 + 0.65 * cap)})`);
      g.addColorStop(0.4, `rgba(${glowColor},${0.25 * alpha * cap})`);
      g.addColorStop(1, `rgba(${glowColor},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${(0.35 + 0.65 * cap) * alpha})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, coreR, 0, Math.PI * 2); ctx.fill();

      // openness halo (openers ≥2)
      if (n.openness >= 2) {
        ctx.beginPath(); ctx.arc(n.x, n.y, coreR + 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(144,133,233,${(n.openness === 3 ? 0.8 : 0.45) * alpha})`;
        ctx.lineWidth = n.openness === 3 ? 1.6 : 1; ctx.stroke();
      }
      // capacity arc: recharge state, amber when low, red when dormant
      if (cap < 0.99 && !n.flags?.paid) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, coreR + 9.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cap);
        ctx.strokeStyle = n.dormant ? `rgba(208,59,59,${0.8 * alpha})`
          : cap < 0.5 ? `rgba(250,178,25,${0.75 * alpha})` : `rgba(255,255,255,${0.28 * alpha})`;
        ctx.lineWidth = 1.6; ctx.stroke();
      }
      // paid instrument: steady square outline — different asset class
      if (n.flags?.paid) {
        ctx.strokeStyle = `rgba(25,158,112,${0.9 * alpha})`; ctx.lineWidth = 1.3;
        ctx.strokeRect(n.x - 6.5, n.y - 6.5, 13, 13);
      }
      // top-3 badge
      if (isTop) {
        const pr = 14 + 3 * Math.sin(this.t * 2.5);
        ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
        ctx.strokeStyle = this._hex(this.companyHue, 0.8); ctx.lineWidth = 1.4; ctx.stroke();
        const idx = this.top3.indexOf(n.id) + 1;
        ctx.fillStyle = this.companyHue;
        ctx.beginPath(); ctx.arc(n.x + 14, n.y - 14, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0d0d0d"; ctx.font = "700 10px system-ui, sans-serif";
        ctx.fillText(idx, n.x + 14 - 3, n.y - 10.5);
      }
      // voice-demo pulse
      const p0 = this._pulse.get(n.id);
      if (p0 !== undefined) {
        const dt = this.t - p0;
        if (dt < 3) {
          const rr = coreR + 6 + dt * 22;
          ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(25,158,112,${0.7 * (1 - dt / 3)})`; ctx.lineWidth = 2; ctx.stroke();
        } else this._pulse.delete(n.id);
      }
      // labels: hubs, hovered, selected, top-3
      if (n.hub || hot || isTop) {
        ctx.font = `${hot || isTop ? "600 " : ""}11px system-ui, sans-serif`;
        ctx.fillStyle = hot || isTop ? "rgba(255,255,255,0.95)" : `rgba(195,194,183,${0.75 * alpha})`;
        ctx.fillText(n.name, n.x + 10, n.y + 4);
      }
    }
    requestAnimationFrame(() => this.draw());
  }
}
