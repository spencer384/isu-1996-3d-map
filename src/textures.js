import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function finalizeTex(canvas, { isColor = true, repeatX = 1, repeatY = 1, anisotropy = 4, wrap = THREE.RepeatWrapping } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = wrap;
  tex.wrapT = wrap;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Deterministic pseudo-random helper
function makeRand(seed = 1996) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createTextureLibrary(renderer) {
  const aniso = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);

  // 1. Subtropical Grass (Map + Bump + Roughness)
  const grass = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const [rc, rctx] = makeCanvas(512, 512);
    const rand = makeRand(101);

    ctx.fillStyle = '#5a8f49';
    ctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 512, 512);
    rctx.fillStyle = '#dcdcdc';
    rctx.fillRect(0, 0, 512, 512);

    // Mottled organic patches
    for (let i = 0; i < 420; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const rad = 10 + rand() * 28;
      const gShift = Math.floor((rand() - 0.5) * 32);
      ctx.fillStyle = `rgba(${86 + gShift}, ${140 + gShift}, ${68 + (gShift >> 1)}, 0.16)`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine grass blade grain
    for (let i = 0; i < 5500; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const len = 3 + rand() * 5;
      const dx = (rand() - 0.5) * 2.5;
      const bright = rand() > 0.5;
      ctx.strokeStyle = bright ? 'rgba(132, 184, 96, 0.35)' : 'rgba(46, 86, 38, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y - len);
      ctx.stroke();

      const bVal = bright ? 185 : 95;
      bctx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bctx.fillRect(x, y, 1.5, 2.5);
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 48, repeatY: 48, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 48, repeatY: 48, anisotropy: aniso }),
      roughnessMap: finalizeTex(rc, { isColor: false, repeatX: 48, repeatY: 48, anisotropy: aniso }),
    };
  })();

  // 2. Asphalt Road with Double Yellow Center Line & White Edge Lines
  const asphaltRoad = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const rand = makeRand(202);

    ctx.fillStyle = '#383e45';
    ctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#787878';
    bctx.fillRect(0, 0, 512, 512);

    // Subtle tire wear tracks
    ctx.fillStyle = 'rgba(24, 28, 32, 0.25)';
    ctx.fillRect(115, 0, 68, 512);
    ctx.fillRect(329, 0, 68, 512);

    // Aggregate speckle
    for (let i = 0; i < 12000; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const v = 40 + Math.floor(rand() * 48);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
      ctx.fillRect(x, y, 2, 2);

      const bv = 90 + Math.floor(rand() * 90);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, 2, 2);
    }

    // White edge lines (u near 0.05 and 0.95)
    ctx.fillStyle = 'rgba(238, 240, 236, 0.88)';
    ctx.fillRect(22, 0, 12, 512);
    ctx.fillRect(478, 0, 12, 512);

    // Double yellow center lines (Taiwanese road style)
    ctx.fillStyle = 'rgba(232, 178, 44, 0.92)';
    ctx.fillRect(243, 0, 9, 512);
    ctx.fillRect(260, 0, 9, 512);

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 1, repeatY: 1, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 1, repeatY: 1, anisotropy: aniso }),
    };
  })();

  // 3. Campus Plaza Tile (Warm sandstone / terracotta interlocking pavers)
  const plazaTile = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const rand = makeRand(303);

    ctx.fillStyle = '#a89683';
    ctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#505050';
    bctx.fillRect(0, 0, 512, 512);

    const step = 32;
    for (let y = 0; y < 512; y += step) {
      for (let x = 0; x < 512; x += step) {
        const isBorder = ((x / step) % 4 === 0) || ((y / step) % 4 === 0);
        const shift = Math.floor((rand() - 0.5) * 16);
        if (isBorder) {
          ctx.fillStyle = `rgb(${156 + shift}, ${106 + shift}, ${88 + shift})`;
        } else {
          ctx.fillStyle = `rgb(${182 + shift}, ${166 + shift}, ${146 + shift})`;
        }
        ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
        bctx.fillStyle = '#b4b4b4';
        bctx.fillRect(x + 2, y + 2, step - 4, step - 4);
      }
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 8, repeatY: 8, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 8, repeatY: 8, anisotropy: aniso }),
    };
  })();

  // 4. Brick Retaining Wall
  const retainingBrick = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const rand = makeRand(404);

    ctx.fillStyle = '#8b7b6c'; // mortar
    ctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#484848';
    bctx.fillRect(0, 0, 512, 512);

    const bh = 16;
    const bw = 42;
    for (let row = 0; row < 512 / bh; row++) {
      const y = row * bh;
      const offset = (row % 2) * (bw / 2);
      for (let x = -bw; x < 512 + bw; x += bw) {
        const shade = Math.floor((rand() - 0.5) * 28);
        ctx.fillStyle = `rgb(${156 + shade}, ${74 + (shade >> 1)}, ${56 + (shade >> 1)})`;
        ctx.fillRect(x + offset + 2, y + 2, bw - 3, bh - 3);
        bctx.fillStyle = '#c8c8c8';
        bctx.fillRect(x + offset + 2, y + 2, bw - 3, bh - 3);
      }
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 4, repeatY: 1, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 4, repeatY: 1, anisotropy: aniso }),
    };
  })();

  // 5. Building Facade Factory ('academic', 'dorm', 'concrete')
  const facadeCache = new Map();
  function facadeFactory(style = 'academic') {
    const key = style;
    if (facadeCache.has(key)) return facadeCache.get(key);

    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const [rc, rctx] = makeCanvas(512, 512);
    const [ec, ectx] = makeCanvas(512, 512);
    const rand = makeRand(style === 'academic' ? 501 : style === 'dorm' ? 502 : 503);

    if (style === 'concrete') {
      ctx.fillStyle = '#c9c4ba';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#909090';
      bctx.fillRect(0, 0, 512, 512);
      rctx.fillStyle = '#dedede';
      rctx.fillRect(0, 0, 512, 512);
      ectx.fillStyle = '#000000';
      ectx.fillRect(0, 0, 512, 512);

      // Formwork panel seams & tie holes
      ctx.strokeStyle = 'rgba(80, 78, 74, 0.35)';
      ctx.lineWidth = 2;
      bctx.strokeStyle = '#404040';
      bctx.lineWidth = 2;
      for (let y = 0; y < 512; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(512, y); bctx.stroke();
        for (let x = 0; x < 512; x += 128) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke();
          bctx.beginPath(); bctx.moveTo(x, y); bctx.lineTo(x, y + 64); bctx.stroke();
          ctx.fillStyle = 'rgba(70,68,64,0.45)';
          ctx.beginPath(); ctx.arc(x + 20, y + 16, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + 108, y + 16, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (let i = 0; i < 4500; i++) {
        const v = 175 + Math.floor((rand() - 0.5) * 40);
        ctx.fillStyle = `rgba(${v},${v - 2},${v - 6},0.16)`;
        ctx.fillRect(rand() * 512, rand() * 512, 3, 3);
      }
    } else {
      // Taiwanese 二丁掛紅磚 (salmon-terracotta glazed tile)
      const isDorm = style === 'dorm';
      ctx.fillStyle = isDorm ? '#a65445' : '#9e4b3c';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#9a9a9a';
      bctx.fillRect(0, 0, 512, 512);
      rctx.fillStyle = '#c8c8c8';
      rctx.fillRect(0, 0, 512, 512);
      ectx.fillStyle = '#000000';
      ectx.fillRect(0, 0, 512, 512);

      // Fine 二丁掛 tile grid
      const th = 8;
      const tw = 24;
      for (let y = 0; y < 512; y += th) {
        const off = ((y / th) % 2) * (tw / 2);
        for (let x = -tw; x < 512 + tw; x += tw) {
          const s = Math.floor((rand() - 0.5) * 20);
          const baseR = isDorm ? 172 : 162;
          const baseG = isDorm ? 88 : 76;
          const baseB = isDorm ? 72 : 60;
          ctx.fillStyle = `rgb(${baseR + s}, ${baseG + (s >> 1)}, ${baseB + (s >> 1)})`;
          ctx.fillRect(x + off + 1, y + 1, tw - 2, th - 2);
        }
      }

      const floors = isDorm ? 4 : 4;
      const cols = isDorm ? 5 : 4;
      const floorH = 512 / floors;
      const colW = 512 / cols;

      for (let f = 0; f < floors; f++) {
        const fy = f * floorH;
        // White concrete horizontal spandrel band
        ctx.fillStyle = '#ddd7cd';
        ctx.fillRect(0, fy, 512, 14);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, fy + 14, 512, 3);
        bctx.fillStyle = '#dcdcdc';
        bctx.fillRect(0, fy, 512, 14);

        for (let col = 0; col < cols; col++) {
          const cx = col * colW;
          const wx = cx + (isDorm ? 10 : 14);
          const wy = fy + (isDorm ? 28 : 30);
          const ww = colW - (isDorm ? 20 : 28);
          const wh = floorH - (isDorm ? 54 : 58);

          // Recessed window shadow & aluminum frame
          ctx.fillStyle = '#5c5852';
          ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
          bctx.fillStyle = '#383838';
          bctx.fillRect(wx, wy, ww, wh);

          // Concrete window sill
          ctx.fillStyle = '#dad4ca';
          ctx.fillRect(wx - 4, wy + wh + 2, ww + 8, 6);
          bctx.fillStyle = '#ededed';
          bctx.fillRect(wx - 4, wy + wh + 2, ww + 8, 6);

          // Glass panes with sky reflection gradient
          const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
          grad.addColorStop(0, '#5a82a6');
          grad.addColorStop(0.55, '#2b4764');
          grad.addColorStop(1, '#1b2b3d');
          ctx.fillStyle = grad;
          ctx.fillRect(wx, wy, ww, wh);

          // Smooth glass in roughness map (dark = glossy)
          rctx.fillStyle = '#262626';
          rctx.fillRect(wx, wy, ww, wh);

          // Window mullions
          ctx.fillStyle = '#bfc4c9';
          ctx.fillRect(wx, wy, ww, 3);
          ctx.fillRect(wx, wy + wh - 3, ww, 3);
          ctx.fillRect(wx, wy, 3, wh);
          ctx.fillRect(wx + ww - 3, wy, 3, wh);
          ctx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
          if (!isDorm) {
            ctx.fillRect(wx, wy + wh * 0.32, ww, 2);
          }

          // Dorm AC unit / balcony slot detail
          if (isDorm && rand() > 0.35) {
            ctx.fillStyle = '#d5d2cc';
            ctx.fillRect(wx + ww - 18, wy + wh + 8, 16, 10);
            ctx.fillStyle = '#40454a';
            ctx.fillRect(wx + ww - 16, wy + wh + 10, 12, 6);
          }

          // Night emissive lights (~65% academic, ~75% dorm)
          if (rand() < (isDorm ? 0.75 : 0.65)) {
            const warm = rand() > 0.3 ? '#ffd88a' : '#ffeec4';
            ectx.fillStyle = warm;
            ectx.fillRect(wx + 3, wy + 3, ww / 2 - 4, wh - 6);
            if (rand() > 0.2) {
              ectx.fillRect(wx + ww / 2 + 1.5, wy + 3, ww / 2 - 4, wh - 6);
            }
          }
        }
      }
    }

    const res = {
      map: finalizeTex(c, { isColor: true, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, anisotropy: aniso }),
      roughnessMap: finalizeTex(rc, { isColor: false, anisotropy: aniso }),
      emissiveMap: finalizeTex(ec, { isColor: true, anisotropy: aniso }),
    };
    facadeCache.set(key, res);
    return res;
  }

  // 6. Terracotta S-Tile Roof
  const roofTile = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const rand = makeRand(601);

    ctx.fillStyle = '#b44835';
    ctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 512, 512);

    const rowH = 24;
    const colW = 18;
    for (let y = 0; y < 512; y += rowH) {
      for (let x = 0; x < 512; x += colW) {
        const s = Math.floor((rand() - 0.5) * 18);
        const grad = ctx.createLinearGradient(x, y, x + colW, y);
        grad.addColorStop(0, `rgb(${155 + s}, ${56 + (s >> 1)}, ${40 + (s >> 1)})`);
        grad.addColorStop(0.45, `rgb(${198 + s}, ${84 + (s >> 1)}, ${60 + (s >> 1)})`);
        grad.addColorStop(1, `rgb(${142 + s}, ${48 + (s >> 1)}, ${36 + (s >> 1)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, colW, rowH - 2);

        const bGrad = bctx.createLinearGradient(x, y, x + colW, y);
        bGrad.addColorStop(0, '#555555');
        bGrad.addColorStop(0.5, '#d8d8d8');
        bGrad.addColorStop(1, '#555555');
        bctx.fillStyle = bGrad;
        bctx.fillRect(x, y, colW, rowH - 2);
      }
      // Tile course shadow
      ctx.fillStyle = 'rgba(20, 8, 5, 0.35)';
      ctx.fillRect(0, y + rowH - 3, 512, 3);
      bctx.fillStyle = '#303030';
      bctx.fillRect(0, y + rowH - 3, 512, 3);
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 4, repeatY: 4, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 4, repeatY: 4, anisotropy: aniso }),
    };
  })();

  // 7. Flat Roof Waterproof Membrane & Gravel Concrete
  const flatRoof = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    const rand = makeRand(701);

    ctx.fillStyle = '#8b8f91';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 3200; i++) {
      const v = 120 + Math.floor(rand() * 44);
      ctx.fillStyle = `rgb(${v},${v + 1},${v})`;
      ctx.fillRect(rand() * 256, rand() * 256, 2, 2);
      const bv = 90 + Math.floor(rand() * 75);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(rand() * 256, rand() * 256, 2, 2);
    }
    ctx.strokeStyle = 'rgba(60, 64, 68, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 248, 248);

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 2, repeatY: 2, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 2, repeatY: 2, anisotropy: aniso }),
    };
  })();

  // 8. Water Tower Painted Riveted Steel
  const waterTowerMetal = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    ctx.fillStyle = '#ece9e2';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(60, 60, 60, 0.2)';
    ctx.lineWidth = 2;
    bctx.strokeStyle = '#505050';
    bctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(256, y); bctx.stroke();
    }
    for (let x = 0; x < 256; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, 256); bctx.stroke();
    }
    return {
      map: finalizeTex(c, { isColor: true, repeatX: 2, repeatY: 1, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 2, repeatY: 1, anisotropy: aniso }),
    };
  })();

  // 9. Wood Grain (Pavilions & Benches)
  const wood = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    const rand = makeRand(901);

    ctx.fillStyle = '#784c2e';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 32) {
      const s = Math.floor((rand() - 0.5) * 18);
      ctx.fillStyle = `rgb(${118 + s}, ${72 + (s >> 1)}, ${44 + (s >> 1)})`;
      ctx.fillRect(0, y, 256, 30);
      ctx.fillStyle = 'rgba(30, 14, 6, 0.45)';
      ctx.fillRect(0, y + 30, 256, 2);
    }
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = 'rgba(50, 22, 10, 0.16)';
      ctx.fillRect(rand() * 256, rand() * 256, 18 + rand() * 40, 1.5);
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 2, repeatY: 2, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 2, repeatY: 2, anisotropy: aniso }),
    };
  })();

  // 10. Sports Field Top-Down Texture (1024x512: 8 tartan lanes + mowed soccer pitch)
  const sportsField = (() => {
    const [c, ctx] = makeCanvas(1024, 512);
    ctx.fillStyle = '#457b3c';
    ctx.fillRect(0, 0, 1024, 512);

    const cx = 512;
    const cy = 256;
    const drawStadiumShape = (halfStraight, radius) => {
      ctx.beginPath();
      ctx.moveTo(cx - halfStraight, cy - radius);
      ctx.lineTo(cx + halfStraight, cy - radius);
      ctx.arc(cx + halfStraight, cy, radius, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx - halfStraight, cy + radius);
      ctx.arc(cx - halfStraight, cy, radius, Math.PI / 2, (Math.PI * 3) / 2);
      ctx.closePath();
    };

    // Outer tartan track
    drawStadiumShape(225, 224);
    ctx.fillStyle = '#b44f3b';
    ctx.fill();

    // 8 crisp white lane lines
    ctx.strokeStyle = 'rgba(248, 248, 245, 0.85)';
    ctx.lineWidth = 2;
    for (let lane = 0; lane <= 8; lane++) {
      const r = 152 + lane * 9;
      drawStadiumShape(225, r);
      ctx.stroke();
    }

    // Start/finish line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy + 152);
    ctx.lineTo(cx - 120, cy + 224);
    ctx.stroke();

    // Inner turf
    drawStadiumShape(225, 150);
    ctx.save();
    ctx.clip();
    for (let x = 0; x < 1024; x += 36) {
      ctx.fillStyle = (x / 36) % 2 === 0 ? '#4d8a42' : '#437c39';
      ctx.fillRect(x, 0, 36, 512);
    }

    // White soccer field markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    const fx = cx - 220;
    const fy = cy - 115;
    const fw = 440;
    const fh = 230;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.beginPath();
    ctx.moveTo(cx, fy);
    ctx.lineTo(cx, fy + fh);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.stroke();
    // Penalty boxes
    ctx.strokeRect(fx, cy - 62, 64, 124);
    ctx.strokeRect(fx + fw - 64, cy - 62, 64, 124);
    ctx.restore();

    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  })();

  // 11. Swimming Pool Water (Tiles + Caustic Ripples + Lane Lines)
  const poolWater = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const rand = makeRand(1101);

    ctx.fillStyle = '#24a8d8';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle underwater tile grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Caustic shimmer highlights
    for (let i = 0; i < 240; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const r = 8 + rand() * 20;
      ctx.strokeStyle = 'rgba(185, 246, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 1.4);
      ctx.stroke();
    }

    return finalizeTex(c, { isColor: true, repeatX: 2, repeatY: 1, anisotropy: aniso });
  })();

  // 12. 1996 Kaohsiung Bus (高雄客運校車) Livery
  const busSide = (() => {
    const [c, ctx] = makeCanvas(512, 256);
    // Upper cream
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, 512, 145);
    // Lower Kaohsiung Bus bright yellow + crimson band (校門1997)
    ctx.fillStyle = '#f0c52c';
    ctx.fillRect(0, 145, 512, 111);
    ctx.fillStyle = '#c92b2b';
    ctx.fillRect(0, 134, 512, 14);

    // Passenger windows
    for (let i = 0; i < 6; i++) {
      const wx = 26 + i * 76;
      ctx.fillStyle = '#1f2f3f';
      ctx.fillRect(wx, 34, 62, 74);
      ctx.fillStyle = 'rgba(130, 175, 215, 0.25)';
      ctx.fillRect(wx + 4, 38, 22, 66);
    }

    // Livery text
    ctx.fillStyle = '#6f2219';
    ctx.font = 'bold 26px "Microsoft JhengHei", sans-serif';
    ctx.fillText('高雄客運  校車', 165, 196);

    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  })();

  const busFront = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, 256, 150);
    ctx.fillStyle = '#e59a28';
    ctx.fillRect(0, 150, 256, 106);
    ctx.fillStyle = '#b93327';
    ctx.fillRect(0, 138, 256, 12);

    // Large split windshield
    ctx.fillStyle = '#1c2b3a';
    ctx.fillRect(20, 42, 216, 84);
    ctx.fillStyle = '#e59a28';
    ctx.fillRect(126, 42, 4, 84);

    // Destination sign
    ctx.fillStyle = '#14181e';
    ctx.fillRect(58, 14, 140, 22);
    ctx.fillStyle = '#ffd66b';
    ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('高雄工學院 校車', 128, 30);

    // Grille & headlights
    ctx.fillStyle = '#333840';
    ctx.fillRect(72, 182, 112, 34);
    ctx.fillStyle = '#fff5c8';
    ctx.fillRect(26, 188, 32, 20);
    ctx.fillRect(198, 188, 32, 20);

    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  })();

  // 13. Gate Plaque ("高雄工學院")
  const gatePlaque = (() => {
    const [c, ctx] = makeCanvas(256, 128);
    ctx.fillStyle = '#d4cfc5';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#7b746a';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 116);
    ctx.fillStyle = '#8b2b1d';
    ctx.font = 'bold 34px "Microsoft JhengHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('高雄工學院', 128, 56);
    ctx.fillStyle = '#4e4842';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('1996 • EST. 1986', 128, 96);
    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  })();

  // 14. Tree Bark & Foliage Clusters
  const bark = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    const rand = makeRand(1401);

    ctx.fillStyle = '#5c4330';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 420; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const w = 2 + rand() * 5;
      const h = 18 + rand() * 48;
      const dark = rand() > 0.4;
      ctx.fillStyle = dark ? 'rgba(42, 28, 18, 0.45)' : 'rgba(116, 88, 64, 0.35)';
      ctx.fillRect(x, y, w, h);
      bctx.fillStyle = dark ? '#454545' : '#c0c0c0';
      bctx.fillRect(x, y, w, h);
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 1, repeatY: 2, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 1, repeatY: 2, anisotropy: aniso }),
    };
  })();

  const leafCluster = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    const rand = makeRand(1402);

    ctx.fillStyle = '#387035';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#707070';
    bctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 900; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const r = 3 + rand() * 7;
      const tone = rand();
      ctx.fillStyle = tone > 0.65
        ? 'rgba(104, 162, 74, 0.65)'
        : tone > 0.25
          ? 'rgba(54, 110, 48, 0.7)'
          : 'rgba(28, 66, 28, 0.75)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      const bv = tone > 0.5 ? 200 : 75;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.beginPath();
      bctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
      bctx.fill();
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 2, repeatY: 2, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 2, repeatY: 2, anisotropy: aniso }),
    };
  })();

  // 15. Sky Dome Equirectangular Textures ('day', 'mist', 'sunset', 'night')
  const skyCache = new Map();
  function skyEquirect(presetName = 'day') {
    if (skyCache.has(presetName)) return skyCache.get(presetName);
    const [c, ctx] = makeCanvas(1024, 512);
    const rand = makeRand(1500 + presetName.length * 13);

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    if (presetName === 'day') {
      grad.addColorStop(0, '#2a6bb3');
      grad.addColorStop(0.45, '#68a9e0');
      grad.addColorStop(0.75, '#b6daf0');
      grad.addColorStop(1, '#dcebf5');
    } else if (presetName === 'mist') {
      grad.addColorStop(0, '#7c93a6');
      grad.addColorStop(0.5, '#a8bcc9');
      grad.addColorStop(1, '#cfdce3');
    } else if (presetName === 'sunset') {
      grad.addColorStop(0, '#2b3868');
      grad.addColorStop(0.38, '#7a5278');
      grad.addColorStop(0.68, '#e07c55');
      grad.addColorStop(1, '#f7be7c');
    } else {
      grad.addColorStop(0, '#050b16');
      grad.addColorStop(0.55, '#0c1a2e');
      grad.addColorStop(1, '#182b44');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    if (presetName === 'day' || presetName === 'sunset') {
      // Soft cumulus clouds band
      const cloudColor = presetName === 'day' ? 'rgba(255, 255, 255, 0.34)' : 'rgba(255, 200, 155, 0.28)';
      for (let i = 0; i < 65; i++) {
        const x = rand() * 1024;
        const y = 135 + rand() * 145;
        const rx = 32 + rand() * 75;
        const ry = 10 + rand() * 22;
        ctx.fillStyle = cloudColor;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (presetName === 'night') {
      // Crisp starry sky
      for (let i = 0; i < 420; i++) {
        const x = rand() * 1024;
        const y = rand() * 320;
        const r = 0.6 + rand() * 1.4;
        ctx.fillStyle = `rgba(255, 252, 235, ${0.35 + rand() * 0.65})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: 1 });
    skyCache.set(presetName, tex);
    return tex;
  }

  // 16. Gate Tower Vertical Signs ("高雄工學院" & 1997 "義守大學")
  const makeGateSign = (chars, seed) => {
    const [c, ctx] = makeCanvas(256, 512);
    const rand = makeRand(seed);
    ctx.fillStyle = '#9b4436';
    ctx.fillRect(0, 0, 256, 512);

    for (let y = 0; y < 512; y += 10) {
      const off = ((y / 10) % 2) * 14;
      for (let x = -14; x < 270; x += 28) {
        const s = Math.floor((rand() - 0.5) * 18);
        ctx.fillStyle = `rgb(${158 + s}, ${70 + (s >> 1)}, ${54 + (s >> 1)})`;
        ctx.fillRect(x + off + 1, y + 1, 26, 8);
      }
    }

    // White concrete border bands
    ctx.fillStyle = '#e5e0d6';
    ctx.fillRect(0, 0, 256, 22);
    ctx.fillRect(0, 490, 256, 22);
    ctx.fillRect(0, 0, 22, 512);
    ctx.fillRect(234, 0, 22, 512);
    ctx.fillRect(22, 240, 212, 12);

    // Bold vertical traditional Chinese white relief text
    ctx.font = chars.length === 4 ? 'bold 64px "Microsoft JhengHei", serif' : 'bold 58px "Microsoft JhengHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const stepY = chars.length === 4 ? 98 : 82;
    const startY = chars.length === 4 ? 88 : 62;
    chars.forEach((ch, idx) => {
      const cy = startY + idx * stepY;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillText(ch, 131, cy + 3);
      ctx.fillStyle = '#f6f4ef';
      ctx.fillText(ch, 128, cy);
    });

    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  };

  const gateTowerSign = makeGateSign(['高', '雄', '工', '學', '院'], 1601);
  const gateTowerSignISU = makeGateSign(['義', '守', '大', '學'], 1602);

  // 17. Octagonal Water Tower Wrap with Red Bands & School Emblem
  const waterTowerEmblem = (() => {
    const [c, ctx] = makeCanvas(512, 256);
    ctx.fillStyle = '#f3f1eb';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#c83929';
    ctx.fillRect(0, 0, 512, 52);
    ctx.fillRect(0, 204, 512, 52);

    // Stylized blue/red school emblem centered on faces
    for (let i = 0; i < 4; i++) {
      const cx = 64 + i * 128;
      const cy = 128;
      ctx.fillStyle = '#1e5aa8';
      ctx.fillRect(cx - 22, cy - 22, 44, 44);
      ctx.fillStyle = '#f3f1eb';
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 12);
      ctx.lineTo(cx, cy - 14);
      ctx.lineTo(cx + 14, cy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c83929';
      ctx.fillRect(cx - 14, cy + 14, 28, 5);
    }

    return finalizeTex(c, { isColor: true, repeatX: 2, repeatY: 1, anisotropy: aniso });
  })();

  // 18. Entrance Spirit Monument Crest (精神指標)
  const spiritEmblem = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    ctx.fillStyle = '#f0ede4';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#c9a24b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1c579e';
    ctx.fillRect(72, 72, 112, 112);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(84, 168);
    ctx.lineTo(128, 86);
    ctx.lineTo(172, 168);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1c579e';
    ctx.fillRect(104, 134, 48, 16);

    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  })();

  // 19. Swimming Pool Deck Square Mosaic Tiles
  const poolDeckMosaic = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    const rand = makeRand(1901);

    ctx.fillStyle = '#b4b8bc';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#555555';
    bctx.fillRect(0, 0, 256, 256);

    const step = 16;
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        const v = 216 + Math.floor((rand() - 0.5) * 20);
        ctx.fillStyle = `rgb(${v}, ${v + 2}, ${v + 4})`;
        ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
        bctx.fillStyle = '#d0d0d0';
        bctx.fillRect(x + 1, y + 1, step - 2, step - 2);
      }
    }

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 6, repeatY: 4, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 6, repeatY: 4, anisotropy: aniso }),
    };
  })();

  // 20. Outdoor Blue Basketball / Tennis Court Texture
  const courtBlue = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    // Outer teal-green apron
    ctx.fillStyle = '#2d6e66';
    ctx.fillRect(0, 0, 512, 512);
    // Inner blue court surface
    ctx.fillStyle = '#2b5e96';
    ctx.fillRect(46, 36, 420, 440);

    // Crisp white court boundary & markings
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.92)';
    ctx.lineWidth = 4;
    ctx.strokeRect(46, 36, 420, 440);
    // Center line & circle
    ctx.beginPath();
    ctx.moveTo(46, 256);
    ctx.lineTo(466, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 256, 42, 0, Math.PI * 2);
    ctx.stroke();
    // Key areas & 3-point arcs
    ctx.strokeRect(196, 36, 120, 96);
    ctx.strokeRect(196, 380, 120, 96);
    ctx.beginPath();
    ctx.arc(256, 68, 124, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 444, 124, Math.PI + 0.15, Math.PI * 2 - 0.15);
    ctx.stroke();

    return finalizeTex(c, { isColor: true, wrap: THREE.ClampToEdgeWrapping, anisotropy: aniso });
  })();

  // 21. Granite Steps (125 階花崗岩階梯與防滑條)
  const graniteSteps = (() => {
    const [c, ctx] = makeCanvas(256, 256);
    const [bc, bctx] = makeCanvas(256, 256);
    const rand = makeRand(2101);

    ctx.fillStyle = '#c8c5be';
    ctx.fillRect(0, 0, 256, 256);
    bctx.fillStyle = '#909090';
    bctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 4000; i++) {
      const v = 165 + Math.floor((rand() - 0.5) * 58);
      ctx.fillStyle = `rgb(${v},${v - 1},${v - 4})`;
      ctx.fillRect(rand() * 256, rand() * 256, 2, 2);
      const bv = 110 + Math.floor(rand() * 70);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(rand() * 256, rand() * 256, 2, 2);
    }

    // Dark anti-slip step nosing strip along front edge
    ctx.fillStyle = '#5c5a55';
    ctx.fillRect(0, 0, 256, 20);
    bctx.fillStyle = '#484848';
    bctx.fillRect(0, 0, 256, 20);

    return {
      map: finalizeTex(c, { isColor: true, repeatX: 4, repeatY: 1, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, repeatX: 4, repeatY: 1, anisotropy: aniso }),
    };
  })();

  // 22. Central Curved Blue-Glass Curtain Tower (行政大樓／綜合大樓中央弧形玻璃帷幕)
  const curtainTower = (() => {
    const [c, ctx] = makeCanvas(256, 512);
    const [rc, rctx] = makeCanvas(256, 512);
    const [ec, ectx] = makeCanvas(256, 512);
    const rand = makeRand(2201);

    ctx.fillStyle = '#9b4839';
    ctx.fillRect(0, 0, 256, 512);
    rctx.fillStyle = '#d0d0d0';
    rctx.fillRect(0, 0, 256, 512);
    ectx.fillStyle = '#000000';
    ectx.fillRect(0, 0, 256, 512);

    const floors = 10;
    const fh = 512 / floors;
    for (let f = 0; f < floors; f++) {
      const y = f * fh;
      // Red-brick spandrel band + white trim
      ctx.fillStyle = '#9b4839';
      ctx.fillRect(0, y, 256, 12);
      ctx.fillStyle = '#ddd7ce';
      ctx.fillRect(0, y + 12, 256, 3);

      // Wide sky-reflective ocean-blue curtain-wall glass band
      const grad = ctx.createLinearGradient(0, y + 15, 0, y + fh - 2);
      grad.addColorStop(0, '#5a92c2');
      grad.addColorStop(0.5, '#2b5885');
      grad.addColorStop(1, '#183452');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y + 15, 256, fh - 16);

      rctx.fillStyle = '#1f1f1f';
      rctx.fillRect(0, y + 15, 256, fh - 16);

      // Crisp silver vertical mullions & night emissive panes
      const cols = 8;
      const cw = 256 / cols;
      for (let col = 0; col < cols; col++) {
        const x = col * cw;
        ctx.fillStyle = '#cfd5dc';
        ctx.fillRect(x, y + 15, 3, fh - 16);
        if (rand() < 0.72) {
          ectx.fillStyle = rand() > 0.35 ? '#ffe8a8' : '#d8f0ff';
          ectx.fillRect(x + 3, y + 17, cw - 4, fh - 20);
        }
      }
    }

    return {
      map: finalizeTex(c, { isColor: true, anisotropy: aniso }),
      roughnessMap: finalizeTex(rc, { isColor: false, anisotropy: aniso }),
      emissiveMap: finalizeTex(ec, { isColor: true, anisotropy: aniso }),
    };
  })();

  // 23. Zodiac Plaza (星座廣場圓形天球星象石雕鋪面)
  const zodiacPlaza = (() => {
    const [c, ctx] = makeCanvas(512, 512);
    const [bc, bctx] = makeCanvas(512, 512);
    const rand = makeRand(2026);

    ctx.fillStyle = '#b8b2a8';
    ctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;
    const gradOuter = ctx.createRadialGradient(cx, cy, 180, cx, cy, 252);
    gradOuter.addColorStop(0, '#1c2d42');
    gradOuter.addColorStop(0.85, '#2b3f5c');
    gradOuter.addColorStop(1, '#a8894d');
    ctx.fillStyle = gradOuter;
    ctx.beginPath();
    ctx.arc(cx, cy, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#dfba6f';
    ctx.lineWidth = 3;
    [248, 232, 200, 160, 110, 60].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    const gradMedallion = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
    gradMedallion.addColorStop(0, '#1a3a60');
    gradMedallion.addColorStop(0.7, '#0b1d33');
    gradMedallion.addColorStop(1, '#05101f');
    ctx.fillStyle = gradMedallion;
    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(223, 186, 111, 0.45)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 60, cy + Math.sin(angle) * 60);
      ctx.lineTo(cx + Math.cos(angle) * 232, cy + Math.sin(angle) * 232);
      ctx.stroke();

      const sx = cx + Math.cos(angle + Math.PI / 12) * 216;
      const sy = cy + Math.sin(angle + Math.PI / 12) * 216;
      ctx.fillStyle = '#fce49f';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const starCoords = [
      [-80, -90], [-60, -80], [-35, -85], [-10, -70], [10, -45], [30, -50], [15, -75],
      [70, 70], [90, 80], [105, 90], [60, 110], [115, 60], [80, 130],
      [-110, 40], [-95, 60], [-75, 45], [-60, 65], [-40, 50],
      [20, 20], [45, -20], [-30, 25], [10, 60], [-10, -30],
    ];
    ctx.strokeStyle = 'rgba(255, 235, 170, 0.55)';
    ctx.lineWidth = 1;
    const connectChain = (indices) => {
      ctx.beginPath();
      indices.forEach((idx, i) => {
        const [ox, oy] = starCoords[idx];
        if (i === 0) ctx.moveTo(cx + ox, cy + oy);
        else ctx.lineTo(cx + ox, cy + oy);
      });
      ctx.stroke();
    };
    connectChain([0, 1, 2, 3, 4, 5, 6, 3]);
    connectChain([7, 8, 9]);
    connectChain([13, 14, 15, 16, 17]);

    starCoords.forEach(([ox, oy]) => {
      const sx = cx + ox;
      const sy = cy + oy;
      ctx.fillStyle = '#fff4cc';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 244, 204, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy);
      ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4);
      ctx.stroke();
    });

    for (let s = 0; s < 120; s++) {
      const sr = rand() * 190;
      const sa = rand() * Math.PI * 2;
      const sx = cx + Math.cos(sa) * sr;
      const sy = cy + Math.sin(sa) * sr;
      ctx.fillStyle = rand() > 0.4 ? '#fce8b2' : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.0 + rand() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f5c35b';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff1b8';
    ctx.lineWidth = 2;
    for (let r = 0; r < 8; r++) {
      const ang = (r * Math.PI) / 4;
      const isCard = r % 2 === 0;
      const len = isCard ? 48 : 36;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      ctx.stroke();
    }

    return {
      map: finalizeTex(c, { isColor: true, anisotropy: aniso }),
      bumpMap: finalizeTex(bc, { isColor: false, anisotropy: aniso }),
    };
  })();

  return {
    grass,
    asphaltRoad,
    plazaTile,
    retainingBrick,
    facadeFactory,
    roofTile,
    flatRoof,
    waterTowerMetal,
    wood,
    sportsField,
    poolWater,
    busSide,
    busFront,
    gatePlaque,
    bark,
    leafCluster,
    skyEquirect,
    gateTowerSign,
    gateTowerSignISU,
    waterTowerEmblem,
    spiritEmblem,
    poolDeckMosaic,
    courtBlue,
    graniteSteps,
    curtainTower,
    zodiacPlaza,
  };
}
