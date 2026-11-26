/* bots.js —— 方塊人 BOT：隊伍、角色外觀、多目標 AI */
(function () {
  'use strict';

  var DIFF = {
    easy:   { reaction: 0.95, acc: 0.20, dmgBase: 14, speed: 3.3, viewDist: 26, fireMin: 1.1, fireMax: 1.7 },
    normal: { reaction: 0.62, acc: 0.38, dmgBase: 19, speed: 3.9, viewDist: 34, fireMin: 0.7, fireMax: 1.1 },
    hard:   { reaction: 0.34, acc: 0.60, dmgBase: 27, speed: 4.5, viewDist: 42, fireMin: 0.4, fireMax: 0.7 }
  };

  var BOT_WEAPONS = ['ak47', 'ak47', 'ar15', 'm4a4', 'galil', 'famas', 'mp5', 'ump45', 'p90', 'awp', 'ssg08', 'nova', 'm249'];

  // 角色外觀（全部方塊風，程序生成，不引用官方材質）
  var CHARACTERS = {
    steve:      { skin: '#c9a17a', shirt: '#00afaf', pants: '#3b3b8f', face: 'human', hair: '#3a2a1a', scale: 1 },
    alex:       { skin: '#f2c9a0', shirt: '#6aa15a', pants: '#6b4a2f', face: 'human', hair: '#b5652a', scale: 1 },
    zombie:     { skin: '#5f8f4a', shirt: '#1f9e9e', pants: '#3b3b8f', face: 'zombie', scale: 1 },
    skeleton:   { skin: '#cfcfcf', shirt: '#c0c0c0', pants: '#b0b0b0', face: 'skeleton', scale: 1, thin: true },
    creeper:    { skin: '#5fcf4a', shirt: '#5fcf4a', pants: '#3f9f2f', face: 'creeper', scale: 1 },
    enderman:   { skin: '#1c1c22', shirt: '#1c1c22', pants: '#1c1c22', face: 'enderman', scale: 1.22, thin: true },
    piglin:     { skin: '#d8a0a0', shirt: '#8a6a3a', pants: '#5a3a1a', face: 'piglin', scale: 1 },
    vindicator: { skin: '#b0b0b0', shirt: '#4a4a5a', pants: '#3a3a4a', face: 'vindicator', scale: 1.02 },
    iron_golem: { skin: '#b8b8b8', shirt: '#a0a0a0', pants: '#909090', face: 'iron', scale: 1.45 }
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- P0：BOT 幾何與臉部貼圖全域共享 ---------- */
  var GEO_CACHE = {};
  function sharedBox(w, h, d) {
    var k = 'b' + w + ',' + h + ',' + d;
    if (!GEO_CACHE[k]) GEO_CACHE[k] = new THREE.BoxGeometry(w, h, d);
    return GEO_CACHE[k];
  }
  function sharedCyl(rt, rb, h, seg) {
    var k = 'c' + rt + ',' + rb + ',' + h + ',' + seg;
    if (!GEO_CACHE[k]) GEO_CACHE[k] = new THREE.CylinderGeometry(rt, rb, h, seg);
    return GEO_CACHE[k];
  }
  var FACE_TEX_CACHE = {};
  var CHAR_MAT_TPL = {};
  var GUN_MAT = new THREE.MeshStandardMaterial({ color: 0x202227, roughness: 0.5, metalness: 0.55 });
  /* 背包與裝飾品共享材質（每人一套，幾何全共享） */
  var PACK_MATS = {
    olive: new THREE.MeshStandardMaterial({ color: 0x4f5d38, roughness: 0.95 }),
    black: new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.85 }),
    tan: new THREE.MeshStandardMaterial({ color: 0x9a7b4f, roughness: 0.95 }),
    red: new THREE.MeshStandardMaterial({ color: 0xa83232, roughness: 0.9 }),
    white: new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.95 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.6 })
  };
  /* 寵物亮色材質（全局共享） */
  var PET_MATS = [
    new THREE.MeshStandardMaterial({ color: 0xf0b040, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x50d8ff, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xff8ac0, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x9dffb0, roughness: 0.9 })
  ];
  function charMatTemplate(role, ch) {
    if (!CHAR_MAT_TPL[role]) {
      if (!FACE_TEX_CACHE[role]) FACE_TEX_CACHE[role] = makeFaceTexture(ch);
      CHAR_MAT_TPL[role] = {
        skin: new THREE.MeshStandardMaterial({ color: new THREE.Color(ch.skin), roughness: 0.95 }),
        shirt: new THREE.MeshStandardMaterial({ color: new THREE.Color(ch.shirt), roughness: 0.95 }),
        pants: new THREE.MeshStandardMaterial({ color: new THREE.Color(ch.pants), roughness: 0.95 }),
        face: new THREE.MeshStandardMaterial({ map: FACE_TEX_CACHE[role], roughness: 0.95 }),
        hair: new THREE.MeshStandardMaterial({ color: new THREE.Color(ch.hair || ch.skin), roughness: 0.95 })
      };
    }
    return CHAR_MAT_TPL[role];
  }

  function hitsBox(x, z, r, colliders, footY) {
    var test = function (c) {
      /* BOT 會自動跨過 0.55 公尺以下的台階／地板，不會被 0.1 厚的地板邊緣卡住 */
      if (footY != null && footY >= c.maxY - 0.55) return false;
      if (footY != null && footY + 1.8 <= c.minY + 0.05) return false;
      var cx = Math.max(c.minX, Math.min(x, c.maxX));
      var cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      var dx = x - cx, dz = z - cz;
      return dx * dx + dz * dz < r * r;
    };
    var U = window.CS_MAP_UTIL;
    if (U && U.forEachNearLine) {
      if (U.ensureGrid) U.ensureGrid(colliders);
      return U.forEachNearLine(colliders, x - r, z - r, x + r, z + r, test);
    }
    for (var i = 0; i < colliders.length; i++) if (test(colliders[i])) return true;
    return false;
  }

  function moveXZ(pos, dx, dz, radius, colliders) {
    var nx = pos.x + dx;
    if (!hitsBox(nx, pos.z, radius, colliders, pos.y)) pos.x = nx;
    var nz = pos.z + dz;
    if (!hitsBox(pos.x, nz, radius, colliders, pos.y)) pos.z = nz;
  }

  /* ---------- 臉部像素貼圖 ---------- */
  function makeFaceTexture(ch) {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 16;
    var g = cv.getContext('2d');
    g.fillStyle = ch.skin;
    g.fillRect(0, 0, 16, 16);

    if (ch.face === 'human') {
      g.fillStyle = ch.hair || '#3a2a1a';
      g.fillRect(0, 0, 16, 4);
      g.fillRect(0, 4, 2, 2); g.fillRect(14, 4, 2, 2);
      g.fillStyle = '#fff';
      g.fillRect(3, 6, 4, 3); g.fillRect(9, 6, 4, 3);
      g.fillStyle = '#3a5a8a';
      g.fillRect(4, 7, 2, 2); g.fillRect(10, 7, 2, 2);
      g.fillStyle = '#8a5a3a';
      g.fillRect(6, 11, 4, 1);
    } else if (ch.face === 'zombie') {
      g.fillStyle = '#3d5e30'; g.fillRect(0, 0, 16, 2);
      g.fillStyle = '#2f4a24';
      g.fillRect(3, 5, 3, 3); g.fillRect(10, 5, 3, 3);
      g.fillStyle = '#0e1a08';
      g.fillRect(4, 6, 2, 2); g.fillRect(10, 6, 2, 2);
      g.fillStyle = '#222'; g.fillRect(6, 11, 4, 2);
    } else if (ch.face === 'skeleton') {
      g.fillStyle = '#9a9a9a';
      g.fillRect(3, 5, 3, 3); g.fillRect(10, 5, 3, 3);
      g.fillStyle = '#111';
      g.fillRect(4, 6, 2, 2); g.fillRect(10, 6, 2, 2);
      g.fillStyle = '#777';
      g.fillRect(5, 11, 6, 1);
      for (var t = 0; t < 3; t++) g.fillRect(6 + t * 2, 12, 1, 2);
    } else if (ch.face === 'creeper') {
      g.fillStyle = '#2f7a24';
      g.fillRect(2, 4, 4, 4); g.fillRect(10, 4, 4, 4);
      g.fillRect(6, 8, 4, 3);
      g.fillRect(4, 10, 2, 3); g.fillRect(10, 10, 2, 3);
      g.fillStyle = '#111';
      g.fillRect(3, 5, 3, 3); g.fillRect(10, 5, 3, 3);
      g.fillRect(7, 9, 2, 4);
    } else if (ch.face === 'enderman') {
      g.fillStyle = '#8a4fff';
      g.fillRect(2, 6, 4, 2); g.fillRect(10, 6, 4, 2);
      g.fillStyle = '#d0b0ff';
      g.fillRect(3, 6, 2, 1); g.fillRect(11, 6, 2, 1);
      g.fillStyle = '#4a3a5a';
      g.fillRect(6, 11, 4, 1);
    } else if (ch.face === 'piglin') {
      g.fillStyle = '#8a5a5a';
      g.fillRect(3, 5, 3, 3); g.fillRect(10, 5, 3, 3);
      g.fillStyle = '#fff';
      g.fillRect(4, 6, 1, 1); g.fillRect(11, 6, 1, 1);
      g.fillStyle = '#c08080';
      g.fillRect(6, 9, 4, 3);
      g.fillStyle = '#7a3a3a';
      g.fillRect(7, 10, 1, 1); g.fillRect(9, 10, 1, 1);
    } else if (ch.face === 'vindicator') {
      g.fillStyle = '#7a7a7a';
      g.fillRect(0, 0, 16, 3);
      g.fillStyle = '#4a4a4a';
      g.fillRect(3, 6, 2, 2); g.fillRect(11, 6, 2, 2);
      g.fillStyle = '#666';
      g.fillRect(6, 11, 4, 1);
    } else if (ch.face === 'iron') {
      g.fillStyle = '#8a8a8a';
      g.fillRect(0, 0, 16, 3);
      g.fillStyle = '#c02020';
      g.fillRect(3, 6, 3, 2); g.fillRect(10, 6, 3, 2);
      g.fillStyle = '#777';
      g.fillRect(5, 11, 6, 2);
    }

    var t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- 名字/血條 ---------- */
  /* 敵人頭上的吸粉標語（循環分配，相鄰盡量不同） */
  var BOT_SLOGANS = [
    '點讚 LIKE', '關注 FOLLOW', '分享 SHARE', '三連 LIKE+SUB',
    '來都來了 FOLLOW', '關注不迷路 FOLLOW', '路過點個讚 LIKE',
    '分享給朋友 SHARE', '收藏一下 SAVE', '明天還來 COME BACK',
    '關注看下集 SUB', '點個關注吧 FOLLOW', '手指點一下 TAP',
    '一鍵三連 SUB', '順手分享 SHARE'
  ];
  var botSloganIdx = 0;
  function makeNameSprite(name, team, slogan) {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 96;
    var g = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    var mat = new THREE.SpriteMaterial({ map: tex, depthTest: true, depthWrite: false, transparent: true });
    var sp = new THREE.Sprite(mat);
    sp.scale.set(1.7, 0.64, 1);
    sp.userData = { canvas: cv, ctx: g, tex: tex, name: name, hp: 100, maxHp: 100, team: team, slogan: slogan || '' };
    return sp;
  }

  function drawNameSprite(sp) {
    var cv = sp.userData.canvas, g = sp.userData.ctx;
    g.clearRect(0, 0, cv.width, cv.height);
    /* 血條底 */
    g.fillStyle = 'rgba(0,0,0,.65)';
    g.fillRect(48, 64, 160, 14);
    var hp = Math.max(0, sp.userData.hp) / (sp.userData.maxHp || 100);
    g.fillStyle = hp > 0.5 ? '#5ce07a' : (hp > 0.25 ? '#f0b437' : '#e04343');
    g.fillRect(50, 66, 156 * hp, 10);
    /* 名字 */
    g.font = 'bold 26px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,.6)';
    g.fillText(sp.userData.name, 129, 25);
    g.fillStyle = sp.userData.team === 'blue' ? '#6fb6ff' : '#ffb454';
    g.fillText(sp.userData.name, 128, 24);
    /* 吸粉標語：每個人都不同（循環），描邊保證清晰 */
    if (sp.userData.slogan) {
      g.font = 'bold 17px "Microsoft JhengHei", system-ui, sans-serif';
      g.textAlign = 'center';
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(0,0,0,.92)';
      g.strokeText(sp.userData.slogan, 128, 48);
      g.fillStyle = sp.userData.team === 'blue' ? '#bfe3ff' : '#ffe066';
      g.fillText(sp.userData.slogan, 128, 48);
    }
    sp.userData.tex.needsUpdate = true;
  }

  /* ---------- Bot ---------- */
  function Bot(scene, mapData, opts) {
    opts = opts || {};
    this.mapData = mapData;
    this.team = opts.team || 'orange';
    this.charRole = opts.role || 'zombie';       // 角色外觀（steve / zombie…）
    this.ch = CHARACTERS[this.charRole] || CHARACTERS.zombie;
    this.diff = DIFF[opts.difficulty || 'normal'];
    this.name = opts.name || 'BOT';
    this.maxHp = opts.maxHp || 110;
    this.hp = this.maxHp;
    this.kills = 0;
    this.deaths = 0;
    this.alive = true;
    this.deathT = 0;
    this.isPlayer = false;
    this.role = 'attack';                    // 隊伍角色：attack / defend（拆除模式）
    this.isCarrier = false;
    this.planting = false;
    this.defusing = false;
    this.plantT = 0;
    this.defuseT = 0;
    this.tintT = 0;
    this.paintT = 0;
    this.staggerT = 0;
    this.celebrateT = 0;
    this.celebratePh = 0;
    this.jumpY = 0;
    this.paintColor = 0x39ff6a;
    this.fireKick = 0;

    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.radius = this.ch.scale > 1.3 ? 0.55 : 0.42;
    this.yaw = 0;
    this.walkPhase = Math.random() * 6;
    this.danceStyle = Math.floor(Math.random() * 5);
    this.dancePhase = Math.random() * 6.28;

    this.state = 'patrol';
    this.targetSite = opts.site || (Math.random() < 0.5 ? 'A' : 'B');
    this.path = null;
    this.pathIdx = 0;
    this.repathT = 0;
    this.seeT = 0;
    this.canSee = false;
    this.target = null;
    this.lastSeen = null;
    this.fireT = rand(0.6, 1.4);
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeT = 0;
    this.weaponKey = opts.weaponKey || BOT_WEAPONS[Math.floor(Math.random() * BOT_WEAPONS.length)];
    this.weapon = window.WEAPONS[this.weaponKey];

    var g = new THREE.Group();
    var sc = this.ch.scale || 1;
    var thin = this.ch.thin;
    var w = thin ? 0.18 : 0.25;
    /* P0：材質由角色模板 clone（臉部貼圖與幾何全域共享），槍材質全域共享 */
    var tpl = charMatTemplate(this.charRole, this.ch);
    var skinMat = tpl.skin.clone();
    var shirtMat = tpl.shirt.clone();
    var pantsMat = tpl.pants.clone();
    var gunMat = GUN_MAT;
    var faceMat = tpl.face.clone();
    var hairMat = tpl.hair.clone();

    // 頭
    var headMats = [skinMat, skinMat, hairMat, skinMat, skinMat, faceMat];
    var head = new THREE.Mesh(sharedBox(0.5, 0.5, 0.5), headMats);
    head.position.y = 1.75;
    head.castShadow = true;
    head.userData = { part: 'head', bot: this };
    g.add(head);

    // 身體
    var body = new THREE.Mesh(sharedBox(0.5, 0.75, 0.25), shirtMat);
    body.position.y = 1.125;
    body.castShadow = true;
    body.userData = { part: 'body', bot: this };
    g.add(body);

    // 隊伍臂章 + 頭盔
    var teamColor = this.team === 'blue' ? 0x2a6fe0 : 0xff8a1c;
    var teamMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.7, emissive: teamColor, emissiveIntensity: 0.12 });
    /* 中彈染色 / 漆彈用：保存可改色的材質 */
    this.mats = {
      skin: skinMat, shirt: shirtMat, pants: pantsMat,
      face: faceMat, hair: hairMat, team: teamMat
    };
    this.baseTeamEmissive = teamColor;
    this.baseTeamIntensity = 0.12;
    var helmet = new THREE.Mesh(sharedBox(0.54, 0.12, 0.54), teamMat);
    helmet.position.y = 2.02;
    g.add(helmet);
    var patch = new THREE.Mesh(sharedBox(0.26, 0.1, 0.27), teamMat);
    patch.position.set(-0.375, 1.46, 0);
    g.add(patch);

    function makeArm(x) {
      var grp = new THREE.Group();
      grp.position.set(x, 1.5, 0);
      var sleeve = new THREE.Mesh(sharedBox(w, 0.25, w), shirtMat);
      sleeve.position.y = -0.125;
      grp.add(sleeve);
      var arm = new THREE.Mesh(sharedBox(w, 0.5, w), skinMat);
      arm.position.y = -0.5;
      grp.add(arm);
      return grp;
    }
    var armL = makeArm(-0.24);
    var armR = makeArm(0.24);
    /* 注意：模型臉朝 -Z，手臂要用「正」的 X 旋轉才會向前伸 */
    armL.rotation.x = 1.15; armL.rotation.z = 0.18;
    armR.rotation.x = 1.15; armR.rotation.z = -0.18;
    g.add(armL); g.add(armR);

    function makeLeg(x) {
      var grp = new THREE.Group();
      grp.position.set(x, 0.75, 0);
      var m = new THREE.Mesh(sharedBox(w, 0.75, w), pantsMat);
      m.position.y = -0.375;
      grp.add(m);
      return grp;
    }
    var legL = makeLeg(-0.125);
    var legR = makeLeg(0.125);
    g.add(legL); g.add(legR);

    /* === 背包：6 種不同形狀（每人隨機一款） === */
    var packKind = Math.floor(Math.random() * 6);
    var packMats = [PACK_MATS.olive, PACK_MATS.black, PACK_MATS.tan, PACK_MATS.red];
    var packMat = packMats[packKind % 4];
    if (packKind === 0) {
      /* 標準雙肩包 */
      var pack = new THREE.Mesh(sharedBox(0.38, 0.46, 0.16), packMat);
      pack.position.set(0, 1.16, 0.24);
      pack.castShadow = true;
      g.add(pack);
      var roll0 = new THREE.Mesh(sharedCyl(0.075, 0.075, 0.36, 8), PACK_MATS.tan);
      roll0.rotation.z = Math.PI / 2;
      roll0.position.set(0, 1.45, 0.25);
      g.add(roll0);
    } else if (packKind === 1) {
      /* 高筒背包 */
      var pack1 = new THREE.Mesh(sharedBox(0.32, 0.6, 0.18), packMat);
      pack1.position.set(0, 1.2, 0.25);
      pack1.castShadow = true;
      g.add(pack1);
      var cap1 = new THREE.Mesh(sharedBox(0.34, 0.08, 0.2), PACK_MATS.black);
      cap1.position.set(0, 1.52, 0.25);
      g.add(cap1);
    } else if (packKind === 2) {
      /* 寬扁包（戰術腰包式） */
      var pack2 = new THREE.Mesh(sharedBox(0.5, 0.3, 0.16), packMat);
      pack2.position.set(0, 1.05, 0.24);
      pack2.castShadow = true;
      g.add(pack2);
      var pouch2 = new THREE.Mesh(sharedBox(0.18, 0.16, 0.12), PACK_MATS.black);
      pouch2.position.set(-0.24, 1.05, 0.26);
      g.add(pouch2);
    } else if (packKind === 3) {
      /* 圓筒捲包 */
      var pack3 = new THREE.Mesh(sharedCyl(0.19, 0.19, 0.44, 10), packMat);
      pack3.rotation.z = Math.PI / 2;
      pack3.position.set(0, 1.28, 0.26);
      pack3.castShadow = true;
      g.add(pack3);
    } else if (packKind === 4) {
      /* 雙筒包 */
      var cyl4a = new THREE.Mesh(sharedCyl(0.13, 0.13, 0.4, 8), packMat);
      cyl4a.rotation.z = Math.PI / 2;
      cyl4a.position.set(0, 1.36, 0.26);
      g.add(cyl4a);
      var cyl4b = new THREE.Mesh(sharedCyl(0.13, 0.13, 0.4, 8), PACK_MATS.tan);
      cyl4b.rotation.z = Math.PI / 2;
      cyl4b.position.set(0, 1.16, 0.26);
      g.add(cyl4b);
    } else {
      /* 工具箱（帶提手） */
      var pack5 = new THREE.Mesh(sharedBox(0.44, 0.3, 0.2), PACK_MATS.steel);
      pack5.position.set(0, 1.02, 0.24);
      pack5.castShadow = true;
      g.add(pack5);
      var handle5 = new THREE.Mesh(sharedBox(0.16, 0.05, 0.05), PACK_MATS.black);
      handle5.position.set(0, 1.2, 0.24);
      g.add(handle5);
    }
    /* 肩帶 */
    var strapGeo = sharedBox(0.05, 0.5, 0.03);
    var strapA = new THREE.Mesh(strapGeo, PACK_MATS.black);
    strapA.position.set(-0.13, 1.28, 0.33);
    strapA.rotation.z = 0.18;
    g.add(strapA);
    var strapB = new THREE.Mesh(strapGeo, PACK_MATS.black);
    strapB.position.set(0.13, 1.28, 0.33);
    strapB.rotation.z = -0.18;
    g.add(strapB);
    /* 依款式加掛件 */
    if (packKind === 0) {
      var canteen = new THREE.Mesh(sharedCyl(0.06, 0.06, 0.16, 8), PACK_MATS.steel);
      canteen.position.set(0.24, 1.02, 0.25);
      g.add(canteen);
      var sidePouch = new THREE.Mesh(sharedBox(0.1, 0.14, 0.12), PACK_MATS.olive);
      sidePouch.position.set(-0.23, 1.1, 0.24);
      g.add(sidePouch);
    } else if (packKind === 1) {
      var ant = new THREE.Mesh(sharedCyl(0.012, 0.012, 0.42, 6), PACK_MATS.steel);
      ant.position.set(0.14, 1.62, 0.26);
      g.add(ant);
      var antTip = new THREE.Mesh(sharedBox(0.04, 0.04, 0.04), PACK_MATS.red);
      antTip.position.set(0.14, 1.84, 0.26);
      g.add(antTip);
    } else if (packKind === 2) {
      var wrench = new THREE.Mesh(sharedBox(0.04, 0.18, 0.03), PACK_MATS.steel);
      wrench.position.set(-0.2, 0.98, 0.3);
      g.add(wrench);
      var toolBox = new THREE.Mesh(sharedBox(0.12, 0.1, 0.1), PACK_MATS.steel);
      toolBox.position.set(0.23, 1.0, 0.25);
      g.add(toolBox);
    } else {
      var medBox = new THREE.Mesh(sharedBox(0.12, 0.12, 0.1), PACK_MATS.white);
      medBox.position.set(0.22, 1.0, 0.26);
      g.add(medBox);
    }
    /* 背包後面的大寵物：每人位置、朝向都不同 */
    var petMat = PET_MATS[Math.floor(Math.random() * PET_MATS.length)];
    var petGroup = new THREE.Group();
    var petSide = Math.random() < 0.5 ? -1 : 1;
    petGroup.position.set(
      petSide * (0.12 + Math.random() * 0.1),
      1.5 + Math.random() * 0.24,
      0.33 + Math.random() * 0.12
    );
    petGroup.rotation.y = (Math.random() - 0.5) * 1.6;
    petGroup.rotation.z = (Math.random() - 0.5) * 0.25;
    g.add(petGroup);
    var petBody = new THREE.Mesh(sharedBox(0.26, 0.2, 0.3), petMat);
    petBody.position.set(0, 0, 0);
    petBody.castShadow = true;
    petGroup.add(petBody);
    var petHead = new THREE.Mesh(sharedBox(0.22, 0.18, 0.18), petMat);
    petHead.position.set(0, 0.14, -0.08);
    petGroup.add(petHead);
    var petEarGeo = sharedBox(0.055, 0.09, 0.055);
    var petEarL = new THREE.Mesh(petEarGeo, petMat);
    petEarL.position.set(-0.06, 0.26, -0.08);
    petGroup.add(petEarL);
    var petEarR = new THREE.Mesh(petEarGeo, petMat);
    petEarR.position.set(0.06, 0.26, -0.08);
    petGroup.add(petEarR);
    var petEyeGeo = sharedBox(0.035, 0.035, 0.035);
    var petEyeL = new THREE.Mesh(petEyeGeo, PACK_MATS.black);
    petEyeL.position.set(-0.045, 0.16, -0.165);
    petGroup.add(petEyeL);
    var petEyeR = new THREE.Mesh(petEyeGeo, PACK_MATS.black);
    petEyeR.position.set(0.045, 0.16, -0.165);
    petGroup.add(petEyeR);
    var petTail = new THREE.Mesh(sharedBox(0.06, 0.06, 0.2), petMat);
    petTail.position.set(0, 0.04, 0.16);
    petTail.rotation.x = -0.6;
    petGroup.add(petTail);
    /* 保存寵物引用，供可動畫（眨眼、搖擺、搖尾巴） */
    this.petGroup = petGroup;
    this.petEyeL = petEyeL;
    this.petEyeR = petEyeR;
    this.petTail = petTail;
    this.petBaseY = petGroup.position.y;
    this.petBaseRotZ = petGroup.rotation.z;
    this.petPhase = Math.random() * 6.28;
    this.petStartleT = 0;
    this.petBlinkT = 2 + Math.random() * 4;

    /* 對講耳罩 */
    var earGeo = sharedBox(0.07, 0.09, 0.07);
    var earL2 = new THREE.Mesh(earGeo, PACK_MATS.black);
    earL2.position.set(-0.29, 1.76, 0.02);
    g.add(earL2);
    var earR2 = new THREE.Mesh(earGeo, PACK_MATS.black);
    earR2.position.set(0.29, 1.76, 0.02);
    g.add(earR2);
    /* 護目鏡（臉朝 -Z） */
    var goggles = new THREE.Mesh(sharedBox(0.46, 0.09, 0.03), PACK_MATS.steel);
    goggles.position.set(0, 1.87, -0.255);
    g.add(goggles);
    /* 腰包 */
    var hipPouch = new THREE.Mesh(sharedBox(0.2, 0.1, 0.12), PACK_MATS.black);
    hipPouch.position.set(0.27, 0.86, 0.02);
    g.add(hipPouch);

    // 槍
    var gun = new THREE.Group();
    var gb = new THREE.Mesh(sharedBox(0.08, 0.10, 0.50), gunMat);
    gb.position.set(0, 0, -0.05);
    gun.add(gb);
    var gmag = new THREE.Mesh(sharedBox(0.05, 0.16, 0.08), gunMat);
    gmag.position.set(0, -0.10, 0.02);
    gun.add(gmag);
    var barrel = new THREE.Mesh(sharedCyl(0.018, 0.018, 0.32, 8), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.42);
    gun.add(barrel);
    gun.position.set(0.0, 1.17, -0.66);
    g.add(gun);
    this.gunMesh = gun;

    this.hitMeshes = [body, head];

    this.label = makeNameSprite(this.name, this.team, BOT_SLOGANS[botSloganIdx++ % BOT_SLOGANS.length]);
    this.label.userData.maxHp = this.maxHp;
    this.label.userData.hp = this.maxHp;
    drawNameSprite(this.label);
    this.label.position.y = 2.45;
    g.add(this.label);

    g.scale.setScalar(sc);
    this.mesh = g;
    scene.add(g);

    this.legL = legL;
    this.legR = legR;
    this.armL = armL;
    this.armR = armR;
    this.bodyMesh = body;
    this.headMesh = head;
    this.headBaseY = 1.75;
  }

  Bot.prototype.spawn = function (x, z, yaw, role, carrier) {
    this.pos.set(x, 0, z);
    this.yaw = yaw || 0;
    this.hp = this.maxHp;
    this.alive = true;
    this.deathT = 0;
    this.state = 'patrol';
    this.path = null;
    this.pathIdx = 0;
    this._dest = null;
    this.wander = null;
    this.repathT = 0;
    this.strafeT = 0;
    this.canSee = false;
    this.seeT = 0;
    this.target = null;
    this.lastSeen = null;
    this.fireT = rand(0.8, 1.6);
    this.role = role || this.role || 'attack';
    this.isCarrier = !!carrier;
    this.planting = false;
    this.defusing = false;
    this.plantT = 0;
    this.defuseT = 0;
    this.tintT = 0;
    this.paintT = 0;
    this.staggerT = 0;
    this.celebrateT = 0;
    this.celebratePh = 0;
    this.jumpY = 0;
    this.mesh.visible = true;
    this.mesh.rotation.set(0, this.yaw + Math.PI, 0);
    this.mesh.position.copy(this.pos);
    this.mesh.position.y = 0;
    this.label.visible = true;
    this.label.userData.maxHp = this.maxHp;
    this.label.userData.hp = this.maxHp;
    drawNameSprite(this.label);
    this._hpShown = this.maxHp;
    this.targetSite = Math.random() < 0.5 ? 'A' : 'B';
    this.legL.rotation.x = 0;
    this.legR.rotation.x = 0;
    this.armL.rotation.x = 1.15; this.armL.rotation.z = 0.18;
    this.armR.rotation.x = 1.15; this.armR.rotation.z = -0.18;
    this.clearTint();
  };

  /* ---------- 入場舞：五種不同姿勢，開局展示用 ---------- */
  Bot.prototype.updateDance = function (dt) {
    if (!this.alive) return;
    var t = performance.now() * 0.001 + this.dancePhase;
    var baseYaw = this.yaw + Math.PI;
    var baseY = this.introY || 0;
    var s = this.danceStyle % 7;
    this.mesh.position.x = this.pos.x;
    this.mesh.position.z = this.pos.z;
    this.mesh.rotation.set(0, baseYaw, 0);
    this.bodyMesh.position.y = 1.125;
    this.armL.rotation.set(1.15, 0, 0.18);
    this.armR.rotation.set(1.15, 0, -0.18);
    this.legL.rotation.set(0, 0, 0);
    this.legR.rotation.set(0, 0, 0);
    this.mesh.position.y = baseY;

    if (s === 0) {
      /* 单手揮舞 */
      this.armR.rotation.x = -2.1 + Math.sin(t * 7) * 0.5;
      this.armR.rotation.z = -0.55 + Math.sin(t * 7) * 0.25;
      this.armL.rotation.x = 0.4 + Math.sin(t * 7 + 1.5) * 0.3;
      this.legL.rotation.x = Math.sin(t * 3.2) * 0.18;
      this.legR.rotation.x = -Math.sin(t * 3.2) * 0.18;
    } else if (s === 1) {
      /* 扭腰 + 雙手擺動 */
      this.mesh.rotation.y = baseYaw + Math.sin(t * 2.6) * 0.35;
      this.armL.rotation.x = -1.2 + Math.sin(t * 5) * 0.6;
      this.armR.rotation.x = -1.2 - Math.sin(t * 5) * 0.6;
      this.armL.rotation.z = 0.5;
      this.armR.rotation.z = -0.5;
      this.legL.rotation.x = Math.sin(t * 4) * 0.3;
      this.legR.rotation.x = -Math.sin(t * 4) * 0.3;
    } else if (s === 2) {
      /* 蹦跳 + 舉手 */
      var bounce = Math.abs(Math.sin(t * 4.2));
      this.mesh.position.y = baseY + bounce * 0.38;
      this.armL.rotation.x = -2.4 + bounce * 0.5;
      this.armR.rotation.x = -2.4 + bounce * 0.5;
      this.armL.rotation.z = 0.35;
      this.armR.rotation.z = -0.35;
      this.legL.rotation.x = 0.25 + bounce * 0.35;
      this.legR.rotation.x = 0.25 + bounce * 0.35;
    } else if (s === 3) {
      /* 轉圈 + 張手 */
      this.danceSpin = (this.danceSpin || 0) + dt * 3.2;
      this.mesh.rotation.y = baseYaw + this.danceSpin;
      this.armL.rotation.x = -1.5;
      this.armR.rotation.x = -1.5;
      this.armL.rotation.z = 0.7;
      this.armR.rotation.z = -0.7;
      this.legL.rotation.x = Math.sin(t * 3) * 0.2;
      this.legR.rotation.x = -Math.sin(t * 3) * 0.2;
    } else if (s === 5) {
      /* 地板動作：蹲低、掃腿、單手撐地 */
      this.mesh.position.y = baseY + 0.12 + Math.abs(Math.sin(t * 3)) * 0.12;
      this.bodyMesh.position.y = 0.95;
      this.armL.rotation.x = -0.2;
      this.armL.rotation.z = 1.25;
      this.armR.rotation.x = 0.4 + Math.sin(t * 6) * 0.35;
      this.legL.rotation.x = 0.6 + Math.sin(t * 5) * 0.55;
      this.legR.rotation.x = -0.6 + Math.sin(t * 5 + 1) * 0.55;
      this.mesh.rotation.y = baseYaw + Math.sin(t * 2) * 0.65;
    } else if (s === 6) {
      /* 機械舞：定格、抽動 */
      var step = Math.floor(t * 6) % 2 ? 1 : 0;
      this.armL.rotation.x = step ? -1.8 : -0.4;
      this.armR.rotation.x = step ? -0.4 : -1.8;
      this.armL.rotation.z = step ? 0.6 : 0.1;
      this.armR.rotation.z = step ? -0.1 : -0.6;
      this.legL.rotation.x = step ? 0.35 : -0.2;
      this.legR.rotation.x = step ? -0.2 : 0.35;
      this.mesh.rotation.y = baseYaw + (step ? 0.28 : -0.28);
      this.mesh.position.y = baseY + Math.abs(Math.sin(t * 6)) * 0.09;
    } else {
      /* 左右搖擺 + 蹲起 */
      this.bodyMesh.position.y = 1.125 + Math.sin(t * 5) * 0.07;
      this.armL.rotation.x = -0.7 + Math.sin(t * 5) * 0.55;
      this.armR.rotation.x = -0.7 - Math.sin(t * 5) * 0.55;
      this.armL.rotation.z = 0.35 + Math.sin(t * 2.5) * 0.2;
      this.armR.rotation.z = -0.35 - Math.sin(t * 2.5) * 0.2;
      this.legL.rotation.x = Math.sin(t * 5) * 0.42;
      this.legR.rotation.x = -Math.sin(t * 5) * 0.42;
      this.mesh.position.y = baseY + Math.max(0, Math.sin(t * 5)) * 0.12;
    }
  };

  Bot.prototype.endDance = function () {
    this.danceSpin = 0;
    this.mesh.rotation.set(0, this.yaw + Math.PI, 0);
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.bodyMesh.position.y = 1.125;
    this.armL.rotation.set(1.15, 0, 0.18);
    this.armR.rotation.set(1.15, 0, -0.18);
    this.legL.rotation.set(0, 0, 0);
    this.legR.rotation.set(0, 0, 0);
  };

  Bot.prototype.forward = function () {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  };

  Bot.prototype.canSeeTarget = function (t, mapData) {
    if (!t || !t.alive) return false;
    /* 地下室（隔著樓板）不應被地面 BOT 看到；起重機平台／屋頂仍可被射擊 */
    var ty = t.pos.y || 0;
    if (ty < -1.5 || ty > 12.5) return false;
    var dx = t.pos.x - this.pos.x;
    var dz = t.pos.z - this.pos.z;
    var dist = Math.hypot(dx, dz);
    if (dist > this.diff.viewDist) return false;
    if (dist > 5) {
      var f = this.forward();
      var dot = (f.x * dx + f.z * dz) / (dist || 1);
      if (dot < -0.15) return false;
    }
    if (window.CS_MAP_UTIL.blocked(this.pos.x, this.pos.z, t.pos.x, t.pos.z, mapData.colliders, 1.5)) return false;
    return true;
  };

  Bot.prototype.repath = function (tx, tz) {
    var U = window.CS_MAP_UTIL;
    var wp = this.mapData.roofMode ? this.mapData.roofWaypoints : this.mapData.waypoints;
    var graph = this.mapData.roofMode ? this.mapData.roofGraph : this.mapData.graph;
    var from = U.nearestWaypoint(wp, this.pos.x, this.pos.z);
    var to = U.nearestWaypoint(wp, tx, tz);
    var p = U.findPath(graph, wp, from, to);
    if (p && p.length) {
      this.path = p;
      this.pathIdx = 0;
      /* 已經很接近第一個節點時直接跳過，避免在出生點與最近節點之間來回擺盪 */
      if (p.length > 1) {
        var f0 = wp[p[0]];
        if (Math.hypot(f0.x - this.pos.x, f0.z - this.pos.z) < 2.2) this.pathIdx = 1;
      }
      return true;
    }
    this.path = null;
    return false;
  };

  /* 寵物小動作：身體漂浮搖擺、尾巴搖、隨機眨眼 */
  Bot.prototype.updatePet = function (dt) {
    if (!this.petGroup) return;
    this.petStartleT = Math.max(0, (this.petStartleT || 0) - dt);
    var t = performance.now() * 0.001 + this.petPhase;
    var startle = this.petStartleT > 0 ? Math.sin(t * 40) * 0.25 * (this.petStartleT / 0.5) : 0;
    var hop = Math.max(0, Math.sin(t * 1.4 + this.petPhase) - 0.95) * 0.5;
    this.petGroup.position.y = this.petBaseY + Math.sin(t * 2.6) * 0.025 + hop * 0.05;
    this.petGroup.rotation.z = this.petBaseRotZ + Math.sin(t * 2.1) * 0.1 + startle;
    if (this.petTail) this.petTail.rotation.x = -0.6 + Math.sin(t * 7) * 0.45 + startle * 2;
    this.petBlinkT -= dt;
    if (this.petBlinkT <= 0) {
      var sy = this.petBlinkT > -0.13 ? 0.12 : 1;
      if (this.petEyeL) this.petEyeL.scale.y = sy;
      if (this.petEyeR) this.petEyeR.scale.y = sy;
      if (this.petBlinkT < -0.35) this.petBlinkT = 2.2 + Math.random() * 4;
    }
  };

  Bot.prototype.update = function (dt, player, game) {
    if (window.__CROWD_FREEZE) {
      this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
      return;
    }
    if (!this.alive) {
      this.deathT += dt;
      var k = Math.min(1, this.deathT * 3);
      this.mesh.rotation.z = -Math.PI / 2 * k;
      this.mesh.position.y = this.pos.y - 0.25 * k;
      this.label.visible = false;
      this.updateTint(dt);
      return;
    }
    this.updatePet(dt);

    /* 擊殺／回合勝利慶祝：舉手 + 跳躍，短暫停止移動 */
    if (this.celebrateT > 0) {
      this.updateCelebrate(dt);
      return;
    }

    /* 卡住自救：2 秒內幾乎沒移動又不是在交戰 → 傳送回出生點，避免卡在建築物裡 */
    this._stuckT = (this._stuckT || 0) + dt;
    if (this._stuckT > 2) {
      var movedDist = Math.hypot(this.pos.x - (this._lastStuckX == null ? this.pos.x : this._lastStuckX),
        this.pos.z - (this._lastStuckZ == null ? this.pos.z : this._lastStuckZ));
      if (this._lastStuckX != null && movedDist < 0.3 && !this.canSee && this.staggerT <= 0) {
        var pools = this.team === 'blue' ? this.mapData.spawns.blue : this.mapData.spawns.orange;
        var rsp = pools[Math.floor(Math.random() * pools.length)];
        this.pos.set(rsp.x, 0, rsp.z);
        this.mesh.position.copy(this.pos);
        this.path = null;
        this.repathT = 0;
        this.state = 'patrol';
      }
      this._lastStuckX = this.pos.x;
      this._lastStuckZ = this.pos.z;
      this._stuckT = 0;
    }

    var md = this.mapData;
    if (this.fireKick > 0) this.fireKick = Math.max(0, this.fireKick - dt * 7);
    this.updateTint(dt);
    if (this.staggerT > 0) this.staggerT -= dt;
    this.planting = false;
    this.defusing = false;

    // 收集敵方目標
    var enemies = [];
    if (player && player.alive && player.team !== this.team) enemies.push(player);
    for (var i = 0; i < game.bots.length; i++) {
      var b = game.bots[i];
      if (b !== this && b.alive && b.team !== this.team) enemies.push(b);
    }

    var best = null, bestD = Infinity;
    for (var e = 0; e < enemies.length; e++) {
      if (this.canSeeTarget(enemies[e], md)) {
        var d = Math.hypot(enemies[e].pos.x - this.pos.x, enemies[e].pos.z - this.pos.z);
        if (d < bestD) { bestD = d; best = enemies[e]; }
      }
    }
    this.canSee = !!best;
    this.target = best;
    if (best) {
      this.lastSeen = { x: best.pos.x, z: best.pos.z, t: 0 };
    } else if (this.lastSeen) {
      this.lastSeen.t += dt;
      if (this.lastSeen.t > 6) this.lastSeen = null;
    }

    var moveX = 0, moveZ = 0;
    var speed = this.diff.speed;
    var canAct = this.staggerT <= 0 && !this.planting && !this.defusing;

    if (best) {
      this.state = 'engage';
      this.seeT += dt;
      var dx = best.pos.x - this.pos.x;
      var dz = best.pos.z - this.pos.z;
      var dist = Math.hypot(dx, dz);
      var targetYaw = Math.atan2(dx, dz);
      this.yaw = lerpAngle(this.yaw, targetYaw, 1 - Math.pow(0.0005, dt));

      var f = this.forward();
      this.strafeT -= dt;
      if (this.strafeT <= 0) {
        this.strafeT = rand(0.6, 1.4);
        this.strafeDir *= -1;
      }
      var rx = Math.cos(this.yaw) * this.strafeDir;
      var rz = -Math.sin(this.yaw) * this.strafeDir;
      var ss = speed * 0.55;
      if (dist > 22) { moveX = f.x * speed * 0.9 + rx * ss * 0.4; moveZ = f.z * speed * 0.9 + rz * ss * 0.4; }
      else if (dist < 7) { moveX = -f.x * speed * 0.8 + rx * ss * 0.5; moveZ = -f.z * speed * 0.8 + rz * ss * 0.5; }
      else { moveX = rx * ss; moveZ = rz * ss; }

      this.fireT -= dt;
      if (canAct && this.seeT >= this.diff.reaction && this.fireT <= 0) {
        this.fire(best, dist, game);
        this.fireT = rand(this.diff.fireMin, this.diff.fireMax);
      }
    } else {
      this.state = this.lastSeen ? 'hunt' : 'patrol';
      this.seeT = 0;

      this.planting = false;
      this.defusing = false;

      var dest = null;
      var bomb = game.bomb;
      var defuseMode = game.mode === 'defuse' && !!bomb;

      if (this.lastSeen) {
        dest = { x: this.lastSeen.x, z: this.lastSeen.z };
        if (Math.hypot(dest.x - this.pos.x, dest.z - this.pos.z) < 2.5) {
          this.lastSeen = null;
          dest = null;
        }
      }
      /* 軍備競賽：看不到人時主動往最近的敵人移動，不要縮在點上 */
      if (!dest && game.mode === 'gungame' && enemies.length) {
        var nearestE = null, nearestD = Infinity;
        for (var ei2 = 0; ei2 < enemies.length; ei2++) {
          var dd2 = Math.hypot(enemies[ei2].pos.x - this.pos.x, enemies[ei2].pos.z - this.pos.z);
          if (dd2 < nearestD) { nearestD = dd2; nearestE = enemies[ei2]; }
        }
        if (nearestE) dest = { x: nearestE.pos.x, z: nearestE.pos.z };
      }

      /* 拆除模式：攻方帶包去下包、守方守點／拆包 */
      if (defuseMode) {
        if (this.role === 'defend' && bomb.planted) {
          var bd = Math.hypot(bomb.x - this.pos.x, bomb.z - this.pos.z);
          dest = { x: bomb.x, z: bomb.z };
          if (bd < 2.6) {
            this.defusing = true;
            dest = null;
          }
        } else {
          var site = md.sites[this.targetSite] || md.sites.A;
          var sd = Math.hypot(site.x - this.pos.x, site.z - this.pos.z);
          if (this.role === 'attack' && this.isCarrier) {
            if (sd < 3.8) {
              this.planting = true;
              dest = null;
            } else {
              dest = { x: site.x, z: site.z };
            }
          } else if (sd > 7) {
            dest = { x: site.x, z: site.z };
          } else {
            if (!this.wander || Math.hypot(this.wander.x - this.pos.x, this.wander.z - this.pos.z) < 1.5 ||
                Math.random() < dt * 0.12) {
              var ang = Math.random() * Math.PI * 2;
              var rr = rand(2, 8);
              var wx = site.x + Math.cos(ang) * rr;
              var wz = site.z + Math.sin(ang) * rr;
              if (!hitsBox(wx, wz, 0.6, md.colliders, 0)) this.wander = { x: wx, z: wz };
            }
            dest = this.wander || { x: site.x, z: site.z };
          }
        }
      } else if (!dest) {
        var site2 = (md.roofMode ? md.roofSites : md.sites)[this.targetSite];
        if (!site2 || Math.hypot(site2.x - this.pos.x, site2.z - this.pos.z) > 5) {
          dest = site2 || { x: 0, z: 0 };
        } else {
          if (!this.wander || Math.hypot(this.wander.x - this.pos.x, this.wander.z - this.pos.z) < 1.5 ||
              Math.random() < dt * 0.15) {
            var ang2 = Math.random() * Math.PI * 2;
            var rr2 = rand(2, 8);
            var wx2 = site2.x + Math.cos(ang2) * rr2;
            var wz2 = site2.z + Math.sin(ang2) * rr2;
            if (!hitsBox(wx2, wz2, 0.6, md.colliders, 0)) this.wander = { x: wx2, z: wz2 };
          }
          dest = this.wander || site2;
        }
      }

      if (dest) {
        var needRepath = !this.path || this.pathIdx >= this.path.length;
        if (!this._dest || Math.hypot(dest.x - this._dest.x, dest.z - this._dest.z) > 2.5) needRepath = true;
        if (needRepath) {
          this.repath(dest.x, dest.z);
          this._dest = { x: dest.x, z: dest.z };
        }
        if (this.path && this.pathIdx < this.path.length) {
          var node = md.waypoints[this.path[this.pathIdx]];
          var ndx = node.x - this.pos.x;
          var ndz = node.z - this.pos.z;
          var nd = Math.hypot(ndx, ndz);
          if (nd < 1.5) {
            this.pathIdx++;
          } else {
            moveX = ndx / nd * speed;
            moveZ = ndz / nd * speed;
            this.yaw = lerpAngle(this.yaw, Math.atan2(ndx, ndz), 1 - Math.pow(0.002, dt));
          }
        }
      }
    }

    if (this.staggerT > 0 || this.planting || this.defusing) { moveX = 0; moveZ = 0; }

    moveXZ(this.pos, moveX * dt, moveZ * dt, this.radius, md.colliders);
    var bb = md.bounds;
    if (md.roofMode) {
      this.pos.x = Math.max(-33, Math.min(33, this.pos.x));
      this.pos.z = Math.max(-19, Math.min(21, this.pos.z));
    } else {
      this.pos.x = Math.max(bb.minX + 1, Math.min(bb.maxX - 1, this.pos.x));
      this.pos.z = Math.max(bb.minZ + 1, Math.min(bb.maxZ - 1, this.pos.z));
    }

    for (var j = 0; j < game.bots.length; j++) {
      var o = game.bots[j];
      if (o === this || !o.alive) continue;
      var sx = this.pos.x - o.pos.x, sz = this.pos.z - o.pos.z;
      var sd = Math.hypot(sx, sz);
      var minD = 0.9 + (this.ch.scale > 1.3 ? 0.3 : 0);
      if (sd > 0.001 && sd < minD) {
        this.pos.x += sx / sd * (minD - sd) * 0.5;
        this.pos.z += sz / sd * (minD - sd) * 0.5;
      }
    }

    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.mesh.rotation.y = this.yaw + Math.PI;

    var moving = Math.hypot(moveX, moveZ) > 0.5;
    if (this.planting || this.defusing) {
      this.armL.rotation.x = -1.25;
      this.armR.rotation.x = -1.25;
      this.legL.rotation.x *= 0.8;
      this.legR.rotation.x *= 0.8;
      this.bodyMesh.position.y = 1.08;
    } else if (moving) {
      this.walkPhase += dt * 9;
      var sw = Math.sin(this.walkPhase) * 0.5;
      this.legL.rotation.x = sw;
      this.legR.rotation.x = -sw;
      this.armL.rotation.x = 1.15 + sw * 0.18;
      this.armR.rotation.x = 1.15 - sw * 0.18;
      this.bodyMesh.position.y = 1.125 + Math.abs(Math.sin(this.walkPhase)) * 0.02;
    } else {
      this.legL.rotation.x *= 0.85;
      this.legR.rotation.x *= 0.85;
      this.armL.rotation.x += (1.15 - this.armL.rotation.x) * 0.2;
      this.armR.rotation.x += (1.15 - this.armR.rotation.x) * 0.2;
    }

    if (this._hpShown !== this.hp) {
      this._hpShown = this.hp;
      this.label.userData.hp = this.hp;
      drawNameSprite(this.label);
    }
  };

  /* ---------- 著色 / 漆彈 / 擊殺慶祝 ---------- */
  Bot.prototype.setTint = function (hex, intensity) {
    var mats = this.mats;
    if (!mats) return;
    var keys = ['skin', 'shirt', 'pants', 'face', 'hair'];
    for (var i = 0; i < keys.length; i++) {
      var m = mats[keys[i]];
      if (!m) continue;
      if (hex == null) m.emissive.setHex(0x000000);
      else m.emissive.setHex(hex);
      m.emissiveIntensity = intensity == null ? 0 : intensity;
    }
    if (mats.team) {
      if (hex == null) {
        mats.team.emissive.setHex(this.baseTeamEmissive || 0x000000);
        mats.team.emissiveIntensity = this.baseTeamIntensity || 0.12;
      } else {
        mats.team.emissive.setHex(hex);
        mats.team.emissiveIntensity = intensity == null ? 0.5 : intensity;
      }
    }
  };

  Bot.prototype.clearTint = function () {
    this.tintT = 0;
    this.paintT = 0;
    this.setTint(null, 0);
  };

  Bot.prototype.flashTint = function () {
    this.tintT = 0.16;
  };

  Bot.prototype.applyPaint = function () {
    this.paintT = 8;
    this.tintT = 0.2;
  };

  Bot.prototype.updateTint = function (dt) {
    if (this.paintT > 0) this.paintT -= dt;
    if (this.tintT > 0) this.tintT -= dt;
    if (this.paintT > 0) {
      var pulse = 0.55 + Math.sin(performance.now() * 0.011) * 0.18;
      this.setTint(this.paintColor || 0x39ff6a, pulse);
    } else if (this.tintT > 0) {
      this.setTint(0xffffff, 0.55 * Math.min(1, this.tintT / 0.16));
    } else {
      this.setTint(null, 0);
    }
  };

  Bot.prototype.celebrate = function () {
    if (!this.alive) return;
    this.celebrateT = 1.15;
    this.celebratePh = 0;
    this.planting = false;
    this.defusing = false;
    this.plantT = 0;
    this.defuseT = 0;
    this.setTint(null, 0);
  };

  Bot.prototype.updateCelebrate = function (dt) {
    var t = Math.max(0, this.celebrateT);
    this.celebrateT -= dt;
    this.celebratePh += dt;
    var jump = Math.abs(Math.sin(this.celebratePh * 7.5)) * 0.36 * Math.min(1, t * 3);
    this.jumpY = jump;
    this.mesh.position.set(this.pos.x, this.pos.y + jump, this.pos.z);
    this.mesh.rotation.y = this.yaw + Math.PI;
    this.mesh.rotation.z = 0;
    this.armL.rotation.x = -2.45 + Math.sin(this.celebratePh * 13) * 0.22;
    this.armR.rotation.x = -2.45 - Math.sin(this.celebratePh * 13) * 0.22;
    this.armL.rotation.z = 0.32;
    this.armR.rotation.z = -0.32;
    this.legL.rotation.x = 0.18;
    this.legR.rotation.x = -0.18;
    this.label.visible = true;
    this.updateTint(dt);
    if (this.celebrateT <= 0) {
      this.jumpY = 0;
      this.mesh.position.y = this.pos.y;
      this.armL.rotation.z = 0.18;
      this.armR.rotation.z = -0.18;
      this.armL.rotation.x = 1.15;
      this.armR.rotation.x = 1.15;
    }
  };

  Bot.prototype.fire = function (target, dist, game) {
    var d = this.diff;
    var w = this.weapon;
    this.fireKick = 1;
    game.playBotShot(this, w.sound);
    var distFactor = Math.max(0.35, 1 - dist / (d.viewDist * 1.5));
    var hitChance = d.acc * distFactor * (w.type === 'sniper' ? 1.25 : 1);
    if (Math.random() > hitChance) return;

    var isHead = Math.random() < (game.difficulty === 'hard' ? 0.16 : 0.08);
    var dmg = d.dmgBase * rand(0.75, 1.15);
    if (w.type === 'sniper') dmg *= 1.5;
    if (isHead) dmg *= 2.0;

    if (target.isPlayer) {
      target.hurt(Math.round(dmg), isHead ? 'head' : 'body', this);
    } else {
      var dx = target.pos.x - this.pos.x, dz = target.pos.z - this.pos.z;
      var dl = Math.hypot(dx, dz) || 1;
      var killed = target.takeDamage(Math.round(dmg), isHead ? 'head' : 'body', { x: dx / dl, z: dz / dl });
      if (killed) game.onBotKilled(this, target);
    }
  };

  Bot.prototype.takeDamage = function (dmg, part, dir) {
    if (!this.alive) return false;
    var mul = part === 'head' ? 4 : (part === 'legs' ? 0.75 : 1);
    this.hp -= dmg * mul;
    this.petStartleT = 0.5;
    this.flashTint();
    /* 輕微擊退 + 短硬直，讓命中更有頓挫感 */
    if (dir) {
      var kb = Math.min(0.55, 0.10 + dmg * 0.005);
      var nx = this.pos.x + dir.x * kb;
      var nz = this.pos.z + dir.z * kb;
      if (!hitsBox(nx, nz, this.radius, this.mapData.colliders, this.pos.y)) {
        this.pos.x = nx;
        this.pos.z = nz;
        this.mesh.position.x = nx;
        this.mesh.position.z = nz;
      }
      this.staggerT = 0.12;
    }
    this._hpShown = this.hp;
    this.label.userData.hp = Math.max(0, this.hp);
    drawNameSprite(this.label);
    if (this.hp <= 0) {
      this.alive = false;
      this.deathT = 0;
      this.celebrateT = 0;
      this.planting = false;
      this.defusing = false;
      return true;
    }
    return false;
  };

  Bot.prototype.explodeDamage = function (dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.petStartleT = 0.6;
    this.flashTint();
    this._hpShown = this.hp;
    this.label.userData.hp = Math.max(0, this.hp);
    drawNameSprite(this.label);
    if (this.hp <= 0) {
      this.alive = false;
      this.deathT = 0;
      this.celebrateT = 0;
      return true;
    }
    return false;
  };

  function lerpAngle(a, b, t) {
    var d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * Math.min(1, t);
  }

  window.CS_BOT = Bot;
  window.CS_CHARACTERS = CHARACTERS;
  window.CS_BOT_UTIL = { hitsBox: hitsBox, moveXZ: moveXZ };
})();
