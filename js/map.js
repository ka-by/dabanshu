/* map.js —— RBMK-1000 核電站地圖（方塊風，11 個分區） */
(function () {
  'use strict';


  /* ---------- 紋理（全部程序生成，不使用官方材質） ---------- */
  function px(size, draw) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    draw(cv.getContext('2d'), size);
    var t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function noise(g, size, n, c1, c2) {
    for (var i = 0; i < n; i++) {
      g.fillStyle = Math.random() < 0.5 ? c1 : c2;
      g.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }
  }

  var TEX = {};
  function initTextures() {
    TEX.grass = px(16, function (g, s) {
      g.fillStyle = '#63bf43'; g.fillRect(0, 0, s, s);
      noise(g, s, 110, 'rgba(70,150,45,.65)', 'rgba(145,220,95,.7)');
      g.fillStyle = 'rgba(215,255,160,.45)';
      for (var i = 0; i < 14; i++) g.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 2);
    });
    TEX.grass.repeat.set(46, 46);

    TEX.stone = px(16, function (g, s) {
      g.fillStyle = '#8a8f94'; g.fillRect(0, 0, s, s);
      noise(g, s, 90, 'rgba(70,74,78,.6)', 'rgba(160,164,168,.6)');
      g.fillStyle = 'rgba(55,60,64,.8)';
      g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
      g.fillStyle = 'rgba(55,60,64,.4)';
      g.fillRect(0, 8, 16, 1);
    });
    TEX.stone.repeat.set(2, 2);

    TEX.white = px(16, function (g, s) {
      g.fillStyle = '#dfe3e6'; g.fillRect(0, 0, s, s);
      noise(g, s, 70, 'rgba(190,196,200,.55)', 'rgba(245,248,250,.6)');
      g.fillStyle = 'rgba(160,168,174,.5)';
      g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
    });
    TEX.white.repeat.set(2, 2);

    TEX.concrete = px(16, function (g, s) {
      g.fillStyle = '#7d848a'; g.fillRect(0, 0, s, s);
      noise(g, s, 90, 'rgba(90,97,103,.6)', 'rgba(140,147,153,.5)');
      g.fillStyle = 'rgba(52,58,64,.85)';
      g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
    });
    TEX.concrete.repeat.set(8, 8);

    TEX.crate = px(16, function (g, s) {
      g.fillStyle = '#9c7a44'; g.fillRect(0, 0, s, s);
      g.fillStyle = 'rgba(138,104,56,.75)';
      g.fillRect(0, 3, 16, 1); g.fillRect(0, 7, 16, 1); g.fillRect(0, 11, 16, 1);
      g.fillStyle = '#6b5230';
      g.fillRect(0, 0, 16, 2); g.fillRect(0, 14, 16, 2);
      g.fillRect(0, 0, 2, 16); g.fillRect(14, 0, 2, 16);
      g.strokeStyle = '#6b5230'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(2, 2); g.lineTo(14, 14); g.stroke();
      g.beginPath(); g.moveTo(14, 2); g.lineTo(2, 14); g.stroke();
    });

    TEX.hazard = px(16, function (g, s) {
      g.fillStyle = '#e8c020'; g.fillRect(0, 0, s, s);
      g.fillStyle = '#1c1c1c';
      for (var i = -16; i < 24; i += 10) {
        g.beginPath();
        g.moveTo(i, 0); g.lineTo(i + 5, 0);
        g.lineTo(i + 5 + 16, 16); g.lineTo(i + 16, 16);
        g.closePath(); g.fill();
      }
    });

    TEX.metal = px(16, function (g, s) {
      g.fillStyle = '#8a9198'; g.fillRect(0, 0, s, s);
      noise(g, s, 60, 'rgba(110,117,124,.6)', 'rgba(170,178,185,.5)');
      g.fillStyle = 'rgba(60,66,72,.6)';
      g.fillRect(2, 2, 1, 1); g.fillRect(13, 2, 1, 1);
      g.fillRect(2, 13, 1, 1); g.fillRect(13, 13, 1, 1);
    });
    TEX.metal.repeat.set(2, 2);

    TEX.black = px(16, function (g, s) {
      g.fillStyle = '#26292d'; g.fillRect(0, 0, s, s);
      noise(g, s, 60, 'rgba(10,12,14,.7)', 'rgba(60,64,70,.5)');
    });

    TEX.red = px(16, function (g, s) {
      g.fillStyle = '#b03a2e'; g.fillRect(0, 0, s, s);
      noise(g, s, 60, 'rgba(130,40,32,.6)', 'rgba(210,90,70,.5)');
      g.fillStyle = 'rgba(60,16,12,.5)';
      g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1);
    });

    TEX.green = px(16, function (g, s) {
      g.fillStyle = '#2f6a4a'; g.fillRect(0, 0, s, s);
      noise(g, s, 60, 'rgba(24,70,46,.6)', 'rgba(70,130,95,.5)');
      g.fillStyle = 'rgba(14,40,26,.5)';
      g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1);
      g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
    });

    TEX.screen = px(16, function (g, s) {
      g.fillStyle = '#123a2a'; g.fillRect(0, 0, s, s);
      g.fillStyle = '#43e07a';
      g.fillRect(2, 3, 12, 1); g.fillRect(2, 6, 8, 1); g.fillRect(2, 9, 10, 1);
      g.fillStyle = '#ff9c33';
      g.fillRect(2, 12, 5, 2);
    });
  }

  /* ---------- 幾何輔助 ---------- */
  function B(x, z, w, d, h, kind, y0) {
    return { x: x, z: z, w: w, d: d, h: h, kind: kind || 'white', y0: y0 || 0 };
  }

  /* 向下樓梯：從 y0 頂部往下，steps 級 */
  function stairDown(out, x, z, dx, dz, width, steps, stepH, stepD, y0) {
    for (var i = 0; i < steps; i++) {
      var top = y0 - stepH * (i + 1);
      var h = top - (-8);
      out.push(B(
        x + dx * stepD * i, z + dz * stepD * i,
        dx ? stepD + 0.02 : width, dz ? stepD + 0.02 : width,
        Math.max(0.2, h), 'stone', -8
      ));
    }
  }

  /* ---------- 地圖方塊定義 ---------- */
  var BOXES = [];
  var EQUIP = [];
  var BLINKERS = [];

  /* 地圖註冊表：內容在 js/maps/<id>.js，這裡只做載入與校驗 */
  var MAP_DEF = window.CS_MAP_DEFS && window.CS_MAP_DEFS.rbmk;
  if (!MAP_DEF) throw new Error('缺少地圖定義：請在 index.html 先引入 js/maps/rbmk.js');
  var MAP = MAP_DEF.MAP;

  function buildLayout() {
    BOXES.length = 0;
    EQUIP.length = 0;
    BLINKERS.length = 0;
    MAP_DEF.buildLayout({
      B: B,
      boxes: BOXES,
      stairDown: stairDown,
      box: function (b) { BOXES.push(b); },
      equip: function (e) { EQUIP.push(e); },
      blink: function (b) { BLINKERS.push(b); },
      MAP: MAP
    });
  }


  buildLayout();

  MAP.boxes = BOXES;
  MAP.equip = EQUIP;

  window.CS_MAP = MAP;

  /* ---------- 碰撞工具 ---------- */
  function blockToCollider(b) {
    return {
      minX: b.x - b.w / 2, maxX: b.x + b.w / 2,
      minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2,
      minY: b.y0, maxY: b.y0 + b.h,
      tall: b.h > 1.6
    };
  }

  function segHitsBox(ax, az, bx, bz, minX, maxX, minZ, maxZ) {
    var dx = bx - ax, dz = bz - az;
    var tmin = 0, tmax = 1;
    if (Math.abs(dx) < 1e-9) {
      if (ax < minX || ax > maxX) return false;
    } else {
      var t1 = (minX - ax) / dx, t2 = (maxX - ax) / dx;
      if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
    if (Math.abs(dz) < 1e-9) {
      if (az < minZ || az > maxZ) return false;
    } else {
      var s1 = (minZ - az) / dz, s2 = (maxZ - az) / dz;
      if (s1 > s2) { var ss = s1; s1 = s2; s2 = ss; }
      tmin = Math.max(tmin, s1); tmax = Math.min(tmax, s2);
      if (tmin > tmax) return false;
    }
    return true;
  }

  /* ---------- 碰撞體空間分割（P0：LOS 不再逐個掃描 206 個碰撞體） ---------- */
  var GRID_CELL = 8;
  function buildColliderGrid(colliders) {
    var cells = {};
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      var x0 = Math.floor(c.minX / GRID_CELL), x1 = Math.floor(c.maxX / GRID_CELL);
      var z0 = Math.floor(c.minZ / GRID_CELL), z1 = Math.floor(c.maxZ / GRID_CELL);
      for (var gx = x0; gx <= x1; gx++) {
        for (var gz = z0; gz <= z1; gz++) {
          var k = gx + ',' + gz;
          if (!cells[k]) cells[k] = [];
          cells[k].push(i);
        }
      }
    }
    return { cell: GRID_CELL, cells: cells, stamp: new Int32Array(colliders.length), tick: 0 };
  }

  function ensureGrid(colliders) {
    if (!colliders.__grid) colliders.__grid = buildColliderGrid(colliders);
    return colliders.__grid;
  }

  /* 回傳線段外包範圍覆蓋到的格子內的碰撞體（去重），逐個交給 cb；cb 回傳 true 可提前結束 */
  function forEachNearLine(colliders, ax, az, bx, bz, cb) {
    var grid = colliders.__grid;
    if (!grid) {
      for (var n = 0; n < colliders.length; n++) if (cb(colliders[n])) return true;
      return false;
    }
    var minX = Math.min(ax, bx) - 1, maxX = Math.max(ax, bx) + 1;
    var minZ = Math.min(az, bz) - 1, maxZ = Math.max(az, bz) + 1;
    var x0 = Math.floor(minX / grid.cell), x1 = Math.floor(maxX / grid.cell);
    var z0 = Math.floor(minZ / grid.cell), z1 = Math.floor(maxZ / grid.cell);
    /* 跨太多格時退回全量掃描，避免格子查詢本身變慢 */
    if ((x1 - x0 + 1) * (z1 - z0 + 1) > 36) {
      for (var n2 = 0; n2 < colliders.length; n2++) if (cb(colliders[n2])) return true;
      return false;
    }
    grid.tick++;
    for (var gx = x0; gx <= x1; gx++) {
      for (var gz = z0; gz <= z1; gz++) {
        var list = grid.cells[gx + ',' + gz];
        if (!list) continue;
        for (var i = 0; i < list.length; i++) {
          var idx = list[i];
          if (grid.stamp[idx] === grid.tick) continue;
          grid.stamp[idx] = grid.tick;
          if (cb(colliders[idx])) return true;
        }
      }
    }
    return false;
  }

  function blocked(ax, az, bx, bz, colliders, minHeight) {
    var mh = minHeight == null ? 1.5 : minHeight;
    ensureGrid(colliders);
    return forEachNearLine(colliders, ax, az, bx, bz, function (c) {
      if (c.maxY < mh) return false;
      /* 只看人體高度附近的障礙：屋頂、起重機平台、高處玻璃不應切斷尋路與視線 */
      if (c.minY > 1.8) return false;
      return segHitsBox(ax, az, bx, bz, c.minX + 0.05, c.maxX - 0.05, c.minZ + 0.05, c.maxZ - 0.05);
    });
  }

  function buildGraph(waypoints, colliders, maxD) {
    var n = waypoints.length;
    var adj = [];
    for (var i = 0; i < n; i++) adj.push([]);
    var MAXD = maxD || 26;
    for (var a = 0; a < n; a++) {
      for (var b = a + 1; b < n; b++) {
        var p = waypoints[a], q = waypoints[b];
        var d = Math.hypot(p.x - q.x, p.z - q.z);
        if (d > MAXD) continue;
        if (blocked(p.x, p.z, q.x, q.z, colliders, 1.4)) continue;
        adj[a].push({ to: b, cost: d });
        adj[b].push({ to: a, cost: d });
      }
    }
    return adj;
  }

  function findPath(graph, wp, fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    var n = wp.length;
    var open = [{ idx: fromIdx, f: 0 }];
    var g = new Array(n).fill(Infinity);
    var came = new Array(n).fill(-1);
    var closed = new Array(n).fill(false);
    g[fromIdx] = 0;
    var guard = 0;
    while (open.length && guard++ < 500) {
      var bi = 0;
      for (var i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      var cur = open.splice(bi, 1)[0];
      if (cur.idx === toIdx) break;
      if (closed[cur.idx]) continue;
      closed[cur.idx] = true;
      var nb = graph[cur.idx];
      for (var k = 0; k < nb.length; k++) {
        var e = nb[k];
        if (closed[e.to]) continue;
        var ng = g[cur.idx] + e.cost;
        if (ng < g[e.to]) {
          g[e.to] = ng;
          came[e.to] = cur.idx;
          var h = Math.hypot(wp[e.to].x - wp[toIdx].x, wp[e.to].z - wp[toIdx].z);
          open.push({ idx: e.to, f: ng + h });
        }
      }
    }
    if (came[toIdx] === -1) return null;
    var path = [toIdx];
    var p = toIdx;
    while (came[p] !== -1) { p = came[p]; path.push(p); }
    path.reverse();
    return path;
  }

  function nearestWaypoint(wp, x, z) {
    var best = -1, bd = Infinity;
    for (var i = 0; i < wp.length; i++) {
      var d = (wp[i].x - x) * (wp[i].x - x) + (wp[i].z - z) * (wp[i].z - z);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  window.CS_MAP_UTIL = {
    blocked: blocked,
    forEachNearLine: forEachNearLine,
    ensureGrid: ensureGrid,
    segHitsBox: segHitsBox,
    buildGraph: buildGraph,
    findPath: findPath,
    nearestWaypoint: nearestWaypoint
  };

  /* ---------- 場景構建 ---------- */
  function matFor(kind) {
    var M = window.__CS_MATS;
    switch (kind) {
      case 'stone': return M.stone;
      case 'white': return M.white;
      case 'concrete': return M.concrete;
      case 'crate': return M.crate;
      case 'hazard': return M.hazard;
      case 'metal': return M.metal;
      case 'black': return M.black;
      case 'red': return M.red;
      case 'green': return M.green;
      default: return M.white;
    }
  }

  function boxTexFor(kind) {
    var T = TEX;
    switch (kind) {
      case 'stone': return T.stone;
      case 'concrete': return T.concrete;
      case 'crate': return T.crate;
      case 'hazard': return T.hazard;
      case 'metal': return T.metal;
      case 'black': return T.black;
      case 'red': return T.red;
      case 'green': return T.green;
      default: return T.white;
    }
  }

  /* 合併同材質方塊為單一幾何體（大幅降低 draw call） */
  function mergeBoxList(list, material) {
    var positions = [], normals = [], uvs = [], indices = [];
    var vOffset = 0;
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var g = new THREE.BoxGeometry(b.w, b.h, b.d);
      g.translate(b.x, b.y0 + b.h / 2, b.z);
      var p = g.attributes.position.array;
      var n = g.attributes.normal.array;
      var u = g.attributes.uv.array;
      for (var a = 0; a < p.length; a++) positions.push(p[a]);
      for (var c = 0; c < n.length; c++) normals.push(n[c]);
      for (var d = 0; d < u.length; d++) uvs.push(u[d]);
      var ix = g.index.array;
      for (var e = 0; e < ix.length; e++) indices.push(ix[e] + vOffset);
      vOffset += g.attributes.position.count;
      g.dispose();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return new THREE.Mesh(geo, material);
  }

  /* ---------- P0：靜態設備批處理（同材質合併成單一 Mesh，大幅降 draw call） ---------- */
  var STATIC_BATCH = {};
  function batchGeo(geo, mat, x, y, z, rx, ry, rz) {
    var k = mat.uuid;
    if (!STATIC_BATCH[k]) STATIC_BATCH[k] = { mat: mat, items: [] };
    STATIC_BATCH[k].items.push({ geo: geo, x: x, y: y, z: z, rx: rx || 0, ry: ry || 0, rz: rz || 0 });
  }
  function mergeTransformed(items, material) {
    var positions = [], normals = [], uvs = [], indices = [];
    var vOffset = 0;
    var mtx = new THREE.Matrix4(), eul = new THREE.Euler();
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var g = it.geo.clone();
      eul.set(it.rx, it.ry, it.rz);
      mtx.makeRotationFromEuler(eul);
      mtx.setPosition(it.x, it.y, it.z);
      g.applyMatrix4(mtx);
      var p = g.attributes.position.array;
      var n = g.attributes.normal.array;
      var u = g.attributes.uv ? g.attributes.uv.array : null;
      for (var a = 0; a < p.length; a++) positions.push(p[a]);
      for (var c = 0; c < n.length; c++) normals.push(n[c]);
      var vcount = g.attributes.position.count;
      if (u) { for (var d = 0; d < u.length; d++) uvs.push(u[d]); }
      else { for (var v = 0; v < vcount; v++) { uvs.push(0, 0); } }
      if (g.index) {
        var ix = g.index.array;
        for (var e = 0; e < ix.length; e++) indices.push(ix[e] + vOffset);
      } else {
        for (var q = 0; q < vcount; q++) indices.push(q + vOffset);
      }
      vOffset += vcount;
      g.dispose();
    }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    out.setIndex(indices);
    return new THREE.Mesh(out, material);
  }
  function flushStaticBatch(group, meshes) {
    var count = 0, merged = 0;
    for (var k in STATIC_BATCH) {
      var b = STATIC_BATCH[k];
      if (!b.items.length) continue;
      count += b.items.length;
      var m = mergeTransformed(b.items, b.mat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      meshes.push(m);
      merged++;
    }
    STATIC_BATCH = {};
    return { source: count, merged: merged };
  }

  /* ---------- V3：世界內廣告燈箱（靜態、不影響操作視線） ---------- */
  function makeAdTexture(brand, slogan, bg, accent, id, tier) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 512, 256);
    grd.addColorStop(0, bg);
    grd.addColorStop(1, '#05070a');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
    var frame = tier === 'gold' ? '#f7c94a' : accent;
    /* 品牌色斜帶 */
    g.save();
    g.translate(400, 0);
    g.rotate(0.35);
    g.fillStyle = accent;
    g.globalAlpha = 0.16;
    g.fillRect(-60, -120, 150, 500);
    g.restore();
    /* 邊框：黃金位用金色加粗 */
    g.strokeStyle = frame;
    g.globalAlpha = tier === 'gold' ? 1 : 0.75;
    g.lineWidth = tier === 'gold' ? 7 : 5;
    g.strokeRect(10, 10, 492, 236);
    /* 編號（招商時可直接指名位置） */
    g.globalAlpha = 0.7;
    g.fillStyle = frame;
    g.font = '700 19px system-ui,sans-serif';
    g.fillText(id, 30, 44);
    if (tier === 'gold') {
      g.globalAlpha = 1;
      g.fillStyle = '#f7c94a';
      g.fillRect(414, 22, 74, 26);
      g.fillStyle = '#1a1305';
      g.font = '900 17px system-ui,sans-serif';
      g.fillText('GOLD', 425, 42);
    }
    g.globalAlpha = 1;
    g.fillStyle = accent;
    g.font = '900 70px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText(brand, 34, 130);
    g.fillStyle = '#e8f2ff';
    g.font = '500 30px "Microsoft JhengHei",system-ui,sans-serif';
    g.globalAlpha = 0.82;
    g.fillText(slogan, 36, 180);
    g.globalAlpha = 0.4;
    g.font = '700 18px system-ui,sans-serif';
    g.fillText('RBMK-1000 · OFFICIAL PARTNER', 36, 224);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 香港霓虹燈牌（中性裝飾）；客戶品牌由 makeWallAdTexture 替換 */
  function makeRentTexture(id, tier, accent, line) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 512, 256);
    grd.addColorStop(0, '#0b0f16');
    grd.addColorStop(1, '#141a22');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
    /* 霓虹雙線框 */
    g.shadowColor = accent;
    g.shadowBlur = 16;
    g.strokeStyle = accent;
    g.lineWidth = 4;
    g.strokeRect(14, 14, 484, 228);
    g.shadowBlur = 6;
    g.globalAlpha = 0.55;
    g.lineWidth = 1.5;
    g.strokeRect(22, 22, 468, 212);
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    /* 編號 */
    g.fillStyle = accent;
    g.globalAlpha = 0.9;
    g.font = '700 18px system-ui,sans-serif';
    g.fillText(id, 30, 46);
    if (tier === 'gold') {
      g.fillStyle = '#f7c94a';
      g.fillRect(414, 24, 74, 26);
      g.fillStyle = '#1a1305';
      g.font = '900 17px system-ui,sans-serif';
      g.fillText('GOLD', 425, 44);
    }
    /* 主標語：霓虹大字 */
    g.globalAlpha = 1;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = accent;
    g.shadowBlur = 24;
    g.fillStyle = '#ffffff';
    g.font = '900 62px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText(line, 256, 122);
    g.shadowBlur = 0;
    /* 小字 */
    g.fillStyle = '#cfd6de';
    g.globalAlpha = 0.75;
    g.font = '500 18px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText('HONG KONG NEON · 港式招牌', 256, 174);
    g.globalAlpha = 0.45;
    g.fillStyle = accent;
    g.font = '700 13px system-ui,sans-serif';
    g.fillText('HONG KONG NEON · RBMK-1000', 256, 212);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 空置霓虹廣告牌：深色玻璃面 + 霓虹邊框 + 抽象光環，不寫店名 */
  function makeEmptyBillboardTexture(id, accent) {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 1024, 512);
    grd.addColorStop(0, '#090c11');
    grd.addColorStop(0.55, '#0f141b');
    grd.addColorStop(1, '#151b23');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);
    /* 玻璃反光斜帶 */
    var gl = g.createLinearGradient(0, 0, 1024, 512);
    gl.addColorStop(0, 'rgba(255,255,255,0.05)');
    gl.addColorStop(0.3, 'rgba(255,255,255,0.012)');
    gl.addColorStop(0.55, 'rgba(255,255,255,0.045)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl;
    g.fillRect(0, 0, 1024, 512);
    /* 極淡掃描線 */
    g.globalAlpha = 0.045;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    for (var y = 0; y < 512; y += 8) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke();
    }
    g.globalAlpha = 1;
    /* 霓虹雙線框 */
    g.shadowColor = accent;
    g.shadowBlur = 22;
    g.strokeStyle = accent;
    g.lineWidth = 6;
    g.beginPath();
    g.roundRect(24, 24, 976, 464, 18);
    g.stroke();
    g.shadowBlur = 6;
    g.globalAlpha = 0.5;
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(40, 40, 944, 432, 14);
    g.stroke();
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    /* 中央：只寫「廣告」兩個字 */
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = accent;
    g.shadowBlur = 40;
    g.fillStyle = '#ffffff';
    g.font = '900 190px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText('廣告', 512, 262);
    g.shadowBlur = 0;
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 品牌 LOGO 整牆牌：方塊番薯頭像 + CANNIKIN GAMING */
  function makeBrandLogoTexture(accent) {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 1024, 512);
    grd.addColorStop(0, '#071018');
    grd.addColorStop(1, '#101a24');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);
    /* 斜向霓虹光帶 */
    g.save();
    g.translate(800, 0);
    g.rotate(0.28);
    g.fillStyle = accent;
    g.globalAlpha = 0.08;
    g.fillRect(-90, -200, 220, 900);
    g.restore();
    /* 霓虹雙線框 */
    g.shadowColor = accent;
    g.shadowBlur = 26;
    g.strokeStyle = accent;
    g.lineWidth = 8;
    g.strokeRect(26, 26, 972, 460);
    g.shadowBlur = 8;
    g.globalAlpha = 0.55;
    g.lineWidth = 3;
    g.strokeRect(44, 44, 936, 424);
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    /* 方塊番薯頭像 */
    var bx = 120, by = 150, s = 200;
    g.fillStyle = '#121820';
    g.fillRect(bx - 12, by - 12, s + 24, s + 24);
    g.fillStyle = '#d98a3a';
    g.fillRect(bx, by, s, s);
    /* 安全帽 */
    g.fillStyle = '#2a6fe0';
    g.fillRect(bx, by - 36, s, 36);
    g.fillStyle = '#f7c94a';
    g.fillRect(bx, by - 10, s, 10);
    /* 眼睛與嘴 */
    g.fillStyle = '#1a1208';
    g.fillRect(bx + 48, by + 66, 34, 34);
    g.fillRect(bx + 118, by + 66, 34, 34);
    g.fillRect(bx + 58, by + 140, 84, 16);
    /* 腮紅 */
    g.fillStyle = 'rgba(255,120,120,.4)';
    g.fillRect(bx + 18, by + 110, 32, 18);
    g.fillRect(bx + 150, by + 110, 32, 18);
    /* 文字 */
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.shadowColor = accent;
    g.shadowBlur = 18;
    g.font = '900 74px system-ui,sans-serif';
    g.fillText('CANNIKIN', 380, 140);
    g.fillText('GAMING', 380, 222);
    g.shadowBlur = 0;
    g.fillStyle = '#f7c94a';
    g.font = '900 66px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText('大番薯', 382, 318);
    g.fillStyle = '#d7dee6';
    g.globalAlpha = 0.75;
    g.font = '600 34px system-ui,sans-serif';
    g.fillText('aBcDIQ180', 384, 378);
    g.globalAlpha = 0.85;
    g.fillStyle = accent;
    g.font = '600 26px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText('不定時更新 · 自製小遊戲', 384, 428);
    g.globalAlpha = 1;
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 五角星（裝飾用） */
  function drawStar(g, cx, cy, r, color) {
    g.save();
    g.shadowColor = color;
    g.shadowBlur = 14;
    g.fillStyle = color;
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var rr = i % 2 === 0 ? r : r * 0.45;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var x = cx + Math.cos(a) * rr;
      var y = cy + Math.sin(a) * rr;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
    g.restore();
  }

  /* 整牆大廣告：只保留兩面外牆，留給客戶整牆投放 */
  function makeWallAdTexture(id, line, accent, brand, slogan, clean, extra, extraColor, theme) {
    theme = theme || {};
    if (theme.border) accent = theme.border;
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 1024, 512);
    grd.addColorStop(0, '#090d13');
    grd.addColorStop(1, '#161c25');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);
    /* 細網格底紋：避免大面積死黑 */
    g.globalAlpha = 0.035;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    for (var gx = 0; gx <= 1024; gx += 32) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, 512); g.stroke(); }
    for (var gy = 0; gy <= 512; gy += 32) { g.beginPath(); g.moveTo(0, gy); g.lineTo(1024, gy); g.stroke(); }
    g.globalAlpha = 1;
    /* 斜向霓虹光帶 */
    g.save();
    g.translate(760, 0);
    g.rotate(0.28);
    g.fillStyle = accent;
    g.globalAlpha = 0.09;
    g.fillRect(-90, -200, 220, 900);
    g.restore();
    /* 霓虹雙線框 */
    g.shadowColor = accent;
    g.shadowBlur = 26;
    g.strokeStyle = accent;
    g.lineWidth = 8;
    g.strokeRect(26, 26, 972, 460);
    g.shadowBlur = 8;
    g.globalAlpha = 0.55;
    g.lineWidth = 3;
    g.strokeRect(44, 44, 936, 424);
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    /* 編號與 GOLD（乾淨模式只保留標語） */
    if (!clean) {
      g.fillStyle = accent;
      g.font = '700 30px system-ui,sans-serif';
      g.fillText(id, 62, 90);
      g.fillStyle = '#f7c94a';
      g.fillRect(820, 62, 130, 42);
      g.fillStyle = '#1a1305';
      g.font = '900 26px system-ui,sans-serif';
      g.fillText('GOLD', 846, 92);
    }
    /* 主標語 */
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = accent;
    g.shadowBlur = 40;
    g.fillStyle = '#ffffff';
    var bfont = clean ? 140 : 150;
    g.font = '900 ' + bfont + 'px "Microsoft JhengHei",system-ui,sans-serif';
    /* 長名稱自動縮小，避免超出畫框 */
    var tw = g.measureText(brand || line).width;
    if (tw > 860) {
      bfont = Math.max(60, Math.floor(bfont * 860 / tw));
      g.font = '900 ' + bfont + 'px "Microsoft JhengHei",system-ui,sans-serif';
    }
    g.fillText(brand || line, 512, clean && slogan ? 300 : (clean ? 256 : 246));
    g.shadowBlur = 0;
    /* 乾淨模式：主標語下方畫副標（免責聲明用） */
    if (clean && slogan) {
      var parts = (extra || '').split('|');
      /* 頂部互動標語（黃色大字） */
      if (parts[0]) {
        g.shadowColor = '#ff9c3a';
        g.shadowBlur = 18;
        g.fillStyle = '#ffe066';
        g.font = '900 56px "Microsoft JhengHei",system-ui,sans-serif';
        var ew0 = g.measureText(parts[0]).width;
        if (ew0 > 860) {
          g.font = '900 ' + Math.max(30, Math.floor(56 * 860 / ew0)) + 'px "Microsoft JhengHei",system-ui,sans-serif';
        }
        g.fillText(parts[0], 512, 128);
      }
      /* 副標（白色） */
      if (parts[1]) {
        g.shadowColor = accent;
        g.shadowBlur = 10;
        g.fillStyle = '#ffffff';
        g.font = '700 34px "Microsoft JhengHei",system-ui,sans-serif';
        g.fillText(parts[1], 512, 186);
      }
      g.shadowBlur = 0;
      /* 分隔線 */
      g.globalAlpha = 0.55;
      g.strokeStyle = accent;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(200, 216);
      g.lineTo(824, 216);
      g.stroke();
      g.globalAlpha = 1;
      /* 主標下方裝飾橫條 */
      g.shadowColor = accent;
      g.shadowBlur = 18;
      g.fillStyle = accent;
      g.fillRect(342, 382, 340, 5);
      g.shadowBlur = 0;
      /* 底部趣味行（白色） */
      g.shadowColor = accent;
      g.shadowBlur = 12;
      g.fillStyle = '#ffffff';
      g.font = '900 32px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('按讚有助於反應堆穩定', 512, 442);
      g.shadowBlur = 0;
    }
    if (!clean) {
      /* 副標：放大、亮黃色、描邊，遠處也看得清 */
      if (brand && slogan) {
        g.shadowColor = accent;
        g.shadowBlur = 18;
        g.fillStyle = '#ffe066';
        g.globalAlpha = 1;
        g.font = '900 48px "Microsoft JhengHei",system-ui,sans-serif';
        g.fillText(slogan, 512, 352);
        g.shadowBlur = 0;
      }
      g.globalAlpha = 0.6;
      g.fillStyle = accent;
      g.font = '700 24px system-ui,sans-serif';
      g.fillText('HONG KONG NEON · RBMK-1000', 512, 434);
    }
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 兩面整牆廣告位：A 點南牆外側、朝南（玩家從南廳進大廳正面必看） */
  var AD_SLOTS = [
    { id: 'WALL-01', tier: 'gold', x: -9.5, y: 4.6, z: 8.56, ry: 0, w: 8.5, h: 5.5, accent: '#28e0d0', logo: true },
    { id: 'WALL-02', tier: 'gold', x: 9.5, y: 4.6, z: 8.56, ry: 0, w: 8.5, h: 5.5, accent: '#ff4fa3', brand: '自娛自樂', slogan: '就圖個樂，沒別的意思', extra: '點讚 · 分享 · 關注|有你們的支持，才能做得更久', extraColor: '#ffe066', clean: true }
  ];
  window.CS_AD_SLOTS = AD_SLOTS;

  /* 品牌廣告牌（用自媒體頭像圖片合成）：圓形頭像 + 名稱 + 帳號 */
  function makeLogoAdTextureWithImage(hex) {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 683;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 1024, 683);
    grd.addColorStop(0, '#0a0d12');
    grd.addColorStop(1, '#151b24');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 683);
    g.shadowColor = hex;
    g.shadowBlur = 24;
    g.strokeStyle = hex;
    g.lineWidth = 8;
    g.strokeRect(24, 24, 976, 635);
    g.shadowBlur = 0;
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var img = new Image();
    img.onload = function () {
      g.save();
      g.beginPath();
      g.arc(250, 350, 170, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, 80, 180, 340, 340);
      g.restore();
      g.strokeStyle = '#ff2a2a';
      g.lineWidth = 7;
      g.beginPath();
      g.arc(250, 350, 173, 0, Math.PI * 2);
      g.stroke();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#ffffff';
      g.shadowColor = hex;
      g.shadowBlur = 18;
      g.font = '900 78px system-ui,sans-serif';
      g.fillText('CANNIKIN', 460, 260);
      g.fillText('GAMING', 460, 355);
      g.shadowBlur = 0;
      g.fillStyle = '#f7c94a';
      g.font = '800 44px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('大番薯 · aBcDIQ180', 462, 455);
      g.fillStyle = hex;
      g.globalAlpha = 0.85;
      g.font = '600 28px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('不定時更新 · 自製小遊戲', 462, 520);
      g.globalAlpha = 1;
      tex.needsUpdate = true;
    };
    img.src = 'assets/cannikin_logo.jpg';
    return tex;
  }

  /* 二樓起重機平台地板 LOGO：開場俯衝看得見 */
  function buildPlatformLogo(group, meshes) {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 220;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 1024, 220);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = '#28e0d0';
    g.shadowBlur = 20;
    g.fillStyle = '#f7c94a';
    g.font = '900 96px system-ui,sans-serif';
    g.fillText('CANNIKIN GAMING', 512, 86);
    g.shadowBlur = 0;
    g.fillStyle = '#e8f7f5';
    g.font = '800 58px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText('大番薯 · aBcDIQ180', 512, 172);
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 2.2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(-7, 6.53, -16);
    group.add(m);
    meshes.push(m);
  }

  /* 屋頂地面大 LOGO：空中俯視可見 CANNIKIN GAMING / 大番薯 / aBcDIQ180 */
  function buildRoofLogo(group, meshes) {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 360;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 1024, 360);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = '#28e0d0';
    g.shadowBlur = 26;
    g.fillStyle = '#f7c94a';
    g.font = '900 140px system-ui,sans-serif';
    g.fillText('CANNIKIN', 512, 104);
    g.fillText('GAMING', 512, 226);
    g.shadowBlur = 0;
    g.fillStyle = '#e8f7f5';
    g.font = '800 56px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText('大番薯 · aBcDIQ180', 512, 328);
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 9.2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 10.62, -15);
    group.add(m);
    meshes.push(m);
  }

  /* 巨幅品牌牆紋理：2048 寬，頭像 + 巨型字 + 帳號 */
  function makeGiantBrandTexture() {
    var cv = document.createElement('canvas');
    cv.width = 2048; cv.height = 512;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 2048, 512);
    grd.addColorStop(0, '#0a1018');
    grd.addColorStop(0.6, '#101c26');
    grd.addColorStop(1, '#0a1018');
    g.fillStyle = grd;
    g.fillRect(0, 0, 2048, 512);
    g.shadowColor = '#28e0d0';
    g.shadowBlur = 30;
    g.strokeStyle = '#28e0d0';
    g.lineWidth = 10;
    g.strokeRect(20, 20, 2008, 472);
    g.shadowBlur = 0;
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var img = new Image();
    img.onload = function () {
      /* 左側頭像 */
      g.save();
      g.beginPath();
      g.arc(230, 256, 180, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, 50, 76, 360, 360);
      g.restore();
      g.strokeStyle = '#ff2a2a';
      g.lineWidth = 8;
      g.beginPath();
      g.arc(230, 256, 183, 0, Math.PI * 2);
      g.stroke();
      /* 巨字 */
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#ffffff';
      g.shadowColor = '#28e0d0';
      g.shadowBlur = 24;
      g.font = '900 170px system-ui,sans-serif';
      g.fillText('CANNIKIN', 470, 170);
      g.fillText('GAMING', 470, 350);
      g.shadowBlur = 0;
      /* 帳號與副標 */
      g.textAlign = 'right';
      g.fillStyle = '#ffe066';
      g.shadowColor = '#ffb020';
      g.shadowBlur = 14;
      g.font = '900 72px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('大番薯', 1990, 180);
      g.shadowBlur = 0;
      g.fillStyle = '#7dfcff';
      g.font = '800 60px system-ui,sans-serif';
      g.fillText('aBcDIQ180', 1990, 280);
      g.fillStyle = '#9dffb0';
      g.font = '700 40px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('不定時更新 · 自製小遊戲', 1990, 380);
      tex.needsUpdate = true;
    };
    img.src = 'assets/cannikin_logo.jpg';
    return tex;
  }

  /* 牆面字母標記（A 北 / B 東 / C 南 / D 西），方便指定廣告位置 */
  function makeWallLetterTexture(letter) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(10,14,18,.82)';
    g.fillRect(20, 20, 216, 216);
    g.strokeStyle = '#ffd166';
    g.lineWidth = 8;
    g.strokeRect(20, 20, 216, 216);
    g.fillStyle = '#ffd166';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 150px system-ui,sans-serif';
    g.shadowColor = '#ffb020';
    g.shadowBlur = 20;
    g.fillText(letter, 128, 136);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function buildWallLetters(group) {
    var marks = [
      { letter: 'A', x: 0, y: 5.2, z: -22.55, ry: Math.PI },      // 北牆中央
      { letter: 'B', x: 36.55, y: 5.2, z: 0, ry: Math.PI / 2 },   // 東牆中央
      { letter: 'C', x: 0, y: 8.4, z: 24.55, ry: 0 },             // 南牆入口正上方
      { letter: 'D', x: -36.55, y: 5.2, z: 4, ry: -Math.PI / 2 }  // 西牆中央（廣告同位，放廣告會蓋住）
    ];
    for (var i = 0; i < marks.length; i++) {
      var mk = marks[i];
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 2.2),
        new THREE.MeshBasicMaterial({ map: makeWallLetterTexture(mk.letter), transparent: true })
      );
      m.position.set(mk.x, mk.y, mk.z);
      m.rotation.y = mk.ry;
      group.add(m);
    }
  }

  /* D 牆專用比例（11:6.4 ≈ 1.72:1）的直式品牌牌紋理，避免拉伸變形 */
  function makeDWallBrandTexture() {
    var cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 700;
    var g = cv.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 1200, 700);
    grd.addColorStop(0, '#0a1018');
    grd.addColorStop(0.6, '#101c26');
    grd.addColorStop(1, '#0a1018');
    g.fillStyle = grd;
    g.fillRect(0, 0, 1200, 700);
    g.shadowColor = '#28e0d0';
    g.shadowBlur = 26;
    g.strokeStyle = '#28e0d0';
    g.lineWidth = 10;
    g.strokeRect(18, 18, 1164, 664);
    g.shadowBlur = 0;
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var img = new Image();
    img.onload = function () {
      /* 左側頭像 */
      g.save();
      g.beginPath();
      g.arc(240, 350, 165, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, 75, 185, 330, 330);
      g.restore();
      g.strokeStyle = '#ff2a2a';
      g.lineWidth = 8;
      g.beginPath();
      g.arc(240, 350, 168, 0, Math.PI * 2);
      g.stroke();
      /* 右側文字 */
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = '#ffffff';
      g.shadowColor = '#28e0d0';
      g.shadowBlur = 22;
      g.font = '900 120px system-ui,sans-serif';
      g.fillText('CANNIKIN', 460, 210);
      g.fillText('GAMING', 460, 350);
      g.shadowBlur = 0;
      g.fillStyle = '#ffe066';
      g.shadowColor = '#ffb020';
      g.shadowBlur = 12;
      g.font = '900 66px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('大番薯', 462, 478);
      g.shadowBlur = 0;
      g.fillStyle = '#7dfcff';
      g.font = '800 52px system-ui,sans-serif';
      g.fillText('aBcDIQ180', 462, 556);
      g.fillStyle = '#9dffb0';
      g.font = '700 34px "Microsoft JhengHei",system-ui,sans-serif';
      g.fillText('不定時更新 · 自製小遊戲', 462, 626);
      tex.needsUpdate = true;
    };
    img.src = 'assets/cannikin_logo.jpg';
    return tex;
  }

  /* 四面外牆品牌牌：避開門洞分段貼滿，門口保持乾淨 */
  function buildWallBrands(group, meshes) {
    var segs = [
      /* D 牆（西牆）正中：放在兩個門洞之間的實牆段，完整貼牆 */
      { x: -36.62, z: 4, ry: -Math.PI / 2, w: 11, h: 6.4 }
    ];
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(s.w, s.h),
        new THREE.MeshBasicMaterial({ map: makeDWallBrandTexture(), transparent: true })
      );
      m.position.set(s.x, 4.9, s.z);
      m.rotation.y = s.ry;
      group.add(m);
      meshes.push(m);
    }
  }

  function buildAds(group, meshes) {
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x171b20, metalness: 0.75, roughness: 0.35 });
    for (var i = 0; i < AD_SLOTS.length; i++) {
      var a = AD_SLOTS[i];
      var hex = a.accent || '#28e0d0';
      var nx = Math.sin(a.ry), nz = Math.cos(a.ry);
      var tex = a.logo
        ? makeLogoAdTextureWithImage(hex)
        : (a.brand ? makeWallAdTexture(a.id, a.line || '', hex, a.brand, a.slogan, a.clean, a.extra, a.extraColor, a.theme) : makeEmptyBillboardTexture(a.id, hex));
      var mat = new THREE.MeshBasicMaterial({ map: tex });
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), mat);
      plane.position.set(a.x + nx * 0.04, a.y, a.z + nz * 0.04);
      plane.rotation.y = a.ry;
      group.add(plane);
      meshes.push(plane);
      /* 外框：上下左右四條金屬邊 */
      var fw = 0.24;
      batchGeo(new THREE.BoxGeometry(a.w + fw * 2, fw, 0.2), frameMat,
        a.x, a.y + a.h / 2 + fw / 2, a.z + nz * 0.02, 0, a.ry, 0);
      batchGeo(new THREE.BoxGeometry(a.w + fw * 2, fw, 0.2), frameMat,
        a.x, a.y - a.h / 2 - fw / 2, a.z + nz * 0.02, 0, a.ry, 0);
      var lx = Math.cos(a.ry), lz = -Math.sin(a.ry);
      var side = a.w / 2 + fw / 2;
      batchGeo(new THREE.BoxGeometry(fw, a.h + fw * 2, 0.2), frameMat,
        a.x + lx * side, a.y, a.z + lz * side + nz * 0.02, 0, a.ry, 0);
      batchGeo(new THREE.BoxGeometry(fw, a.h + fw * 2, 0.2), frameMat,
        a.x - lx * side, a.y, a.z - lz * side + nz * 0.02, 0, a.ry, 0);
      /* 頂部燈罩與底部基座 */
      batchGeo(new THREE.BoxGeometry(a.w + 0.7, 0.18, 0.6), frameMat,
        a.x + nx * 0.16, a.y + a.h / 2 + 0.32, a.z + nz * 0.16, 0, a.ry, 0);
      batchGeo(new THREE.BoxGeometry(a.w + 0.5, 0.26, 0.5), frameMat,
        a.x + nx * 0.12, a.y - a.h / 2 - 0.4, a.z + nz * 0.12, 0, a.ry, 0);
    }
    flushStaticBatch(group, meshes);
  }

  /* ---------- B 類幽默標語：發光霓虹字，全部貼在牆上 ---------- */
  function makeGraffitiTexture(text, color) {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 256;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 1024, 256);
    var size = 128;
    g.font = '900 ' + size + 'px "Microsoft JhengHei",system-ui,sans-serif';
    var w = g.measureText(text).width;
    if (w > 980) {
      size = Math.floor(size * 980 / w);
      g.font = '900 ' + size + 'px "Microsoft JhengHei",system-ui,sans-serif';
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    /* 霓虹外發光：一層 */
    g.shadowColor = color;
    g.shadowBlur = 30;
    g.fillStyle = color;
    g.globalAlpha = 0.95;
    g.fillText(text, 512, 128);
    /* 白色燈芯：與主字同字號，避免重影 */
    g.shadowBlur = 0;
    g.globalAlpha = 0.55;
    g.fillStyle = '#ffffff';
    g.font = '900 ' + size + 'px "Microsoft JhengHei",system-ui,sans-serif';
    g.fillText(text, 512, 128);
    /* 極少掉漆，保留霓虹感 */
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 3; i++) {
      g.globalAlpha = 0.25 + Math.random() * 0.25;
      g.fillRect(80 + Math.random() * 840, 70 + Math.random() * 110, 10 + Math.random() * 26, 3 + Math.random() * 7);
    }
    g.globalCompositeOperation = 'source-over';
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 樓上立牌專用：深色底板 + 柔和霓虹字（天空背景下也看得清） */
  function makeRoofSignTexture(text, color) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 128;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = 'rgba(8,12,16,.9)';
    g.fillRect(0, 0, 512, 128);
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.strokeRect(5, 5, 502, 118);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = color;
    g.shadowBlur = 8;
    g.fillStyle = color;
    g.font = '900 60px "Microsoft JhengHei",system-ui,sans-serif';
    /* 長句自動縮小，避免超出底板 */
    var tw2 = g.measureText(text).width;
    if (tw2 > 450) {
      var fs2 = Math.max(30, Math.floor(60 * 450 / tw2));
      g.font = '900 ' + fs2 + 'px "Microsoft JhengHei",system-ui,sans-serif';
    }
    g.fillText(text, 256, 68);
    g.shadowBlur = 0;
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* 噴漆塗鴉圖案（星星/骷髏/笑臉/閃電） */
  function makeSprayDoodleTexture(kind, color) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = color;
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.lineJoin = 'round';
    g.shadowColor = color;
    g.shadowBlur = 10;
    if (kind === 'star') {
      g.beginPath();
      for (var i = 0; i < 10; i++) {
        var r = i % 2 ? 52 : 118;
        var a = -Math.PI / 2 + i * Math.PI / 5;
        if (i === 0) g.moveTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
        else g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    } else if (kind === 'skull') {
      g.beginPath();
      g.arc(128, 108, 66, Math.PI, 0);
      g.arc(128, 108, 66, 0, Math.PI);
      g.fill();
      g.fillRect(92, 158, 72, 48);
      g.fillStyle = '#0a0d12';
      g.beginPath(); g.arc(104, 104, 17, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(152, 104, 17, 0, Math.PI * 2); g.fill();
      for (var t = 0; t < 4; t++) g.fillRect(100 + t * 18, 166, 8, 34);
    } else if (kind === 'smiley') {
      g.beginPath();
      g.arc(128, 128, 96, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#0a0d12';
      g.beginPath(); g.arc(96, 104, 14, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(160, 104, 14, 0, Math.PI * 2); g.fill();
      g.beginPath();
      g.strokeStyle = '#0a0d12';
      g.lineWidth = 12;
      g.arc(128, 128, 58, 0.25 * Math.PI, 0.75 * Math.PI);
      g.stroke();
    } else {
      /* 閃電 */
      g.beginPath();
      g.moveTo(150, 20); g.lineTo(84, 138); g.lineTo(126, 138);
      g.lineTo(104, 236); g.lineTo(176, 112); g.lineTo(132, 112);
      g.closePath();
      g.fill();
    }
    g.shadowBlur = 0;
    /* 噴漆飛濺點 */
    for (var d = 0; d < 46; d++) {
      g.globalAlpha = 0.15 + Math.random() * 0.35;
      var ang = Math.random() * Math.PI * 2;
      var rad = 70 + Math.random() * 60;
      var sx = 128 + Math.cos(ang) * rad;
      var sy = 128 + Math.sin(ang) * rad;
      g.fillRect(sx, sy, 2 + Math.random() * 5, 2 + Math.random() * 5);
    }
    g.globalAlpha = 1;
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function buildGraffiti(group) {
    var NEON = ['#aef8ff', '#ffb3e6', '#fff2a8', '#ffc38a', '#c4ffd0', '#d4b3ff'];
    /* 全部放在鏡頭常經過的位置：出生點正對、入口、A 點、大廳兩側 */
    var wallSigns = [
      { x: 26, y: 2.4, z: 10.56, ry: 0, text: '按下 AZ-5 之前請三思' },          // 藍隊出生正對
      { x: 35.45, y: 3.4, z: 14, ry: -Math.PI / 2, text: '冷靜、冷靜、再冷靜' },   // 控制室東牆
      { x: -9.45, y: 3.2, z: 25.0, ry: Math.PI / 2, text: '石墨是我們的驕傲' },    // 入口左牆
      { x: -9.45, y: 3.2, z: 29.5, ry: Math.PI / 2, text: '本機組安全運行 0 天' }, // 入口左牆後段
      { x: 14.45, y: 3.4, z: 18.5, ry: -Math.PI / 2, text: '請勿在反應堆旁吃泡麵' }, // 南廳東牆
      { x: -14.45, y: 3.4, z: 18.0, ry: Math.PI / 2, text: '跑得比輻射快就行' },   // 南廳西牆
      { x: -9.5, y: 9.0, z: 8.56, ry: 0, text: '輻射不痛，但很持久' },             // A 點左廣告上方
      { x: 9.5, y: 9.0, z: 8.56, ry: 0, text: '請勿投餵反應堆' },                  // A 點右廣告上方
      { x: -14.45, y: 3.4, z: 0.0, ry: Math.PI / 2, text: '這裡本來有個按鈕' },    // 大廳西牆
      { x: 14.45, y: 3.4, z: 0.0, ry: -Math.PI / 2, text: '當心電離輻射（大概）' }, // 大廳東牆
      { x: -20, y: 3.8, z: -21.44, ry: 0, text: '本區域已消毒（大概）' },          // 北側走廊
      { x: -10, y: -3.0, z: 17.45, ry: Math.PI, text: '地下室沒有鬼（大概）' },    // 地下室
      { x: -35.45, y: 3.2, z: -7, ry: Math.PI / 2, text: '請勿在機組旁飲食' },    // 汽輪機室
      { x: 35.45, y: 3.2, z: -4, ry: -Math.PI / 2, text: '輻射只是心理作用' },    // 水泵房
      /* 吸粉標語（鏡頭必經位置，中英文對照） */
      { x: 14.45, y: 5.4, z: 12, ry: -Math.PI / 2, text: '來都來了 FOLLOW' },
      { x: -14.45, y: 5.4, z: 12, ry: Math.PI / 2, text: '點讚分享 SUBSCRIBE' },
      { x: -9.45, y: 5.2, z: 26.2, ry: Math.PI / 2, text: '緣分從這裡開始 FOLLOW' },
      { x: 9.45, y: 5.2, z: 26.2, ry: -Math.PI / 2, text: 'CANNIKIN GAMING' },
      { x: 26, y: 6.4, z: 10.56, ry: 0, text: '一鍵三連 LIKE+SUB' },
      { x: -20, y: 5.6, z: -21.44, ry: 0, text: '關注再打 FOLLOW FIRST' },
      { x: 20, y: 5.6, z: -21.44, ry: 0, text: '不定時更新 DAILY' }
    ];
    for (var i = 0; i < wallSigns.length; i++) {
      var s = wallSigns[i];
      var color = NEON[i % NEON.length];
      var w = 4.6 + Math.random() * 1.6;
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, w * 0.26),
        new THREE.MeshBasicMaterial({ map: makeGraffitiTexture(s.text, color), transparent: true, depthWrite: false, opacity: 0.95 })
      );
      m.position.set(s.x, s.y + (Math.random() - 0.5) * 0.3, s.z);
      m.rotation.y = s.ry;
      m.rotation.z = (Math.random() - 0.5) * 0.16;
      group.add(m);
    }

    /* 天台立式發光標語牌：天台對戰與開場鏡頭都會看到 */
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x2f353d, metalness: 0.7, roughness: 0.4 });
    var roofSigns = [
      { x: -8, z: 20, text: '本機組安全運行 0 天' },
      { x: 0, z: 18, text: '跑得比輻射快就行' },
      { x: 8, z: 20, text: '請勿投餵反應堆' },
      { x: -16, z: 20, text: '來都來了 點個關注' },
      { x: 16, z: 20, text: '喜歡就分享給朋友' }
    ];
    for (var r = 0; r < roofSigns.length; r++) {
      var rs = roofSigns[r];
      var rcolor = NEON[(r + 2) % NEON.length];
      /* 樓上大看板：深色底板 + 霓虹字，金屬框架 + 雙立柱 + 底座 */
      var rmat = new THREE.MeshBasicMaterial({ map: makeRoofSignTexture(rs.text, rcolor), transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.98 });
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.6), rmat);
      sign.position.set(rs.x, 12.3, rs.z);
      sign.rotation.y = Math.PI;
      group.add(sign);
      /* 底座 + 雙立柱 + 頂橫梁，取代細杆 */
      batchGeo(new THREE.BoxGeometry(0.8, 0.28, 0.8), poleMat, rs.x - 2.0, 10.54, rs.z);
      batchGeo(new THREE.BoxGeometry(0.8, 0.28, 0.8), poleMat, rs.x + 2.0, 10.54, rs.z);
      batchGeo(new THREE.BoxGeometry(0.18, 1.9, 0.18), poleMat, rs.x - 2.0, 11.55, rs.z);
      batchGeo(new THREE.BoxGeometry(0.18, 1.9, 0.18), poleMat, rs.x + 2.0, 11.55, rs.z);
      batchGeo(new THREE.BoxGeometry(4.2, 0.16, 0.16), poleMat, rs.x, 11.6, rs.z);
    }

    /* 噴漆塗鴉：星星 / 骷髏 / 笑臉 / 閃電，散在四面牆 */
    var doodles = [
      { x: 10, y: 4.0, z: -21.4, ry: 0, kind: 'star' },
      { x: -12, y: 4.6, z: -21.4, ry: 0, kind: 'skull' },
      { x: 14.4, y: 6.6, z: 6, ry: -Math.PI / 2, kind: 'smiley' },
      { x: -14.4, y: 6.2, z: -8, ry: Math.PI / 2, kind: 'bolt' },
      { x: 35.4, y: 4.0, z: -6, ry: -Math.PI / 2, kind: 'star' },
      { x: -35.4, y: 4.2, z: 10, ry: Math.PI / 2, kind: 'skull' },
      { x: 22, y: 3.4, z: 23.4, ry: Math.PI, kind: 'smiley' }
    ];
    for (var ddi = 0; ddi < doodles.length; ddi++) {
      var dd = doodles[ddi];
      var dm = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 2.6),
        new THREE.MeshBasicMaterial({
          map: makeSprayDoodleTexture(dd.kind, NEON[ddi % NEON.length]),
          transparent: true, depthWrite: false
        })
      );
      dm.position.set(dd.x, dd.y, dd.z);
      dm.rotation.y = dd.ry;
      group.add(dm);
    }
  }

  window.buildMap = function (scene) {
    initTextures();
    var group = new THREE.Group();
    var colliders = [];
    var meshes = [];

    // 共享材質（按紋理 + 尺寸重複）
    var mats = {};
    window.__CS_MATS = {};
    ['white', 'stone', 'concrete', 'crate', 'hazard', 'metal', 'black', 'red', 'green'].forEach(function (k) {
      var tex = boxTexFor(k);
      mats[k] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: k === 'metal' ? 0.35 : 0.05 });
      window.__CS_MATS[k] = mats[k];
    });

    // 草地
    var grassMat = new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(92, 92), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    group.add(ground);
    meshes.push(ground);

    // 方塊（按材質合併）
    var byKind = {};
    for (var i = 0; i < MAP.boxes.length; i++) {
      var b = MAP.boxes[i];
      if (b.h <= 0.02) continue;
      if (!byKind[b.kind]) byKind[b.kind] = [];
      byKind[b.kind].push(b);
      colliders.push(blockToCollider(b));
    }
    for (var kind in byKind) {
      var mesh = mergeBoxList(byKind[kind], matFor(kind));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isWall = true;
      group.add(mesh);
      meshes.push(mesh);
    }

    // 設備
    var equipRes = buildEquip(group, colliders, meshes);
    var equipMeshes = equipRes.equipMeshes;
    var glassList = equipRes.glass;
    buildAds(group, meshes);
    /* 外牆品牌牌：目前只放 D 牆（西牆）正中 */
    buildWallBrands(group, meshes);
    buildWallLetters(group);
    buildRoofLogo(group, meshes);
    buildPlatformLogo(group, meshes);
    buildGraffiti(group);
    buildLadderVisual(group);
    buildRoofLandingRail(group);

    // 室內照明（P0：9 盞點光源 → 6 盞，其餘以發光燈帶與環境光補足）
    var lightSpots = [
      [0, 7, 0, 4.8, 60, 0x9fd0ff],    // 反應堆大廳：青藍
      [-26, 5, -2, 3.8, 48, 0xffc48a], // 汽輪機室：暖橙
      [26, 5, -2, 3.6, 48, 0x8fc8ff],  // 水泵房：冷藍
      [-26, 5, 16, 3.6, 48, 0xffa060], // 柴油發電室：橙紅
      [26, 5, 16, 3.8, 48, 0x9dffc4],  // 控制室：綠白
      [0, 6, 30, 3.2, 44, 0xffdfae]    // 入口走廊：暖白
    ];
    var roomLights = [];
    for (var lsi = 0; lsi < lightSpots.length; lsi++) {
      var ls = lightSpots[lsi];
      var pl = new THREE.PointLight(ls[5] || 0xfff2dc, ls[3], ls[4], 1.4);
      pl.position.set(ls[0], ls[1], ls[2]);
      group.add(pl);
      roomLights.push({ light: pl, base: ls[3], color: ls[5] || 0xfff2dc });
    }

    // 發光燈帶（純視覺，不參與光照計算）
    var lampMats = [];
    var lampMatByColor = {};
    function lampMatFor(color) {
      if (!lampMatByColor[color]) {
        var lmat = new THREE.MeshBasicMaterial({ color: color });
        lampMatByColor[color] = lmat;
        lampMats.push({ mat: lmat, color: color });
      }
      return lampMatByColor[color];
    }
    /* 應急照明燈條：常態近黑，警報時整組亮紅（共用材質，只更新一次） */
    var emergencyMat = new THREE.MeshStandardMaterial({
      color: 0x2a0808, emissive: 0xff2020, emissiveIntensity: 0.03, roughness: 0.5, metalness: 0.1
    });
    var emergencySpots = [
      [0, 7.6, 28, 4.2], [0, 9.2, 16, 4.0], [0, 9.2, -6, 4.0],
      [26, 9.2, 16, 3.4], [-26, 8.6, -2, 3.4], [26, 8.6, -2, 3.4],
      [0, -0.35, 0, 3.4], [0, 8.0, -20, 4.0]
    ];
    for (var es = 0; es < emergencySpots.length; es++) {
      var esp = emergencySpots[es];
      var em = new THREE.Mesh(new THREE.BoxGeometry(esp[3], 0.12, 0.35), emergencyMat);
      em.position.set(esp[0], esp[1], esp[2]);
      group.add(em);
    }
    function lampBar(x, y, z, w, d, color) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), lampMatFor(color || 0xffe9c8));
      m.position.set(x, y, z);
      group.add(m);
    }
    /* 分區燈帶：大廳青白、汽輪機暖橙、水泵冷藍、柴油橙紅、控制室綠白、入口暖白、地下室冷青 */
    lampBar(0, 9.4, 0, 14, 1.2, 0xcfeaff);
    lampBar(0, 9.4, -12, 8, 1.0, 0xcfeaff);
    lampBar(-26, 8.8, -8, 8, 1.0, 0xffd8a8);
    lampBar(-26, 8.8, 4, 8, 1.0, 0xffd8a8);
    lampBar(26, 8.8, -8, 8, 1.0, 0xc8e4ff);
    lampBar(26, 8.8, 4, 8, 1.0, 0xc8e4ff);
    lampBar(-26, 8.8, 16, 8, 1.0, 0xffc090);
    lampBar(26, 8.8, 16, 8, 1.0, 0xc8ffd8);
    lampBar(0, 7, 28, 6, 1.0, 0xffe8c8);
    lampBar(0, -1.5, 0, 14, 1.0, 0x8fd8d0);

    // 建築外立面玻璃窗：拆成一段一段的窗戶，避免一整條長條看起來像穿模的水管
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x9fd0e8, transparent: true, opacity: 0.45, roughness: 0.15, metalness: 0.3, side: THREE.DoubleSide
    });
    function glassStripRun(x, y, z, total, h, ry) {
      var seg = 5.5, gap = 2.4;
      var n = Math.max(1, Math.floor((total + gap) / (seg + gap)));
      var span = n * seg + (n - 1) * gap;
      var start = -span / 2 + seg / 2;
      var alongZ = Math.abs(Math.sin(ry)) > 0.5;
      for (var gi = 0; gi < n; gi++) {
        var off = start + gi * (seg + gap);
        var m = new THREE.Mesh(new THREE.PlaneGeometry(seg, h), glassMat);
        if (alongZ) m.position.set(x, y, z + off);
        else m.position.set(x + off, y, z);
        m.rotation.y = ry;
        group.add(m);
      }
    }
    glassStripRun(-23, 4, 24.55, 22, 1.4, 0);
    glassStripRun(23, 4, 24.55, 22, 1.4, 0);
    glassStripRun(0, 4, -22.55, 60, 1.4, Math.PI);
    glassStripRun(36.55, 4, 1, 40, 1.4, Math.PI / 2);
    glassStripRun(-36.55, 4, 1, 40, 1.4, -Math.PI / 2);

    // 天空
    buildSky(group);

    // A/B 地面標記 + 光柱
    group.add(makeSiteLabel('A', MAP.sites.A));
    group.add(makeSiteLabel('B', MAP.sites.B));
    var siteBeams = buildSiteBeams(group);
    var beacons = buildBeacons(group);
    var marquee = buildReactorMarquee(group);

    var graph = buildGraph(MAP.waypoints, colliders);
    /* 天台對戰專用導航圖（屋頂平面網格） */
    var roofWP = [];
    for (var rwx = -32; rwx <= 32; rwx += 8) {
      for (var rwz = -16; rwz <= 16; rwz += 8) roofWP.push({ x: rwx, z: rwz });
    }
    var roofGraph = buildGraph(roofWP, colliders, 11.5);
    var roofSites = { A: { x: -24, z: 8 }, B: { x: 24, z: 8 } };

    scene.add(group);

    return {
      group: group,
      colliders: colliders,
      meshes: meshes,
      glass: glassList,
      waypoints: MAP.waypoints,
      graph: graph,
      roofWaypoints: roofWP,
      roofGraph: roofGraph,
      roofSites: roofSites,
      spawns: MAP.spawns,
      sites: MAP.sites,
      bounds: MAP.bounds,
      ladders: MAP.ladders,
      elevators: MAP.elevators,
      reactor: MAP.reactor,
      beacons: beacons,
      siteBeams: siteBeams,
      marquee: marquee,
      reactorFx: window.__CS_REACTOR_FX,
      blinkers: BLINKERS,
      equipMeshes: equipMeshes,
      lampMats: lampMats,
      emergencyMat: emergencyMat,
      roomLights: roomLights,
      alarmLevel: 0
    };
  };

  /* ---------- 設備構建 ---------- */
  function buildEquip(group, colliders, meshes) {
    var M = window.__CS_MATS;
    var equipMeshes = [];
    var glass = [];
    var breakGlassMat = new THREE.MeshStandardMaterial({
      color: 0x9fd8f0, transparent: true, opacity: 0.34,
      roughness: 0.08, metalness: 0.25, side: THREE.DoubleSide
    });
    /* 共享材質：避免每個設備各自 new 一個，也讓批處理能合併 */
    var sandMat = new THREE.MeshStandardMaterial({ color: 0xc8bc96, roughness: 1 });
    var batMat = new THREE.MeshStandardMaterial({ color: 0x8a4fd8, emissive: 0x5a2fa8, emissiveIntensity: 0.5, roughness: 0.5 });
    var elevDark = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.35, metalness: 0.7 });
    var elevFrame = new THREE.MeshStandardMaterial({ color: 0x2f8fe0, emissive: 0x12588a, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.5 });
    var blueFrame = new THREE.MeshStandardMaterial({ color: 0x2f8fe0, emissive: 0x12588a, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.5 });
    var pipeMatRed = new THREE.MeshStandardMaterial({ color: 0xb03030, roughness: 0.5, metalness: 0.5, emissive: 0x3a0a0a, emissiveIntensity: 0.4 });
    var pipeMatBlack = new THREE.MeshStandardMaterial({ color: 0x1f2226, roughness: 0.5, metalness: 0.5 });
    var cableMat = new THREE.MeshStandardMaterial({ color: 0xd83a3a, emissive: 0x7a1010, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.3 });

    function addMesh(m) {
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      meshes.push(m);
      return m;
    }
    function solid(x, z, w, d, y0, h) {
      colliders.push({
        minX: x - w / 2, maxX: x + w / 2,
        minZ: z - d / 2, maxZ: z + d / 2,
        minY: y0 || 0, maxY: (y0 || 0) + h,
        tall: h > 1.6
      });
    }

    for (var i = 0; i < MAP.equip.length; i++) {
      var e = MAP.equip[i];
      if (e.type === 'turbine') {
        batchGeo(new THREE.CylinderGeometry(e.r, e.r, e.h, 12), M.green, e.x, e.h / 2, e.z);
        batchGeo(new THREE.CylinderGeometry(e.r * 0.55, e.r * 0.55, e.h + 0.4, 10), M.metal, e.x, e.h / 2, e.z);
        solid(e.x, e.z, e.r * 2 + 0.6, e.r * 2 + 0.6, 0, e.h);
      } else if (e.type === 'condenser') {
        batchGeo(new THREE.BoxGeometry(e.w, e.h, e.d), M.metal, e.x, e.h / 2, e.z);
        solid(e.x, e.z, e.w, e.d, 0, e.h);
      } else if (e.type === 'tank' || e.type === 'fuelTank') {
        /* 大型柴油罐為灰色；儲水罐也是灰色 */
        batchGeo(new THREE.CylinderGeometry(e.r, e.r, e.h, 12), M.metal, e.x, e.h / 2, e.z);
        batchGeo(new THREE.SphereGeometry(e.r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.metal, e.x, e.h, e.z);
        solid(e.x, e.z, e.r * 2 + 0.4, e.r * 2 + 0.4, 0, e.h + e.r);
      } else if (e.type === 'generator') {
        batchGeo(new THREE.BoxGeometry(e.w, e.h, e.d), M.red, e.x, e.h / 2, e.z);
        batchGeo(new THREE.BoxGeometry(e.w * 0.7, 0.3, e.d * 0.7), M.black, e.x, e.h + 0.15, e.z);
        solid(e.x, e.z, e.w, e.d, 0, e.h + 0.3);
      } else if (e.type === 'battery') {
        batchGeo(new THREE.BoxGeometry(e.w, e.h, e.d), batMat, e.x, e.h / 2, e.z);
        solid(e.x, e.z, e.w, e.d, 0, e.h);
      } else if (e.type === 'console') {
        batchGeo(new THREE.BoxGeometry(e.w, e.h, e.d), M.metal, e.x, e.h / 2, e.z);
        var screen = new THREE.Mesh(new THREE.PlaneGeometry(e.w * 0.9, e.h * 0.7),
          new THREE.MeshStandardMaterial({ map: TEX.screen, emissive: 0x2fa05a, emissiveIntensity: 0.5, roughness: 0.6 }));
        screen.position.set(e.x, e.h * 0.7, e.z - e.d / 2 - 0.02);
        screen.rotation.x = -0.35;
        group.add(screen);
        meshes.push(screen);
        /* 紅橙黃按鈕 */
        var btnColors = [0xd83a3a, 0xf08a2a, 0xf0d24a];
        for (var bi = 0; bi < 3; bi++) {
          var btn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18),
            new THREE.MeshStandardMaterial({
              color: btnColors[bi], emissive: btnColors[bi], emissiveIntensity: 0.5, roughness: 0.5
            }));
          btn.position.set(e.x - e.w * 0.28 + bi * 0.28, e.h + 0.04, e.z + e.d * 0.15);
          group.add(btn);
          BLINKERS.push({ mat: btn.material, phase: Math.random() * 6.28, kind: 'button' });
        }
        solid(e.x, e.z, e.w, e.d, 0, e.h);
      } else if (e.type === 'monitor') {
        var mon = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.h),
          new THREE.MeshStandardMaterial({ map: TEX.screen, emissive: 0x2fa05a, emissiveIntensity: 0.6, roughness: 0.6 }));
        mon.position.set(e.x, 2.4, e.z + 0.06);
        group.add(mon);
        meshes.push(mon);
      } else if (e.type === 'window') {
        var winMat = new THREE.MeshStandardMaterial({
          color: 0x9fd0e8, transparent: true, opacity: 0.35,
          roughness: 0.1, metalness: 0.2, side: THREE.DoubleSide
        });
        var win = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.h), winMat);
        win.position.set(e.x, 3.2, e.z + 0.55);
        group.add(win);
        meshes.push(win);
      } else if (e.type === 'breakGlass') {
        var pane = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.h), breakGlassMat);
        pane.position.set(e.x, e.y || 4, e.z);
        pane.rotation.y = e.ry || 0;
        pane.userData.isGlass = true;
        group.add(pane);
        meshes.push(pane);
        var gx = e.ry ? 0.22 : e.w / 2;
        var gz = e.ry ? e.w / 2 : 0.22;
        var gCol = {
          minX: e.x - gx, maxX: e.x + gx,
          minZ: e.z - gz, maxZ: e.z + gz,
          minY: (e.y || 4) - e.h / 2, maxY: (e.y || 4) + e.h / 2,
          tall: false
        };
        colliders.push(gCol);
        glass.push({ mesh: pane, collider: gCol, x: e.x, z: e.z, w: e.w, h: e.h, ry: e.ry || 0 });
        /* 藍色金屬窗框 */
        var frameMat = M.metal;
        var fw = 0.12;
        function frameBar(px, py, pz, sx, sy, sz) {
          batchGeo(new THREE.BoxGeometry(sx, sy, sz), frameMat, px, py, pz);
        }
        if (e.ry) {
          frameBar(e.x, e.y + e.h / 2, e.z, 0.3, fw, e.w + fw * 2);
          frameBar(e.x, e.y - e.h / 2, e.z, 0.3, fw, e.w + fw * 2);
          frameBar(e.x, e.y, e.z - e.w / 2, 0.3, e.h, fw);
          frameBar(e.x, e.y, e.z + e.w / 2, 0.3, e.h, fw);
        } else {
          frameBar(e.x, e.y + e.h / 2, e.z, e.w + fw * 2, fw, 0.3);
          frameBar(e.x, e.y - e.h / 2, e.z, e.w + fw * 2, fw, 0.3);
          frameBar(e.x - e.w / 2, e.y, e.z, fw, e.h, 0.3);
          frameBar(e.x + e.w / 2, e.y, e.z, fw, e.h, 0.3);
        }
      } else if (e.type === 'readout') {
        var rt = makeReadoutTexture(e.text || ['系統', '—'], e.color || '#7dff9c');
        var rmMat = new THREE.MeshBasicMaterial({ map: rt, transparent: true, opacity: 1 });
        var rm = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.h), rmMat);
        rm.position.set(e.x, e.y || 4.5, e.z);
        group.add(rm);
        meshes.push(rm);
        BLINKERS.push({ mat: rmMat, phase: Math.random() * 6.28, kind: 'screen' });
        batchGeo(new THREE.BoxGeometry(e.w + 0.22, e.h + 0.22, 0.14), M.black, e.x, e.y || 4.5, e.z - 0.08);
      } else if (e.type === 'blueWindow') {
        var bwMat = new THREE.MeshStandardMaterial({
          color: 0x79c8ff, transparent: true, opacity: 0.32,
          roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide,
          emissive: 0x1a6fa8, emissiveIntensity: 0.35
        });
        var bw = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.h), bwMat);
        bw.position.set(e.x, e.y || 4, e.z);
        bw.rotation.y = e.ry || 0;
        group.add(bw);
        var fw2 = 0.12;
        function blueBar(px, py, pz, sx, sy, sz) {
          batchGeo(new THREE.BoxGeometry(sx, sy, sz), blueFrame, px, py, pz);
        }
        if (e.ry) {
          blueBar(e.x, e.y + e.h / 2, e.z, 0.22, fw2, e.w + fw2 * 2);
          blueBar(e.x, e.y - e.h / 2, e.z, 0.22, fw2, e.w + fw2 * 2);
          blueBar(e.x, e.y, e.z - e.w / 2, 0.22, e.h, fw2);
          blueBar(e.x, e.y, e.z + e.w / 2, 0.22, e.h, fw2);
        } else {
          blueBar(e.x, e.y + e.h / 2, e.z, e.w + fw2 * 2, fw2, 0.22);
          blueBar(e.x, e.y - e.h / 2, e.z, e.w + fw2 * 2, fw2, 0.22);
          blueBar(e.x - e.w / 2, e.y, e.z, fw2, e.h, 0.22);
          blueBar(e.x + e.w / 2, e.y, e.z, fw2, e.h, 0.22);
        }
      } else if (e.type === 'elevator') {
        var doorGeo = new THREE.BoxGeometry(0.22, e.h, e.w / 2 - 0.05);
        batchGeo(doorGeo, elevDark, e.x, e.y, e.z - e.w / 4 - 0.02);
        batchGeo(doorGeo, elevDark, e.x, e.y, e.z + e.w / 4 + 0.02);
        batchGeo(new THREE.BoxGeometry(0.3, e.h + 0.3, 0.14), elevFrame, e.x, e.y, e.z - e.w / 2);
        batchGeo(new THREE.BoxGeometry(0.3, e.h + 0.3, 0.14), elevFrame, e.x, e.y, e.z + e.w / 2);
        batchGeo(new THREE.BoxGeometry(0.3, 0.14, e.w + 0.2), elevFrame, e.x, e.y + e.h / 2 + 0.12, e.z);
        var esign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8),
          new THREE.MeshBasicMaterial({ map: makeReadoutTexture(['電梯', '控制室 ↑'], '#7dc9ff') }));
        esign.position.set(e.x - 0.14, e.y + e.h / 2 + 0.7, e.z);
        esign.rotation.y = e.ry - Math.PI;
        group.add(esign);
      } else if (e.type === 'radSign') {
        var rs = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.h),
          new THREE.MeshBasicMaterial({ map: makeRadSignTexture(), transparent: true }));
        rs.position.set(e.x, e.y || 4, e.z);
        rs.rotation.y = e.ry || 0;
        group.add(rs);
      } else if (e.type === 'pipeRun') {
        var prMat = e.color === 'red' ? pipeMatRed : pipeMatBlack;
        var prGeo = new THREE.CylinderGeometry(0.16, 0.16, e.len, 8);
        if (Math.abs(e.ry || 0) > 1) batchGeo(prGeo, prMat, e.x, e.y || 3, e.z, Math.PI / 2, 0, 0);
        else batchGeo(prGeo, prMat, e.x, e.y || 3, e.z, 0, 0, Math.PI / 2);
      } else if (e.type === 'reactorDetail') {
        buildReactorDetail(group, M);
      } else if (e.type === 'powerline') {
        batchGeo(new THREE.CylinderGeometry(0.055, 0.055, e.len, 6), cableMat, e.x, e.y, e.z, Math.PI / 2, 0, 0);
      } else if (e.type === 'crane') {
        buildCrane(group, M);
      } else if (e.type === 'pipe') {
        batchGeo(new THREE.CylinderGeometry(0.35, 0.35, e.w, 8), M.black, e.x, e.y || 6, e.z, 0, 0, Math.PI / 2);
      } else if (e.type === 'rod') {
        batchGeo(new THREE.CylinderGeometry(e.r, e.r, e.h, 6), M.black, e.x, (e.y || 0) + e.h / 2, e.z);
      } else if (e.type === 'vent') {
        batchGeo(new THREE.CylinderGeometry(e.r, e.r * 0.85, e.h, 8), M.white, e.x, (e.y || 0) + e.h / 2, e.z);
        solid(e.x, e.z, e.r * 2, e.r * 2, e.y || 0, e.h);
      } else if (e.type === 'transformer') {
        batchGeo(new THREE.BoxGeometry(e.w, e.h, e.d), M.metal, e.x, e.h / 2, e.z);
        batchGeo(new THREE.BoxGeometry(e.w + 0.6, 0.4, e.d + 0.6), M.black, e.x, e.h - 0.4, e.z);
        solid(e.x, e.z, e.w, e.d, 0, e.h);
      } else if (e.type === 'pylon') {
        /* 矮化輸電桿：原本 16 米高 + 5 米橫梁，遠看像懸空的長管 */
        batchGeo(new THREE.CylinderGeometry(0.16, 0.24, 11, 6), M.black, e.x, 5.5, e.z);
        for (var arm = 0; arm < 2; arm++) {
          batchGeo(new THREE.BoxGeometry(3.0, 0.18, 0.18), M.black, e.x, 7.6 + arm * 1.5, e.z);
        }
        solid(e.x, e.z, 1.2, 1.2, 0, 11);
      } else if (e.type === 'barrel') {
        var barMat = e.color === 'yellow' ? M.hazard : (e.color === 'red' ? M.red : M.metal);
        batchGeo(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 10), barMat, e.x, 0.55, e.z);
        batchGeo(new THREE.CylinderGeometry(0.47, 0.47, 0.08, 10), M.black, e.x, 1.0, e.z);
        solid(e.x, e.z, 1.0, 1.0, 0, 1.1);
      } else if (e.type === 'cone') {
        batchGeo(new THREE.ConeGeometry(0.28, 0.7, 6), M.red, e.x, 0.35, e.z);
      } else if (e.type === 'sandbags') {
        var cry = Math.cos(e.ry || 0), sry = Math.sin(e.ry || 0);
        for (var r = 0; r < 3; r++) {
          var n = 5 - (r % 2);
          for (var k = 0; k < n; k++) {
            var lx = (k - n / 2 + 0.5) * 0.6 + (r % 2) * 0.15;
            var lz = (Math.random() - 0.5) * 0.06;
            var wy = 0.16 + r * 0.32;
            var wx = e.x + lx * cry + lz * sry;
            var wz = e.z - lx * sry + lz * cry;
            batchGeo(new THREE.BoxGeometry(0.58, 0.32, 0.46), sandMat, wx, wy, wz, 0, (e.ry || 0) + (Math.random() - 0.5) * 0.1, 0);
          }
        }
        var hw = 1.7, hd = 0.45;
        if (Math.abs(Math.sin(e.ry || 0)) > 0.5) { var t = hw; hw = hd; hd = t; }
        colliders.push({ minX: e.x - hw, maxX: e.x + hw, minZ: e.z - hd, maxZ: e.z + hd, minY: 0, maxY: 1.1, tall: false });
      } else if (e.type === 'nuke') {
        buildNuke(e, M, colliders);
      } else if (e.type === 'nukeLabel') {
        var nl = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.92),
          new THREE.MeshBasicMaterial({ map: makeNukeLabelTexture(e.text, e.sub) }));
        nl.position.set(e.x, e.y || 1.15, e.z);
        nl.rotation.set(0, e.ry || 0, 0);
        group.add(nl);
        /* 兩根立桿 */
        var nry = e.ry || 0;
        batchGeo(new THREE.BoxGeometry(0.1, 0.72, 0.1), M.metal, e.x + 0.85 * Math.cos(nry), 0.36, e.z - 0.85 * Math.sin(nry));
        batchGeo(new THREE.BoxGeometry(0.1, 0.72, 0.1), M.metal, e.x - 0.85 * Math.cos(nry), 0.36, e.z + 0.85 * Math.sin(nry));
      }
      equipMeshes.push(e);
    }
    /* 把批處理的靜態設備一次合併成少數 Mesh */
    var batchInfo = flushStaticBatch(group, meshes);
    MAP._batch = batchInfo;
    return { equipMeshes: equipMeshes, glass: glass };
  }

  /* ---------- 外圍核武展示品（純裝飾，四件真實歷史核彈模型） ---------- */
  function buildNuke(e, M, colliders) {
    var x = e.x, z = e.z;
    var metal = M.metal, black = M.black, red = M.red, white = M.white;
    var haz = M.hazard, conc = M.concrete;
    /* 彈體銀白塗裝（共享材質，惰性建立） */
    var shell = buildNuke._shell || (buildNuke._shell =
      new THREE.MeshStandardMaterial({ color: 0xc6d0d6, roughness: 0.4, metalness: 0.55 }));

    if (e.kind === 'tsar') {
      /* RDS-220「沙皇炸彈」：約 10m 長、直徑 2.7m，銀白彈體 + 橙紅環帶，橫臥在雙 A 型托架上 */
      batchGeo(new THREE.BoxGeometry(13.0, 0.3, 4.6), conc, x, 0.15, z);
      batchGeo(new THREE.BoxGeometry(13.6, 0.06, 5.2), haz, x, 0.035, z);
      /* 彈體（軸沿 X） */
      batchGeo(new THREE.CylinderGeometry(1.35, 1.35, 7.8, 16), shell, x, 2.7, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.ConeGeometry(1.35, 2.3, 16), shell, x + 4.9, 2.7, z, 0, 0, -Math.PI / 2);
      batchGeo(new THREE.CylinderGeometry(1.35, 1.12, 0.85, 16), shell, x - 4.25, 2.7, z, 0, 0, Math.PI / 2);
      /* 橙紅識別環 */
      batchGeo(new THREE.CylinderGeometry(1.37, 1.37, 0.55, 16), red, x - 1.5, 2.7, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.CylinderGeometry(1.37, 1.37, 0.55, 16), red, x + 1.4, 2.7, z, 0, 0, Math.PI / 2);
      /* 十字尾翼 */
      batchGeo(new THREE.BoxGeometry(1.45, 0.12, 2.5), black, x - 4.4, 2.7, z);
      batchGeo(new THREE.BoxGeometry(1.45, 2.5, 0.12), black, x - 4.4, 2.7, z);
      /* 雙 A 型托架 */
      for (var bi = 0; bi < 2; bi++) {
        var bx = x + (bi ? 2.7 : -2.7);
        batchGeo(new THREE.BoxGeometry(0.24, 2.0, 0.24), black, bx, 0.95, z - 0.78, 0.42, 0, 0);
        batchGeo(new THREE.BoxGeometry(0.24, 2.0, 0.24), black, bx, 0.95, z + 0.78, -0.42, 0, 0);
        batchGeo(new THREE.BoxGeometry(0.28, 0.18, 1.25), black, bx, 1.5, z);
      }
      colliders.push({ minX: x - 6.8, maxX: x + 6.8, minZ: z - 2.6, maxZ: z + 2.6, minY: 0, maxY: 4.1, tall: true });
    } else if (e.kind === 'fatman') {
      /* RDS-1「第一閃電」：直徑 3.9m 的圓胖彈體 + 方框尾翼，放在混凝土台上 */
      batchGeo(new THREE.BoxGeometry(8.2, 0.3, 5.7), conc, x, 0.15, z);
      batchGeo(new THREE.BoxGeometry(8.9, 0.06, 6.4), haz, x, 0.035, z);
      batchGeo(new THREE.CylinderGeometry(1.95, 1.95, 3.0, 16), shell, x, 2.75, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.SphereGeometry(1.95, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell, x + 1.5, 2.75, z, 0, 0, -Math.PI / 2);
      batchGeo(new THREE.SphereGeometry(1.95, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell, x - 1.5, 2.75, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.CylinderGeometry(1.97, 1.97, 0.45, 16), red, x - 0.7, 2.75, z, 0, 0, Math.PI / 2);
      /* 方框尾翼（垂直於彈軸的矩形框） */
      batchGeo(new THREE.BoxGeometry(0.14, 0.18, 2.6), black, x - 2.6, 3.85, z);
      batchGeo(new THREE.BoxGeometry(0.14, 0.18, 2.6), black, x - 2.6, 1.6, z);
      batchGeo(new THREE.BoxGeometry(0.14, 2.5, 0.18), black, x - 2.6, 2.75, z - 1.25);
      batchGeo(new THREE.BoxGeometry(0.14, 2.5, 0.18), black, x - 2.6, 2.75, z + 1.25);
      /* 四角支撐座 */
      for (var si = 0; si < 4; si++) {
        var sx2 = x + (si < 2 ? -1.25 : 1.25);
        var sz2 = z + (si % 2 ? 1.05 : -1.05);
        batchGeo(new THREE.BoxGeometry(0.65, 0.95, 0.55), black, sx2, 0.6, sz2);
      }
      colliders.push({ minX: x - 4.5, maxX: x + 4.5, minZ: z - 3.2, maxZ: z + 3.2, minY: 0, maxY: 4.8, tall: true });
    } else if (e.kind === 'missile') {
      /* SS-20「先鋒」：約 11.5m 豎立展示，白色彈體 + 紅色識別環 + 發射基座 */
      batchGeo(new THREE.BoxGeometry(5.8, 0.34, 5.8), conc, x, 0.17, z);
      batchGeo(new THREE.BoxGeometry(6.4, 0.06, 6.4), haz, x, 0.04, z);
      batchGeo(new THREE.CylinderGeometry(2.2, 2.6, 0.6, 12), metal, x, 0.65, z);
      batchGeo(new THREE.CylinderGeometry(1.3, 1.1, 1.1, 12), metal, x, 1.5, z);
      batchGeo(new THREE.CylinderGeometry(1.05, 1.05, 8.0, 12), white, x, 4.95, z);
      batchGeo(new THREE.CylinderGeometry(1.07, 1.07, 0.5, 12), red, x, 7.2, z);
      batchGeo(new THREE.CylinderGeometry(1.07, 1.07, 0.4, 12), red, x, 3.1, z);
      batchGeo(new THREE.ConeGeometry(1.05, 2.3, 12), white, x, 10.1, z);
      /* 四根斜撐 */
      for (var mi = 0; mi < 4; mi++) {
        var ang = mi * Math.PI / 2;
        var ox = Math.cos(ang) * 1.6, oz = Math.sin(ang) * 1.6;
        batchGeo(new THREE.BoxGeometry(0.18, 2.0, 0.18), black,
          x + ox, 1.1, z + oz, -Math.sin(ang) * 0.5, 0, Math.cos(ang) * 0.5);
      }
      colliders.push({ minX: x - 3.3, maxX: x + 3.3, minZ: z - 3.3, maxZ: z + 3.3, minY: 0, maxY: 11.2, tall: true });
    } else if (e.kind === 'tactical') {
      /* B-61 戰術核彈：4.2m 彈體放在四輪推車上 */
      batchGeo(new THREE.BoxGeometry(5.4, 0.32, 3.0), conc, x, 0.16, z);
      batchGeo(new THREE.BoxGeometry(6.0, 0.06, 3.6), haz, x, 0.04, z);
      batchGeo(new THREE.BoxGeometry(3.8, 0.16, 0.14), metal, x, 0.95, z - 0.65);
      batchGeo(new THREE.BoxGeometry(3.8, 0.16, 0.14), metal, x, 0.95, z + 0.65);
      for (var wi = 0; wi < 4; wi++) {
        var wx2 = x + (wi < 2 ? -1.25 : 1.25);
        var wz2 = z + (wi % 2 ? 0.85 : -0.85);
        batchGeo(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 10), black, wx2, 0.45, wz2, 0, 0, Math.PI / 2);
      }
      batchGeo(new THREE.CylinderGeometry(0.9, 0.9, 3.8, 12), shell, x, 1.7, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.ConeGeometry(0.9, 1.4, 12), shell, x + 2.6, 1.7, z, 0, 0, -Math.PI / 2);
      batchGeo(new THREE.CylinderGeometry(0.9, 0.66, 0.7, 12), shell, x - 2.25, 1.7, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.CylinderGeometry(0.92, 0.92, 0.45, 12), red, x + 0.95, 1.7, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.CylinderGeometry(0.92, 0.92, 0.35, 12), red, x - 0.65, 1.7, z, 0, 0, Math.PI / 2);
      batchGeo(new THREE.BoxGeometry(0.7, 1.7, 0.1), black, x - 2.45, 1.7, z);
      batchGeo(new THREE.BoxGeometry(0.7, 0.1, 1.7), black, x - 2.45, 1.7, z);
      colliders.push({ minX: x - 3.2, maxX: x + 3.2, minZ: z - 1.9, maxZ: z + 1.9, minY: 0, maxY: 2.8, tall: true });
    }
  }

  /* ---------- 核彈展示牌（黑底黃框 + 輻射標誌 + 型號） ---------- */
  function makeNukeLabelTexture(title, sub) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 236;
    var g = cv.getContext('2d');
    g.fillStyle = '#0e1114';
    g.fillRect(0, 0, 512, 236);
    g.strokeStyle = '#e8c020';
    g.lineWidth = 8;
    g.strokeRect(6, 6, 500, 224);
    /* 左側輻射標誌 */
    g.save();
    g.translate(74, 118);
    g.fillStyle = '#e8c020';
    g.beginPath();
    g.arc(0, 0, 50, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#151515';
    for (var i = 0; i < 3; i++) {
      var a0 = -Math.PI / 2 + i * Math.PI * 2 / 3 - 0.52;
      var a1 = a0 + 1.04;
      g.beginPath();
      g.arc(0, 0, 40, a0, a1);
      g.arc(0, 0, 12, a1, a0, true);
      g.closePath();
      g.fill();
    }
    g.beginPath();
    g.arc(0, 0, 10, 0, Math.PI * 2);
    g.fill();
    g.restore();
    /* 型號與副標題 */
    g.textAlign = 'left';
    g.fillStyle = '#f7c94a';
    g.font = 'bold 56px system-ui, "Microsoft JhengHei"';
    g.fillText(title || '', 142, 105);
    g.fillStyle = '#dfe6ea';
    g.font = 'bold 38px system-ui, "Microsoft JhengHei"';
    g.fillText(sub || '', 142, 168);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- 控制室讀數螢幕 ---------- */
  function makeReadoutTexture(lines, color) {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 132;
    var g = cv.getContext('2d');
    g.fillStyle = '#06120c';
    g.fillRect(0, 0, 256, 132);
    g.fillStyle = 'rgba(40,90,60,.22)';
    for (var sy = 0; sy < 132; sy += 4) g.fillRect(0, sy, 256, 1);
    g.strokeStyle = color;
    g.globalAlpha = 0.8;
    g.lineWidth = 3;
    g.strokeRect(5, 5, 246, 122);
    g.globalAlpha = 1;
    g.textAlign = 'center';
    g.fillStyle = 'rgba(190,255,210,.72)';
    g.font = 'bold 20px system-ui, "Microsoft JhengHei"';
    g.fillText(lines[0] || '', 128, 42);
    g.fillStyle = color;
    g.font = 'bold 42px system-ui, monospace';
    g.fillText(lines[1] || '', 128, 96);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function makeRadSignTexture() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = '#e8c020';
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1a1a1a';
    g.lineWidth = 5;
    g.stroke();
    g.fillStyle = '#151515';
    for (var i = 0; i < 3; i++) {
      var a0 = -Math.PI / 2 + i * Math.PI * 2 / 3 - 0.52;
      var a1 = a0 + 1.04;
      g.beginPath();
      g.arc(64, 64, 46, a0, a1);
      g.arc(64, 64, 14, a1, a0, true);
      g.closePath();
      g.fill();
    }
    g.beginPath();
    g.arc(64, 64, 11, 0, Math.PI * 2);
    g.fill();
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- 反應堆細節：173 燃料棒 / 288 控制棒 / 320 蒸汽管道 ---------- */
  function buildReactorDetail(group, M) {
    var dummy = new THREE.Object3D();
    var R = MAP.reactor;

    /* 南面：深色核心面板 + 173 根發光燃料棒 */
    var panel = new THREE.Mesh(new THREE.BoxGeometry(14.2, 7.2, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0x35545f, emissive: 0x0a2830, emissiveIntensity: 0.35,
        roughness: 0.45, metalness: 0.5
      }));
    panel.position.set(0, 5.0, 4.0);
    group.add(panel);
    var glowMat = new THREE.MeshBasicMaterial({ color: 0x6ff0d0 });
    var glowTop = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.07, 0.12), glowMat);
    glowTop.position.set(0, 8.65, 4.12);
    group.add(glowTop);
    var glowBot = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.07, 0.12), glowMat);
    glowBot.position.set(0, 1.35, 4.12);
    group.add(glowBot);

    var fuelGeo = new THREE.BoxGeometry(0.16, 0.44, 0.07);
    var fuelMat = new THREE.MeshStandardMaterial({
      color: 0x63f0d0, emissive: 0x2fb892, emissiveIntensity: 0.9, roughness: 0.35
    });
    var fuel = new THREE.InstancedMesh(fuelGeo, fuelMat, R.fuelRods);
    for (var f = 0; f < R.fuelRods; f++) {
      dummy.position.set(-6.4 + (f % 17) * 0.8, 2.0 + Math.floor(f / 17) * 0.58, 4.08);
      dummy.updateMatrix();
      fuel.setMatrixAt(f, dummy.matrix);
    }
    fuel.instanceMatrix.needsUpdate = true;
    group.add(fuel);

    /* 核心面板金屬框與橫樑 */
    var beamMat = M.metal;
    for (var by = 2.1; by <= 8.0; by += 1.95) {
      var beam = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.1, 0.26), beamMat);
      beam.position.set(0, by, 4.12);
      group.add(beam);
    }
    for (var bx = -7.15; bx <= 7.15; bx += 14.3) {
      var vbar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 7.5, 0.28), beamMat);
      vbar.position.set(bx, 5.0, 4.12);
      group.add(vbar);
    }
    /* RBMK-1000 標牌 */
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.1),
      new THREE.MeshBasicMaterial({ map: makeReactorSignTexture() }));
    sign.position.set(0, 9.15, 4.12);
    group.add(sign);

    /* 北面：320 條蒸汽管道 */
    var pipeGeo = new THREE.BoxGeometry(0.14, 0.34, 0.09);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0xbcc4cc, roughness: 0.35, metalness: 0.7 });
    var pipes = new THREE.InstancedMesh(pipeGeo, pipeMat, R.steamPipes);
    for (var p = 0; p < R.steamPipes; p++) {
      dummy.position.set(-7.6 + (p % 20) * 0.8, 1.2 + Math.floor(p / 20) * 0.56, -12.06);
      dummy.updateMatrix();
      pipes.setMatrixAt(p, dummy.matrix);
    }
    pipes.instanceMatrix.needsUpdate = true;
    group.add(pipes);

    /* 頂部：288 根控制棒（16 × 18） */
    var rodGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.7, 4);
    var rodMat = new THREE.MeshStandardMaterial({
      color: 0x24282e, roughness: 0.45, metalness: 0.65, emissive: 0x0e0e0e
    });
    var rods = new THREE.InstancedMesh(rodGeo, rodMat, R.controlRods);
    for (var r = 0; r < R.controlRods; r++) {
      dummy.position.set(-7.5 + (r % 16) * 1.0, 12.85, -11.5 + Math.floor(r / 16) * 0.88);
      dummy.updateMatrix();
      rods.setMatrixAt(r, dummy.matrix);
    }
    rods.instanceMatrix.needsUpdate = true;
    group.add(rods);

    /* 頂部控制棒基座 */
    var base = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.18, 15.4), M.metal);
    base.position.set(0, 12.09, -4);
    group.add(base);

    /* 供走馬燈使用的發光材質 */
    window.__CS_REACTOR_FX = {
      fuelMat: fuelMat, pipeMat: pipeMat, rodMat: rodMat,
      panelMat: panel.material, glowMat: glowMat
    };
  }

  function makeReactorSignTexture() {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 118;
    var g = cv.getContext('2d');
    g.fillStyle = '#141414';
    g.fillRect(0, 0, 512, 118);
    g.fillStyle = '#e8c020';
    g.fillRect(0, 0, 512, 8);
    g.fillRect(0, 110, 512, 8);
    g.strokeStyle = '#e8c020';
    g.lineWidth = 4;
    g.strokeRect(12, 14, 488, 90);
    g.fillStyle = '#f2d24a';
    g.font = 'bold 54px system-ui, monospace';
    g.textAlign = 'center';
    g.fillText('RBMK-1000', 256, 72);
    g.fillStyle = 'rgba(242,210,74,.65)';
    g.font = '18px system-ui, "Microsoft JhengHei"';
    g.fillText('反應堆大廳 · 1000 MW', 256, 98);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- 大廳頂部起重機軌道與方形燈 ---------- */
  function buildCrane(group, M) {
    var railMat = M.black;
    var lampMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0 });
    var rails = [-4.2, 4.2];
    for (var i = 0; i < rails.length; i++) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 22), railMat);
      rail.position.set(rails[i], 9.25, -4);
      group.add(rail);
    }
    for (var z = -13; z <= 5; z += 6) {
      var beam = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.3, 0.45), railMat);
      beam.position.set(0, 9.4, z);
      group.add(beam);
      for (var lx = -2.2; lx <= 2.2; lx += 4.4) {
        var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.85), lampMat);
        lamp.position.set(lx, 8.95, z);
        group.add(lamp);
        var cage = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.06, 1.02), railMat);
        cage.position.set(lx, 9.06, z);
        group.add(cage);
      }
    }
  }

  /* ---------- 屋頂梯子（視覺） ---------- */
  function buildLadderVisual(group) {
    var mat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.7 });
    for (var i = 0; i < MAP.ladders.length; i++) {
      var L = MAP.ladders[i];
      var h = L.y1 - L.y0;
      for (var side = -1; side <= 1; side += 2) {
        var rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, h, 0.09), mat);
        rail.position.set(L.x + side * 0.42, L.y0 + h / 2, L.z);
        group.add(rail);
      }
      for (var y = 0.35; y < h; y += 0.5) {
        var rung = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.07, 0.07), mat);
        rung.position.set(L.x, L.y0 + y, L.z);
        group.add(rung);
      }
    }
  }

  /* ---------- 梯子頂端護欄 ---------- */
  function buildRoofLandingRail(group) {
    var mat = new THREE.MeshStandardMaterial({ color: 0x8a9198, roughness: 0.4, metalness: 0.5 });
    var rail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 0.08), mat);
    rail.position.set(8, 10.9, -22.55);
    group.add(rail);
    var sideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 1.3), mat);
    sideL.position.set(7.1, 10.9, -22.0);
    group.add(sideL);
    var sideR = sideL.clone();
    sideR.position.x = 8.9;
    group.add(sideR);
  }

  function buildSky(group) {
    var skyCv = document.createElement('canvas');
    skyCv.width = 32; skyCv.height = 512;
    var skg = skyCv.getContext('2d');
    var skGrad = skg.createLinearGradient(0, 0, 0, 512);
    skGrad.addColorStop(0.00, '#2a7de0');
    skGrad.addColorStop(0.35, '#54a3f5');
    skGrad.addColorStop(0.55, '#9fd2ff');
    skGrad.addColorStop(0.66, '#cfe8ff');
    skGrad.addColorStop(0.80, '#e2eef0');
    skGrad.addColorStop(1.00, '#d2dcde');
    skg.fillStyle = skGrad;
    skg.fillRect(0, 0, 32, 512);
    var skyTex = new THREE.CanvasTexture(skyCv);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(300, 32, 20),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    group.add(sky);

    var cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
    for (var cl = 0; cl < 10; cl++) {
      var ca = cl / 10 * Math.PI * 2 + Math.random() * 0.5;
      var cd = 150 + Math.random() * 80;
      var baseY = 100 + Math.random() * 40;
      for (var pc = 0; pc < 4; pc++) {
        var cloud = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cloudMat);
        cloud.position.set(
          Math.cos(ca) * cd + (Math.random() - 0.5) * 38,
          baseY + (Math.random() - 0.5) * 5,
          Math.sin(ca) * cd + (Math.random() - 0.5) * 26
        );
        cloud.scale.set(12 + Math.random() * 16, 3.5, 9 + Math.random() * 12);
        group.add(cloud);
      }
    }
  }

  /* ---------- 紅色警示燈（會閃爍，部分帶旋轉光束） ---------- */
  /* 反應堆頂部彩色走馬燈：一圈燈珠，顏色隨時間流動 */
  function buildReactorMarquee(group) {
    var pos = [];
    var half = 8, zc = -4, y = 12.32;
    /* 頂部四邊 */
    for (var i = 0; i <= 12; i++) {
      var tx = -half + (16 * i / 12);
      pos.push([tx, y, zc + half]);
      pos.push([tx, y, zc - half]);
    }
    for (var j = 0; j <= 12; j++) {
      var tz = zc - half + (16 * j / 12);
      pos.push([half, y, tz]);
      pos.push([-half, y, tz]);
    }
    /* 南面（玩家最常看到的面）：上下橫向燈帶 + 左右豎向燈帶 */
    var yTop = 11.85, yBot = 1.55, zFace = 4.62;
    for (var k1 = 0; k1 <= 12; k1++) {
      var sx = -half - 0.3 + (16.6 * k1 / 12);
      pos.push([sx, yTop, zFace]);
      pos.push([sx, yBot, zFace]);
    }
    for (var k2 = 0; k2 <= 12; k2++) {
      var sy = yBot + (yTop - yBot) * k2 / 12;
      pos.push([half + 0.75, sy, zFace]);
      pos.push([-half - 0.75, sy, zFace]);
    }
    /* 四個牆面都鋪彩色燈珠：南、北、東、西 */
    var rows = [2.0, 4.2, 6.4, 8.6];
    for (var ri = 0; ri < rows.length; ri++) {
      for (var ci = 0; ci <= 12; ci++) {
        var lx = -7.5 + (15 * ci / 12);
        pos.push([lx, rows[ri], zFace]);       // 南面
        pos.push([lx, rows[ri], -12.62]);      // 北面
      }
    }
    for (var r2 = 0; r2 < rows.length; r2++) {
      for (var c2 = 0; c2 <= 12; c2++) {
        var lz = -11.5 + (15 * c2 / 12);
        pos.push([8.62, rows[r2], lz]);        // 東面
        pos.push([-8.62, rows[r2], lz]);       // 西面
      }
    }
    var count = pos.length;
    var geo = new THREE.SphereGeometry(0.19, 8, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var inst = new THREE.InstancedMesh(geo, mat, count);
    var dummy = new THREE.Object3D();
    var c = new THREE.Color();
    for (var k = 0; k < count; k++) {
      dummy.position.set(pos[k][0], pos[k][1], pos[k][2]);
      dummy.updateMatrix();
      inst.setMatrixAt(k, dummy.matrix);
      c.setHSL(k / count, 1, 0.55);
      inst.setColorAt(k, c);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    group.add(inst);
    return inst;
  }

  function buildBeacons(group) {
    var out = [];
    var baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.16, 8);
    var domeGeo = new THREE.SphereGeometry(0.17, 10, 8);
    var coneGeo = new THREE.ConeGeometry(0.75, 3.2, 10, 1, true);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: 0.6, metalness: 0.5 });
    for (var i = 0; i < MAP.beacons.length; i++) {
      var b = MAP.beacons[i];
      var grp = new THREE.Group();
      grp.position.set(b.x, b.y, b.z);
      var base = new THREE.Mesh(baseGeo, baseMat);
      grp.add(base);
      var domeMat = new THREE.MeshStandardMaterial({
        color: 0xff3a3a, emissive: 0xff1a1a, emissiveIntensity: 1.0,
        roughness: 0.35, metalness: 0.1
      });
      var dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 0.12;
      grp.add(dome);
      var coneGroup = null, coneMat = null;
      if (b.spin) {
        coneGroup = new THREE.Group();
        coneMat = new THREE.MeshBasicMaterial({
          color: 0xff3030, transparent: true, opacity: 0.12,
          depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
        });
        var cone = new THREE.Mesh(coneGeo, coneMat);
        cone.rotation.x = Math.PI / 2;
        cone.position.z = 1.55;
        coneGroup.add(cone);
        grp.add(coneGroup);
      }
      group.add(grp);
      out.push({
        group: grp, domeMat: domeMat, coneGroup: coneGroup, coneMat: coneMat,
        phase: Math.random() * 6.28, spinSpeed: 0.9 + Math.random() * 1.1
      });
    }
    return out;
  }

  /* ---------- A/B 點光柱 ---------- */
  function buildSiteBeams(group) {
    var out = [];
    var defs = [
      { s: MAP.sites.A, color: 0xff4d4d },
      { s: MAP.sites.B, color: 0x4aa8ff }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var beamMat = new THREE.MeshBasicMaterial({
        color: d.color, transparent: true, opacity: 0.022,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
      });
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 16, 1, true), beamMat);
      beam.position.set(d.s.x, 2.55, d.s.z);
      group.add(beam);
      var ringMat = new THREE.MeshBasicMaterial({
        color: d.color, transparent: true, opacity: 0.25,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
      });
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 28), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(d.s.x, 0.08, d.s.z);
      group.add(ring);
      out.push({ beamMat: beamMat, ringMat: ringMat, phase: i * 1.7 });
    }
    return out;
  }

  function makeSiteLabel(ch, site) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var lg = cv.getContext('2d');
    lg.font = 'bold 112px system-ui, sans-serif';
    lg.textAlign = 'center';
    lg.textBaseline = 'middle';
    lg.fillStyle = 'rgba(250,176,48,.55)';
    lg.fillText(ch, 64, 70);
    lg.strokeStyle = 'rgba(250,176,48,.55)';
    lg.lineWidth = 5;
    lg.beginPath(); lg.arc(64, 64, 58, 0, Math.PI * 2); lg.stroke();
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(site.x, 0.04, site.z);
    return mesh;
  }
})();
