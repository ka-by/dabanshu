/* game.js —— 方塊突擊 RBMK-1000 V1 主邏輯 */
(function () {
  'use strict';

  function showErr(msg) {
    var el = document.getElementById('loaderr');
    el.style.display = 'block';
    el.textContent += msg + '\n';
    console.error(msg);
  }
  window.addEventListener('error', function (e) {
    showErr('[JS] ' + e.message + '\n  ' + (e.filename || '') + ':' + (e.lineno || ''));
  });

  var SELFTEST = /[?&]selftest=1/.test(location.search);
  var SHOT = /[?&]shot=1/.test(location.search);
  var MOVIE = /[?&]movie=1/.test(location.search);
  var ORBIT = /[?&]orbit=1/.test(location.search);
  var TEST = /[?&]test=1/.test(location.search) || SELFTEST || SHOT || MOVIE;

  /* 玩家名稱（顯示在計分板 / 結算排名 / 擊殺訊息） */
  var PLAYER_NAME = 'abcdiq180大番薯';

  function $(id) { return document.getElementById(id); }
  var canvas = $('c');
  var elHUD = $('hud'), elCross = $('crosshair'), elHit = $('hitmarker');
  var elHP = $('hp'), elAP = $('ap'), elAmmo = $('ammo'), elWeapon = $('weaponName');
  var elReload = $('reloadTxt'), elMoney = $('money'), elHint = $('hint');
  var elKillfeed = $('killfeed'), elCenter = $('centerMsg');
  var elAnnounce = $('announce'), elAnnounceTxt = $('announceTxt');
  var elRadio = $('radio'), elRadioBody = $('radioBody');
  var elScoreboard = $('scoreboard'), elSbCols = $('sbCols');
  var elIntro = $('introLabel'), elIntroTeam = $('introTeam');
  var elScoreCT = $('scoreCT'), elScoreT = $('scoreT');
  var elTimer = $('roundTimer'), elRound = $('roundNo');
  var elDmgFlash = $('dmgFlash'), elLowHp = $('lowHp'), elScope = $('scope'), elRadOverlay = $('radOverlay');
  var elBombHud = $('bombHud'), elBombTimer = $('bombTimer');
  var elRoleTag = $('roleTag'), elCarrierHud = $('carrierHud'), elPaintHud = $('paintHud');
  var elMenu = $('menu'), elBuy = $('buy'), elPause = $('pause'), elEnd = $('end');
  var radarCv = $('radar'), radarCtx = radarCv.getContext('2d');
  var elFps = $('fps'), fpsOn = false, fpsFrames = 0, fpsAcc = 0;
  var elMovieBadge = $('movieBadge'), elMovieCam = $('movieCam');
  var elSceneLabel = $('sceneLabel'), elSceneNo = $('sceneNo'), elSceneName = $('sceneName');

  var ROUND_TIME = 100;
  var BUY_TIME = 10;
  var WIN_ROUNDS = 5;
  var DEFUSE_FUSE = 40;
  var BOMB_DEFUSE_TIME = 3.5;
  var BOMB_PLANT_TIME = 3.0;
  var PLAYER_MAX_HP = 120;       // 血量略高
  var HAPPY_HP = 20000;          // 快樂模式：玩家兩萬血、一打一百、無限機槍彈
  var HAPPY_ENEMIES = 100;
  /* 彈道曳光池（需在 buildMap 之前就存在） */
  var tracerPool = [];
  var TRACER_COLORS = {};
  var TRACER_LIFE = 0.16;
  var muzzleTmp = new THREE.Vector3();
  var BOT_MAX_HP = 110;
  var MAX_MONEY = 999999;
  var GRAVITY = 20;
  var JUMP_V = 7.2;
  var PLAYER_R = 0.38;
  var EYE_STAND = 1.62, EYE_CROUCH = 1.12;

  var scene, camera, renderer, clock;
  var mapData = null;
  var player, bots = [];
  var viewRoot, viewModels = {}, flashRoot, flashSprite;
  var gameState = 'menu';
  var prevState = null;
  var roundNo = 1, scoreBlue = 0, scoreOrange = 0;
  var roundTimer = ROUND_TIME, buyTimer = BUY_TIME;
  var mode = 'elim';
  var difficulty = 'normal';
  var radMode = false;
  var roofMode = false;   // 天台對戰場景
  var ROOF_SPAWNS = {
    blue: [
      { x: -20, z: 12 }, { x: -26, z: 6 }, { x: -28, z: 16 }, { x: -14, z: 8 }, { x: -22, z: 20 },
      { x: -30, z: 2 }, { x: -16, z: 18 }, { x: -24, z: -2 }, { x: -12, z: 14 }, { x: -32, z: 10 }
    ],
    orange: [
      { x: 20, z: 12 }, { x: 26, z: 6 }, { x: 28, z: 16 }, { x: 14, z: 8 }, { x: 22, z: 20 },
      { x: 30, z: 2 }, { x: 16, z: 18 }, { x: 24, z: -2 }, { x: 12, z: 14 }, { x: 32, z: 10 }
    ]
  };
  var ROOF_Y = 10.4;
  var roundResolved = false;
  var roundEndT = 0;
  var playerDeathT = 0;
  var buyOpen = false;
  var pointerLocked = false;
  var keys = {};
  var stats = { kills: 0, headshots: 0, deaths: 0, roundsWon: 0 };
  var grenades = [];
  var decals = [];
  var elapsed = 0;
  var menuCamAngle = 0;
  var hallBlockers = [];
  var hallBlockTimer = 0;
  var bomb = { planted: false, x: 0, z: 0, timer: 0, mesh: null, carrier: null, defuseT: 0, site: 'A', plantT: 0 };
  var attackTeam = 'orange';        // 拆除模式的攻方（每回合輪換）

  /* ---------- V3 新玩法：軍備競賽（Gun Game） ---------- */
  var GG_LADDER = ['glock', 'usp', 'tec9', 'fiveseven', 'mp5', 'ump45', 'p90',
    'famas', 'galil', 'ak47', 'm4a4', 'aug', 'ssg08', 'awp', 'knife'];
  var ggPlayerLevel = 0;
  var playerHasBomb = false;
  var plantT = 0;
  var hitStopT = 0;
  var hitStopCd = 0;
  var playerCelebrateT = 0;
  var glassShards = [];
  var paintSplats = [];
  var radParticles = [];
  var radCracks = [];
  var radLight = null;
  var fireParticles = [];
  var radAcc = 0;
  var lastLockHint = -999;
  var lastPlantTick = -9;
  var lastPaintToast = -9;
  var elevatorCd = 0;
  var lastElevHint = -9;

  /* ---------- 錄影／AI 代打模式 ---------- */
  var movieStarted = false;
  var movieStart = 0;
  var movieStar = null;
  var movieSwitchT = 0;
  var movieEvents = [];
  var movieRecorder = null;
  var movieChunks = [];
  var movieRadDone = false;
  var movieDone = false;
  var movieLookYaw = 0;
  var movieLookPitch = -0.02;
  var movieTourT = 0;
  var movieTourIndex = 0;
  var movieTourScene = null;

  /* ---------- 合照模式（P 鍵） ---------- */
  var photoMode = false;
  var photoFrozen = false;
  var photoOldFov = 0;
  var photoArranged = 0;
  var photoDist = 4.4;
  var photoHeight = 1.8;
  var photoFov = 75;
  var photoSnapFlashT = 0;
  var photoHudWasHidden = false;

  var BLUE_ROLES = ['steve', 'alex', 'enderman', 'iron_golem', 'alex', 'steve', 'enderman', 'iron_golem', 'alex'];
  var BLUE_NAMES = ['方塊老爹', '小方同學', '瘦高影子', '鐵壁大哥', '藍帽小工', '藍帽技師', '藍帽隊長', '藍帽學徒', '藍帽守衛'];
  var ORANGE_ROLES = ['zombie', 'skeleton', 'creeper', 'piglin', 'vindicator', 'zombie', 'skeleton', 'creeper', 'piglin', 'vindicator'];
  var ORANGE_NAMES = ['夜貓子', '骨頭隊長', '悶聲大哥', '金幣獵人', '硬核教練', '橙帽小兵', '橙帽工頭', '橙帽夜巡', '橙帽打手', '橙帽新丁'];

  /* ---------- 渲染初始化 ---------- */
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  /* 1.0 像素比：高 DPI 螢幕上更順，方塊風也不需要 1.5 倍解析度 */
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  scene = new THREE.Scene();
  window.__SCENE = scene;
  scene.background = new THREE.Color(0xd6e6e8);
  scene.fog = new THREE.Fog(0xd0dedf, 80, 200);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 460);
  window.__CAMERA = camera;
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  clock = new THREE.Clock();

  /* ---------- Bloom 輝光後處理（自寫，無外部依賴） ---------- */
  var bloomEnabled = !/[?&]nobloom=1/.test(location.search);
  var bloomFx = null;
  function setupBloom() {
    var w = Math.max(2, renderer.domElement.width);
    var h = Math.max(2, renderer.domElement.height);
    var sceneRT = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: true, stencilBuffer: false
    });
    var bw = Math.max(2, Math.floor(w / 4)), bh = Math.max(2, Math.floor(h / 4));
    var rtOpt = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false };
    var b1 = new THREE.WebGLRenderTarget(bw, bh, rtOpt);
    var b2 = new THREE.WebGLRenderTarget(bw, bh, rtOpt);
    var b3 = new THREE.WebGLRenderTarget(bw, bh, rtOpt);
    var quadScene = new THREE.Scene();
    var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    quad.frustumCulled = false;
    quadScene.add(quad);
    var vert = 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    var brightMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, threshold: { value: 0.45 } },
      vertexShader: vert,
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float threshold; varying vec2 vUv;\n' +
        'void main(){\n' +
        '  vec4 c = texture2D(tDiffuse, vUv);\n' +
        '  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));\n' +
        '  float k = smoothstep(threshold, threshold + 0.25, l);\n' +
        '  gl_FragColor = vec4(c.rgb * k, 1.0);\n' +
        '}',
      depthTest: false, depthWrite: false
    });
    var blurMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1 / 512, 0) } },
      vertexShader: vert,
      fragmentShader: 'uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;\n' +
        'void main(){\n' +
        '  vec4 c = texture2D(tDiffuse, vUv) * 0.227027;\n' +
        '  c += texture2D(tDiffuse, vUv + dir * 1.5) * 0.316216;\n' +
        '  c += texture2D(tDiffuse, vUv - dir * 1.5) * 0.316216;\n' +
        '  c += texture2D(tDiffuse, vUv + dir * 3.5) * 0.070270;\n' +
        '  c += texture2D(tDiffuse, vUv - dir * 3.5) * 0.070270;\n' +
        '  gl_FragColor = c;\n' +
        '}',
      depthTest: false, depthWrite: false
    });
    var compMat = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: null }, tBloom: { value: null }, strength: { value: 1.1 } },
      vertexShader: vert,
      fragmentShader: 'uniform sampler2D tScene; uniform sampler2D tBloom; uniform float strength; varying vec2 vUv;\n' +
        'void main(){\n' +
        '  vec4 s = texture2D(tScene, vUv);\n' +
        '  vec4 b = texture2D(tBloom, vUv);\n' +
        '  vec3 c = max(s.rgb + b.rgb * strength, vec3(0.0));\n' +
        '  vec3 srgb = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));\n' +
        '  gl_FragColor = vec4(srgb, 1.0);\n' +
        '}',
      depthTest: false, depthWrite: false
    });
    bloomFx = { sceneRT: sceneRT, b1: b1, b2: b2, b3: b3, quadScene: quadScene, quadCam: quadCam, quad: quad,
      brightMat: brightMat, blurMat: blurMat, compMat: compMat };
  }
  function renderFrame() {
    if (!bloomFx || !bloomEnabled) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }
    var fx = bloomFx;
    renderer.setRenderTarget(fx.sceneRT);
    renderer.render(scene, camera);
    fx.quad.material = fx.brightMat;
    fx.brightMat.uniforms.tDiffuse.value = fx.sceneRT.texture;
    renderer.setRenderTarget(fx.b1);
    renderer.render(fx.quadScene, fx.quadCam);
    fx.quad.material = fx.blurMat;
    fx.blurMat.uniforms.tDiffuse.value = fx.b1.texture;
    fx.blurMat.uniforms.dir.value.set(1 / fx.b1.width, 0);
    renderer.setRenderTarget(fx.b2);
    renderer.render(fx.quadScene, fx.quadCam);
    fx.blurMat.uniforms.tDiffuse.value = fx.b2.texture;
    fx.blurMat.uniforms.dir.value.set(0, 1 / fx.b1.height);
    renderer.setRenderTarget(fx.b3);
    renderer.render(fx.quadScene, fx.quadCam);
    fx.quad.material = fx.compMat;
    fx.compMat.uniforms.tScene.value = fx.sceneRT.texture;
    fx.compMat.uniforms.tBloom.value = fx.b3.texture;
    renderer.setRenderTarget(null);
    renderer.render(fx.quadScene, fx.quadCam);
  }
  setupBloom();


  var hemi = new THREE.HemisphereLight(0xcfe0ff, 0x8a7a66, 0.9);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffe6c4, 2.3);
  sun.position.set(46, 60, -38);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0xbfd4ff, 0.2);
  fill.position.set(-20, 30, -25);
  scene.add(fill);
  /* 南面補光：讓入口白色工業建築與草地更亮、更卡通 */
  var fillSouth = new THREE.DirectionalLight(0xffe2c8, 0.38);
  fillSouth.position.set(8, 28, 62);
  scene.add(fillSouth);
  scene.add(new THREE.AmbientLight(0xdfe8ff, 0.12));

  mapData = window.buildMap(scene);
  initTracers();

  viewRoot = new THREE.Group();
  viewRoot.position.set(0.19, -0.20, -0.46);
  viewRoot.rotation.y = -0.04;
  camera.add(viewRoot);

  flashRoot = new THREE.Group();
  camera.add(flashRoot);
  flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: window.makeFlashTexture(), transparent: true, depthTest: false, blending: THREE.AdditiveBlending
  }));
  flashSprite.scale.set(0.34, 0.34, 1);
  flashSprite.visible = false;
  flashRoot.add(flashSprite);

  /* 煙霧 / 彈殼 */
  var puffTex = (function () {
    var s = 64, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(232,228,220,.6)');
    grd.addColorStop(0.45, 'rgba(214,208,198,.24)');
    grd.addColorStop(1, 'rgba(200,196,188,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  var fireTex = (function () {
    var s = 64, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,245,190,1)');
    grd.addColorStop(0.3, 'rgba(255,170,40,.9)');
    grd.addColorStop(0.7, 'rgba(220,80,10,.4)');
    grd.addColorStop(1, 'rgba(150,40,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  /* ---------- P0：粒子與彈殼固定池（不再無限生成／銷毀 Mesh） ---------- */
  var PUFF_POOL = 64, SHELL_POOL = 32;
  var puffSlots = [], puffCursor = 0;
  function initPuffPool() {
    for (var i = 0; i < PUFF_POOL; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: puffTex, transparent: true, depthWrite: false, opacity: 0
      }));
      sp.visible = false;
      scene.add(sp);
      puffSlots.push({ sprite: sp, life: 0, max: 0.38, s0: 0.22, active: false });
    }
  }
  function spawnPuff(pos, scale) {
    var p = null;
    for (var i = 0; i < puffSlots.length; i++) {
      var q = puffSlots[(puffCursor + i) % puffSlots.length];
      if (!q.active) { p = q; puffCursor = (puffCursor + i + 1) % puffSlots.length; break; }
    }
    if (!p) { p = puffSlots[puffCursor]; puffCursor = (puffCursor + 1) % puffSlots.length; }
    var s0 = scale || 0.22;
    p.active = true;
    p.life = p.max;
    p.s0 = s0;
    p.sprite.visible = true;
    p.sprite.position.copy(pos);
    p.sprite.scale.set(s0, s0, 1);
    p.sprite.material.opacity = 0.55;
  }
  function updatePuffs(dt) {
    for (var i = 0; i < puffSlots.length; i++) {
      var p = puffSlots[i];
      if (!p.active) continue;
      p.life -= dt;
      var t = 1 - p.life / p.max;
      var s = p.s0 * (1 + t * 2.4);
      p.sprite.scale.set(s, s, 1);
      p.sprite.material.opacity = 0.55 * (1 - t);
      if (p.life <= 0) {
        p.active = false;
        p.sprite.visible = false;
      }
    }
  }

  var shellGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.045, 6);
  var shellMat = new THREE.MeshStandardMaterial({ color: 0xc9a548, metalness: 0.85, roughness: 0.3 });
  var shellSlots = [], shellCursor = 0;
  function initShellPool() {
    for (var i = 0; i < SHELL_POOL; i++) {
      var m = new THREE.Mesh(shellGeo, shellMat);
      m.visible = false;
      scene.add(m);
      shellSlots.push({ mesh: m, vel: new THREE.Vector3(), life: 0, active: false });
    }
  }
  function spawnShell() {
    var s = null;
    for (var i = 0; i < shellSlots.length; i++) {
      var q = shellSlots[(shellCursor + i) % shellSlots.length];
      if (!q.active) { s = q; shellCursor = (shellCursor + i + 1) % shellSlots.length; break; }
    }
    if (!s) { s = shellSlots[shellCursor]; shellCursor = (shellCursor + 1) % shellSlots.length; }
    s.active = true;
    s.life = 1.2;
    var m = s.mesh;
    m.visible = true;
    var right = new THREE.Vector3(-Math.cos(player.yaw), 0, Math.sin(player.yaw));
    var pos = camera.position.clone().addScaledVector(right, 0.22);
    pos.y -= 0.14;
    m.position.copy(pos);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    s.vel.copy(right).multiplyScalar(2.2 + Math.random() * 1.4);
    s.vel.y = 2.0 + Math.random() * 1.4;
    s.spin = (Math.random() - 0.5) * 24;
  }
  function updateShells(dt) {
    for (var i = 0; i < shellSlots.length; i++) {
      var s = shellSlots[i];
      if (!s.active) continue;
      s.life -= dt;
      s.vel.y -= 18 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.rotation.x += s.spin * dt;
      if (s.mesh.position.y < 0.03 || s.life <= 0) {
        s.active = false;
        s.mesh.visible = false;
      }
    }
  }
  initPuffPool();
  initShellPool();

  /* ---------- 玩家身體模型 + 肩上鸚鵡（第三人稱可見） ---------- */
  var camMode = 0;   // 0=第一人稱 1=背後 2=正面
  var playerOutfit = 'blue';
  var petKind = 'parrot';
  var _uq = new URLSearchParams(location.search);
  if (_uq.get('outfit')) playerOutfit = _uq.get('outfit');
  if (_uq.get('pet')) petKind = _uq.get('pet');
  var playerBody = null;
  function makePet(kind) {
    kind = kind || 'parrot';
    var p = new THREE.Group();
    var bodyC = 0x3fae4a;
    if (kind === 'cat') bodyC = 0x8a8f96;
    else if (kind === 'dog') bodyC = 0x9a6a3a;
    else if (kind === 'chicken') bodyC = 0xf0f0e8;
    var bodyMat = new THREE.MeshStandardMaterial({ color: bodyC, roughness: 0.85 });
    var redMat = new THREE.MeshStandardMaterial({ color: 0xd83a3a, roughness: 0.85 });
    var yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc33, roughness: 0.85 });
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.22), bodyMat);
    body.position.y = 0.11;
    p.add(body);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.14), bodyMat);
    head.position.set(0, 0.27, -0.06);
    p.add(head);
    var eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.02), whiteMat);
    eyeL.position.set(-0.035, 0.29, -0.135);
    p.add(eyeL);
    var eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.02), whiteMat);
    eyeR.position.set(0.035, 0.29, -0.135);
    p.add(eyeR);
    var pupL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.012), darkMat);
    pupL.position.set(-0.035, 0.29, -0.145);
    p.add(pupL);
    var pupR = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.012), darkMat);
    pupR.position.set(0.035, 0.29, -0.145);
    p.add(pupR);
    var limbL = null, limbR = null, tail = null;
    if (kind === 'parrot') {
      var beak = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.09), yellowMat);
      beak.position.set(0, 0.26, -0.16);
      p.add(beak);
      limbL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.16), redMat);
      limbL.position.set(-0.095, 0.12, 0);
      p.add(limbL);
      limbR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.16), redMat);
      limbR.position.set(0.095, 0.12, 0);
      p.add(limbR);
      var blueMat = new THREE.MeshStandardMaterial({ color: 0x3f7fe0, roughness: 0.85 });
      tail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.03, 0.36), redMat);
      tail.position.set(0, 0.02, 0.24);
      p.add(tail);
      var t2 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.028, 0.32), yellowMat);
      t2.position.set(-0.055, 0.035, 0.22);
      t2.rotation.y = 0.18;
      p.add(t2);
      var t3 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.028, 0.32), blueMat);
      t3.position.set(0.055, 0.035, 0.22);
      t3.rotation.y = -0.18;
      p.add(t3);
      var cheekL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.015), redMat);
      cheekL.position.set(-0.07, 0.25, -0.125);
      p.add(cheekL);
      var cheekR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.015), redMat);
      cheekR.position.set(0.07, 0.25, -0.125);
      p.add(cheekR);
    } else if (kind === 'cat') {
      var earL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.03), bodyMat);
      earL.position.set(-0.05, 0.37, -0.06);
      p.add(earL);
      var earR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.03), bodyMat);
      earR.position.set(0.05, 0.37, -0.06);
      p.add(earR);
      tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.2), bodyMat);
      tail.position.set(0, 0.18, 0.2);
      tail.rotation.x = 0.7;
      p.add(tail);
      limbL = earL;
      limbR = earR;
    } else if (kind === 'dog') {
      var dEarL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.05), bodyMat);
      dEarL.position.set(-0.085, 0.28, -0.06);
      p.add(dEarL);
      var dEarR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.05), bodyMat);
      dEarR.position.set(0.085, 0.28, -0.06);
      p.add(dEarR);
      var nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.03), darkMat);
      nose.position.set(0, 0.25, -0.14);
      p.add(nose);
      tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.14), bodyMat);
      tail.position.set(0, 0.16, 0.18);
      tail.rotation.x = 0.5;
      p.add(tail);
      limbL = dEarL;
      limbR = dEarR;
    } else {
      var comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.08), redMat);
      comb.position.set(0, 0.35, -0.06);
      p.add(comb);
      var cbeak = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.07), yellowMat);
      cbeak.position.set(0, 0.26, -0.155);
      p.add(cbeak);
      var ctail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), whiteMat);
      ctail.position.set(0, 0.22, 0.14);
      p.add(ctail);
      tail = ctail;
      limbL = ctail;
      limbR = ctail;
    }
    p.userData = { wingL: limbL, wingR: limbR, tailMesh: tail, isBird: kind === 'parrot', flying: false, flyT: 5 + Math.random() * 5, home: new THREE.Vector3(0.32, 1.92, 0), bodyMesh: body, headMesh: head };
    return p;
  }
  function makePlayerLogoTex() {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 96;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, 256, 96);
    g.fillStyle = 'rgba(8,14,20,.92)';
    g.fillRect(0, 0, 256, 96);
    g.strokeStyle = '#2ee6c8';
    g.lineWidth = 5;
    g.strokeRect(4, 4, 248, 88);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#2ee6c8';
    g.font = '900 40px system-ui,sans-serif';
    g.fillText('CANNIKIN', 128, 38);
    g.fillStyle = '#ffe066';
    g.font = '800 26px system-ui,sans-serif';
    g.fillText('GAMING', 128, 72);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makePlayerBody() {
    var g = new THREE.Group();
    var outfitColors = {
      blue: { shirt: 0x16294a, pants: 0x0e1522, accent: 0x00e5c0 },
      black: { shirt: 0x15171d, pants: 0x0b0c10, accent: 0xffb020 },
      red: { shirt: 0x7a1a22, pants: 0x2a1012, accent: 0xffd166 },
      white: { shirt: 0xe0e8f0, pants: 0x4a5260, accent: 0x3fb0ff }
    };
    var oc = outfitColors[playerOutfit] || outfitColors.blue;
    var skin = new THREE.MeshStandardMaterial({ color: 0xe0b090, roughness: 0.9 });
    var shirt = new THREE.MeshStandardMaterial({ color: oc.shirt, roughness: 0.85 });
    var accent = new THREE.MeshStandardMaterial({ color: oc.accent, roughness: 0.6, emissive: 0x0a5a4a, emissiveIntensity: 0.35 });
    var pants = new THREE.MeshStandardMaterial({ color: oc.pants, roughness: 0.9 });
    var boot = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.8 });
    var hairMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
    var white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    var blush = new THREE.MeshStandardMaterial({ color: 0xe89090, roughness: 0.9 });
    /* 頭 + 頭髮 */
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skin);
    head.position.y = 1.75;
    g.add(head);
    var hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.54), hairMat);
    hairTop.position.y = 2.02;
    g.add(hairTop);
    /* 大眼 + 瞳孔 + 腮紅 + 微笑 */
    var eyeW2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), white);
    eyeW2.position.set(-0.11, 1.8, -0.256);
    g.add(eyeW2);
    var eyeW3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), white);
    eyeW3.position.set(0.11, 1.8, -0.256);
    g.add(eyeW3);
    var pup2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.02), dark);
    pup2.position.set(-0.11, 1.79, -0.266);
    g.add(pup2);
    var pup3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.02), dark);
    pup3.position.set(0.11, 1.79, -0.266);
    g.add(pup3);
    var cheek2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.02), blush);
    cheek2.position.set(-0.19, 1.68, -0.256);
    g.add(cheek2);
    var cheek3 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.02), blush);
    cheek3.position.set(0.19, 1.68, -0.256);
    g.add(cheek3);
    var smile2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.02), dark);
    smile2.position.set(0, 1.62, -0.256);
    g.add(smile2);
    /* 身體 + 胸條 + 腰帶 + 臂章 */
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), shirt);
    body.position.y = 1.125;
    g.add(body);
    var chest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.27), accent);
    chest.position.set(0, 1.34, 0);
    g.add(chest);
    /* 胸前 CANNIKIN logo 貼片 */
    var chestLogo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.12),
      new THREE.MeshBasicMaterial({ map: makePlayerLogoTex(), transparent: true })
    );
    chestLogo.position.set(0, 1.18, -0.131);
    chestLogo.rotation.y = Math.PI;
    g.add(chestLogo);
    var belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.09, 0.29), boot);
    belt.position.set(0, 0.76, 0);
    g.add(belt);
    /* 酷背包：深藍硬殼 + 發光 CANNIKIN 標誌 */
    var packShell = new THREE.MeshStandardMaterial({ color: 0x16202e, roughness: 0.65, metalness: 0.35 });
    var packTrim = new THREE.MeshStandardMaterial({ color: 0x2ee6c8, roughness: 0.5, emissive: 0x0a5a4a, emissiveIntensity: 0.5 });
    var pack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.2), packShell);
    pack.position.set(0, 1.15, 0.23);
    g.add(pack);
    var packLid = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.22), packTrim);
    packLid.position.set(0, 1.43, 0.23);
    g.add(packLid);
    var packPocket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.08), packShell);
    packPocket.position.set(0, 1.05, 0.34);
    g.add(packPocket);
    var logoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.12),
      new THREE.MeshBasicMaterial({ map: makePlayerLogoTex(), transparent: true })
    );
    logoPlane.position.set(0, 1.24, 0.336);
    g.add(logoPlane);
    var badge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), accent);
    badge.position.set(0.26, 1.2, -0.13);
    g.add(badge);
    /* 臂：袖 + 手 */
    function makeArmP(x) {
      var grp = new THREE.Group();
      grp.position.set(x, 1.5, 0);
      var sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.42, 0.19), shirt);
      sleeve.position.y = -0.21;
      grp.add(sleeve);
      var hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.16), skin);
      hand.position.y = -0.55;
      grp.add(hand);
      return grp;
    }
    var armL = makeArmP(-0.34);
    var armR = makeArmP(0.34);
    g.add(armL);
    g.add(armR);
    /* 腿：褲 + 靴 */
    function makeLegP(x) {
      var grp = new THREE.Group();
      grp.position.set(x, 0.75, 0);
      var pant = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.5, 0.21), pants);
      pant.position.y = -0.25;
      grp.add(pant);
      var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.2, 0.26), boot);
      shoe.position.set(0, -0.62, -0.02);
      grp.add(shoe);
      return grp;
    }
    var legL = makeLegP(-0.12);
    var legR = makeLegP(0.12);
    g.add(legL);
    g.add(legR);
    var parrot = makePet(petKind);
    parrot.position.copy(parrot.userData.home);
    g.add(parrot);
    g.visible = false;
    scene.add(g);
    return { group: g, parrot: parrot, legL: legL, legR: legR, armL: armL, armR: armR };
  }
  function updateParrot(dt) {
    if (!playerBody) return;
    var p = playerBody.parrot;
    var ud = p.userData;
    ud.flyT -= dt;
    if (ud.flyT <= 0) {
      ud.flying = !ud.flying;
      ud.flyT = ud.flying ? 2.2 : (6 + Math.random() * 6);
    }
    var t = performance.now() * 0.001;
    if (!ud.isBird) {
      /* 貓 / 狗 / 雞：呼吸起伏 + 東張西望 + 偶爾原地蹦 */
      var hop = Math.max(0, Math.sin(t * 1.6 + ud.home.x) - 0.94) * 1.6;
      p.position.set(
        ud.home.x,
        ud.home.y + Math.sin(t * 2.4) * 0.012 + hop * 0.05,
        ud.home.z
      );
      p.rotation.y = Math.sin(t * 1.2) * 0.35;
      p.rotation.z = Math.sin(t * 2.1) * 0.04;
      if (ud.headMesh) {
        ud.headMesh.rotation.y = Math.sin(t * 0.9) * 0.5;
        ud.headMesh.rotation.x = Math.sin(t * 1.7) * 0.12;
      }
      if (ud.tailMesh) ud.tailMesh.rotation.x = 0.5 + Math.sin(t * 4) * 0.18;
      return;
    }
    if (ud.flying) {
      p.position.set(0.32 + Math.sin(t * 2.6) * 0.55, 2.15 + Math.sin(t * 3.4) * 0.35, Math.sin(t * 1.9) * 0.45);
      ud.wingL.rotation.z = 0.9 + Math.sin(t * 26) * 0.9;
      ud.wingR.rotation.z = -0.9 - Math.sin(t * 26) * 0.9;
    } else {
      p.position.copy(ud.home);
      ud.wingL.rotation.z = 0.15;
      ud.wingR.rotation.z = -0.15;
      p.rotation.y = Math.sin(t * 0.8) * 0.3;
    }
  }

  /* ---------- 死亡爆塊：被打死後散成小方塊 ---------- */
  var debrisList = [];
  var DEBRIS_MATS = {};
  function spawnDebris(x, y, z, colorHex) {
    var mat = DEBRIS_MATS[colorHex];
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.9 });
      DEBRIS_MATS[colorHex] = mat;
    }
    for (var i = 0; i < 14; i++) {
      var s = 0.09 + Math.random() * 0.13;
      var m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat);
      m.position.set(x + (Math.random() - 0.5) * 0.6, y + Math.random() * 1.7, z + (Math.random() - 0.5) * 0.6);
      m.castShadow = true;
      scene.add(m);
      debrisList.push({
        m: m,
        vx: (Math.random() - 0.5) * 3.5,
        vy: 1.5 + Math.random() * 4,
        vz: (Math.random() - 0.5) * 3.5,
        life: 1.0 + Math.random() * 0.5
      });
    }
  }
  function updateDebris(dt) {
    for (var i = debrisList.length - 1; i >= 0; i--) {
      var d = debrisList[i];
      d.life -= dt;
      d.vy -= 11 * dt;
      d.m.position.x += d.vx * dt;
      d.m.position.y += d.vy * dt;
      d.m.position.z += d.vz * dt;
      if (d.m.position.y < 0.05) { d.m.position.y = 0.05; d.vy *= -0.3; d.vx *= 0.7; d.vz *= 0.7; }
      d.m.rotation.x += dt * 6;
      d.m.rotation.y += dt * 5;
      if (d.life <= 0) {
        scene.remove(d.m);
        d.m.geometry.dispose();
        debrisList.splice(i, 1);
      }
    }
  }

  /* ---------- 玩家 ---------- */
  function makePlayer() {
    var p = {
      name: PLAYER_NAME,
      pos: new THREE.Vector3(0, 0, 21),
      vel: new THREE.Vector3(),
      yaw: Math.PI, pitch: 0,
      hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, armor: 100, money: 800,
      alive: true,
      team: 'blue',
      isPlayer: true,
      crouch: false,
      onGround: true,
      eyeH: EYE_STAND,
      current: 'usp',
      weapons: { primary: null, secondary: 'usp', knife: 'knife', grenade: null },
      ammo: {},
      lastShot: -10,
      reloadT: 0,
      reloading: false,
      scoped: false,
      recoilPitch: 0,
      recoilOffset: 0,
      bobT: 0,
      speedXZ: 0,
      switching: false,
      switchT: 0,
      switchDur: 0.2,
      switchAccT: 0,       // 切槍後 0.2 秒準度略降
      hasBomb: false,
      hurtKickPitch: 0,
      hurtKickYaw: 0,
      prevWeapon: null
    };
    p.hurt = playerHurt;
    return p;
  }
  player = makePlayer();

  function resetAmmoAll() {
    player.ammo = {};
    var keysW = ['knife', 'usp', 'glock', 'deagle', 'mp5', 'ak47', 'm4a4', 'awp', 'nova', 'radpaint', 'hegrenade'];
    for (var i = 0; i < keysW.length; i++) {
      var W = window.WEAPONS[keysW[i]];
      player.ammo[keysW[i]] = { mag: W.mag, reserve: W.reserve };
    }
  }
  resetAmmoAll();

  function giveWeapon(key) {
    var W = window.WEAPONS[key];
    if (!W) return;
    if (W.slot === 1) player.weapons.primary = key;
    else if (W.slot === 2) player.weapons.secondary = key;
    else if (W.slot === 4) player.weapons.grenade = key;
    player.ammo[key] = { mag: W.mag, reserve: W.reserve };
  }

  function bestWeapon() {
    if (player.weapons.primary) return player.weapons.primary;
    if (player.weapons.secondary) return player.weapons.secondary;
    return 'knife';
  }

  /* ---------- 視圖模型 ---------- */
  function getViewModel(key) {
    if (!viewModels[key]) {
      var m = window.buildGunModel(key);
      m.scale.setScalar(0.92);
      m.visible = false;
      viewRoot.add(m);
      viewModels[key] = m;
    }
    return viewModels[key];
  }
  function updateViewModel() {
    var key = player.current;
    for (var k in viewModels) viewModels[k].visible = false;
    if (!player.alive) return;
    var m = getViewModel(key);
    m.visible = !player.scoped;
    var mz = m.userData.muzzle;
    flashRoot.position.copy(viewRoot.position).addScaledVector(mz, 0.92);
  }
  function setWeapon(key, instant) {
    if (!key) key = 'knife';
    if (key === player.current && !instant) return;
    var W = window.WEAPONS[key];
    /* V2：換槍幾乎無懲罰，動畫短；但切槍後 0.2 秒準度略降 */
    var dur = W && W.slot === 1 ? 0.26 : (W && W.slot === 2 ? 0.16 : 0.12);
    player.prevWeapon = player.current;
    player.current = key;
    player.reloading = false;
    player.reloadT = 0;
    player.scoped = false;
    player.switchAccT = instant ? 0 : 0.2;
    camera.fov = 75;
    camera.updateProjectionMatrix();
    elScope.style.display = 'none';
    elCross.classList.remove('hidden');
    player.switching = !instant;
    player.switchT = 0;
    player.switchDur = dur;
    updateViewModel();
    updateHUD();
    if (window.SFX) SFX.switchWeapon();
  }

  /* ---------- 物理 ---------- */
  function playerHitsBox(x, z, footY, r) {
    var colliders = mapData.colliders;
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      if (footY >= c.maxY - 0.05) continue;
      if (footY + 1.75 <= c.minY + 0.05) continue;
      var cx = Math.max(c.minX, Math.min(x, c.maxX));
      var cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      var dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }
  function supportHeight(x, z, footY, r) {
    var floor = -100;
    var colliders = mapData.colliders;
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      if (c.maxY > footY + 0.02) continue;
      var cx = Math.max(c.minX, Math.min(x, c.maxX));
      var cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      var dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < r * r) {
        if (c.maxY > floor) floor = c.maxY;
      }
    }
    if (floor < -50) floor = 0;
    return floor;
  }

  /* ---------- 輸入 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Tab') {
      e.preventDefault();
      if (gameState === 'live' || gameState === 'buy' || gameState === 'roundEnd') showScoreboard();
    }
    if (e.code === 'F3') {
      e.preventDefault();
      fpsOn = !fpsOn;
      elFps.classList.toggle('show', fpsOn);
    }
    if (e.code === 'F4') {
      e.preventDefault();
      bloomEnabled = !bloomEnabled;
      showHint(bloomEnabled ? '輝光：開啟' : '輝光：關閉', 1.4);
    }
    if (e.code === 'KeyV') {
      camMode = (camMode + 1) % 3;
      showHint(['視角：第一人稱', '視角：背後（看得到鸚鵡）', '視角：正面'][camMode], 1.3);
      if (viewRoot) viewRoot.visible = camMode === 0;
      if (playerBody) playerBody.group.visible = camMode !== 0;
    }
    if (e.code === 'KeyM' && window.SFX) {
      SFX.toggle(!SFX.isEnabled());
      showHint(SFX.isEnabled() ? '音效：開啟' : '音效：靜音', 1.2);
    }
    /* 合照模式：P 進出，Enter 拍照 */
    if (e.code === 'KeyP') {
      e.preventDefault();
      if (photoMode) {
        exitPhotoMode();
        showHint('合照模式：關閉', 1.2);
      } else {
        var pr = enterPhotoMode({ count: 20 });
        showHint('合照模式：' + pr.arranged + ' 人 · Enter 拍照 · P 退出', 2.4);
      }
    }
    if (e.code === 'Enter' && photoMode) {
      e.preventDefault();
      window.__PHOTO_SNAP();
      showHint('咔嚓', 0.7);
    }
    /* 死亡後：F 切換「跟隨隊友 / 自由視角」 */
    if (e.code === 'KeyF' && !player.alive &&
        (gameState === 'live' || gameState === 'roundEnd')) {
      deathCamFree = !deathCamFree;
      if (deathCamFree) {
        enterFreeCam();
        showHint('自由視角：WASD / 方向鍵移動 · 空格/Shift 升降 · 左鍵換人 · F 返回', 2.4);
      } else {
        showHint('觀戰：跟隨隊友', 1.4);
      }
    }
    /* 避免 Ctrl+W / Ctrl+R / Ctrl+S 等瀏覽器快捷鍵在遊戲中誤觸 */
    if (e.ctrlKey || e.metaKey) {
      var blockCtrl = ['KeyW', 'KeyR', 'KeyS', 'KeyD', 'KeyA', 'KeyQ', 'KeyE', 'KeyG', 'KeyB', 'KeyC'];
      if (blockCtrl.indexOf(e.code) >= 0) e.preventDefault();
    }
    if (e.code === 'Space') e.preventDefault();
    if (deathCamFree && e.code.indexOf('Arrow') === 0) e.preventDefault();
    if (gameState === 'intro') { introT = 0.001; return; }
    if (gameState === 'menu' || gameState === 'over') return;
    keys[e.code] = true;
    if (e.code === 'KeyB') toggleBuy();
    if (e.code === 'KeyR') startReload();
    if (e.code === 'KeyQ') {
      if (player.prevWeapon && player.prevWeapon !== player.current) setWeapon(player.prevWeapon);
    }
    if (e.code === 'Digit1' && player.weapons.primary) setWeapon(player.weapons.primary);
    if (e.code === 'Digit2' && player.weapons.secondary) setWeapon(player.weapons.secondary);
    if (e.code === 'Digit3') setWeapon('knife');
    if (e.code === 'Digit4' && player.weapons.grenade) setWeapon(player.weapons.grenade);
    if (e.code === 'KeyG') tryPlant();
    if (e.code === 'KeyE') tryElevator();
  });
  document.addEventListener('keyup', function (e) { keys[e.code] = false; });

  document.addEventListener('mousemove', function (e) {
    if (!pointerLocked || gameState === 'paused') return;
    /* 死亡後自由視角：滑鼠轉自由相機 */
    if (!player.alive && deathCamFree) {
      freeCamYaw -= e.movementX * 0.0022;
      freeCamPitch -= e.movementY * 0.0022;
      freeCamPitch = Math.max(-1.53, Math.min(1.53, freeCamPitch));
      return;
    }
    var sens = player.scoped ? 0.0012 : 0.0022;
    player.yaw -= e.movementX * sens;
    player.pitch -= e.movementY * sens;
    player.pitch = Math.max(-1.53, Math.min(1.53, player.pitch));
  });

  document.addEventListener('mousedown', function (e) {
    /* 死亡觀戰：左鍵下一位、右鍵上一位 */
    if (player && !player.alive && (gameState === 'live' || gameState === 'roundEnd')) {
      if (!pointerLocked) {
        if (!TEST) canvas.requestPointerLock();
        return;
      }
      /* 自由視角下點擊換人：自動回到跟隨模式 */
      deathCamFree = false;
      spectateIdx += (e.button === 2 ? -1 : 1);
      showHint(e.button === 2 ? '觀戰：上一位' : '觀戰：下一位', 0.8);
      return;
    }
    if (!pointerLocked || gameState !== 'live') {
      if (gameState === 'live' && !buyOpen && !TEST) canvas.requestPointerLock();
      return;
    }
    if (e.button === 0) { keys['Mouse0'] = true; tryShoot(); }
    else if (e.button === 2) toggleScope();
  });
  document.addEventListener('keyup', function (e) {
    if (e.code === 'Tab') hideScoreboard();
  });
  document.addEventListener('mouseup', function (e) {
    if (e.button === 0) keys['Mouse0'] = false;
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  document.addEventListener('wheel', function (e) {
    if (gameState !== 'live' && gameState !== 'buy') return;
    if (player.switching) return;
    var order = [];
    if (player.weapons.primary) order.push(player.weapons.primary);
    if (player.weapons.secondary) order.push(player.weapons.secondary);
    if (player.weapons.grenade) order.push(player.weapons.grenade);
    order.push('knife');
    var idx = order.indexOf(player.current);
    if (idx < 0) idx = 0;
    idx = (idx + (e.deltaY > 0 ? 1 : -1) + order.length) % order.length;
    setWeapon(order[idx]);
  }, { passive: true });

  document.addEventListener('pointerlockchange', function () {
    var was = pointerLocked;
    pointerLocked = (document.pointerLockElement === canvas);
    if (was && !pointerLocked) {
      keys['Mouse0'] = false;
      if (player && !player.alive) return;   /* 觀戰中不因鎖丟失而暫停 */
      if (buyOpen) return;
      if (gameState === 'live' || gameState === 'buy' || gameState === 'roundEnd') pauseGame();
    }
  });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------- 選單 ---------- */
  $('startBtn').onclick = function () { startGame(); };
  $('resumeBtn').onclick = function () { resumeGame(); };
  $('restartBtn').onclick = function () { hideAll(); startGame(); };
  $('quitBtn').onclick = function () { quitToMenu(); };
  $('againBtn').onclick = function () { hideAll(); startGame(); };
  $('menuBtn').onclick = function () { quitToMenu(); };

  function bindToggle(sel, attr, cb) {
    var btns = document.querySelectorAll(sel + ' .btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function () {
        for (var k = 0; k < btns.length; k++) btns[k].classList.remove('active');
        this.classList.add('active');
        cb(this.dataset[attr]);
        try { SFX.click(); } catch (e) { }
      };
    }
  }
  bindToggle('#modeBtns', 'mode', function (v) { mode = v; });
  bindToggle('#diffBtns', 'diff', function (v) { difficulty = v; });
  bindToggle('#radBtns', 'rad', function (v) {
    radMode = (v === 'on');
    roofMode = (v === 'roof');
  });
  bindToggle('#outfitBtns', 'outfit', function (v) { playerOutfit = v; });
  bindToggle('#petBtns', 'pet', function (v) { petKind = v; });

  function hideAll() {
    elMenu.classList.add('hidden');
    elPause.classList.add('hidden');
    elEnd.classList.add('hidden');
    elBuy.classList.add('hidden');
    if (elAnnounce) elAnnounce.classList.remove('show');
    announceT = 0;
    broadcastCd = 55;
    buyOpen = false;
  }
  function quitToMenu() {
    hideAll();
    gameState = 'menu';
    elHUD.classList.add('hidden');
    elCross.classList.add('hidden');
    elMenu.classList.remove('hidden');
    elBombHud.classList.remove('show');
    if (document.pointerLockElement) document.exitPointerLock();
    for (var i = 0; i < bots.length; i++) { scene.remove(bots[i].mesh); }
    bots = [];
    clearGrenades();
    clearBomb();
    resetAmmoAll();
    player = makePlayer();
    roundNo = 1; scoreBlue = 0; scoreOrange = 0;
    stats = { kills: 0, headshots: 0, deaths: 0, roundsWon: 0 };
    removeHallBlockers();
    var keepRad = radMode;
    setRadMode(false);
    radMode = keepRad;      // 保留主選單的場景選擇，下次開始再套用
    resetGlass();
    playerHasBomb = false;
    plantT = 0;
    hitStopT = 0;
    playerCelebrateT = 0;
    elCarrierHud.classList.remove('show');
    elPaintHud.classList.remove('show');
    updateViewModel();
  }

  /* ---------- 購買 ---------- */
  function isOwned(key) {
    return player.weapons.primary === key || player.weapons.secondary === key || player.weapons.grenade === key;
  }
  function buildBuyMenu() {
    var box = $('buyCats');
    box.innerHTML = '';
    for (var c = 0; c < window.BUY_LIST.length; c++) {
      var cat = window.BUY_LIST[c];
      var col = document.createElement('div');
      col.className = 'buyCat';
      var h = document.createElement('h4');
      h.textContent = cat.cat;
      col.appendChild(h);
      for (var i = 0; i < cat.items.length; i++) {
        (function (key) {
          var W = window.WEAPONS[key];
          var item = document.createElement('div');
          item.className = 'buyItem';
          var owned = isOwned(key);
          if (owned) item.classList.add('owned');
          if (!owned && player.money < W.price) item.classList.add('cant');
          item.innerHTML = '<span>' + W.name + '</span><span class="price">' +
            (owned ? '已擁有' : '$' + W.price) + '</span>';
          item.onclick = function () { buy(key); };
          col.appendChild(item);
        })(cat.items[i]);
      }
      box.appendChild(col);
    }
    $('buyMoney').textContent = '$' + player.money;
  }
  function buy(key) {
    var W = window.WEAPONS[key];
    if (!W) return;
    if (gameState !== 'buy' || buyTimer <= 0) { SFX.deny(); showHint('購買時間已結束', 1.5); return; }
    if (isOwned(key)) { SFX.deny(); return; }
    if (player.money < W.price) { SFX.deny(); showHint('金錢不足', 1.5); return; }
    if (key === 'hegrenade' && player.weapons.grenade) { SFX.deny(); return; }
    player.money -= W.price;
    giveWeapon(key);
    setWeapon(key);
    SFX.buy();
    buildBuyMenu();
    updateHUD();
  }
  function toggleBuy() {
    if (mode === 'gungame') { showHint('軍備競賽不使用購買，擊殺即可升級', 1.6); return; }
    if (gameState !== 'buy' || buyTimer <= 0) {
      if (gameState === 'live') showHint('只能在回合開始的購買時間內購買', 1.8);
      return;
    }
    buyOpen = !buyOpen;
    if (buyOpen) {
      buildBuyMenu();
      elBuy.classList.remove('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      elBuy.classList.add('hidden');
      if (!TEST) canvas.requestPointerLock();
    }
  }

  /* ---------- 回合流程 ---------- */
  function resetGlass() {
    if (mapData && mapData.glass) {
      for (var i = 0; i < mapData.glass.length; i++) {
        var g = mapData.glass[i];
        if (!g.broken) continue;
        g.broken = false;
        if (scene.children.indexOf(g.mesh) < 0) scene.add(g.mesh);
        if (mapData.colliders.indexOf(g.collider) < 0) mapData.colliders.push(g.collider);
        if (mapData.meshes.indexOf(g.mesh) < 0) mapData.meshes.push(g.mesh);
      }
    }
    for (var s = 0; s < glassShards.length; s++) scene.remove(glassShards[s].mesh);
    glassShards = [];
    if (mapData && mapData.colliders) mapData.colliders.__grid = null;
  }

  function startGame() {
    try { SFX.resume(); } catch (e) { }
    hideAll();
    if (roofMode) mode = 'elim';
    if (mapData) mapData.roofMode = roofMode;
    resetGlass();
    elMenu.classList.add('hidden');
    elHUD.classList.remove('hidden');
    elCross.classList.remove('hidden');

    resetAmmoAll();
    player = makePlayer();
    if (playerBody) scene.remove(playerBody.group);
    playerBody = makePlayerBody();
    window.__PB = playerBody;
    window.__PLAYER = player;
    resetAmmoAll();
    hitStopT = 0;
    elevatorCd = 0;
    lastElevHint = -9;
    elCarrierHud.classList.remove('show');
    elPaintHud.classList.remove('show');
    stats = { kills: 0, headshots: 0, deaths: 0, roundsWon: 0 };
    roundNo = 1; scoreBlue = 0; scoreOrange = 0;
    player.money = 800;
    ggPlayerLevel = 0;

    for (var i = 0; i < bots.length; i++) scene.remove(bots[i].mesh);
    bots = [];

    // 藍隊 9 名隊友（錄影模式由 AI 代替玩家，維持 10v10）
    var blueN = MOVIE ? 10 : 9;
    var orangeN = 10;
    if (mode === 'happy') {
      /* 錄影模式：補一名 AI 代打藍隊員，否則一開局就判藍隊全滅；
         錄影時打多回合，避免 65 秒就結束、後面全是空鏡 */
      blueN = MOVIE ? 1 : 0;
      orangeN = HAPPY_ENEMIES;
      WIN_ROUNDS = MOVIE ? 99 : 1;
    }
    else WIN_ROUNDS = 5;
    for (var b = 0; b < blueN; b++) {
      var happyMovie = mode === 'happy' && MOVIE;
      bots.push(new window.CS_BOT(scene, mapData, {
        team: 'blue',
        role: b < BLUE_ROLES.length ? BLUE_ROLES[b] : 'steve',
        name: happyMovie ? 'AI 代打' : (b < BLUE_NAMES.length ? BLUE_NAMES[b] : 'AI 代打'),
        difficulty: difficulty,
        maxHp: happyMovie ? HAPPY_HP : BOT_MAX_HP,
        weaponKey: happyMovie ? 'm249' : undefined
      }));
    }
    // 橙隊 10 名敵人（快樂模式 100 名）
    for (var o = 0; o < orangeN; o++) {
      var oName = ORANGE_NAMES[o % ORANGE_NAMES.length] + (o >= ORANGE_NAMES.length ? ('-' + (o + 1)) : '');
      bots.push(new window.CS_BOT(scene, mapData, {
        team: 'orange', role: ORANGE_ROLES[o % ORANGE_ROLES.length], name: oName,
        difficulty: difficulty, maxHp: BOT_MAX_HP
      }));
    }
    /* 快樂模式：玩家一萬血 */
    if (mode === 'happy') {
      player.maxHp = HAPPY_HP;
      player.hp = HAPPY_HP;
      /* 開局給機槍 + 無限彈藥 */
      player.weapons.primary = 'm249';
      player.ammo.m249 = { mag: 100, reserve: 999 };
    }

    setRadMode(radMode);
    startRound();
    /* 錄影用：快樂模式 100 人屋頂集合 / 全場巡覽 */
    if (/[?&]crowd=roof/.test(location.search) && mode === 'happy') {
      var cidx = 0;
      for (var cbi = 0; cbi < bots.length; cbi++) {
        var cb = bots[cbi];
        if (cb.team !== 'orange') continue;
        var ang = cidx / 100 * Math.PI * 2;
        var rad = 1.2 + (cidx % 10) * 0.55;
        var gx = 11 + Math.cos(ang) * rad;
        var gz = 37 + Math.sin(ang) * rad;
        cb.alive = true;
        cb.mesh.visible = true;
        cb.pos.set(gx, 0, gz);
        cb.mesh.position.set(gx, 0, gz);
        cidx++;
      }
      window.__CROWD_FREEZE = true;
    }
    if (/[?&]tour=1/.test(location.search)) {
      gameState = 'buy';
      buyTimer = 999;
    }
    if (ORBIT) {
      gameState = 'intro';
      introT = 0;
    }
    updateViewModel();
    if (!TEST && !MOVIE) startIntro();
    if (MOVIE) {
      viewRoot.visible = true;
      var movieAk = getViewModel('ak47');
      if (movieAk) movieAk.visible = true;
    }
    if (!TEST) canvas.requestPointerLock();
  }

  function getAttackTeam(no) {
    /* 拆除模式攻守輪換：第 1 回合橙隊進攻（符合入口出生），第 2 回合換藍隊 */
    return (no % 2 === 1) ? 'orange' : 'blue';
  }

  /* 每回合從出生點池隨機挑一個，盡量不重複（玩家與同隊 BOT 共用 used） */
  function pickSpawn(pool, used) {
    var cand = [];
    for (var i = 0; i < pool.length; i++) if (used.indexOf(i) < 0) cand.push(i);
    var idx = cand.length ? cand[Math.floor(Math.random() * cand.length)]
      : Math.floor(Math.random() * pool.length);
    used.push(idx);
    return pool[idx];
  }

  /* ---------- 軍備競賽流程 ---------- */
  function ggGivePlayer() {
    var key = GG_LADDER[Math.min(ggPlayerLevel, GG_LADDER.length - 1)];
    var W = window.WEAPONS[key];
    player.weapons = { primary: null, secondary: null, knife: 'knife', grenade: null };
    if (W.slot === 1) player.weapons.primary = key;
    else if (W.slot === 2) player.weapons.secondary = key;
    else if (W.slot === 3) player.weapons.knife = key;
    player.ammo[key] = { mag: W.mag, reserve: W.reserve };
    setWeapon(key, true);
  }

  function ggGiveBot(bot) {
    var idx = Math.min(bot.ggLevel || 0, GG_LADDER.length - 2);   // BOT 不使用小刀
    bot.weaponKey = GG_LADDER[idx];
    bot.weapon = window.WEAPONS[bot.weaponKey];
  }

  function startGunGame() {
    gameState = 'live';
    buyTimer = 0;
    roundTimer = 0;
    roundResolved = false;
    playerDeathT = 0;
    playerCelebrateT = 0;
    hitStopT = 0;
    plantT = 0;
    clearBomb();
    removeHallBlockers();
    if (!roofMode) {
      addHallBlockers();
      hallBlockTimer = 10;
    } else {
      hallBlockTimer = 0;
    }

    player.alive = true;
    player.hp = player.maxHp;
    player.armor = 100;
    player.crouch = false;
    player.scoped = false;
    player.reloading = false;
    player.reloadT = 0;
    player.switching = false;
    player.switchAccT = 0;
    player.vel.set(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
    elScope.style.display = 'none';
    elCross.classList.remove('hidden');

    mapData.roofMode = roofMode;
    var ggUsedBlue = [], ggUsedOrange = [];
    var sp;
    if (roofMode) {
      var rp = ROOF_SPAWNS.blue[Math.floor(Math.random() * ROOF_SPAWNS.blue.length)];
      sp = { x: rp.x, z: rp.z, yaw: Math.PI / 2 };
    } else {
      sp = pickSpawn(mapData.spawns.blue, ggUsedBlue);
    }
    player.pos.set(sp.x, roofMode ? ROOF_Y : 0, sp.z);
    player.pos.y = roofMode ? ROOF_Y : supportHeight(sp.x, sp.z, 6, PLAYER_R);
    player.yaw = sp.yaw;
    player.pitch = 0;
    player.eyeH = EYE_STAND;

    for (var b = 0; b < bots.length; b++) {
      var bot = bots[b];
      bot.ggLevel = 0;
      var s;
      if (roofMode) {
        var poolR = bot.team === 'blue' ? ROOF_SPAWNS.blue : ROOF_SPAWNS.orange;
        var rr = poolR[Math.floor(Math.random() * poolR.length)];
        s = { x: rr.x, z: rr.z, yaw: bot.team === 'blue' ? Math.PI / 2 : -Math.PI / 2 };
      } else {
        var pool = bot.team === 'blue' ? mapData.spawns.blue : mapData.spawns.orange;
        var ggUsed = pool === mapData.spawns.blue ? ggUsedBlue : ggUsedOrange;
        s = pickSpawn(pool, ggUsed);
      }
      bot.spawn(s.x, s.z, s.yaw, 'attack', false);
      if (roofMode) bot.pos.y = ROOF_Y;
      bot.targetSite = Math.random() < 0.5 ? 'A' : 'B';
      ggGiveBot(bot);
    }

    ggPlayerLevel = 0;
    ggGivePlayer();
    stats.kills = 0;
    stats.headshots = 0;
    stats.deaths = 0;
    scoreBlue = 0;
    scoreOrange = 0;
    updateViewModel();
    updateHUD();
    if (window.SFX) SFX.roundStart();
    setAlarm(0);
    announce(pickLine(BC_LINES.gungame));
    radioNextT = 10 + Math.random() * 12;
    showCenter('軍備競賽', '擊殺升級武器 · 用小刀完成最後一擊', 3.2);
    movieLog('round', '軍備競賽開始');
  }

  function pickSpawnFar(pool) {
    /* 選離其他存活人員最遠的出生點，避免重生在同一位置或擠在一起 */
    var best = pool[Math.floor(Math.random() * pool.length)];
    var bestScore = -Infinity;
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      var minD = 999;
      if (player && player.alive) {
        minD = Math.min(minD, Math.hypot(p.x - player.pos.x, p.z - player.pos.z));
      }
      for (var j = 0; j < bots.length; j++) {
        var b = bots[j];
        if (!b.alive) continue;
        minD = Math.min(minD, Math.hypot(p.x - b.pos.x, p.z - b.pos.z));
      }
      var score = minD + Math.random() * 1.5;
      if (score > bestScore) { bestScore = score; best = p; }
    }
    return best;
  }

  function ggRespawnPlayer() {
    var pool = roofMode ? ROOF_SPAWNS.blue : mapData.spawns.blue;
    var sp = pickSpawnFar(pool);
    player.pos.set(sp.x, roofMode ? ROOF_Y : 0, sp.z);
    player.pos.y = roofMode ? ROOF_Y : supportHeight(sp.x, sp.z, 6, PLAYER_R);
    player.yaw = roofMode ? Math.PI / 2 : sp.yaw;
    player.pitch = 0;
    player.eyeH = EYE_STAND;
    player.alive = true;
    player.hp = player.maxHp;
    player.armor = 100;
    player.crouch = false;
    player.scoped = false;
    player.reloading = false;
    player.reloadT = 0;
    player.vel.set(0, 0, 0);
    playerDeathT = 0;
    camera.fov = 75;
    camera.rotation.z = 0;
    camera.rotation.x = 0;
    camera.updateProjectionMatrix();
    elScope.style.display = 'none';
    elCross.classList.remove('hidden');
    ggGivePlayer();
    updateViewModel();
    showHint('重新出擊 · ' + window.WEAPONS[player.current].name, 1.4);
  }

  function ggRespawnBot(bot) {
    var sp, yaw;
    if (roofMode) {
      var poolR = bot.team === 'blue' ? ROOF_SPAWNS.blue : ROOF_SPAWNS.orange;
      var rr = pickSpawnFar(poolR);
      sp = { x: rr.x, z: rr.z };
      yaw = bot.team === 'blue' ? Math.PI / 2 : -Math.PI / 2;
    } else {
      var pool = bot.team === 'blue' ? mapData.spawns.blue : mapData.spawns.orange;
      sp = pickSpawnFar(pool);
      yaw = sp.yaw;
    }
    bot.spawn(sp.x, sp.z, yaw, 'attack', false);
    if (roofMode) bot.pos.y = ROOF_Y;
    ggGiveBot(bot);
  }

  function ggFinish(winnerTeam, winnerName) {
    gameState = 'over';
    if (document.pointerLockElement) document.exitPointerLock();
    elHUD.classList.add('hidden');
    elCross.classList.add('hidden');
    elEnd.classList.remove('hidden');
    var win = winnerTeam === 'blue';
    $('endTitle').textContent = win ? '勝利' : '失敗';
    $('endTitle').style.color = win ? 'var(--orange)' : 'var(--red)';
    $('endScore').textContent = winnerName + ' 完成軍備競賽';
    $('endStats').textContent = '擊殺 ' + stats.kills + ' · 爆頭 ' + stats.headshots +
      ' · 死亡 ' + stats.deaths + ' · 等級 ' + (ggPlayerLevel + 1) + '/' + GG_LADDER.length;
    renderEndRank(true);
    if (window.SFX) (win ? SFX.roundWin() : SFX.roundLose());
  }

  /* ---------- 開場入場舞：鏡頭依次展示藍隊、橙隊全員跳舞 ---------- */
  var INTRO_TIME = 18;
  var introT = 0;
  var introReturnState = 'buy';
  function startIntro() {
    introReturnState = (gameState === 'live') ? 'live' : 'buy';
    gameState = 'intro';
    introT = INTRO_TIME;
    /* 開場旋轉時不顯示廣播字幕，避免擋住中間畫面 */
    announceT = 0;
    if (elAnnounce) elAnnounce.classList.remove('show');
    elHUD.classList.add('hidden');
    elCross.classList.add('hidden');
    if (viewRoot) viewRoot.visible = false;
    if (elIntro) elIntro.classList.add('show');
    if (elIntroTeam) elIntroTeam.textContent = '藍隊入場';
    /* 開場鏡頭拉得很遠：把霧拉開，避免远景糊成白雾 */
    if (scene.fog) {
      scene.fog.near = 260;
      scene.fog.far = 800;
    }
    var orangeIdx = 0;
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      b.danceStyle = i % 7;
      b.danceSpin = 0;
      b.introY = 0;
      if (b.team === 'orange') {
        b._introOld = { x: b.pos.x, z: b.pos.z };
        var oi = orangeIdx++;
        /* 10 列 × 10 排排滿屋頂前部（100 人也不會超範圍） */
        var col = oi % 10;
        var row = Math.floor(oi / 10) % 10;
        b.pos.set(-8.1 + col * 1.8, 0, 12 + row * 1.2);
        b.introY = 10.45;
        b.yaw = Math.PI;
      }
    }
  }
  /* 錄影用：高空環繞屋頂人群 */
  function updateOrbitCam(dt) {
    if (window.__CROWD_FREEZE) {
      var k = 0;
      for (var oi = 0; oi < bots.length; oi++) {
        var ob = bots[oi];
        if (ob.team !== 'orange') continue;
        var oa = k / 100 * Math.PI * 2;
        var orr = 1.2 + (k % 10) * 0.55;
        var ox = 11 + Math.cos(oa) * orr;
        var oz = 37 + Math.sin(oa) * orr;
        ob.alive = true;
        ob.pos.set(ox, 0, oz);
        ob.mesh.position.set(ox, 0, oz);
        ob.mesh.visible = true;
        k++;
      }
    }
    var a = elapsed * 0.35;
    camera.position.set(11 + Math.cos(a) * 13, 10, 37 + Math.sin(a) * 13);
    camera.lookAt(11, 0, 37);
    if (viewRoot) viewRoot.visible = false;
    if (playerBody) playerBody.group.visible = false;
    if (elHUD) elHUD.classList.add('hidden');
  }

  function updateIntro(dt) {
    introT -= dt;
    var t = INTRO_TIME - introT;
    var px, py, pz, lx, ly, lz;
    if (t < 9.0) {
      /* 外景：高空俯瞰整個場地，繞一圈多再拉近 */
      var k1 = t / 9.0;
      var e1 = k1 * k1 * (3 - 2 * k1);
      var rad1 = 118 - 60 * e1;
      var hgt1 = 78 - 58 * e1;
      var a1 = -Math.PI * 0.85 + k1 * Math.PI * 2.1;
      px = Math.cos(a1) * rad1; py = hgt1; pz = Math.sin(a1) * rad1;
      lx = 0; ly = 5; lz = 0;
      if (elIntroTeam) elIntroTeam.textContent = '第一號機組 · 外景';
    } else if (t < 13.0) {
      /* 天台：繞著橙隊 360 度（放慢） */
      var k2 = (t - 9.0) / 4.0;
      var e2 = k2 * k2 * (3 - 2 * k2);
      var a2 = k2 * Math.PI * 2;
      var rad2 = 18 - 4 * e2;
      var hgt2 = 18 - 3 * e2;
      px = Math.cos(a2) * rad2; py = hgt2; pz = 12 + Math.sin(a2) * rad2;
      lx = 0; ly = 11; lz = 12;
      if (elIntroTeam) elIntroTeam.textContent = '橙隊入場 · 天台';
    } else if (t < 14.5) {
      /* 從屋頂外側平滑下降，沿入口滑進大廳（不穿屋頂） */
      var k3 = (t - 13.0) / 1.5;
      if (k3 < 0.45) {
        var k3a = k3 / 0.45;
        px = 14 * (1 - k3a); py = 15; pz = 12 + 20 * k3a;
      } else {
        var k3b = (k3 - 0.45) / 0.55;
        px = 0; py = 15 - 9.6 * k3b; pz = 32 - 12 * k3b;
      }
      lx = 0; ly = 5; lz = 0;
      if (elIntroTeam) elIntroTeam.textContent = '反應堆大廳';
    } else if (t < 16.0) {
      /* 帳號 + 粉絲準則大牌短暫停留 */
      px = 0; py = 5.2; pz = 18;
      lx = 0; ly = 4.6; lz = 8;
      if (elIntroTeam) elIntroTeam.textContent = '關注我們 · 不定時更新';
    } else {
      /* 先平飛出大門，再升高收尾（不穿牆） */
      var k5 = Math.min(1, (t - 16.0) / 2.0);
      if (k5 < 0.5) {
        var ka = k5 / 0.5;
        px = 0; py = 5.2; pz = 18 + 12 * ka;
      } else {
        var kb = (k5 - 0.5) / 0.5;
        px = 0; py = 5.2 + 8.8 * kb; pz = 30 + 6 * kb;
      }
      lx = 0; ly = 4.7; lz = 8;
      if (elIntroTeam) elIntroTeam.textContent = '開始遊戲';
    }
    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive) bots[i].updateDance(dt);
    }
    if (introT <= 0) endIntro();
  }
  function endIntro() {
    if (elIntro) elIntro.classList.remove('show');
    elHUD.classList.remove('hidden');
    elCross.classList.remove('hidden');
    if (viewRoot) viewRoot.visible = true;
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b._introOld) { b.pos.set(b._introOld.x, 0, b._introOld.z); b._introOld = null; }
      b.introY = 0;
      b.endDance();
    }
    camera.rotation.z = 0;
    if (scene.fog) {
      if (radMode) {
        scene.fog.color.setHex(0x4a7a4a);
        scene.fog.near = 30;
        scene.fog.far = 120;
      } else {
        scene.fog.color.setHex(0xd0dedf);
        scene.fog.near = 80;
        scene.fog.far = 200;
      }
    }
    gameState = introReturnState;
    if (gameState === 'live') buyTimer = 0;
  }

  function startRound() {
    if (mode === 'gungame') { startGunGame(); return; }
    gameState = 'buy';
    buyTimer = BUY_TIME;
    /* 快樂模式：單回合一打一百，限時 3 分鐘 */
    roundTimer = mode === 'happy' ? 180 : ROUND_TIME;
    roundResolved = false;
    playerDeathT = 0;
    playerCelebrateT = 0;
    hitStopT = 0;
    plantT = 0;
    clearBomb();
    removeHallBlockers();
    if (!roofMode) {
      addHallBlockers();
      hallBlockTimer = 10;
    } else {
      hallBlockTimer = 0;
    }

    player.alive = true;
    player.hp = player.maxHp;
    player.armor = 100;
    player.crouch = false;
    player.scoped = false;
    player.reloading = false;
    player.reloadT = 0;
    player.switching = false;
    player.switchAccT = 0;
    player.hasBomb = false;
    player.hurtKickPitch = 0;
    player.hurtKickYaw = 0;
    player.vel.set(0, 0, 0);
    player.current = bestWeapon();
    camera.fov = 75;
    camera.updateProjectionMatrix();
    elScope.style.display = 'none';
    elCross.classList.remove('hidden');

    /* 攻守輪換：攻方從入口／變電站外側，守方從控制室一側走廊 */
    attackTeam = mode === 'defuse' ? getAttackTeam(roundNo) : 'orange';
    var playerRole = 'attack';
    var playerSpawn;
    var usedBlue = [], usedOrange = [];
    mapData.roofMode = roofMode;
    if (roofMode) {
      var rp = ROOF_SPAWNS.blue[Math.floor(Math.random() * ROOF_SPAWNS.blue.length)];
      playerSpawn = { x: rp.x, z: rp.z, yaw: Math.PI / 2 };
    } else if (mode === 'defuse') {
      playerRole = (player.team === attackTeam) ? 'attack' : 'defend';
      playerSpawn = playerRole === 'attack'
        ? pickSpawn(mapData.spawns.orange, usedOrange)
        : pickSpawn(mapData.spawns.blue, usedBlue);
    } else {
      /* 出生位置：全部出生點隨機（藍隊 + 橙隊兩側），每局位置都不同 */
      var allSpawns = mapData.spawns.blue.concat(mapData.spawns.orange);
      var spPick = allSpawns[Math.floor(Math.random() * allSpawns.length)];
      playerSpawn = { x: spPick.x, z: spPick.z, yaw: spPick.yaw };
    }
    player.pos.set(playerSpawn.x, 0, playerSpawn.z);
    player.pos.y = roofMode ? ROOF_Y : supportHeight(playerSpawn.x, playerSpawn.z, 6, PLAYER_R);
    player.yaw = playerSpawn.yaw;
    player.pitch = 0;
    player.eyeH = EYE_STAND;

    // 彈藥補滿
    var owned = ['knife'];
    if (player.weapons.primary) owned.push(player.weapons.primary);
    if (player.weapons.secondary) owned.push(player.weapons.secondary);
    if (player.weapons.grenade) owned.push(player.weapons.grenade);
    for (var i = 0; i < owned.length; i++) {
      var W = window.WEAPONS[owned[i]];
      if (W) player.ammo[owned[i]] = { mag: W.mag, reserve: W.reserve };
    }

    // 出生（拆除模式按攻／守分配出生區）
    for (var b = 0; b < bots.length; b++) {
      var bot = bots[b];
      var role = 'attack';
      var pool, used, sp;
      if (roofMode) {
        var poolR = bot.team === 'blue' ? ROOF_SPAWNS.blue : ROOF_SPAWNS.orange;
        var rr = poolR[Math.floor(Math.random() * poolR.length)];
        sp = { x: rr.x, z: rr.z, yaw: bot.team === 'blue' ? Math.PI / 2 : -Math.PI / 2 };
      } else {
        if (mode === 'defuse') {
          role = bot.team === attackTeam ? 'attack' : 'defend';
          pool = role === 'attack' ? mapData.spawns.orange : mapData.spawns.blue;
        } else {
          pool = bot.team === 'blue' ? mapData.spawns.blue : mapData.spawns.orange;
        }
        used = pool === mapData.spawns.blue ? usedBlue : usedOrange;
        sp = pickSpawn(pool, used);
        /* 快樂模式 100 人共用 10 個出生點：散開避免疊在一起，但不能卡進牆裡 */
        if (mode === 'happy' && bot.team === 'orange') {
          var ox = sp.x + (Math.random() - 0.5) * 1.6;
          var oz = sp.z + (Math.random() - 0.5) * 1.6;
          if (!playerHitsBox(ox, oz, 0, 0.5)) sp = { x: ox, z: oz, yaw: sp.yaw };
        }
      }
      bot.spawn(sp.x, sp.z, sp.yaw, role, false);
      if (roofMode) bot.pos.y = ROOF_Y;
      bot.targetSite = Math.random() < 0.5 ? 'A' : 'B';
    }

    // 拆除模式：指定攜帶者／攻方目標點
    if (mode === 'defuse') {
      bomb.site = Math.random() < 0.5 ? 'A' : 'B';
      assignBombCarrier();
    } else {
      playerHasBomb = false;
      elCarrierHud.classList.remove('show');
    }

    clearGrenades();
    updateViewModel();
    updateHUD();
    buildBuyMenu();
    setAlarm(radMode ? 2 : 0);
    if (window.SFX) SFX.roundStart();
    announce(radMode ? pickLine(BC_LINES.rad) : pickLine(BC_LINES.start), radMode);
    var sub = '購買時間 ' + BUY_TIME + ' 秒 · 按 B 購買';
    if (mode === 'defuse') {
      sub = playerRole === 'attack'
        ? '你是攻方 · 到 A / B 按住 G 下包'
        : '你是守方 · 阻止對方下包，E 拆包';
    }
    showCenter('回合 ' + roundNo, sub, 2.4);
    movieLog('round', '回合 ' + roundNo + (mode === 'defuse' ? (attackTeam === 'blue' ? ' 藍隊進攻' : ' 橙隊進攻') : ''));
    if (MOVIE) movieRoundStart();
  }

  function addHallBlockers() {
    var spots = [
      { x: 0, z: 8, w: 8.4, d: 1.4, h: 4.2 },
      { x: -15, z: -4, w: 1.4, d: 3.8, h: 4.2 },
      { x: -15, z: 4, w: 1.4, d: 3.8, h: 4.2 },
      { x: 15, z: -4, w: 1.4, d: 3.8, h: 4.2 },
      { x: 15, z: 4, w: 1.4, d: 3.8, h: 4.2 },
      { x: 11, z: 6.5, w: 3.4, d: 3.4, h: 4.2 }   // 地下室上樓梯口也封住
    ];
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var c = {
        minX: s.x - s.w / 2, maxX: s.x + s.w / 2,
        minZ: s.z - s.d / 2, maxZ: s.z + s.d / 2,
        minY: 0, maxY: s.h, tall: true
      };
      mapData.colliders.push(c);
      mapData.colliders.__grid = null;   // 碰撞體變動 → 重建空間索引
      var m = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d),
        new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.16, depthWrite: false }));
      m.position.set(s.x, s.h / 2, s.z);
      scene.add(m);
      hallBlockers.push({ collider: c, mesh: m });
    }
  }
  function removeHallBlockers() {
    for (var i = 0; i < hallBlockers.length; i++) {
      var hb = hallBlockers[i];
      var idx = mapData.colliders.indexOf(hb.collider);
      if (idx >= 0) mapData.colliders.splice(idx, 1);
      scene.remove(hb.mesh);
    }
    hallBlockers = [];
    mapData.colliders.__grid = null;   // 碰撞體變動 → 重建空間索引
  }

  function endRound(winner, reason) {
    if (roundResolved) return;
    movieLog('roundEnd', (winner === 'blue' ? '藍隊' : '橙隊') + '勝利：' + (reason || ''));
    roundResolved = true;
    gameState = 'roundEnd';
    roundEndT = 3.2;
    if (buyOpen) { buyOpen = false; elBuy.classList.add('hidden'); }
    removeHallBlockers();
    elBombHud.classList.remove('show');

    setAlarm(radMode ? 2 : 0);
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive && bots[i].team === winner) bots[i].celebrate();
    }
    if (winner === 'blue') {
      scoreBlue++;
      if (player.team === 'blue') player.money = Math.min(MAX_MONEY, player.money + 3250);
      stats.roundsWon++;
      showCenter('藍隊勝利', reason || '敵人被全部消滅', 2.8);
      if (window.SFX) SFX.roundWin();
      if (player.alive && player.team === 'blue') playerCelebrateT = 1.1;
    } else {
      scoreOrange++;
      player.money = Math.min(MAX_MONEY, player.money + 1400);
      showCenter('橙隊勝利', reason || '我們被消滅了', 2.8);
      if (window.SFX) SFX.roundLose();
    }
    elCarrierHud.classList.remove('show');
    elPaintHud.classList.remove('show');
    updateHUD();
  }

  function nextRoundOrEnd() {
    if (scoreBlue >= WIN_ROUNDS || scoreOrange >= WIN_ROUNDS) {
      gameOver();
    } else {
      roundNo++;
      startRound();
    }
  }

  var sbVisible = false, sbT = 0;
  function showScoreboard() {
    if (!elScoreboard) return;
    sbVisible = true;
    elScoreboard.classList.add('show');
    renderScoreboard();
  }
  function hideScoreboard() {
    sbVisible = false;
    if (elScoreboard) elScoreboard.classList.remove('show');
  }
  function renderScoreboard() {
    if (!elSbCols) return;
    var blue = [{ name: PLAYER_NAME, kills: stats.kills, deaths: stats.deaths, alive: player.alive, me: true }];
    var orange = [];
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      var row = { name: b.name, kills: b.kills || 0, deaths: b.deaths || 0, alive: b.alive };
      if (b.team === 'blue') blue.push(row); else orange.push(row);
    }
    function sortRows(a, b) { return (b.kills - a.kills) || (a.deaths - b.deaths); }
    blue.sort(sortRows); orange.sort(sortRows);
    function col(title, rows, cls) {
      var html = '<div class="sbTeam ' + cls + '"><h3>' + title + '</h3>' +
        '<div class="sbHead"><span>名字</span><span>擊殺</span><span>死亡</span></div>';
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        html += '<div class="sbRow' + (row.me ? ' me' : '') + (row.alive ? '' : ' dead') + '">' +
          '<span>' + row.name + '</span>' +
          '<span class="kills">' + row.kills + '</span>' +
          '<span class="deaths">' + row.deaths + '</span></div>';
      }
      return html + '</div>';
    }
    elSbCols.innerHTML = col('藍隊', blue, 'blue') + col('橙隊', orange, 'orange');
  }
  function updateScoreboard(dt) {
    if (!sbVisible) return;
    sbT -= dt;
    if (sbT <= 0) { sbT = 0.35; renderScoreboard(); }
  }

  function renderEndRank(withLevel) {
    var el = document.getElementById('endRank');
    if (!el) return;
    var rows = [{ name: PLAYER_NAME, team: player.team, kills: stats.kills, deaths: stats.deaths, lvl: ggPlayerLevel, me: true }];
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      rows.push({ name: b.name, team: b.team, kills: b.kills || 0, deaths: b.deaths || 0, lvl: b.ggLevel || 0 });
    }
    rows.sort(function (a, b) {
      return (b.kills - a.kills) || (a.deaths - b.deaths) || (b.lvl - a.lvl);
    });
    el.className = withLevel ? 'withLevel' : '';
    var html = '<div class="rankHead"><span>#</span><span>名字</span><span>隊</span><span>擊殺</span><span>死亡</span>' +
      (withLevel ? '<span>等級</span>' : '') + '</div>';
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      html += '<div class="rankRow' + (row.me ? ' me' : '') + '">' +
        '<span>' + (r + 1) + '</span>' +
        '<span>' + row.name + '</span>' +
        '<span class="' + (row.team === 'blue' ? 'tb' : 'to') + '">' + (row.team === 'blue' ? '藍' : '橙') + '</span>' +
        '<span>' + row.kills + '</span>' +
        '<span>' + row.deaths + '</span>' +
        (withLevel ? '<span>' + (row.lvl + 1) + '/' + GG_LADDER.length + '</span>' : '') +
        '</div>';
    }
    el.innerHTML = html;
  }

  function gameOver() {
    gameState = 'over';
    if (document.pointerLockElement) document.exitPointerLock();
    elHUD.classList.add('hidden');
    elCross.classList.add('hidden');
    elEnd.classList.remove('hidden');
    var win = scoreBlue > scoreOrange;
    $('endTitle').textContent = win ? '勝利' : '失敗';
    $('endTitle').style.color = win ? 'var(--orange)' : 'var(--red)';
    $('endScore').textContent = scoreBlue + ' : ' + scoreOrange;
    $('endStats').textContent = '擊殺 ' + stats.kills + ' · 爆頭 ' + stats.headshots +
      ' · 死亡 ' + stats.deaths + ' · 勝回合 ' + stats.roundsWon;
    renderEndRank(false);
    if (window.SFX) (win ? SFX.roundWin() : SFX.roundLose());
  }

  function pauseGame() {
    if (gameState === 'paused' || gameState === 'menu' || gameState === 'over') return;
    prevState = gameState;
    gameState = 'paused';
    elPause.classList.remove('hidden');
  }
  function resumeGame() {
    if (gameState !== 'paused') return;
    elPause.classList.add('hidden');
    gameState = prevState || 'live';
    if (!TEST) canvas.requestPointerLock();
  }

  /* ---------- 提示 ---------- */
  var hintT = 0;
  function showHint(text, dur) {
    elHint.textContent = text;
    elHint.classList.add('show');
    hintT = dur || 1.6;
  }
  var centerT = 0;
  function showCenter(main, sub, dur) {
    elCenter.innerHTML = main + (sub ? '<div class="sub">' + sub + '</div>' : '');
    elCenter.classList.add('show');
    centerT = dur || 2.2;
  }
  /* ---------- 廠區廣播與警報燈光 ---------- */
  var announceT = 0;
  var broadcastCd = 55;
  var spectateIdx = 0;
  var spectateHintT = -9;
  /* 死亡觀戰：自由視角 */
  var deathCamFree = false;
  var freeCamPos = new THREE.Vector3();
  var freeCamVel = new THREE.Vector3();
  var freeCamYaw = 0;
  var freeCamPitch = 0;
  var spectateHidden = null;
  var spectateLerpT = 0;
  var spectateLerpFrom = new THREE.Vector3();
  var spectateLerpYaw = 0;

  function restoreSpectateHidden() {
    if (spectateHidden) {
      if (spectateHidden.mesh) spectateHidden.mesh.visible = true;
      if (spectateHidden.label) spectateHidden.label.visible = true;
      spectateHidden = null;
    }
  }

  function resetDeathCamState() {
    deathCamFree = false;
    spectateLerpT = 0;
    restoreSpectateHidden();
  }
  var BC_LINES = {
    start: [
      '各單位注意：本機組今日安全運行第 0 天，請保持。',
      '值班人員請就位，反應堆狀況一切正常（大概）。',
      '本班次開始，請檢查裝備，並確認自己知道出口在哪。'
    ],
    gungame: [
      '軍備競賽開始：先把手上的槍用明白，再去想小刀。',
      '各單位注意：本場不使用購買，請靠擊殺升級裝備。'
    ],
    bomb: [
      '緊急通告：檢測到異常熱源，請就近確認。',
      '警告：目標區域溫度上升，非必要人員撤離。',
      '請注意：倒數開始了，現在後悔還來得及。'
    ],
    defused: [
      '警報解除，系統恢復正常。請各單位回到崗位。',
      '好，拆掉了。請把這件事寫進報告，並假裝我們一直很有把握。'
    ],
    explode: [
      '堆芯溫度失控，請立即撤離。這不是演習。',
      '警告：本回合的安全紀錄已歸零。'
    ],
    rad: [
      '緊急通告：反應堆進入不穩定狀態，所有人員立即撤離。',
      '警告：輻射水平上升。請不要深呼吸，也不要拍照。'
    ],
    idle: [
      '各部門注意：本機組已安全運行 0 天，請繼續保持。',
      '夜班人員請勿在反應堆旁吃泡麵，泡麵湯請倒入指定容器。',
      '三號泵房報告：水位正常。二號泵房報告：我們也正常，謝謝關心。',
      '請勿投餵反應堆，它已經吃飽了。',
      '控制室請注意：剛才的紅燈不是故障，是裝飾。',
      '提醒：撤離演習不是真的撤離，但跑得快一點總沒錯。',
      '本區域已消毒（大概），請放心執勤。',
      '請各單位檢查儀表，尤其是那些看起來像在開玩笑的儀表。'
    ]
  };
  function pickLine(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function setAlarm(level) {
    if (mapData) mapData.alarmLevel = level;
  }
  function announce(text, urgent) {
    if (!elAnnounce || !text) return;
    elAnnounceTxt.textContent = text;
    elAnnounce.classList.add('show');
    elAnnounce.classList.toggle('urgent', !!urgent);
    announceT = urgent ? 4.4 : 3.6;
    if (window.SFX) (urgent ? SFX.alarm() : SFX.broadcast());
    movieLog('broadcast', text);
  }
  function updateAnnounce(dt) {
    if (announceT > 0) {
      announceT -= dt;
      if (announceT <= 0) elAnnounce.classList.remove('show');
    }
    if (gameState === 'live' && !roundResolved) {
      broadcastCd -= dt;
      if (broadcastCd <= 0) {
        broadcastCd = 55 + Math.random() * 35;
        announce(pickLine(BC_LINES.idle));
      }
    }
  }

  /* ---------- 對講機搞笑對話 ---------- */
  var radioHideT = 0;
  var radioNextT = 30;
  var RADIO_CHATS = [
    [{ who: '方塊老爹', text: '我掩護你！' }, { who: '小方同學', text: '你先掩護你自己吧。' }],
    [{ who: '夜貓子', text: '我看到他了！' }, { who: '硬核教練', text: '在哪？' }, { who: '夜貓子', text: '我也想知道。' }],
    [{ who: '鐵壁大哥', text: '我走最前面。' }, { who: '藍帽小工', text: '因為你最大隻。' }],
    [{ who: '骨頭隊長', text: '誰在打我的骨頭？' }, { who: '悶聲大哥', text: '我什麼都沒說。' }],
    [{ who: '金幣獵人', text: '這局我請客。' }, { who: '夜貓子', text: '你先活下來再說。' }],
    [{ who: '藍帽隊長', text: '我們需要一個計劃。' }, { who: '藍帽學徒', text: '計劃就是衝。' }],
    [{ who: '方塊老爹', text: '有人看到敵人嗎？' }, { who: '瘦高影子', text: '……' }, { who: '方塊老爹', text: '當我沒問。' }],
    [{ who: '橙帽打手', text: '他們在天台！', team: 'orange' }, { who: '夜貓子', text: '我們也在天台。' }, { who: '硬核教練', text: '那就好辦了。' }],
    [{ who: '藍帽技師', text: '我的槍卡彈了。' }, { who: '鐵壁大哥', text: '用拳頭。' }],
    [{ who: '金幣獵人', text: '這顆手雷值三百塊。' }, { who: '悶聲大哥', text: '丟出去就值三十。' }],
    [{ who: '藍帽守衛', text: '我守這裡。' }, { who: '方塊老爹', text: '你守的是我們的退路。' }],
    [{ who: '夜貓子', text: '對講機好像壞了。' }, { who: '硬核教練', text: '你現在聽得到我嗎？' }, { who: '夜貓子', text: '聽得到。' }, { who: '硬核教練', text: '那就沒壞。' }],
    [{ who: '橙帽新丁', text: '他們衝過來了！', team: 'orange' }, { who: '橙帽工頭', text: '你也是衝過來的。', team: 'orange' }],
    [{ who: '方塊老爹', text: '誰在開槍？' }, { who: '藍帽隊長', text: '不是我。' }, { who: '小方同學', text: '也不是我。' }, { who: '方塊老爹', text: '那就是敵人了。' }]
  ];
  var RADIO_COLORS = ['#7dfcff', '#ff7ad9', '#ffe066', '#ff9a4a', '#9dffb0', '#c9a0ff', '#ff9a9a', '#8ac6ff'];
  /* 對講機對話模板：每次隨機組合名字 + 台詞，幾乎不會重複 */
  var CHAT_TEMPLATES = [
    function () { return [pickLine(['我掩護你！', '我來開路！', '跟著我！', '看我的！']), pickLine(['你先掩護你自己。', '你走反了。', '上局也是這樣說的。', '你確定？'])]; },
    function () { return [pickLine(['我在 A 點！', '我在 B 點！', '我就在門口！', '我在樓上！']), pickLine(['A 點在另一邊。', '你確定那是 B 點？', '門口有很多個。', '樓上很危險。'])]; },
    function () { return [pickLine(['我的槍卡彈了。', '我沒子彈了。', '我打空了。', '我的準星在晃。']), pickLine(['用拳頭。', '那你趴下吧。', '晃的可能是你的手。', '省錢的好方法。'])]; },
    function () { return [pickLine(['這顆手雷值三百塊。', '我扔手雷了！', '手雷往你那邊！', '小心爆炸！']), pickLine(['丟出去就值三十。', '扔準一點。', '我知道，我看到了。', '謝謝你提醒得太晚。'])]; },
    function () { return [pickLine(['我看到敵人了！', '有人在那邊！', '對面有動靜。', '有人在跑。']), pickLine(['在哪？', '我也想知道。', '你確定不是隊友？', '他剛從你旁邊過去。'])]; },
    function () { return [pickLine(['誰能來支援我？', '我需要人！', '救命！', '這邊快守不住了。']), pickLine(['馬上到。', '我在忙。', '你再撐三秒。', '已經太遠了，祝好運。'])]; },
    function () { return [pickLine(['你這槍打得漂亮！', '好球！', '這波可以！', '太準了！']), pickLine(['運氣。', '打偏了八次。', '你看到的只是最後一次。', '我也這麼覺得。'])]; },
    function () { return [pickLine(['我掛了。', '我倒了。', '我先走一步。', '這個角度太刁了。']), pickLine(['安心去吧。', '下局見。', '我會記住你的。', '保持這個位置。'])]; },
    function () { return [pickLine(['我去下包。', '我去拆包。', '包在我手上。', '倒數開始了！']), pickLine(['小心點。', '別急。', '對面就在附近。', '記得回來。'])]; },
    function () { return [pickLine(['撤退！', '先撤！', '別打了，跑！', '我們打不過。']), pickLine(['我同意。', '這不是我的主意。', '我早就想跑了。', '早說啊。'])]; },
    function () { return [pickLine(['敵人全在這裡！', '他們衝過來了！', '這波很多人！', '對面全員出動！']), pickLine(['那我們這邊人呢？', '數字上我們有優勢。', '我選擇相信你。', '我先躲一下。'])]; }
  ];
  function makeRandomChat() {
    if (Math.random() < 0.6) {
      var names = [];
      for (var i = 0; i < bots.length; i++) if (bots[i].alive) names.push(bots[i].name);
      if (names.length >= 2) {
        var n1 = names[Math.floor(Math.random() * names.length)];
        var n2 = names[Math.floor(Math.random() * names.length)];
        var t = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)]();
        var t2 = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)]();
        return [
          { who: n1, text: t[0] },
          { who: n2, text: t[1] },
          { who: n1, text: t2[0] }
        ];
      }
    }
    return RADIO_CHATS[Math.floor(Math.random() * RADIO_CHATS.length)];
  }
  function radioColorFor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return RADIO_COLORS[h % RADIO_COLORS.length];
  }
  function spawnFloatChat(c) {
    if (!c) return;
    var line = document.createElement('div');
    line.className = 'floatChat' + (c.team === 'orange' ? ' orange' : '');
    var col = c.team === 'orange' ? '#ffb45a' : radioColorFor(c.who);
    line.innerHTML = '<b style="color:' + col + '">' + c.who + '</b>' + c.text;
    /* 綜藝花字：左右隨機、上下隨機、隨機角度與字號，亂跳著出現 */
    var leftSide = Math.random() < 0.5;
    line.style.left = leftSide ? (12 + Math.random() * 26) + 'px' : 'auto';
    line.style.right = leftSide ? 'auto' : (12 + Math.random() * 26) + 'px';
    line.style.top = (16 + Math.random() * 54) + '%';
    line.style.transform = 'rotate(' + (Math.random() * 14 - 7) + 'deg)';
    line.style.fontSize = (16 + Math.random() * 7) + 'px';
    document.body.appendChild(line);
    if (window.SFX) SFX.radio();
    setTimeout(function () { line.classList.add('out'); }, 2400 + Math.random() * 700);
    setTimeout(function () { if (line.parentNode) line.remove(); }, 3300);
  }
  function radioChat(chat) {
    if (!chat || !chat.length) return;
    var delay = 0;
    for (var i = 0; i < chat.length; i++) {
      if (i === 0) spawnFloatChat(chat[i]);
      else (function (c, d) {
        setTimeout(function () { spawnFloatChat(c); }, d);
      })(chat[i], delay);
      delay += 1100 + chat[i].text.length * 45;
    }
    radioHideT = 0;
  }
  function updateRadio(dt) {
    if (radioHideT > 0) {
      radioHideT -= dt;
      if (radioHideT <= 0) elRadio.classList.remove('show');
    }
    if (gameState === 'live' && !roundResolved) {
      radioNextT -= dt;
      if (radioNextT <= 0) {
        radioNextT = 25 + Math.random() * 25;
        radioChat(makeRandomChat());
      }
    }
  }

  function movieLog(type, text) {
    if (!MOVIE) return;
    movieEvents.push({ t: Math.max(0, +(elapsed - movieStart).toFixed(2)), type: type, text: text || '' });
    if (movieEvents.length > 600) movieEvents.shift();
  }

  function addKillfeed(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    elKillfeed.appendChild(d);
    setTimeout(function () {
      d.classList.add('fade');
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 500);
    }, 4200);
  }

  /* ---------- 射擊 ---------- */
  var raycaster = new THREE.Raycaster();
  var tmpV1 = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpV3 = new THREE.Vector3();

  function hitStop(sec) {
    if (elapsed < hitStopCd) return;
    hitStopCd = elapsed + 0.11;
    hitStopT = Math.max(hitStopT, sec);
  }

  /* ---------- 彈道曳光：每把槍一種柔和顏色 ---------- */
  function initTracers() {
    for (var i = 0; i < 32; i++) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      var mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      var line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      line.visible = false;
      scene.add(line);
      tracerPool.push({ line: line, life: 0, geo: geo, mat: mat });
    }
  }
  function tracerColorFor(key) {
    if (TRACER_COLORS[key]) return TRACER_COLORS[key];
    var keys = Object.keys(window.WEAPONS || {});
    var idx = keys.indexOf(key);
    if (idx < 0) idx = keys.length;
    /* 黃金角輪轉色相，低飽和高明度 = 柔和彩色 */
    var hue = (idx * 137.5) % 360;
    var c = new THREE.Color('hsl(' + hue.toFixed(0) + ',60%,74%)');
    TRACER_COLORS[key] = c;
    return c;
  }
  function spawnTracer(from, to, key) {
    var slot = null;
    for (var i = 0; i < tracerPool.length; i++) {
      if (tracerPool[i].life <= 0) { slot = tracerPool[i]; break; }
    }
    if (!slot) slot = tracerPool[0];
    var p = slot.geo.attributes.position;
    p.setXYZ(0, from.x, from.y, from.z);
    p.setXYZ(1, to.x, to.y, to.z);
    p.needsUpdate = true;
    slot.mat.color.copy(tracerColorFor(key));
    slot.mat.opacity = 0.7;
    slot.life = TRACER_LIFE;
    slot.line.visible = true;
  }
  function updateTracers(dt) {
    for (var i = 0; i < tracerPool.length; i++) {
      var t = tracerPool[i];
      if (t.life > 0) {
        t.life -= dt;
        t.mat.opacity = Math.max(0, 0.7 * (t.life / TRACER_LIFE));
        if (t.life <= 0) { t.line.visible = false; t.mat.opacity = 0; }
      }
    }
  }

  function currentSpread() {
    var W = window.WEAPONS[player.current];
    if (!W) return 0;
    var base = player.scoped ? (W.scopedSpread || 0) : W.spread;
    var moving = Math.min(1, player.speedXZ / 5.4);
    base += (W.moveSpread || 0) * moving;
    if (!player.onGround) base += 0.05;
    if (player.crouch) base *= 0.7;
    if (player.switchAccT > 0) base *= 1.75;   // 換槍後 0.2 秒內準度略降
    return base;
  }

  function tryShoot() {
    if (gameState !== 'live' || !player.alive) return;
    var now = elapsed;
    var W = window.WEAPONS[player.current];
    if (!W) return;
    if (W.type === 'grenade') { throwGrenade(); return; }
    if (player.reloading) return;
    if (player.switching && player.switchT < 0.08) return;  // 抽槍動作極短，幾乎不影響開火
    var interval = 60 / W.rpm;
    if (now - player.lastShot < interval) return;
    var ammo = player.ammo[player.current];
    if (!ammo) return;
    if (W.type === 'melee') { player.lastShot = now; doMelee(W); return; }
    if (ammo.mag <= 0) {
      if (now - player.lastShot > interval) {
        SFX.dryFire();
        player.lastShot = now;
        if (ammo.reserve > 0) startReload();
      }
      return;
    }
    /* 快樂模式：無限子彈，不扣彈匣 */
    if (mode !== 'happy') ammo.mag--;
    player.lastShot = now;
    var isPaint = W.type === 'paint';
    if (isPaint) { if (window.SFX) SFX.paint(); }
    else SFX.shot(W.sound);
    spawnShell();
    showMuzzleFlash(isPaint);
    // 先開火（首發精準），再累積後坐力（V2 後坐力較小）
    var pellets = W.pellets || 1;
    for (var p = 0; p < pellets; p++) fireRay(W, isPaint);
    var rec = W.recoil * 0.55;
    player.recoilOffset = Math.min(0.32, player.recoilOffset + rec * (0.75 + Math.random() * 0.4));
    player.yaw += (Math.random() - 0.5) * rec * 0.55;
    player.recoilPitch += rec * 0.5;
    updateHUD();
  }

  function fireRay(W, isPaint) {
    // 同步相機到當前瞄準（含後坐力偏移）
    camera.position.set(player.pos.x, player.pos.y + player.eyeH, player.pos.z);
    camera.rotation.y = player.yaw + Math.PI;
    camera.rotation.x = player.pitch + player.recoilOffset;
    camera.updateMatrixWorld();
    camera.getWorldDirection(tmpV1);
    var spread = currentSpread();
    tmpV2.set(1, 0, 0).crossVectors(tmpV1, new THREE.Vector3(0, 1, 0)).normalize();
    if (tmpV2.lengthSq() < 0.01) tmpV2.set(1, 0, 0);
    tmpV3.crossVectors(tmpV2, tmpV1).normalize();
    var a = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random()) * spread;
    tmpV1.addScaledVector(tmpV2, Math.cos(a) * r).addScaledVector(tmpV3, Math.sin(a) * r).normalize();

    raycaster.set(camera.position, tmpV1);
    raycaster.far = W.range || 200;

    var targets = [];
    for (var i = 0; i < bots.length; i++) {
      if (!bots[i].alive) continue;
      for (var h = 0; h < bots[i].hitMeshes.length; h++) targets.push(bots[i].hitMeshes[h]);
    }
    for (var m = 0; m < mapData.meshes.length; m++) targets.push(mapData.meshes[m]);

    var hits = raycaster.intersectObjects(targets, false);
    /* 彈道曳光：每把槍不同柔和色，從槍口畫到命中點 */
    muzzleTmp.copy(camera.position).addScaledVector(tmpV1, 0.9);
    if (!hits.length) {
      var farPoint = new THREE.Vector3().copy(muzzleTmp).addScaledVector(tmpV1, 95);
      spawnTracer(muzzleTmp, farPoint, W.key);
      return;
    }
    spawnTracer(muzzleTmp, hits[0].point, W.key);
    var hit = hits[0];
    var bot = hit.object.userData.bot;
    if (bot && bot.alive && bot.team !== player.team) {
      var part = hit.object.userData.part || 'body';
      var dist = hit.distance;
      var falloff = Math.max(0.55, 1 - (dist / (W.range || 100)) * 0.45);
      var dmg = W.dmg * falloff;
      var shotDir = { x: tmpV1.x, z: tmpV1.z };
      var killed = bot.takeDamage(dmg, part, shotDir);
      if (isPaint) {
        bot.applyPaint();
        addPaintDecal(hit);
        if (window.SFX) SFX.paintSplat();
        if (elapsed - lastPaintToast > 1.2) {
          lastPaintToast = elapsed;
          elPaintHud.textContent = '漆彈命中 · ' + bot.name + ' 染色 8 秒';
          elPaintHud.classList.add('show');
          setTimeout(function () { if (elapsed - lastPaintToast > 1.1) elPaintHud.classList.remove('show'); }, 1100);
        }
      } else if (part === 'head') {
        SFX.headshot();
        stats.headshots++;
      } else {
        SFX.hit();
      }
      spawnPuff(hit.point, isPaint ? 0.2 : 0.16);
      showHitmarker();
      hitStop(killed ? 0.075 : 0.012);
      if (killed) onBotKilled(player, bot);
    } else if (bot && bot.team === player.team) {
      // 友軍不傷害
    } else {
      if (hit.object.userData.isGlass) {
        breakGlass(hit.object);
      } else {
        addDecal(hit, isPaint);
      }
    }
  }

  function doMelee(W) {
    camera.getWorldDirection(tmpV1);
    raycaster.set(camera.position, tmpV1);
    raycaster.far = W.range;
    var targets = [];
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive && bots[i].team !== player.team) {
        for (var h = 0; h < bots[i].hitMeshes.length; h++) targets.push(bots[i].hitMeshes[h]);
      }
    }
    var hits = raycaster.intersectObjects(targets, false);
    if (hits.length) {
      var bot = hits[0].object.userData.bot;
      if (bot && bot.alive) {
        var part = hits[0].object.userData.part || 'body';
        var killed = bot.takeDamage(W.dmg, part, { x: tmpV1.x, z: tmpV1.z });
        SFX.hit();
        showHitmarker();
        hitStop(killed ? 0.075 : 0.012);
        if (killed) onBotKilled(player, bot);
      }
    } else SFX.dryFire();
  }

  function onBotKilled(shooter, victim) {
    movieLog('kill', (shooter ? shooter.name : '？') + ' 擊殺 ' + (victim ? victim.name : '？'));
    /* 錄影模式：擊殺瞬間慢鏡 0.4 秒，電競高光感 */
    if (MOVIE) hitStop(0.4);
    /* 死亡爆塊：身體散成小方塊（膚色 + 隊服色） */
    if (victim && victim !== player && victim.mesh) {
      var skinCol = victim.ch && victim.ch.skin ? new THREE.Color(victim.ch.skin).getHex() : 0xc9a17a;
      var teamCol = victim.team === 'blue' ? 0x2a6fe0 : 0xff8a1c;
      spawnDebris(victim.pos.x, victim.pos.y + 0.4, victim.pos.z, skinCol);
      spawnDebris(victim.pos.x, victim.pos.y + 0.4, victim.pos.z, teamCol);
      victim.mesh.visible = false;
    }
    /* 排名統計（結算後仍計入） */
    if (shooter && shooter !== player) shooter.kills = (shooter.kills || 0) + 1;
    if (victim && victim !== player) victim.deaths = (victim.deaths || 0) + 1;
    /* 回合已結算後的爆炸連鎖擊殺不再給分／改寫贏家 */
    if (roundResolved) return;
    if (Math.random() < 0.10) radioChat(makeRandomChat());

    /* 軍備競賽：擊殺即升級，無限重生，不用回合流程 */
    if (mode === 'gungame') {
      if (shooter === player) {
        stats.kills++;
        playerCelebrateT = 0.9;
        addKillfeed(PLAYER_NAME + ' 擊殺了 ' + victim.name);
        if (window.SFX) SFX.celebrate();
        hitStop(0.075);
        if (ggPlayerLevel >= GG_LADDER.length - 1) {
          ggFinish('blue', PLAYER_NAME);
        } else {
          ggPlayerLevel++;
          ggGivePlayer();
          showHint('升級：' + window.WEAPONS[player.current].name, 1.8);
        }
      } else if (shooter) {
        shooter.celebrate();
        addKillfeed(shooter.name + ' 擊殺了 ' + (victim === player ? PLAYER_NAME : victim.name));
        if ((shooter.ggLevel || 0) >= GG_LADDER.length - 2) {
          ggFinish(shooter.team, shooter.name);
        } else {
          shooter.ggLevel = (shooter.ggLevel || 0) + 1;
          ggGiveBot(shooter);
        }
      }
      updateHUD();
      return;
    }

    if (shooter === player) {
      stats.kills++;
      player.money = Math.min(MAX_MONEY, player.money + 300);
      playerCelebrateT = 0.9;
      addKillfeed('你 擊殺了 ' + victim.name);
      if (window.SFX) SFX.celebrate();
      hitStop(0.075);
      elPaintHud.innerHTML = '擊殺！<span class="cash">+$300</span>';
      elPaintHud.classList.add('show');
      setTimeout(function () { elPaintHud.classList.remove('show'); }, 1100);
    } else if (victim === player) {
      // 玩家死亡在 playerHurt 中處理
    } else if (shooter) {
      shooter.celebrate();   // 擊殺慶祝：舉手 + 跳躍
      addKillfeed(shooter.name + ' 擊殺了 ' + victim.name);
    }
    /* 攜帶者死亡 → 交給下一個攻方 */
    if (mode === 'defuse' && !bomb.planted) {
      if (victim === bomb.carrier || (victim === player && playerHasBomb)) {
        if (victim === player) { playerHasBomb = false; player.hasBomb = false; }
        bomb.carrier = null;
        assignBombCarrier();
      }
    }
    updateHUD();
    checkRoundEnd();
  }

  function checkRoundEnd() {
    if (roundResolved) return;
    if (mode === 'gungame') return;
    var blueAlive = player.alive ? 1 : 0;
    var orangeAlive = 0;
    for (var i = 0; i < bots.length; i++) {
      if (!bots[i].alive) continue;
      if (bots[i].team === 'blue') blueAlive++;
      else orangeAlive++;
    }
    if (mode === 'defuse') {
      if (bomb.planted) return;   // 已下包：等拆包或爆炸
      var atkAlive = attackTeam === 'blue' ? blueAlive : orangeAlive;
      var defTeam = attackTeam === 'blue' ? 'orange' : 'blue';
      if (atkAlive === 0) endRound(defTeam, '攻方被消滅，炸彈未下包');
      return;
    }
    if (orangeAlive === 0) endRound('blue', '敵人被全部消滅');
    else if (blueAlive === 0) endRound('orange', '藍隊被全部消滅');
  }

  function showMuzzleFlash(isPaint) {
    var m = viewModels[player.current];
    if (!m) return;
    flashRoot.position.copy(viewRoot.position).addScaledVector(m.userData.muzzle, 0.92);
    flashSprite.visible = true;
    flashSprite.material.rotation = Math.random() * Math.PI;
    flashSprite.material.color.setHex(isPaint ? 0x8dffa8 : 0xffffff);
    var s = 0.26 + Math.random() * 0.16;
    flashSprite.scale.set(s, s, 1);
    camera.updateMatrixWorld();
    var wpos = flashRoot.position.clone();
    camera.localToWorld(wpos);
    spawnPuff(wpos, 0.2);
    setTimeout(function () { flashSprite.visible = false; }, 45);
  }

  var decalMat = new THREE.MeshBasicMaterial({ color: 0x2a241c, transparent: true, opacity: 0.85 });
  var paintDecalMat = new THREE.MeshBasicMaterial({ color: 0x47ff6f, transparent: true, opacity: 0.9 });
  function addDecal(hit, paint) {
    if (!hit.face) return;
    var n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    var m = new THREE.Mesh(new THREE.CircleGeometry(paint ? 0.075 : 0.04, paint ? 8 : 6),
      paint ? paintDecalMat : decalMat);
    m.position.copy(hit.point).addScaledVector(n, 0.012);
    m.lookAt(hit.point.clone().add(n));
    scene.add(m);
    decals.push(m);
    if (decals.length > 80) {
      var old = decals.shift();
      scene.remove(old);
      old.geometry.dispose();
    }
    spawnPuff(hit.point, paint ? 0.2 : 0.12);
  }

  function addPaintDecal(hit) {
    addDecal(hit, true);
    paintSplats.push({ t: 0 });
    if (paintSplats.length > 30) paintSplats.shift();
  }

  /* ---------- 可擊碎玻璃 ---------- */
  var shardGeo = new THREE.BoxGeometry(0.13, 0.13, 0.05);
  var shardMat = new THREE.MeshStandardMaterial({
    color: 0xbfe8f5, transparent: true, opacity: 0.8, roughness: 0.05, metalness: 0.2
  });
  function breakGlass(mesh) {
    if (!mapData.glass) return;
    var entry = null;
    for (var i = 0; i < mapData.glass.length; i++) {
      if (mapData.glass[i].mesh === mesh && !mapData.glass[i].broken) { entry = mapData.glass[i]; break; }
    }
    if (!entry) return;
    entry.broken = true;
    scene.remove(entry.mesh);
    var ci = mapData.colliders.indexOf(entry.collider);
    if (ci >= 0) mapData.colliders.splice(ci, 1);
    mapData.colliders.__grid = null;
    var mi = mapData.meshes.indexOf(entry.mesh);
    if (mi >= 0) mapData.meshes.splice(mi, 1);
    var n = entry.ry ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    for (var s = 0; s < 16; s++) {
      var sh = new THREE.Mesh(shardGeo, shardMat);
      sh.position.set(
        entry.x + (Math.random() - 0.5) * (entry.ry ? 0.2 : entry.w),
        4 + (Math.random() - 0.5) * entry.h,
        entry.z + (Math.random() - 0.5) * (entry.ry ? entry.w : 0.2)
      );
      scene.add(sh);
      glassShards.push({
        mesh: sh, life: 1.4,
        vel: new THREE.Vector3(n.x * (Math.random() - 0.5) * 4 + (Math.random() - 0.5) * 2,
          1.2 + Math.random() * 2.4,
          n.z * (Math.random() - 0.5) * 4 + (Math.random() - 0.5) * 2)
      });
    }
    if (window.SFX) SFX.glass();
    showHint('觀察窗玻璃已擊碎', 1.2);
    addKillfeed('<span style="color:#9fe6ff">玻璃碎裂</span>');
  }

  function updateGlassShards(dt) {
    for (var i = glassShards.length - 1; i >= 0; i--) {
      var s = glassShards[i];
      s.life -= dt;
      s.vel.y -= 16 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.rotation.x += dt * 8;
      s.mesh.rotation.y += dt * 6;
      if (s.life <= 0 || s.mesh.position.y < 0.05) {
        scene.remove(s.mesh);
        glassShards.splice(i, 1);
      }
    }
  }

  function showHitmarker() {
    elHit.classList.remove('show');
    void elHit.offsetWidth;
    elHit.classList.add('show');
    elCross.classList.add('hit');
    setTimeout(function () { elCross.classList.remove('hit'); }, 80);
  }

  /* ---------- 換彈 / 開鏡 / 手雷 ---------- */
  function startReload() {
    var W = window.WEAPONS[player.current];
    if (!W || W.type === 'melee' || W.type === 'grenade') return;
    var ammo = player.ammo[player.current];
    if (!ammo) return;
    if (player.reloading || player.switching || ammo.mag >= W.mag || ammo.reserve <= 0) return;
    player.reloading = true;
    player.reloadT = W.reload;
    SFX.reloadStart();
    updateHUD();
  }
  function finishReload() {
    var W = window.WEAPONS[player.current];
    var ammo = player.ammo[player.current];
    if (!W || !ammo) { player.reloading = false; return; }
    var need = W.mag - ammo.mag;
    var give = Math.min(need, ammo.reserve);
    ammo.mag += give;
    ammo.reserve -= give;
    player.reloading = false;
    player.reloadT = 0;
    SFX.reloadEnd();
    updateHUD();
  }
  function toggleScope() {
    var W = window.WEAPONS[player.current];
    if (!W || !W.scope || !player.alive) return;
    player.scoped = !player.scoped;
    camera.fov = player.scoped ? (W.zoomFov || 32) : 75;
    camera.updateProjectionMatrix();
    elScope.style.display = player.scoped ? 'block' : 'none';
    elCross.classList.toggle('hidden', player.scoped);
    updateViewModel();
    SFX.click();
  }

  var grenadeMat = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.7 });
  function throwGrenade() {
    if (!player.weapons.grenade || player.switching) return;
    var dir = camera.getWorldDirection(new THREE.Vector3());
    var pos = camera.position.clone().addScaledVector(dir, 0.5);
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), grenadeMat);
    mesh.castShadow = true;
    mesh.position.copy(pos);
    scene.add(mesh);
    grenades.push({ mesh: mesh, pos: pos, vel: dir.multiplyScalar(16).add(new THREE.Vector3(0, 4.5, 0)), fuse: 3.0 });
    player.weapons.grenade = null;
    player.ammo.hegrenade = { mag: 0, reserve: 0 };
    setWeapon(bestWeapon());
    SFX.click();
  }
  function updateGrenades(dt) {
    for (var i = grenades.length - 1; i >= 0; i--) {
      var g = grenades[i];
      g.fuse -= dt;
      g.vel.y -= GRAVITY * dt;
      var nx = g.pos.x + g.vel.x * dt;
      var nz = g.pos.z + g.vel.z * dt;
      var ny = g.pos.y + g.vel.y * dt;
      if (playerHitsBox(nx, g.pos.z, Math.max(0, g.pos.y - 0.1), 0.1)) g.vel.x *= -0.45;
      else g.pos.x = nx;
      if (playerHitsBox(g.pos.x, nz, Math.max(0, g.pos.y - 0.1), 0.1)) g.vel.z *= -0.45;
      else g.pos.z = nz;
      var floor = supportHeight(g.pos.x, g.pos.z, g.pos.y + 0.1, 0.1);
      if (ny <= floor + 0.1) {
        g.pos.y = floor + 0.1;
        if (g.vel.y < 0) g.vel.y *= -0.38;
        g.vel.x *= 0.75;
        g.vel.z *= 0.75;
      } else g.pos.y = ny;
      g.mesh.position.copy(g.pos);
      if (g.fuse <= 0) {
        explode(g.pos);
        scene.remove(g.mesh);
        grenades.splice(i, 1);
      }
    }
  }
  function clearGrenades() {
    for (var i = 0; i < grenades.length; i++) scene.remove(grenades[i].mesh);
    grenades = [];
  }
  function explode(pos) {
    var R = 8, MAXD = 98;
    var fx = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.95 }));
    fx.position.copy(pos);
    scene.add(fx);
    var light = new THREE.PointLight(0xffa040, 6, 25);
    light.position.copy(pos);
    scene.add(light);
    var t0 = performance.now();
    var anim = function () {
      var p = (performance.now() - t0) / 500;
      if (p >= 1) {
        scene.remove(fx); scene.remove(light);
        fx.geometry.dispose(); fx.material.dispose();
        return;
      }
      fx.scale.setScalar(1 + p * 8);
      fx.material.opacity = 0.95 * (1 - p);
      light.intensity = 6 * (1 - p);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
    SFX.shot('shotgun');
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (!b.alive) continue;
      var d = Math.hypot(b.pos.x - pos.x, b.pos.z - pos.z);
      if (d < R) {
        var killed = b.explodeDamage(MAXD * (1 - d / R));
        if (killed) onBotKilled(player, b);
      }
    }
    if (player.alive) {
      var pd = Math.hypot(player.pos.x - pos.x, player.pos.z - pos.z);
      if (pd < R) player.hurt(Math.round(MAXD * (1 - pd / R)), 'body', null);
    }
  }

  /* ---------- 玩家受傷 ---------- */
  function playerHurt(amount, part, bot) {
    if (!player.alive || gameState === 'roundEnd' || gameState === 'over') return;
    var dmg = amount;
    if (player.armor > 0) {
      var absorbed = Math.min(player.armor, dmg * 0.5);
      player.armor -= absorbed;
      dmg -= absorbed;
    }
    player.hp -= dmg;
    elDmgFlash.style.opacity = 0.85;
    setTimeout(function () { elDmgFlash.style.opacity = 0; }, 110);
    player.hurtKickPitch += Math.min(0.05, dmg * 0.0012);
    player.hurtKickYaw += (Math.random() - 0.5) * Math.min(0.03, dmg * 0.0008);
    hitStop(0.012);
    SFX.hurt();
    updateHUD();
    if (player.hp <= 0) {
      player.hp = 0;
      player.alive = false;
      playerDeathT = 0;
      stats.deaths++;
      player.scoped = false;
      camera.fov = 75;
      camera.updateProjectionMatrix();
      elScope.style.display = 'none';
      elCross.classList.add('hidden');
      if (bot) {
        bot.kills = (bot.kills || 0) + 1;
        addKillfeed(bot.name + ' 擊殺了 你');
      } else addKillfeed('你 被爆炸擊倒');
      SFX.death();
      if (mode === 'defuse' && !bomb.planted && playerHasBomb) {
        playerHasBomb = false;
        player.hasBomb = false;
        assignBombCarrier();
      }
      /* 軍備競賽：擊殺玩家的 BOT 也升級 */
      if (mode === 'gungame' && bot) {
        bot.celebrate();
        if ((bot.ggLevel || 0) >= GG_LADDER.length - 2) {
          ggFinish(bot.team, bot.name);
        } else {
          bot.ggLevel = (bot.ggLevel || 0) + 1;
          ggGiveBot(bot);
        }
      }
      updateCarrierHud();
      updateHUD();
      checkRoundEnd();
    }
  }

  /* ---------- 下包 / 拆包 ---------- */
  function clearBomb() {
    if (bomb.mesh) { scene.remove(bomb.mesh); bomb.mesh = null; }
    if (bomb.light) { scene.remove(bomb.light); bomb.light = null; }
    bomb.planted = false;
    bomb.timer = 0;
    bomb.defuseT = 0;
    bomb.plantT = 0;
    if (bomb.carrier) bomb.carrier.isCarrier = false;
    bomb.carrier = null;
    playerHasBomb = false;
    if (player) player.hasBomb = false;
    plantT = 0;
    elBombHud.classList.remove('show');
    elCarrierHud.classList.remove('show');
  }

  function updateCarrierHud() {
    var show = mode === 'defuse' && !bomb.planted && playerHasBomb && player.alive;
    elCarrierHud.classList.toggle('show', show);
  }

  function assignBombCarrier() {
    if (mode !== 'defuse' || bomb.planted) return;
    playerHasBomb = false;
    player.hasBomb = false;
    bomb.carrier = null;
    bomb.plantT = 0;
    for (var i = 0; i < bots.length; i++) {
      bots[i].isCarrier = false;
      bots[i].plantT = 0;
      bots[i].planting = false;
    }
    if (attackTeam === 'blue' && player.alive) {
      playerHasBomb = true;
      player.hasBomb = true;
    } else {
      for (var j = 0; j < bots.length; j++) {
        if (bots[j].team === attackTeam && bots[j].alive) {
          bomb.carrier = bots[j];
          bots[j].isCarrier = true;
          break;
        }
      }
    }
    updateCarrierHud();
  }

  function nearestSite(x, z, maxR) {
    var best = null, bd = Infinity;
    for (var k in mapData.sites) {
      var s = mapData.sites[k];
      var d = Math.hypot(x - s.x, z - s.z);
      if (d < (maxR || 6) && d < bd) { bd = d; best = k; }
    }
    return best;
  }

  function plantBomb(siteKey, px, pz) {
    if (bomb.planted) return;
    var site = mapData.sites[siteKey];
    bomb.planted = true;
    bomb.x = px == null ? site.x + (Math.random() - 0.5) * 3 : px;
    bomb.z = pz == null ? site.z + (Math.random() - 0.5) * 3 : pz;
    bomb.timer = DEFUSE_FUSE;
    bomb.site = siteKey;
    plantT = 0;
    setAlarm(2);
    announce(pickLine(BC_LINES.bomb), true);
    radioChat([{ who: '夜貓子', text: '炸彈在 ' + siteKey + ' 點！' }, { who: '硬核教練', text: '守好！' }]);
    playerHasBomb = false;
    player.hasBomb = false;
    if (bomb.carrier) bomb.carrier.isCarrier = false;
    bomb.carrier = null;
    updateCarrierHud();
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0xff2200, emissiveIntensity: 0.6 }));
    m.position.set(bomb.x, 0.3, bomb.z);
    m.castShadow = true;
    scene.add(m);
    var light = new THREE.PointLight(0xff3300, 1.5, 8);
    light.position.set(bomb.x, 0.6, bomb.z);
    scene.add(light);
    bomb.mesh = m;
    bomb.light = light;
    elBombHud.classList.add('show');
    showCenter('炸彈已安放', '點 ' + siteKey + ' · 快點拆除！', 2.4);
    movieLog('plant', '炸彈安裝在 ' + siteKey + ' 點');
    SFX.roundStart();
  }

  function tryElevator() {
    if (gameState !== 'live' || !player.alive || !mapData.elevators) return;
    if (elapsed < elevatorCd) return;
    for (var i = 0; i < mapData.elevators.length; i++) {
      var ev = mapData.elevators[i];
      var d = Math.hypot(player.pos.x - ev.x, player.pos.z - ev.z);
      if (d < ev.radius && Math.abs(player.pos.y) < 2) {
        player.pos.set(ev.to.x, 0, ev.to.z);
        player.pos.y = supportHeight(ev.to.x, ev.to.z, 6, PLAYER_R);
        player.vel.set(0, 0, 0);
        player.onGround = true;
        elevatorCd = elapsed + 1.4;
        showHint('電梯前往 ' + ev.label, 1.2);
        if (window.SFX) SFX.click();
        return;
      }
    }
  }

  function tryPlant() {
    if (gameState !== 'live' || !player.alive) return;
    if (mode !== 'defuse') { showHint('殲滅模式無需下包', 1.5); return; }
    if (bomb.planted) { showHint('炸彈已經安放', 1.5); return; }
    if (player.team !== attackTeam) { showHint('你是守方 · 按 E 拆包', 1.8); return; }
    if (!playerHasBomb) { showHint('你沒有攜帶炸彈', 1.5); return; }
    if (player.pos.y < -1 || player.pos.y > 2) { showHint('請到 A / B 點地面下包', 1.8); return; }
    if (!nearestSite(player.pos.x, player.pos.z, 6)) { showHint('請到 A / B 點按住 G 下包', 1.8); return; }
    showHint('按住 G 下包…', 1.0);
  }

  function updateBomb(dt) {
    if (mode !== 'defuse' || gameState !== 'live') return;

    if (!bomb.planted) {
      updateCarrierHud();

      /* 玩家下包（攻方且攜帶炸彈） */
      if (attackTeam === 'blue' && playerHasBomb && player.alive) {
        var sk = nearestSite(player.pos.x, player.pos.z, 6);
        if (sk && keys['KeyG'] && player.pos.y > -1 && player.pos.y < 2) {
          plantT += dt;
          var pct = Math.min(100, Math.round(plantT / BOMB_PLANT_TIME * 100));
          elPaintHud.textContent = '下包中… ' + pct + '%';
          elPaintHud.classList.add('show');
          if (elapsed - lastPlantTick > 0.5) {
            lastPlantTick = elapsed;
            if (window.SFX) SFX.plantTick();
          }
          if (plantT >= BOMB_PLANT_TIME) {
            plantBomb(sk, player.pos.x, player.pos.z);
            elPaintHud.classList.remove('show');
            if (window.SFX) SFX.celebrate();
            showCenter('炸彈已安放', '點 ' + sk + ' · 守住 40 秒！', 2.4);
            return;
          }
        } else {
          plantT = Math.max(0, plantT - dt * 2);
          if (plantT <= 0) elPaintHud.classList.remove('show');
        }
      }

      /* AI 攜帶者下包 */
      if (bomb.carrier) {
        var c = bomb.carrier;
        if (!c.alive) {
          bomb.carrier = null;
        } else {
          var siteKey = c.targetSite || bomb.site;
          var site = mapData.sites[siteKey];
          var d = Math.hypot(c.pos.x - site.x, c.pos.z - site.z);
          if (c.planting && d < 4.3) {
            c.plantT += dt;
            if (c.plantT >= BOMB_PLANT_TIME) {
              plantBomb(siteKey, c.pos.x, c.pos.z);
              c.celebrate();
              if (window.SFX) SFX.celebrate();
              showCenter('炸彈已安放', '點 ' + siteKey + ' · 快點拆除！', 2.4);
              return;
            }
          } else {
            c.plantT = Math.max(0, c.plantT - dt * 2);
          }
        }
      }
      if (!bomb.carrier && (!playerHasBomb || !player.alive)) assignBombCarrier();
      return;
    }

    bomb.timer -= dt;
    elBombTimer.textContent = Math.max(0, Math.ceil(bomb.timer));
    if (bomb.mesh) {
      bomb.mesh.rotation.y += dt * 2;
      if (bomb.light) bomb.light.intensity = 1.2 + Math.sin(elapsed * 8) * 0.6;
    }

    /* 玩家拆包（守方按住 E） */
    var defusing = false;
    if (player.alive && keys['KeyE'] && player.team !== attackTeam &&
        player.pos.y > -1 && player.pos.y < 2) {
      var pd = Math.hypot(player.pos.x - bomb.x, player.pos.z - bomb.z);
      if (pd < 2.6) {
        defusing = true;
        bomb.defuseT += dt;
        var dpct = Math.min(100, Math.round(bomb.defuseT / BOMB_DEFUSE_TIME * 100));
        elPaintHud.textContent = '拆包中… ' + dpct + '%';
        elPaintHud.classList.add('show');
        showHint('拆包中… ' + dpct + '%', 0.3);
        if (bomb.defuseT >= BOMB_DEFUSE_TIME) {
          elPaintHud.classList.remove('show');
          removeBombMesh();
          bomb.planted = false;
          elBombHud.classList.remove('show');
          movieLog('defuse', '炸彈被拆除');
          setAlarm(0);
          announce(pickLine(BC_LINES.defused));
          endRound(player.team, '炸彈已成功拆除');
          return;
        }
      }
    }

    /* AI 守方拆包 */
    if (!defusing) {
      var defuser = null;
      for (var i = 0; i < bots.length; i++) {
        var b = bots[i];
        if (!b.alive || b.team === attackTeam) continue;
        if (!b.defusing) continue;
        var bd = Math.hypot(b.pos.x - bomb.x, b.pos.z - bomb.z);
        if (bd < 2.8) { defuser = b; break; }
      }
      if (defuser) {
        defusing = true;
        bomb.defuseT += dt;
        var apct = Math.min(100, Math.round(bomb.defuseT / (BOMB_DEFUSE_TIME + 1.2) * 100));
        elPaintHud.textContent = defuser.name + ' 拆包中… ' + apct + '%';
        elPaintHud.classList.add('show');
        if (bomb.defuseT >= BOMB_DEFUSE_TIME + 1.2) {
          elPaintHud.classList.remove('show');
          removeBombMesh();
          bomb.planted = false;
          elBombHud.classList.remove('show');
          movieLog('defuse', defuser.name + ' 拆除炸彈');
          setAlarm(0);
          announce(pickLine(BC_LINES.defused));
          endRound(defuser.team, '炸彈已被 ' + defuser.name + ' 拆除');
          return;
        }
      }
    }
    if (!defusing) {
      bomb.defuseT = Math.max(0, bomb.defuseT - dt * 0.5);
      if (bomb.defuseT <= 0) elPaintHud.classList.remove('show');
    }

    if (bomb.timer <= 0) {
      removeBombMesh();
      bomb.planted = false;
      movieLog('explode', '炸彈爆炸');
      /* 先結算勝負，再播放爆炸，避免爆炸連鎖擊殺改寫贏家 */
      endRound(attackTeam, '炸彈爆炸');
      announce(pickLine(BC_LINES.explode), true);
      setAlarm(0);
      explode(new THREE.Vector3(bomb.x, 0.5, bomb.z));
    }
  }

  function removeBombMesh() {
    if (bomb.mesh) { scene.remove(bomb.mesh); bomb.mesh = null; }
    if (bomb.light) { scene.remove(bomb.light); bomb.light = null; }
    elPaintHud.classList.remove('show');
  }

  /* ---------- 破壞層 ---------- */
  function setRadMode(on) {
    radMode = on;
    if (on) {
      scene.fog.color.setHex(0x4a7a4a);
      scene.fog.near = 30;
      scene.fog.far = 120;
      elRadOverlay.style.opacity = 0.36;
      if (!fireParticles.length) initFire();
      if (!radParticles.length) initBlueRad();
      if (!radCracks.length) initCracks();
      if (!radLight) {
        radLight = new THREE.PointLight(0xff8a28, 2.6, 34, 1.2);
        radLight.position.set(0, 6, 2);
        scene.add(radLight);
      }
    } else {
      scene.fog.color.setHex(0xd0dedf);
      scene.fog.near = 80;
      scene.fog.far = 200;
      elRadOverlay.style.opacity = 0;
      for (var i = 0; i < fireParticles.length; i++) scene.remove(fireParticles[i]);
      fireParticles = [];
      for (var j = 0; j < radParticles.length; j++) scene.remove(radParticles[j]);
      radParticles = [];
      for (var k = 0; k < radCracks.length; k++) scene.remove(radCracks[k]);
      radCracks = [];
      if (radLight) { scene.remove(radLight); radLight = null; }
    }
    setAlarm(on ? 2 : 0);
    if (on) announce(pickLine(BC_LINES.rad), true);
  }

  /* 藍色輻射粒子 */
  function makeBlueGlowTexture() {
    var s = 64, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(190,235,255,1)');
    grd.addColorStop(0.3, 'rgba(80,180,255,.85)');
    grd.addColorStop(0.7, 'rgba(40,100,255,.3)');
    grd.addColorStop(1, 'rgba(20,40,180,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  var blueGlowTex = null;
  function initBlueRad() {
    if (!blueGlowTex) blueGlowTex = makeBlueGlowTexture();
    for (var i = 0; i < 34; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: blueGlowTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, opacity: 0.8
      }));
      var a = Math.random() * Math.PI * 2;
      var r = 2 + Math.random() * 16;
      sp.position.set(Math.cos(a) * r, 0.6 + Math.random() * 9, -4 + Math.sin(a) * r);
      var sc = 0.25 + Math.random() * 0.55;
      sp.scale.set(sc, sc, 1);
      sp.userData = { baseY: sp.position.y, ph: Math.random() * 6.28, spd: 0.5 + Math.random() * 1.2 };
      scene.add(sp);
      radParticles.push(sp);
    }
  }
  function updateBlueRad(dt) {
    for (var i = 0; i < radParticles.length; i++) {
      var sp = radParticles[i];
      sp.userData.ph += dt * sp.userData.spd;
      sp.position.y = sp.userData.baseY + Math.sin(sp.userData.ph) * 1.2;
      sp.material.opacity = 0.45 + Math.sin(sp.userData.ph * 1.9) * 0.3;
    }
  }

  /* ---------- 閃燈 / 儀表板呼吸燈 ---------- */
  function updateAmbientLights(dt) {
    var t = elapsed;
    var alarm = (mapData && mapData.alarmLevel) || 0;
    if (mapData && mapData.beacons) {
      for (var i = 0; i < mapData.beacons.length; i++) {
        var b = mapData.beacons[i];
        var spd = alarm >= 2 ? 13 : (alarm >= 1 ? 8 : 4.2);
        var p = 0.5 + 0.5 * Math.sin(t * spd + b.phase);
        if (alarm >= 1) {
          /* 警報：更快、更亮、純紅 */
          b.domeMat.emissiveIntensity = 0.6 + 1.9 * p;
          b.domeMat.color.setRGB(1, 0.05 + 0.09 * p, 0.05);
          if (b.coneGroup) {
            b.coneGroup.rotation.y += dt * b.spinSpeed * (alarm >= 2 ? 2.4 : 1.5);
            if (b.coneMat) b.coneMat.opacity = 0.06 + 0.18 * p;
          }
        } else {
          b.domeMat.emissiveIntensity = 0.35 + 1.35 * p;
          b.domeMat.color.setRGB(1, 0.16 + 0.22 * p, 0.16 + 0.12 * p);
          if (b.coneGroup) {
            b.coneGroup.rotation.y += dt * b.spinSpeed;
            if (b.coneMat) b.coneMat.opacity = 0.04 + 0.12 * p;
          }
        }
      }
    }
    if (mapData && mapData.siteBeams) {
      for (var s = 0; s < mapData.siteBeams.length; s++) {
        var sb = mapData.siteBeams[s];
        var q = 0.5 + 0.5 * Math.sin(t * (alarm >= 1 ? 6 : 2.2) + sb.phase);
        sb.beamMat.opacity = 0.012 + 0.022 * q + (alarm >= 1 ? 0.03 : 0);
        sb.ringMat.opacity = 0.16 + 0.2 * q;
      }
    }
    if (mapData && mapData.blinkers) {
      for (var k = 0; k < mapData.blinkers.length; k++) {
        var bl = mapData.blinkers[k];
        var r = 0.5 + 0.5 * Math.sin(t * (alarm >= 1 ? 11 : 5.2) + bl.phase);
        if (bl.kind === 'screen') {
          bl.mat.opacity = 0.84 + 0.16 * r;
        } else {
          bl.mat.emissiveIntensity = 0.25 + 0.85 * r;
        }
      }
    }
    /* 反應堆走馬燈：常態彩色流動，警報時全紅閃爍 */
    if (mapData && mapData.marquee) {
      var mq = mapData.marquee;
      var mcount = mq.count || 0;
      if (!mq.__color) mq.__color = new THREE.Color();
      var mc = mq.__color;
      for (var mi = 0; mi < mcount; mi++) {
        if (alarm >= 1) {
          var mb = 0.5 + 0.5 * Math.sin(t * 10 + mi * 0.5);
          mc.setRGB(1, 0.06 + 0.12 * mb, 0.04);
        } else {
          var mh = (t * 0.10 + mi / Math.max(1, mcount)) % 1;
          var mlight = 0.45 + 0.25 * (0.5 + 0.5 * Math.sin(t * 8 + mi * 0.9));
          mc.setHSL(mh, 1, mlight);
        }
        mq.setColorAt(mi, mc);
      }
      if (mq.instanceColor) mq.instanceColor.needsUpdate = true;
    }
    /* 反應堆本體：燃料棒、控制棒、蒸汽管、核心面板、燈條全部參與走馬燈 */
    if (mapData && mapData.reactorFx) {
      var fx = mapData.reactorFx;
      var p1 = 0.5 + 0.5 * Math.sin(t * 6.5);
      var p2 = 0.5 + 0.5 * Math.sin(t * 5.2 + 2.1);
      if (alarm >= 1) {
        if (fx.fuelMat) { fx.fuelMat.emissive.setHex(0xff3020); fx.fuelMat.emissiveIntensity = 0.8 + 1.2 * p1; }
        if (fx.rodMat) { fx.rodMat.emissive.setHex(0xff2010); fx.rodMat.emissiveIntensity = 0.5 + 1.0 * p2; }
        if (fx.pipeMat) { fx.pipeMat.emissive.setHex(0xff2010); fx.pipeMat.emissiveIntensity = 0.3 + 0.8 * p1; }
        if (fx.panelMat) { fx.panelMat.emissive.setHex(0x5a0808); fx.panelMat.emissiveIntensity = 0.5 + 0.8 * p2; }
        if (fx.glowMat) fx.glowMat.color.setRGB(1, 0.1 + 0.15 * p1, 0.08);
      } else {
        if (fx.fuelMat) {
          fx.fuelMat.emissive.setHSL((t * 0.08) % 1, 1, 0.45);
          fx.fuelMat.emissiveIntensity = 0.5 + 0.9 * p1;
        }
        if (fx.rodMat) {
          fx.rodMat.emissive.setHSL((t * 0.08 + 0.33) % 1, 1, 0.4);
          fx.rodMat.emissiveIntensity = 0.3 + 1.2 * p2;
        }
        if (fx.pipeMat) {
          fx.pipeMat.emissive.setHSL((t * 0.08 + 0.66) % 1, 0.9, 0.35);
          fx.pipeMat.emissiveIntensity = 0.15 + 0.5 * p1;
        }
        if (fx.panelMat) {
          fx.panelMat.emissive.setHSL((t * 0.08 + 0.5) % 1, 0.8, 0.22);
          fx.panelMat.emissiveIntensity = 0.25 + 0.45 * p2;
        }
        if (fx.glowMat) fx.glowMat.color.setHSL((t * 0.08 + 0.33) % 1, 1, 0.6);
      }
    }
    /* 應急燈條：警報時整組亮紅並閃爍 */
    if (mapData && mapData.emergencyMat) {
      var eb = 0.5 + 0.5 * Math.sin(t * (alarm >= 2 ? 12 : 7));
      mapData.emergencyMat.emissiveIntensity = alarm >= 1 ? (1.2 + 1.0 * eb) : 0.03;
      if (mapData._emgAlarm !== alarm) {
        mapData._emgAlarm = alarm;
        mapData.emergencyMat.color.setHex(alarm >= 1 ? 0xff2a2a : 0x2a0808);
      }
    }
    /* 天花板燈帶與室內點光源：警報時轉紅，避免整場燈光突然全滅 */
    if (mapData && mapData._litAlarm !== alarm) {
      mapData._litAlarm = alarm;
      if (mapData.lampMats) {
        for (var lmi = 0; lmi < mapData.lampMats.length; lmi++) {
          mapData.lampMats[lmi].mat.color.setHex(alarm >= 2 ? 0xff4a3a : mapData.lampMats[lmi].color);
        }
      }
      if (mapData.roomLights) {
        for (var rl = 0; rl < mapData.roomLights.length; rl++) {
          var rm = mapData.roomLights[rl];
          if (alarm >= 1) {
            rm.light.color.setHex(0xff6a5a);
            rm.light.intensity = rm.base * (alarm >= 2 ? 1.25 : 1.1);
          } else {
            rm.light.color.setHex(rm.color || 0xfff2dc);
            rm.light.intensity = rm.base;
          }
        }
      }
    }
  }

  /* 牆面裂縫 */
  function makeCrackTexture() {
    var s = 128, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    var g = cv.getContext('2d');
    g.clearRect(0, 0, s, s);
    g.strokeStyle = 'rgba(12,12,14,.9)';
    g.lineWidth = 2.5;
    for (var i = 0; i < 7; i++) {
      var x = 64 + (Math.random() - 0.5) * 50;
      var y = 64 + (Math.random() - 0.5) * 50;
      g.beginPath();
      g.moveTo(x, y);
      var ang = Math.random() * 6.283;
      for (var j = 0; j < 5; j++) {
        ang += (Math.random() - 0.5) * 1.2;
        x += Math.cos(ang) * (6 + Math.random() * 12);
        y += Math.sin(ang) * (6 + Math.random() * 12);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    var t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function initCracks() {
    var tex = makeCrackTexture();
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false });
    var spots = [
      { x: -14.46, z: -4, ry: Math.PI / 2, w: 8, h: 5 },
      { x: 14.46, z: -4, ry: -Math.PI / 2, w: 8, h: 5 },
      { x: 0, z: -16.96, ry: 0, w: 10, h: 5 },
      { x: 0, z: 7.46, ry: Math.PI, w: 10, h: 5 }
    ];
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mat);
      m.position.set(s.x, 5.0, s.z);
      m.rotation.y = s.ry;
      scene.add(m);
      radCracks.push(m);
    }
  }
  function initFire() {
    for (var i = 0; i < 46; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: fireTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        opacity: 0.6
      }));
      if (i < 30) {
        var a = Math.random() * Math.PI * 2;
        var r = 3 + Math.random() * 14;
        sp.position.set(Math.cos(a) * r, 0.5 + Math.random() * 7, -4 + Math.sin(a) * r);
      } else if (i < 40) {
        /* 南面（玩家從大廳看過去）也放亮色火焰，貼近反應堆避免糊住視線 */
        sp.position.set(-7 + Math.random() * 14, 0.8 + Math.random() * 4.5, 4.4 + Math.random() * 1.8);
      } else {
        sp.position.set(-9 + Math.random() * 18, 8 + Math.random() * 3, -4 + (Math.random() - 0.5) * 16);
      }
      var sc = 1.5 + Math.random() * 1.8;
      sp.scale.set(sc, sc, 1);
      sp.userData = { baseY: sp.position.y, ph: Math.random() * 6.28, spd: 0.8 + Math.random() * 1.6 };
      scene.add(sp);
      fireParticles.push(sp);
    }
  }
  function updateFire(dt) {
    for (var i = 0; i < fireParticles.length; i++) {
      var sp = fireParticles[i];
      sp.userData.ph += dt * sp.userData.spd;
      sp.position.y = sp.userData.baseY + Math.sin(sp.userData.ph) * 0.5;
      sp.material.opacity = 0.55 + Math.sin(sp.userData.ph * 1.7) * 0.25;
    }
  }
  function updateRadiation(dt) {
    if (!radMode || !player.alive || gameState !== 'live') return;
    var d = Math.hypot(player.pos.x - mapData.sites.A.x, player.pos.z - mapData.sites.A.z);
    if (d < 20 || (player.pos.y < -1 && d < 13)) {
      radAcc += dt;
      if (radAcc >= 1) {
        radAcc = 0;
        player.hp -= 3;
        elDmgFlash.style.opacity = 0.3;
        setTimeout(function () { elDmgFlash.style.opacity = 0; }, 90);
        if (player.hp <= 0) {
          player.hp = 0;
          player.alive = false;
          playerDeathT = 0;
          stats.deaths++;
          addKillfeed('你 受到輻射傷害死亡');
          checkRoundEnd();
        }
        updateHUD();
      }
    }
  }

  /* ---------- 更新 ---------- */
  function updatePlayer(dt) {
    /* 合照模式：玩家定格站樁 */
    if (photoMode) return;
    if (!player.alive) {
      playerDeathT += dt;
      if (mode === 'gungame' && gameState === 'live' && playerDeathT > 3.2) ggRespawnPlayer();
      return;
    }
    if (player.switchAccT > 0) player.switchAccT = Math.max(0, player.switchAccT - dt);
    if (playerCelebrateT > 0) playerCelebrateT = Math.max(0, playerCelebrateT - dt);
    if (gameState === 'roundEnd' || gameState === 'paused') {
      player.vel.x = 0; player.vel.z = 0;
    } else if (gameState === 'live' || gameState === 'buy') {
      var forward = tmpV1.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
      var right = tmpV2.set(-Math.cos(player.yaw), 0, Math.sin(player.yaw));
      var mx = 0, mz = 0;
      if (!buyOpen) {
        if (keys['KeyW']) { mx += forward.x; mz += forward.z; }
        if (keys['KeyS']) { mx -= forward.x; mz -= forward.z; }
        if (keys['KeyD']) { mx += right.x; mz += right.z; }
        if (keys['KeyA']) { mx -= right.x; mz -= right.z; }
      }
      var len = Math.hypot(mx, mz);
      player.crouch = !!keys['ControlLeft'] || !!keys['ControlRight'] || !!keys['KeyC'];
      var sprint = !keys['ShiftLeft'] && !keys['ShiftRight'];
      var wishSpeed = player.crouch ? 2.7 : (sprint ? 5.6 : 2.7);
      var W = window.WEAPONS[player.current];
      if (W && W.moveSpeedMul) wishSpeed *= W.moveSpeedMul;

      var wx = 0, wz = 0;
      if (len > 0.01) { wx = mx / len * wishSpeed; wz = mz / len * wishSpeed; }
      var accel = player.onGround ? 12 : 2.6;
      var k = 1 - Math.exp(-accel * dt);
      player.vel.x += (wx - player.vel.x) * k;
      player.vel.z += (wz - player.vel.z) * k;
      if (len < 0.01 && player.onGround) {
        var damp = Math.exp(-9 * dt);
        player.vel.x *= damp;
        player.vel.z *= damp;
      }
      if (keys['Space'] && player.onGround) { player.vel.y = JUMP_V; player.onGround = false; }

      /* 下包時站定 */
      var plantingNow = playerHasBomb && keys['KeyG'] && player.team === attackTeam &&
        nearestSite(player.pos.x, player.pos.z, 6) && gameState === 'live';
      var defusingNow = bomb.planted && keys['KeyE'] && player.team !== attackTeam &&
        Math.hypot(player.pos.x - bomb.x, player.pos.z - bomb.z) < 2.6;
      if (plantingNow || defusingNow) {
        wx = 0; wz = 0;
        player.vel.x *= Math.exp(-12 * dt);
        player.vel.z *= Math.exp(-12 * dt);
      }

      /* 屋頂梯子：靠近並按 W 攀爬 */
      if (mapData.ladders) {
        for (var li = 0; li < mapData.ladders.length; li++) {
          var L = mapData.ladders[li];
          if (Math.abs(player.pos.x - L.x) < L.radius && Math.abs(player.pos.z - L.z) < L.radius &&
              player.pos.y < L.y1 - 0.04) {
            if (keys['KeyW']) { player.vel.y = 4.0; player.onGround = false; }
            else if (keys['KeyS']) { player.vel.y = -2.4; player.onGround = false; }
          }
        }
      }

      var r = PLAYER_R;
      var footY = player.pos.y;
      var nx = player.pos.x + player.vel.x * dt;
      if (!playerHitsBox(nx, player.pos.z, footY, r)) player.pos.x = nx;
      else {
        var stepX = supportHeight(nx, player.pos.z, footY + 0.5, r);
        if (stepX > footY && stepX - footY <= 0.5) { player.pos.x = nx; player.pos.y = stepX; }
        else player.vel.x *= 0.2;
      }
      var nz = player.pos.z + player.vel.z * dt;
      if (!playerHitsBox(player.pos.x, nz, footY, r)) player.pos.z = nz;
      else {
        var stepZ = supportHeight(player.pos.x, nz, footY + 0.5, r);
        if (stepZ > footY && stepZ - footY <= 0.5) { player.pos.z = nz; player.pos.y = stepZ; }
        else player.vel.z *= 0.2;
      }

      player.vel.y -= GRAVITY * dt;
      var ny = player.pos.y + player.vel.y * dt;
      var floor = supportHeight(player.pos.x, player.pos.z, footY + 0.6, r);
      if (ny <= floor) { player.pos.y = floor; player.vel.y = 0; player.onGround = true; }
      else { player.pos.y = ny; player.onGround = false; }

      if (roofMode && player.pos.y < 9) {
        var rpFall = ROOF_SPAWNS.blue[Math.floor(Math.random() * ROOF_SPAWNS.blue.length)];
        player.pos.set(rpFall.x, ROOF_Y, rpFall.z);
        player.vel.set(0, 0, 0);
        playerHurt(35, 'body', null);
        showHint('掉下天台，已傳送回場內', 1.6);
      }
      var bb = mapData.bounds;
      player.pos.x = Math.max(bb.minX + 1, Math.min(bb.maxX - 1, player.pos.x));
      player.pos.z = Math.max(bb.minZ + 1, Math.min(bb.maxZ - 1, player.pos.z));
      player.speedXZ = Math.hypot(player.vel.x, player.vel.z);

      if (keys['Mouse0'] && gameState === 'live' && !buyOpen) {
        var wc = window.WEAPONS[player.current];
        if (wc && wc.type !== 'melee' && wc.type !== 'grenade') tryShoot();
      }
      if (player.reloading) {
        player.reloadT -= dt;
        if (player.reloadT <= 0) finishReload();
      }
      if (player.onGround && player.speedXZ > 3.2 && !player.crouch) {
        player.bobT += dt * player.speedXZ;
        if (player.bobT > 2.3) {
          player.bobT = 0;
          var inDiesel = player.pos.x > -36 && player.pos.x < -15 && player.pos.z > 10 && player.pos.z < 22;
          var onMetal = (player.pos.y > 5.5 && player.pos.y < 7.5) ||
            (player.pos.y > 10.2 && player.pos.y < 10.7);
          if (inDiesel && window.SFX && SFX.footstepLoud) SFX.footstepLoud();
          else if (onMetal && window.SFX && SFX.metalFootstep) SFX.metalFootstep();
          else SFX.footstep();
        }
      }

      if (mapData.elevators && elapsed - lastElevHint > 2.5) {
        for (var ei = 0; ei < mapData.elevators.length; ei++) {
          var ev2 = mapData.elevators[ei];
          if (Math.hypot(player.pos.x - ev2.x, player.pos.z - ev2.z) < ev2.radius) {
            showHint('按 E 搭電梯前往 ' + ev2.label, 1.2);
            lastElevHint = elapsed;
            break;
          }
        }
      }
    }

    var targetEye = player.crouch ? EYE_CROUCH : EYE_STAND;
    player.eyeH += (targetEye - player.eyeH) * Math.min(1, dt * 12);
    var bob = 0;
    if (player.onGround && player.speedXZ > 1) {
      bob = Math.sin(elapsed * 11) * Math.min(0.016, player.speedXZ * 0.0025);
    }
    /* 視角：0=第一人稱 1=背後第三人稱 2=正面第三人稱（V 鍵切換） */
    if (camMode === 0) {
      camera.position.set(player.pos.x, player.pos.y + player.eyeH + bob, player.pos.z);
      camera.rotation.y = player.yaw + Math.PI + player.hurtKickYaw;
      camera.rotation.x = player.pitch + player.recoilOffset + player.hurtKickPitch;
      camera.rotation.z = 0;
      if (viewRoot) viewRoot.visible = !player.scoped;
      if (playerBody) playerBody.group.visible = false;
    } else {
      var vfx = Math.sin(player.yaw), vfz = Math.cos(player.yaw);
      var vBack = camMode === 1 ? -1 : 1;
      var vDist = 3.8;
      /* 避免相機穿牆：沿視線採樣，碰到牆就縮短距離 */
      var cpx = player.pos.x, cpy = player.pos.y + 2.2, cpz = player.pos.z;
      for (var vd = vDist; vd > 0.8; vd -= 0.3) {
        var clear = true;
        for (var vs = 0.25; vs <= 1.0; vs += 0.15) {
          var sx2 = player.pos.x + vfx * vd * vs * vBack;
          var sz2 = player.pos.z + vfz * vd * vs * vBack;
          if (playerHitsBox(sx2, sz2, player.pos.y + 1.2, 0.25)) { clear = false; break; }
        }
        if (clear) {
          cpx = player.pos.x + vfx * vd * vBack;
          cpz = player.pos.z + vfz * vd * vBack;
          break;
        }
      }
      camera.position.set(cpx, cpy, cpz);
      camera.lookAt(player.pos.x, player.pos.y + 1.3, player.pos.z);
      if (viewRoot) viewRoot.visible = false;
      if (playerBody) playerBody.group.visible = true;
    }
    if (playerBody) {
      playerBody.group.position.copy(player.pos);
      playerBody.group.rotation.y = player.yaw + Math.PI;
      /* 走路動畫：腿和手臂擺動（不再像飄） */
      var walkSwing = 0;
      if (player.speedXZ > 0.6) {
        walkSwing = Math.min(0.9, player.speedXZ * 0.16) * Math.sin(elapsed * 10);
      }
      playerBody.legL.rotation.x = walkSwing;
      playerBody.legR.rotation.x = -walkSwing;
      playerBody.armL.rotation.x = -walkSwing * 0.55;
      playerBody.armR.rotation.x = walkSwing * 0.55;
      playerBody.group.scale.y = player.crouch ? 0.82 : 1;
      updateParrot(dt);
    }
    player.hurtKickPitch *= Math.exp(-10 * dt);
    player.hurtKickYaw *= Math.exp(-10 * dt);

    // 停火回正
    if (elapsed - player.lastShot > 0.18) {
      player.recoilOffset *= Math.exp(-7 * dt);
      if (Math.abs(player.recoilOffset) < 0.0005) player.recoilOffset = 0;
    }

    // 切槍動畫
    if (player.switching) {
      player.switchT += dt;
      if (player.switchT >= player.switchDur) player.switching = false;
    }
    var sw = player.switching ? Math.sin(Math.min(1, player.switchT / player.switchDur) * Math.PI) : 0;
    var cel = playerCelebrateT > 0 ? Math.min(1, playerCelebrateT * 3) : 0;
    viewRoot.position.x = 0.19 + Math.sin(elapsed * 7) * Math.min(0.008, player.speedXZ * 0.0016);
    viewRoot.position.y = -0.20 - sw * 0.42 + cel * 0.13;
    viewRoot.position.z = -0.46 + player.recoilPitch * 0.5;
    viewRoot.rotation.x = player.recoilPitch * 0.9;
    viewRoot.rotation.z = cel * 0.18;
    player.recoilPitch *= Math.exp(-8 * dt);
  }

  function updateDeathCamera(dt) {
    playerDeathT += dt;
    if (viewRoot) viewRoot.visible = false;
    if (elCross) elCross.classList.add('hidden');
    if (mode === 'gungame' && gameState === 'live' && playerDeathT > 3.2) {
      resetDeathCamState();
      ggRespawnPlayer();
      return;
    }
    /* 自由視角：WASD 飛行 */
    if (deathCamFree) {
      updateFreeCam(dt);
      if (elapsed - spectateHintT > 4) {
        spectateHintT = elapsed;
        showHint('自由視角：WASD / 方向鍵移動 · 空格/Shift 升降 · 左鍵換人 · F 返回', 2.4);
      }
      return;
    }
    /* 死亡後觀戰：優先跟隨存活隊友，沒有隊友就跟隨敵人 */
    var list = [];
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive && bots[i].team === player.team) list.push(bots[i]);
    }
    if (!list.length) {
      for (var j = 0; j < bots.length; j++) {
        if (bots[j].alive) list.push(bots[j]);
      }
    }
    if (list.length) {
      spectateIdx = ((spectateIdx % list.length) + list.length) % list.length;
      var t = list[spectateIdx];
      /* 關鍵：隱藏被觀戰者的模型，否則鏡頭在頭裡，整屏被擋 */
      if (spectateHidden !== t) {
        restoreSpectateHidden();
        spectateHidden = t;
        t.mesh.visible = false;
        if (t.label) t.label.visible = false;
        spectateLerpFrom.copy(camera.position);
        spectateLerpYaw = camera.rotation.y;
        spectateLerpT = 0.25;
      }
      var eyeY = t.pos.y + 1.62;
      var tx = t.pos.x + Math.sin(t.yaw) * 0.12;
      var tz = t.pos.z + Math.cos(t.yaw) * 0.12;
      if (spectateLerpT > 0) {
        spectateLerpT = Math.max(0, spectateLerpT - dt);
        var kk = 1 - spectateLerpT / 0.25;
        kk = kk * kk * (3 - 2 * kk);
        camera.position.set(
          spectateLerpFrom.x + (tx - spectateLerpFrom.x) * kk,
          spectateLerpFrom.y + (eyeY - spectateLerpFrom.y) * kk,
          spectateLerpFrom.z + (tz - spectateLerpFrom.z) * kk
        );
        camera.rotation.y = movieAngleLerp(spectateLerpYaw, t.yaw + Math.PI, kk);
      } else {
        camera.position.set(tx, eyeY, tz);
        camera.rotation.y = t.yaw + Math.PI;
      }
      camera.rotation.x = 0;
      camera.rotation.z = 0;
      if (elapsed - spectateHintT > 2.5) {
        spectateHintT = elapsed;
        showHint('觀戰：' + t.name + ' · HP ' + Math.ceil(t.hp) + ' · 左鍵下一位 / 右鍵上一位 · F 自由視角', 2.2);
      }
      return;
    }
    /* 沒有可觀戰目標：維持原本的倒地鏡頭 */
    var k = Math.min(1, playerDeathT * 2);
    camera.position.set(player.pos.x, player.pos.y + player.eyeH - k * 1.2, player.pos.z);
    camera.rotation.x = -0.5 * k;
    camera.rotation.z = 0.7 * k;
  }

  function enterFreeCam() {
    deathCamFree = true;
    restoreSpectateHidden();
    freeCamPos.copy(camera.position);
    freeCamYaw = camera.rotation.y - Math.PI;
    freeCamPitch = camera.rotation.x;
    /* 往前挪 1 米，避免出生在剛觀戰的隊友身體裡；前方有牆就不挪 */
    var ox = freeCamPos.x + Math.sin(freeCamYaw) * 1.0;
    var oz = freeCamPos.z + Math.cos(freeCamYaw) * 1.0;
    if (!playerHitsBox(ox, oz, freeCamPos.y + 0.1, 0.18)) {
      freeCamPos.x = ox;
      freeCamPos.z = oz;
    }
    freeCamPos.y += 0.1;
    freeCamVel.set(0, 0, 0);
  }

  function updateFreeCam(dt) {
    var speed = 10;
    var fx = Math.sin(freeCamYaw), fz = Math.cos(freeCamYaw);
    /* 右方向：面朝 -Z 時右邊是 -X，這裡用叉積算出的正確右向量 */
    var rx = -Math.cos(freeCamYaw), rz = Math.sin(freeCamYaw);
    var ix = 0, iz = 0, iy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) { ix += fx; iz += fz; }
    if (keys['KeyS'] || keys['ArrowDown']) { ix -= fx; iz -= fz; }
    if (keys['KeyD'] || keys['ArrowRight']) { ix += rx; iz += rz; }
    if (keys['KeyA'] || keys['ArrowLeft']) { ix -= rx; iz -= rz; }
    if (keys['Space'] || keys['PageUp']) iy += 1;
    if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['PageDown']) iy -= 1;
    var len = Math.hypot(ix, iz);
    if (len > 0) { ix = ix / len * speed; iz = iz / len * speed; }
    /* 平滑加減速：起步和剎車都不會頓 */
    var k = 1 - Math.exp(-10 * dt);
    freeCamVel.x += (ix - freeCamVel.x) * k;
    freeCamVel.z += (iz - freeCamVel.z) * k;
    freeCamVel.y += (iy * speed - freeCamVel.y) * k;
    var nx = freeCamPos.x + freeCamVel.x * dt;
    var nz = freeCamPos.z + freeCamVel.z * dt;
    var ny = freeCamPos.y + freeCamVel.y * dt;
    /* 不穿牆：分軸嘗試，撞牆就把該軸速度清零 */
    var cr = 0.18;
    if (!playerHitsBox(nx, nz, ny, cr)) {
      freeCamPos.x = nx; freeCamPos.z = nz;
    } else {
      if (!playerHitsBox(nx, freeCamPos.z, ny, cr)) freeCamPos.x = nx; else freeCamVel.x = 0;
      if (!playerHitsBox(freeCamPos.x, nz, ny, cr)) freeCamPos.z = nz; else freeCamVel.z = 0;
    }
    if (ny < -6 || ny > 32) freeCamVel.y = 0;
    freeCamPos.y = Math.max(-6, Math.min(32, ny));
    camera.position.copy(freeCamPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = freeCamYaw + Math.PI;
    camera.rotation.x = freeCamPitch;
    camera.rotation.z = 0;
  }

  function updateBots(dt) {
    /* 合照模式：BOT 定格，只讓寵物繼續做小動作 */
    if (photoFrozen) {
      for (var pf = 0; pf < bots.length; pf++) {
        var pb2 = bots[pf];
        if (!pb2) continue;
        if (pb2.alive && typeof pb2.updateDance === 'function') pb2.updateDance(dt);
        if (pb2.petGroup && typeof pb2.updatePet === 'function') pb2.updatePet(dt);
      }
      return;
    }
    if (gameState === 'roundEnd') {
      for (var r = 0; r < bots.length; r++) {
        if (!bots[r].alive) bots[r].update(dt, player, null);
        else if (bots[r].celebrateT > 0) bots[r].updateCelebrate(dt);
      }
      return;
    }
    if (gameState !== 'live') return;
    var g = {
      bots: bots,
      difficulty: difficulty,
      mapData: mapData,
      mode: mode,
      bomb: bomb,
      attackTeam: attackTeam,
      onBotKilled: onBotKilled,
      playBotShot: function (bot, sound) {
        SFX.shot(sound);
        var p = new THREE.Vector3(0, 1.15, -0.8).applyMatrix4(bot.mesh.matrixWorld);
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: window.makeFlashTexture(), transparent: true, depthTest: true, blending: THREE.AdditiveBlending
        }));
        sp.position.copy(p);
        sp.scale.set(0.5, 0.5, 1);
        scene.add(sp);
        setTimeout(function () { scene.remove(sp); sp.material.dispose(); }, 60);
      }
    };
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive) bots[i].update(dt, player, g);
      else if (mode === 'gungame' && gameState === 'live' && bots[i].deathT > 3) {
        ggRespawnBot(bots[i]);
      } else if (bots[i].mesh.visible) {
        bots[i].update(dt, player, g);
        if (bots[i].deathT > 4) bots[i].mesh.visible = false;
      }
    }
  }

  function updateTimers(dt) {
    if (hallBlockTimer > 0) {
      hallBlockTimer -= dt;
      if (hallBlockTimer <= 0) {
        removeHallBlockers();
        showHint('中央反應堆大廳已開放', 1.8);
      }
    }
    if (gameState === 'buy') {
      buyTimer -= dt;
      if (buyTimer <= 0) {
        buyTimer = 0;
        gameState = 'live';
        if (buyOpen) { buyOpen = false; elBuy.classList.add('hidden'); if (!TEST) canvas.requestPointerLock(); }
        var atkNow = mode === 'defuse' && player.team === attackTeam;
        showCenter('開始交火', mode === 'defuse' ? (atkNow ? '到 A / B 按住 G 下包' : '守住 A/B 點 · E 拆包') : '消滅所有敵人', 1.6);
      }
    }
    if (mode !== 'gungame' && (gameState === 'live' || gameState === 'buy') && !(mode === 'defuse' && bomb.planted)) {
      roundTimer -= dt;
      if (roundTimer <= 0) {
        roundTimer = 0;
        if (gameState === 'live' && !roundResolved) {
          var timeWinner = mode === 'defuse' ? (attackTeam === 'blue' ? 'orange' : 'blue') : 'orange';
          endRound(timeWinner, '時間到');
        }
      }
    }
    if (gameState === 'roundEnd') {
      roundEndT -= dt;
      if (roundEndT <= 0) nextRoundOrEnd();
    }
    if (hintT > 0) { hintT -= dt; if (hintT <= 0) elHint.classList.remove('show'); }
    if (centerT > 0) { centerT -= dt; if (centerT <= 0) elCenter.classList.remove('show'); }
  }

  var lastHudT = -999;
  function updateHUD() {
    if (!player) return;
    if (elapsed - lastHudT < 0.08) return;
    lastHudT = elapsed;
    elHP.textContent = Math.max(0, Math.ceil(player.hp));
    elHP.classList.toggle('low', player.hp <= 25);
    elAP.textContent = Math.max(0, Math.ceil(player.armor));
    elMoney.textContent = player.money;
    if (mode === 'gungame') {
      var topBot = 0;
      for (var gb = 0; gb < bots.length; gb++) {
        if (bots[gb].team === 'orange') topBot = Math.max(topBot, bots[gb].ggLevel || 0);
      }
      elScoreCT.textContent = stats.kills;
      elScoreT.textContent = topBot;
      elRound.textContent = '等級 ' + (ggPlayerLevel + 1) + ' / ' + GG_LADDER.length;
      elTimer.textContent = '∞';
      elTimer.style.color = '#fff';
      elRoleTag.className = 'role atk';
      elRoleTag.innerHTML = '<span class="dot"></span>軍備競賽';
    } else {
      elScoreCT.textContent = scoreBlue;
      elScoreT.textContent = scoreOrange;
      elRound.textContent = '回合 ' + roundNo + (mode === 'defuse' ? ' · 拆除' : '');
      if (mode === 'defuse') {
        var isAtk = player.team === attackTeam;
        elRoleTag.className = 'role ' + (isAtk ? 'atk' : 'def');
        elRoleTag.innerHTML = '<span class="dot"></span>' + (isAtk ? '攻方' : '守方');
      } else {
        elRoleTag.className = 'role atk';
        elRoleTag.innerHTML = '<span class="dot"></span>殲滅';
      }
    }
    updateCarrierHud();
    var W = window.WEAPONS[player.current];
    if (W) {
      elWeapon.textContent = W.name;
      if (W.type === 'melee' || W.type === 'grenade') {
        elAmmo.textContent = '—';
        elAmmo.classList.remove('empty');
      } else {
        var a = player.ammo[player.current] || { mag: 0, reserve: 0 };
        elAmmo.innerHTML = a.mag + '<small> / ' + a.reserve + '</small>';
        elAmmo.classList.toggle('empty', a.mag === 0);
      }
    }
    elReload.textContent = player.reloading ? '換彈中…' :
      (player.switching ? '切換武器…' : (player.switchAccT > 0 ? '切槍準度恢復中…' : ''));
    if (mode !== 'gungame') {
      var secs = Math.max(0, Math.ceil(roundTimer));
      var mm = Math.floor(secs / 60), ss = secs % 60;
      elTimer.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
      elTimer.style.color = (gameState === 'live' && secs <= 20) ? 'var(--red)' : '#fff';
    }
  }

  function updateCrosshair() {
    var spread = currentSpread();
    elCross.style.setProperty('--gap', (4 + spread * 420).toFixed(1) + 'px');
  }
  function updateLowHp() {
    if (!player.alive) { elLowHp.style.opacity = 0; return; }
    var o = player.hp <= 30 ? (1 - player.hp / 30) * 0.8 : 0;
    elLowHp.style.opacity = o;
  }

  /* ---------- 雷達 ---------- */
  var radarT = 0;
  function drawRadar() {
    var ctx = radarCtx;
    var w = radarCv.width, h = radarCv.height;
    ctx.clearRect(0, 0, w, h);
    var b = mapData.bounds;
    var pad = 8;
    var sc = Math.min((w - pad * 2) / (b.maxX - b.minX), (h - pad * 2) / (b.maxZ - b.minZ));
    var ox = w / 2 - (b.minX + b.maxX) / 2 * sc;
    var oz = h / 2 - (b.minZ + b.maxZ) / 2 * sc;
    function tx(x) { return ox + x * sc; }
    function tz(z) { return oz + z * sc; }
    ctx.fillStyle = 'rgba(214,196,160,.22)';
    var cols = mapData.colliders;
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      if (c.maxY > 20) continue;
      ctx.fillRect(tx(c.minX), tz(c.minZ), (c.maxX - c.minX) * sc, (c.maxZ - c.minZ) * sc);
    }
    ctx.fillStyle = 'rgba(247,164,29,.3)';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('A', tx(mapData.sites.A.x), tz(mapData.sites.A.z));
    ctx.fillText('B', tx(mapData.sites.B.x), tz(mapData.sites.B.z));
    if (gameState === 'menu') return;

    for (var j = 0; j < bots.length; j++) {
      var bot = bots[j];
      if (!bot.alive) continue;
      if (bot.team === player.team) {
        ctx.fillStyle = '#4aa8ff';
        ctx.beginPath();
        ctx.arc(tx(bot.pos.x), tz(bot.pos.z), 4, 0, 6.283);
        ctx.fill();
      } else {
        var d = Math.hypot(bot.pos.x - player.pos.x, bot.pos.z - player.pos.z);
        if (d < 26 || bot.canSee || bot.paintT > 0) {
          ctx.fillStyle = bot.paintT > 0 ? '#47ff6f' : '#ff8a1c';
          ctx.beginPath();
          ctx.arc(tx(bot.pos.x), tz(bot.pos.z), bot.paintT > 0 ? 6 : 5, 0, 6.283);
          ctx.fill();
          if (bot.paintT > 0) {
            ctx.strokeStyle = '#c8ffd4';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    }
    var px = tx(player.pos.x), pz = tz(player.pos.z);
    var a = player.yaw;
    var fx = Math.sin(a), fz = Math.cos(a);
    var rx = Math.cos(a), rz = -Math.sin(a);
    ctx.fillStyle = '#5cd6ff';
    ctx.beginPath();
    ctx.moveTo(px + fx * 13, pz + fz * 13);
    ctx.lineTo(px - fx * 7 + rx * 7, pz - fz * 7 + rz * 7);
    ctx.lineTo(px - fx * 7 - rx * 7, pz - fz * 7 - rz * 7);
    ctx.closePath();
    ctx.fill();
    if (bomb.planted) {
      ctx.fillStyle = '#ff3b3b';
      ctx.beginPath();
      ctx.arc(tx(bomb.x), tz(bomb.z), 6, 0, 6.283);
      ctx.fill();
    }
  }

  /* ---------- AI 代打錄影模式 ---------- */
  var MOVIE_TOUR = [
    { name: '入口與玻璃門', pos: [0, 4.2, 42], look: [0, 3.0, 24] },
    { name: '石磚走廊 · 電梯', pos: [-6, 4.0, 27], look: [8, 3.0, 29] },
    { name: '控制室 B 點', pos: [22, 4.6, 21], look: [29, 3.2, 11.2] },
    { name: '反應堆大廳 A 點', pos: [0, 6.2, 17], look: [0, 4.0, 2] },
    { name: '汽輪機室', pos: [-18.5, 5.0, 6.5], look: [-30, 2.8, -4] },
    { name: '水泵房', pos: [17.5, 5.0, 6.5], look: [29, 2.8, -3] },
    { name: '北側後勤走廊', pos: [-8, 4.0, -20], look: [14, 2.8, -20] },
    { name: '柴油發電室', pos: [-18.5, 4.6, 20.5], look: [-30, 2.8, 14] },
    { name: '起重機平台', pos: [-7, 8.2, -14.5], look: [0, 3.0, 4] },
    { name: '屋頂與控制棒', pos: [0, 12.1, 18], look: [0, 13.0, -3] },
    { name: '變電站', pos: [28, 3.8, 43], look: [34, 4.0, 31] },
    { name: '地下室', pos: [24, -2.0, 14], look: [0, -3.0, 0] }
  ];

  function movieTourUpdate(dt) {
    document.body.classList.add('movie-tour');
    if ((!movieTourScene || movieTourT <= 0) && buyTimer > 0.35) {
      movieTourScene = MOVIE_TOUR[movieTourIndex % MOVIE_TOUR.length];
      movieTourIndex++;
      movieTourT = 2.6;
      elSceneNo.textContent = '場景 ' + String(((movieTourIndex - 1) % 12) + 1).padStart(2, '0');
      elSceneName.textContent = movieTourScene.name;
      movieLog('scene', movieTourScene.name);
    }
    if (!movieTourScene) return;
    movieTourT -= dt;
    var p = movieTourScene.pos;
    var l = movieTourScene.look;
    var pan = Math.sin(elapsed * 0.35) * 0.7;
    /* 開場俯衝鏡頭：前 3 秒從高空快速拉近第一個機位（電競開場感） */
    var introT = elapsed - movieStart;
    if (introT >= 0 && introT < 3) {
      var ik = introT / 3;
      ik = 1 - (1 - ik) * (1 - ik) * (1 - ik);
      camera.position.set(
        (0.15 + 0.85 * ik) * p[0],
        46 + (p[1] - 46) * ik,
        70 + (p[2] - 70) * ik
      );
      camera.lookAt(l[0] * (0.3 + 0.7 * ik), l[1], l[2] * (0.3 + 0.7 * ik));
    } else {
      camera.position.set(p[0], p[1], p[2]);
      camera.lookAt(l[0] + pan, l[1], l[2] + pan * 0.4);
    }
    viewRoot.visible = false;
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive) bots[i].mesh.visible = true;
    }
  }

  function movieRoundStart() {
    if (!MOVIE) return;
    movieStar = null;
    movieSwitchT = 0;
    movieTourT = 0;
    player.alive = false;
    player.hp = BOT_MAX_HP;
    player.maxHp = BOT_MAX_HP;
    player.armor = 60;
    player.current = 'ak47';
    player.weapons.primary = 'ak47';
    player.ammo.ak47 = { mag: 30, reserve: 90 };
    player.hasBomb = false;
    playerHasBomb = false;
    /* 讓「AI 代打」不受守點命令限制，主動去 A/B 找架打，鏡頭才有戲 */
    for (var mb = 0; mb < bots.length; mb++) {
      if (bots[mb].name === 'AI 代打') {
        bots[mb].role = 'attack';
        bots[mb].targetSite = Math.random() < 0.5 ? 'A' : 'B';
      }
    }
    viewRoot.visible = true;
    getViewModel('ak47').visible = true;
    if (mode === 'defuse') assignBombCarrier();
    elCarrierHud.classList.remove('show');
    elPaintHud.classList.remove('show');
  }

  function moviePickStar() {
    var best = null, bestScore = -999;
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (!b.alive) continue;
      var s = Math.random() * 10;
      if (b.team === 'blue') s += 120;
      else s -= 220;
      if (b.name === 'AI 代打') s += 15;
      if (b === movieStar) s += 10;
      if (b.isCarrier) s += 70;
      if (b.canSee || b.state === 'engage') s += 85;
      if (b.planting || b.defusing) s += 85;
      if (b.target) s += 35;
      if (b.lastSeen) s += 18;
      if (bomb.planted) s += Math.max(0, 26 - Math.hypot(b.pos.x - bomb.x, b.pos.z - bomb.z));
      if (s > bestScore) { bestScore = s; best = b; }
    }
    return best;
  }

  function movieSwitchStar(bot) {
    if (movieStar && movieStar !== bot) movieStar.mesh.visible = true;
    movieStar = bot;
    if (bot) {
      bot.mesh.visible = false;
      movieLookYaw = bot.yaw;
      movieLookPitch = -0.02;
    }
    movieSwitchT = 5 + Math.random() * 4;
    if (bot) movieLog('camera', bot.name);
  }

  function movieAngleLerp(a, b, t) {
    var d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * Math.min(1, t);
  }

  /* ---------- AI 代打：三視角切換接口（錄像腳本用） ---------- */
  var movieManualTarget = false;
  window.__SET_MOVIE_TARGET = function (kind, name) {
    if (!MOVIE) return { ok: false, reason: 'not movie mode' };
    kind = kind || 'auto';
    if (kind === 'auto') {
      movieManualTarget = false;
      movieSwitchT = 0;
      return { ok: true, target: 'auto' };
    }
    var team = kind === 'enemy' ? 'orange' : (kind === 'team' ? 'blue' : null);
    if (!team) return { ok: false, reason: 'kind must be enemy / team / auto' };
    var pool = [];
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (!b.alive || b.team !== team) continue;
      if (name && b.name.indexOf(name) < 0) continue;
      pool.push(b);
    }
    if (!pool.length) return { ok: false, reason: 'no alive bot in ' + team };
    movieManualTarget = true;
    movieSwitchStar(pool[0]);
    movieSwitchT = 99999;
    return { ok: true, target: pool[0].name, team: team };
  };
  window.__SET_MOVIE_TARGET_AUTO = function () {
    movieManualTarget = false;
    movieSwitchT = 0;
    return true;
  };
  window.__GET_MOVIE_STATE = function () {
    return {
      movie: MOVIE,
      star: movieStar ? movieStar.name : null,
      manual: movieManualTarget,
      aliveBlue: bots.filter(function (b) { return b.alive && b.team === 'blue'; }).length,
      aliveOrange: bots.filter(function (b) { return b.alive && b.team === 'orange'; }).length
    };
  };

  /* ---------- 合照模式 ---------- */
  function arrangePhotoBots(opts) {
    opts = opts || {};
    var want = Math.max(1, Math.min(opts.count || 20, bots.length));
    var pool = [];
    for (var i = 0; i < bots.length; i++) {
      if (bots[i].alive) pool.push(bots[i]);
    }
    pool.sort(function (a, b) {
      return Math.hypot(a.pos.x - player.pos.x, a.pos.z - player.pos.z) -
        Math.hypot(b.pos.x - player.pos.x, b.pos.z - player.pos.z);
    });
    var list = pool.slice(0, want);
    photoArranged = list.length;
    var half = Math.ceil(list.length / 2);
    for (var j = 0; j < list.length; j++) {
      var b = list[j];
      var row = j < half ? 0 : 1;
      var idx = row === 0 ? j : j - half;
      var rowN = row === 0 ? half : list.length - half;
      var spread = row === 0 ? 1.55 : 1.95;
      var tt = rowN <= 1 ? 0.5 : idx / (rowN - 1);
      var ang = player.yaw + Math.PI + (tt - 0.5) * 2 * spread;
      var r = (row === 0 ? 2.3 : 3.7) + (opts.formation === 'circle' ? 0.7 : 0);
      var x = player.pos.x + Math.sin(ang) * r;
      var z = player.pos.z + Math.cos(ang) * r;
      b.pos.set(x, player.pos.y, z);
      b.yaw = player.yaw;
      b.introY = player.pos.y;
      b.mesh.position.set(x, player.pos.y, z);
      b.mesh.rotation.set(0, player.yaw + Math.PI, 0);
      b.mesh.visible = true;
      if (b.label) b.label.position.set(x, player.pos.y + 2.25, z);
      if (typeof b.updatePet === 'function') b.updatePet(0.016);
      if (typeof b.updateDance === 'function') b.updateDance(0.016);
    }
    return photoArranged;
  }

  function placePhotoCamera() {
    var fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
    camera.position.set(
      player.pos.x + fx * photoDist,
      player.pos.y + photoHeight,
      player.pos.z + fz * photoDist
    );
    var aimY = player.pos.y + 1.25;
    if (/[?&]photoaim=high/.test(location.search)) aimY = player.pos.y + 3.2;
    camera.lookAt(player.pos.x, aimY, player.pos.z);
    if (Math.abs(camera.fov - photoFov) > 0.01) {
      camera.fov = photoFov;
      camera.updateProjectionMatrix();
    }
  }

  function enterPhotoMode(opts) {
    opts = opts || {};
    if (!player || !playerBody) return { ok: false, reason: 'no player body' };
    if (!photoMode) photoOldFov = camera.fov;
    photoMode = true;
    photoFrozen = true;
    document.body.classList.add('photo-mode');
    if (viewRoot) viewRoot.visible = false;
    if (elHUD) {
      photoHudWasHidden = elHUD.classList.contains('hidden');
      elHUD.classList.add('hidden');
    }
    if (elAnnounce) elAnnounce.style.display = 'none';
    playerBody.group.visible = true;
    playerBody.group.position.copy(player.pos);
    playerBody.group.rotation.y = player.yaw + Math.PI;
    if (elCross) elCross.classList.add('hidden');
    var n = arrangePhotoBots(opts);
    placePhotoCamera();
    return { ok: true, arranged: n, fov: camera.fov };
  }

  function exitPhotoMode() {
    if (!photoMode) return false;
    photoMode = false;
    photoFrozen = false;
    document.body.classList.remove('photo-mode');
    if (elHUD && !photoHudWasHidden) elHUD.classList.remove('hidden');
    if (elAnnounce) elAnnounce.style.display = '';
    camera.fov = photoOldFov || 75;
    camera.updateProjectionMatrix();
    if (elCross && camMode === 0) elCross.classList.remove('hidden');
    if (camMode === 0 && playerBody) playerBody.group.visible = false;
    return true;
  }

  function updatePhotoCamera(dt) {
    if (!photoMode) return;
    placePhotoCamera();
    if (photoSnapFlashT > 0) photoSnapFlashT = Math.max(0, photoSnapFlashT - dt);
  }

  window.__PHOTO_ENTER = enterPhotoMode;
  window.__PHOTO_EXIT = exitPhotoMode;
  window.__PHOTO_STATE = function () {
    return { mode: photoMode, frozen: photoFrozen, arranged: photoArranged };
  };

  /* 開發用：死亡觀戰 / 自由視角測試接口 */
  window.__DEBUG_DIE = function () {
    player.alive = false;
    playerDeathT = 0;
    spectateIdx = 0;
    deathCamFree = false;
    return true;
  };
  window.__DEBUG_FREE = function () {
    if (player.alive) return false;
    enterFreeCam();
    return true;
  };
  window.__DEBUG_CAM_STATE = function () {
    return {
      alive: player.alive,
      free: deathCamFree,
      hidden: spectateHidden ? spectateHidden.name : null,
      pos: { x: +camera.position.x.toFixed(2), y: +camera.position.y.toFixed(2), z: +camera.position.z.toFixed(2) },
      yaw: +freeCamYaw.toFixed(3),
      vel: { x: +freeCamVel.x.toFixed(2), y: +freeCamVel.y.toFixed(2), z: +freeCamVel.z.toFixed(2) }
    };
  };
  window.__PHOTO_ARRANGE = function (count, formation) {
    return arrangePhotoBots({ count: count || 20, formation: formation || 'fan' });
  };
  window.__PHOTO_CAMERA = function (dist, height, fov) {
    if (typeof dist === 'number') photoDist = dist;
    if (typeof height === 'number') photoHeight = height;
    if (typeof fov === 'number') { photoFov = fov; camera.fov = fov; camera.updateProjectionMatrix(); }
    if (photoMode) placePhotoCamera();
    return { dist: photoDist, height: photoHeight, fov: photoFov };
  };
  window.__PHOTO_SNAP = function (filename) {
    if (!photoMode) return { ok: false, reason: 'not in photo mode' };
    renderFrame();
    var url;
    try { url = renderer.domElement.toDataURL('image/png'); } catch (e) { return { ok: false, reason: String(e) }; }
    try {
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || ('photo-' + Date.now() + '.png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e2) { }
    photoSnapFlashT = 0.25;
    return { ok: true, chars: url.length };
  };
  window.__PHOTO_DATAURL = function () {
    if (!photoMode) return null;
    renderFrame();
    try { return renderer.domElement.toDataURL('image/png'); } catch (e) { return null; }
  };

  function updateMovieCamera(dt) {
    if (!MOVIE || !movieStarted) return;
    var t = elapsed - movieStart;

    if (t >= 260 && !movieRadDone) {
      movieRadDone = true;
      setRadMode(true);
      movieLog('rad', '破壞層啟動');
    }
    if (t >= 299.5 && !movieDone) {
      movieDone = true;
      window.__MOVIE_DONE = true;
      movieLog('done', '五分鐘到');
    }

    /* 回合結束：切到第三人稱看勝利慶祝 */
    if (gameState === 'roundEnd') {
      viewRoot.visible = false;
      elCross.classList.add('hidden');
      for (var rv = 0; rv < bots.length; rv++) {
        if (bots[rv].alive) bots[rv].mesh.visible = true;
      }
      var winner = null;
      for (var w = 0; w < bots.length; w++) {
        if (bots[w].alive && bots[w].celebrateT > 0) { winner = bots[w]; break; }
      }
      if (!winner) {
        for (var w2 = 0; w2 < bots.length; w2++) if (bots[w2].alive) { winner = bots[w2]; break; }
      }
      if (winner) {
        if (movieStar && movieStar !== winner) movieStar.mesh.visible = true;
        movieStar = winner;
        winner.mesh.visible = true;
        var f = winner.forward();
        var rx2 = Math.cos(winner.yaw);
        var rz2 = -Math.sin(winner.yaw);
        var wang = elapsed * 0.55;
        var wdist = 3.6;
        var wx, wz, wy;
        for (var wt = 0; wt < 8; wt++) {
          wx = winner.pos.x + Math.cos(wang) * wdist;
          wz = winner.pos.z + Math.sin(wang) * wdist;
          wy = winner.pos.y + 2.4;
          if (!playerHitsBox(wx, wz, wy - 1.4, 0.35)) break;
          wdist -= 0.35;
        }
        camera.position.set(wx, wy, wz);
        camera.lookAt(winner.pos.x, winner.pos.y + 1.2, winner.pos.z);
        elMovieCam.textContent = '回合結束 · ' + winner.name;
      }
      return;
    }

    if (gameState === 'buy') {
      movieTourUpdate(dt);
      return;
    }
    if (document.body.classList.contains('movie-tour')) document.body.classList.remove('movie-tour');

    movieSwitchT -= dt;
    if (movieManualTarget && (!movieStar || !movieStar.alive)) movieManualTarget = false;
    if (!movieManualTarget && (!movieStar || !movieStar.alive || movieSwitchT <= 0)) {
      var best = moviePickStar();
      if (best && best !== movieStar) movieSwitchStar(best);
      else if (movieStar) movieSwitchT = 6;
    }
    if (!movieStar) return;

    var mt = movieStar.target;

    /* 沒看到敵人：第三人稱跟拍，避免鏡頭對著牆壁發呆 */
    if (!mt || !mt.alive) {
      movieStar.mesh.visible = true;
      viewRoot.visible = false;
      elCross.classList.add('hidden');
      for (var vi = 0; vi < bots.length; vi++) {
        if (bots[vi].alive) bots[vi].mesh.visible = true;
      }
      var f = movieStar.forward();
      var rx = Math.cos(movieStar.yaw);
      var rz = -Math.sin(movieStar.yaw);
      var dist = 3.2;
      var cx, cz, cy;
      for (var tries = 0; tries < 8; tries++) {
        cx = movieStar.pos.x - f.x * dist + rx * 0.8;
        cz = movieStar.pos.z - f.z * dist + rz * 0.8;
        cy = movieStar.pos.y + 2.5;
        if (!playerHitsBox(cx, cz, cy - 1.4, 0.35)) break;
        dist -= 0.35;
      }
      camera.position.set(cx, cy, cz);
      camera.lookAt(movieStar.pos.x + f.x * 0.8, movieStar.pos.y + 1.35, movieStar.pos.z + f.z * 0.8);
      /* 鏡頭後方貼太近的隊友也會擋畫面，先藏起來 */
      for (var ci = 0; ci < bots.length; ci++) {
        var cb = bots[ci];
        if (!cb.alive || cb === movieStar) continue;
        cb.mesh.visible = Math.hypot(cb.pos.x - camera.position.x, cb.pos.z - camera.position.z) > 2.2;
      }
      player.pos.copy(movieStar.pos);
      player.yaw = movieStar.yaw;
      player.hp = Math.max(1, movieStar.hp);
      player.maxHp = movieStar.maxHp;
      player.armor = 60;
      player.alive = false;
      player.current = 'ak47';
      player.ammo.ak47 = { mag: 30, reserve: 90 };
      elMovieCam.textContent = '跟拍：' + movieStar.name + ' · HP ' + Math.ceil(movieStar.hp);
      return;
    }

    /* 看到敵人：第一人稱，鏡頭自動看向交火目標 */
    movieStar.mesh.visible = false;
    elCross.classList.remove('hidden');
    for (var bi = 0; bi < bots.length; bi++) {
      var mb = bots[bi];
      if (!mb.alive || mb === movieStar) continue;
      var mdist2 = Math.hypot(mb.pos.x - movieStar.pos.x, mb.pos.z - movieStar.pos.z);
      mb.mesh.visible = mdist2 > 1.8;
    }
    camera.position.set(movieStar.pos.x, movieStar.pos.y + 1.62, movieStar.pos.z);

    var desiredYaw = movieStar.yaw;
    var desiredPitch = -0.02;
    if (mt && mt.alive) {
      var mdx = mt.pos.x - movieStar.pos.x;
      var mdz = mt.pos.z - movieStar.pos.z;
      var mdist = Math.hypot(mdx, mdz);
      desiredYaw = Math.atan2(mdx, mdz);
      var my = (mt.pos.y || 0) + 1.15;
      desiredPitch = Math.atan2(my - (movieStar.pos.y + 1.62), Math.max(0.1, mdist));
    }
    var lookK = 1 - Math.exp(-9 * dt);
    movieLookYaw = movieAngleLerp(movieLookYaw, desiredYaw, lookK);
    movieLookPitch += (desiredPitch - movieLookPitch) * lookK;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = movieLookYaw + Math.PI;
    camera.rotation.x = movieLookPitch;
    camera.rotation.z = 0;

    player.pos.copy(movieStar.pos);
    player.yaw = movieLookYaw;
    player.hp = Math.max(1, movieStar.hp);
    player.maxHp = movieStar.maxHp;
    player.armor = 60;
    player.alive = false;
    player.current = 'ak47';
    player.ammo.ak47 = { mag: 30, reserve: 90 };
    viewRoot.visible = true;
    var ak = getViewModel('ak47');
    if (ak) ak.visible = true;
    var kick = movieStar.fireKick || 0;
    viewRoot.position.y = -0.20 + Math.sin(elapsed * 6.5) * 0.004 - kick * 0.012;
    viewRoot.position.x = 0.19 + Math.sin(elapsed * 3.4) * 0.003;
    viewRoot.position.z = -0.46 - kick * 0.035;
    viewRoot.rotation.x = kick * 0.04;
    elMovieCam.textContent = '觀戰：' + movieStar.name + ' · HP ' + Math.ceil(movieStar.hp);
  }

  function startMovieAudio() {
    if (!MOVIE) return false;
    try {
      if (window.SFX && SFX.resume) SFX.resume();
      var stream = window.SFX && SFX.getCaptureStream ? SFX.getCaptureStream() : null;
      if (!stream || !window.MediaRecorder) return false;
      var mime = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mime = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/webm')) mime = 'audio/webm';
      movieChunks = [];
      movieRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      movieRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size) movieChunks.push(e.data);
      };
      movieRecorder.start(1000);
      movieLog('audio', '錄音開始');
      return true;
    } catch (e) {
      movieLog('audioError', e.message);
      return false;
    }
  }

  function stopMovieAudio() {
    return new Promise(function (resolve) {
      if (!movieRecorder) { resolve(''); return; }
      movieRecorder.onstop = function () {
        try {
          var blob = new Blob(movieChunks, { type: 'audio/webm' });
          var fr = new FileReader();
          fr.onload = function () { resolve(fr.result); };
          fr.onerror = function () { resolve(''); };
          fr.readAsDataURL(blob);
        } catch (e) { resolve(''); }
      };
      try { movieRecorder.stop(); } catch (e) { resolve(''); }
    });
  }

  function startMovieMode() {
    document.body.classList.add('movie-mode');
    document.title = 'RBMK-1000 方塊突擊 V3';
    elMenu.classList.add('hidden');
    elHUD.classList.remove('hidden');
    elCross.classList.remove('hidden');
    elEnd.classList.add('hidden');
    elPause.classList.add('hidden');
    elBuy.classList.add('hidden');
    elBombHud.classList.remove('show');
    /* 錄製參數：&mode=defuse|gungame|elim &scene=roof|rad */
    var mq = new URLSearchParams(location.search);
    var mMode = mq.get('mode');
    mode = (mMode === 'gungame' || mMode === 'elim' || mMode === 'defuse' || mMode === 'happy') ? mMode : 'defuse';
    difficulty = 'normal';
    if (mq.get('scene') === 'roof') roofMode = true;
    else if (mq.get('scene') === 'rad') radMode = true;
    else radMode = false;
    WIN_ROUNDS = 99;
    movieStarted = false;
    movieDone = false;
    movieRadDone = false;
    movieEvents = [];
    movieStart = 0;
    movieStar = null;
    window.__MOVIE_READY = true;
    window.__MOVIE_EVENTS = function () { return movieEvents; };
    window.__MOVIE_TIME = function () { return movieStarted ? elapsed - movieStart : 0; };
    window.__startMovieAudio = startMovieAudio;
    window.__stopMovieAudio = stopMovieAudio;
    window.__START_MOVIE = function () {
      if (movieStarted) return;
      movieStarted = true;
      movieStart = elapsed;
      movieSwitchT = 0;
      startGame();
      player.alive = false;
      movieLog('start', 'AI 代打開始');
      document.body.classList.add('movie-mode');
      elMenu.classList.add('hidden');
    };
    /* 若沒有外部錄影器，15 秒後自動開始；?record=1 / ?autostart=1 立即開始 */
    var autoDelay = /[?&](record|autostart)=1/.test(location.search) ? 400 : 15000;
    setTimeout(function () { if (!movieStarted) window.__START_MOVIE(); }, autoDelay);
  }

  /* ---------- 主循環 ---------- */
  function animate() {
    requestAnimationFrame(animate);
    var rawDt = Math.min(0.05, clock.getDelta());
    var dt = rawDt;
    /* 命中頓挫：極短時間放慢，讓打擊感更明顯 */
    if (hitStopT > 0) {
      hitStopT = Math.max(0, hitStopT - rawDt);
      dt = rawDt * 0.12;
    }
    elapsed += dt;

    fpsFrames++;
    fpsAcc += rawDt;
    if (fpsAcc >= 0.5) {
      elFps.textContent = Math.round(fpsFrames / fpsAcc) + ' FPS';
      fpsFrames = 0;
      fpsAcc = 0;
    }

    if (gameState === 'menu') {
      menuCamAngle += dt * 0.06;
      camera.position.set(Math.cos(menuCamAngle) * 62, 34, Math.sin(menuCamAngle) * 62);
      camera.lookAt(0, 4, 0);
      updateAmbientLights(dt);
      updateLowHp();
      renderFrame();
      return;
    }

    if (gameState === 'intro') {
      if (ORBIT) updateOrbitCam(dt); else updateIntro(dt);
      updateAnnounce(dt);
      updateRadio(dt);
      updateScoreboard(dt);
      updateAmbientLights(dt);
      renderFrame();
      return;
    }

    if (gameState !== 'paused') {
      updateTimers(dt);
      updateTracers(dt);
      updateDebris(dt);
      if (player.alive) {
        if (deathCamFree || spectateHidden) resetDeathCamState();
        updatePlayer(dt);
      } else updateDeathCamera(dt);
      updateBots(dt);
      updateGrenades(dt);
      updatePuffs(dt);
      updateShells(dt);
      updateBomb(dt);
      updateRadiation(dt);
      updateGlassShards(dt);
      updateAmbientLights(dt);
      if (MOVIE) updateMovieCamera(dt);
      if (radMode) { updateFire(dt); updateBlueRad(dt); }
      updateCrosshair();
      updateLowHp();
      updateHUD();
      updateAnnounce(dt);
      updateRadio(dt);
      updateScoreboard(dt);
      if (!pointerLocked && !TEST && !buyOpen && (gameState === 'live' || gameState === 'buy') &&
          elapsed - lastLockHint > 3) {
        showHint('點擊畫面鎖定滑鼠再開火', 1.2);
        lastLockHint = elapsed;
      }
      radarT -= dt;
      if (radarT <= 0) { drawRadar(); radarT = 0.1; }
      checkRoundEnd();
    }
    if (photoMode) updatePhotoCamera(dt);
    renderFrame();
  }

  /* ---------- 自檢 ---------- */
  function runSelfTest() {
    var out = [];
    function ok(name, cond, extra) {
      out.push((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  :: ' + extra : ''));
    }
    try {
      startGame();
      ok('初始化進入購買階段', gameState === 'buy', 'state=' + gameState);
      ok('10v10：共 19 名 BOT', bots.length === 19, 'bots=' + bots.length);
      var blueBots = bots.filter(function (b) { return b.team === 'blue'; }).length;
      var orangeBots = bots.filter(function (b) { return b.team === 'orange'; }).length;
      ok('隊伍分配 9 藍 / 10 橙', blueBots === 9 && orangeBots === 10, 'blue=' + blueBots + ' orange=' + orangeBots);
      ok('玩家屬於藍隊', player.team === 'blue' && player.isPlayer === true, 'team=' + player.team);
      ok('初始彈藥', !!player.ammo.usp && player.ammo.usp.mag === 12, JSON.stringify(player.ammo.usp));
      var reach = 0, seen = {}, queue = [0];
      seen[0] = true;
      while (queue.length) {
        var qi = queue.shift();
        reach++;
        var nb = mapData.graph[qi];
        for (var ni = 0; ni < nb.length; ni++) {
          if (!seen[nb[ni].to]) { seen[nb[ni].to] = true; queue.push(nb[ni].to); }
        }
      }
      var missingWp = [];
      for (var wi = 0; wi < mapData.waypoints.length; wi++) {
        if (!seen[wi]) missingWp.push(wi + '(' + mapData.waypoints[wi].x + ',' + mapData.waypoints[wi].z + ')');
      }
      ok('導航圖全節點連通', reach === mapData.waypoints.length,
        reach + '/' + mapData.waypoints.length + ' missing=' + missingWp.join(' '));

      gameState = 'buy'; buyTimer = 10; player.money = 5000;
      buy('ak47');
      ok('購買 老鐵槍 扣款', player.weapons.primary === 'ak47' && player.money === 2300, 'money=' + player.money);

      gameState = 'live'; roundTimer = 100;
      player.switching = false;
      player.pos.set(0, 0, 20);
      player.yaw = Math.PI; player.pitch = 0.02;
      camera.position.set(0, EYE_STAND, 20);
      camera.rotation.y = player.yaw + Math.PI;
      camera.rotation.x = 0.02;
      var b = bots.filter(function (x) { return x.team === 'orange'; })[0];
      b.spawn(0, 15.5, 0);
      scene.updateMatrixWorld(true);
      var hpBefore = b.hp;
      player.lastShot = -10;
      tryShoot();
      ok('射擊命中敵方 BOT', b.hp < hpBefore, 'hp=' + b.hp + '/' + hpBefore);

      var blueB = bots.filter(function (x) { return x.team === 'blue'; })[0];
      blueB.spawn(0, 17.5, 0);
      scene.updateMatrixWorld(true);
      var hpb = blueB.hp;
      player.lastShot = -10;
      tryShoot();
      ok('友軍不受傷', blueB.hp === hpb, 'hp=' + blueB.hp);

      // 擊殺與回合勝
      for (var i = 0; i < bots.length; i++) {
        if (bots[i].team === 'orange' && bots[i].alive) {
          bots[i].takeDamage(999, 'body');
          onBotKilled(player, bots[i]);
        }
      }
      ok('全滅敵方後藍隊勝利', scoreBlue === 1 && gameState === 'roundEnd', 'score=' + scoreBlue + ' state=' + gameState);

      roundEndT = 0; nextRoundOrEnd();
      ok('進入下一回合', roundNo === 2 && gameState === 'buy', 'round=' + roundNo);

      // 移動方向
      gameState = 'live';
      player.alive = true; player.hp = 100;
      player.pos.set(0, 0, 20); player.yaw = Math.PI; player.vel.set(0, 0, 0); player.onGround = true;
      keys['KeyW'] = true;
      for (var mf = 0; mf < 60; mf++) updatePlayer(0.016);
      keys['KeyW'] = false;
      ok('W 向前（向北）', player.pos.z < 19, 'z=' + player.pos.z.toFixed(2));
      player.pos.set(0, 0, 20); player.vel.set(0, 0, 0);
      keys['KeyD'] = true;
      for (var mf2 = 0; mf2 < 60; mf2++) updatePlayer(0.016);
      keys['KeyD'] = false;
      ok('D 向右（向東）', player.pos.x > 0.5, 'x=' + player.pos.x.toFixed(2));

      // 換槍動畫
      setWeapon('knife');
      player.switching = false;
      setWeapon('ak47');
      ok('切槍進入動畫狀態', player.switching === true, 'switchT=' + player.switchT);
      player.switching = false;
      setWeapon('usp');
      ok('手槍切換較快', player.switchDur <= 0.4, 'dur=' + player.switchDur);

      // V2 手感與新內容
      ok('玩家血量略高（120）', player.maxHp === 120, 'hp=' + player.maxHp);
      ok('BOT 血量 110', bots[0].maxHp === 110, 'hp=' + bots[0].maxHp);
      ok('攻守輪換（1 橙攻 / 2 藍攻）', getAttackTeam(1) === 'orange' && getAttackTeam(2) === 'blue');
      player.vel.set(0, 0, 0); player.speedXZ = 0; player.crouch = false; player.onGround = true;
      player.current = 'ak47'; player.switchAccT = 0.2;
      var spreadPen = currentSpread();
      player.switchAccT = 0;
      var spreadBase = currentSpread();
      ok('切槍後 0.2 秒準度下降', spreadPen > spreadBase * 1.5,
        spreadBase.toFixed(4) + ' → ' + spreadPen.toFixed(4));
      var paintBot = bots.filter(function (x) { return x.team === 'orange'; })[0];
      paintBot.applyPaint();
      paintBot.updateTint(0.016);
      ok('漆彈染色（8 秒）', paintBot.paintT > 0 && paintBot.mats.skin.emissive.getHex() !== 0,
        'paintT=' + paintBot.paintT.toFixed(1));
      paintBot.celebrate();
      paintBot.updateCelebrate(0.016);
      ok('擊殺慶祝（舉手 + 跳躍）', paintBot.armL.rotation.x < -2 && paintBot.mesh.position.y > 0,
        'arm=' + paintBot.armL.rotation.x.toFixed(2) + ' y=' + paintBot.mesh.position.y.toFixed(2));
      ok('反應堆 173 燃料棒 / 288 控制棒 / 320 蒸汽管',
        mapData.reactor.fuelRods === 173 && mapData.reactor.controlRods === 288 &&
        mapData.reactor.steamPipes === 320,
        JSON.stringify(mapData.reactor));
      ok('屋頂梯子存在', mapData.ladders && mapData.ladders.length >= 1, 'n=' + (mapData.ladders ? mapData.ladders.length : 0));
      var glassEntry = mapData.glass && mapData.glass[0];
      var glassColBefore = glassEntry ? mapData.colliders.indexOf(glassEntry.collider) : -1;
      if (glassEntry) breakGlass(glassEntry.mesh);
      ok('觀察窗玻璃可擊碎', !!glassEntry && glassEntry.broken &&
        mapData.colliders.indexOf(glassEntry.collider) < 0 && glassColBefore >= 0,
        'glass=' + !!glassEntry);

      // 拆除模式
      mode = 'defuse';
      roundResolved = false;
      clearBomb();
      plantBomb('A');
      ok('炸彈安放成功', bomb.planted === true && bomb.timer === 40, 'timer=' + bomb.timer);
      gameState = 'live';
      player.alive = true; player.pos.set(bomb.x, 0, bomb.z);
      keys['KeyE'] = true;
      var guard = 0;
      while (bomb.planted && guard++ < 400) updateBomb(0.016);
      keys['KeyE'] = false;
      ok('按住 E 可拆包', !bomb.planted && roundResolved, 'planted=' + bomb.planted);

      // 玩家下包（G）
      mode = 'defuse';
      attackTeam = 'blue';
      roundResolved = false;
      gameState = 'live';
      clearBomb();
      player.alive = true;
      player.team = 'blue';
      player.pos.set(mapData.sites.A.x, 0, mapData.sites.A.z);
      playerHasBomb = true;
      player.hasBomb = true;
      plantT = 0;
      keys['KeyG'] = true;
      var pg = 0;
      while (!bomb.planted && pg++ < 260) updateBomb(0.016);
      keys['KeyG'] = false;
      ok('玩家按住 G 可在 A 點下包', bomb.planted && bomb.site === 'A' && !playerHasBomb,
        'planted=' + bomb.planted + ' site=' + bomb.site);

      // AI 攜帶者下包
      roundResolved = false;
      clearBomb();
      attackTeam = 'orange';
      var carrierBot = bots.filter(function (x) { return x.team === 'orange'; })[0];
      carrierBot.alive = true;
      carrierBot.role = 'attack';
      carrierBot.isCarrier = true;
      carrierBot.targetSite = 'A';
      carrierBot.pos.set(mapData.sites.A.x, 0, mapData.sites.A.z);
      carrierBot.planting = true;
      bomb.carrier = carrierBot;
      var bg = 0;
      while (!bomb.planted && bg++ < 260) updateBomb(0.016);
      ok('AI 攜帶者會自動下包', bomb.planted && bomb.site === 'A', 'site=' + bomb.site);
      clearBomb();
      roundResolved = false;
      gameState = 'live';

      // 購買輻射漆彈
      gameState = 'buy'; buyTimer = 10; player.money = 5000;
      buy('radpaint');
      ok('可購買輻射漆彈（趣味武器）', player.weapons.grenade === 'radpaint' && player.money === 4550,
        'money=' + player.money + ' w=' + player.weapons.grenade);

      // 攻守出生與攜帶者（整合測試）
      mode = 'defuse';
      roundNo = 1;
      startRound();
      var oc = bots.filter(function (x) { return x.team === 'orange' && x.isCarrier; })[0];
      ok('第 1 回合：橙隊進攻、玩家守方', attackTeam === 'orange' && !playerHasBomb &&
        player.pos.x > 15 && !!oc, 'atk=' + attackTeam + ' pos=' + player.pos.x.toFixed(1) + ',' + player.pos.z.toFixed(1));
      roundNo = 2;
      startRound();
      var blueAtk = bots.filter(function (x) { return x.team === 'blue' && x.role === 'attack'; }).length;
      ok('第 2 回合：藍隊進攻、玩家攜帶炸彈', attackTeam === 'blue' && playerHasBomb &&
        player.pos.z > 30 && blueAtk > 0, 'atk=' + attackTeam + ' carrier=' + playerHasBomb + ' blueAtk=' + blueAtk);
      clearBomb();
      mode = 'elim';
      roundNo = 1;
      gameState = 'live';

      // 入口電梯
      mode = 'elim';
      gameState = 'live';
      player.alive = true;
      player.pos.set(8.6, 0, 28);
      elevatorCd = 0;
      tryElevator();
      ok('入口電梯可通往控制室', player.pos.x === 20 && player.pos.z === 18,
        'pos=' + player.pos.x.toFixed(1) + ',' + player.pos.z.toFixed(1));

      // 短時間 AI 模擬（攻方是否真的往點位移動、是否拋錯）
      mode = 'defuse';
      roundNo = 1;
      startRound();
      gameState = 'live';
      buyTimer = 0;
      var startOrange = {};
      for (var so = 0; so < bots.length; so++) {
        if (bots[so].team === 'orange') {
          startOrange[bots[so].name] = {
            x: bots[so].pos.x, z: bots[so].pos.z,
            inside: window.CS_BOT_UTIL.hitsBox(bots[so].pos.x, bots[so].pos.z, bots[so].radius, mapData.colliders, bots[so].pos.y)
          };
        }
      }
      var simErr = null;
      for (var sf = 0; sf < 420; sf++) {
        try {
          updateTimers(0.016);
          updateBots(0.016);
          updateBomb(0.016);
        } catch (e) { simErr = e; break; }
      }
      var movedCount = 0;
      for (var sm = 0; sm < bots.length; sm++) {
        var mb = bots[sm];
        var s0 = startOrange[mb.name];
        if (s0 && mb.alive && Math.hypot(mb.pos.x - s0.x, mb.pos.z - s0.z) > 3) movedCount++;
      }
      ok('6.7 秒 AI 模擬無例外', !simErr, simErr ? simErr.message : 'ok');
      var simDbg = bots.filter(function (x) { return x.team === 'orange'; }).map(function (x) {
        return x.name + ':' + x.pos.x.toFixed(1) + ',' + x.pos.z.toFixed(1) +
          ',role=' + x.role + ',carrier=' + x.isCarrier + ',path=' + (x.path ? x.path.length : 0);
      }).join(' | ');
      ok('攻方 BOT 會往 A/B 點移動', movedCount >= 2, 'moved=' + movedCount + ' :: ' + simDbg);

      // 破壞層
      setRadMode(true);
      ok('破壞層：火焰 + 藍色輻射粒子 + 牆面裂縫',
        fireParticles.length > 0 && radParticles.length > 0 && radCracks.length > 0,
        'fire=' + fireParticles.length + ' blue=' + radParticles.length + ' cracks=' + radCracks.length);
      setRadMode(false);

      /* V3 軍備競賽 */
      mode = 'gungame';
      startGame();
      ok('軍備競賽：直接進入戰鬥', gameState === 'live' && player.alive,
        'state=' + gameState + ' alive=' + player.alive);
      ok('軍備競賽：初始武器為小快槍', player.current === 'glock' && player.weapons.secondary === 'glock',
        'current=' + player.current);
      var ggVictim = bots.filter(function (x) { return x.team === 'orange'; })[0];
      onBotKilled(player, ggVictim);
      ok('軍備競賽：擊殺後升級換槍', ggPlayerLevel === 1 && player.current === 'usp',
        'lvl=' + ggPlayerLevel + ' weapon=' + player.current);
      player.hurt(9999, 'body', ggVictim);
      ok('軍備競賽：玩家死亡不結束比賽', !player.alive && gameState === 'live',
        'alive=' + player.alive + ' state=' + gameState);
      updateDeathCamera(4.0);
      ok('軍備競賽：3.2 秒後自動重生', player.alive && player.hp === PLAYER_MAX_HP,
        'hp=' + player.hp + ' weapon=' + player.current);
      ok('軍備競賽：重生保留等級武器', player.current === 'usp', 'current=' + player.current);
      mode = 'elim';

      /* V3 廠區廣播與警報燈光 */
      announce('測試廣播：請各單位就位', true);
      ok('廠區廣播可顯示', elAnnounce.classList.contains('show') &&
        elAnnounceTxt.textContent.indexOf('測試廣播') >= 0, elAnnounceTxt.textContent);
      radioChat([{ who: '藍帽隊長', text: '對講機測試' }]);
      ok('對講機對話可顯示（綜藝浮動）', document.querySelectorAll('.floatChat').length > 0, 'float chat');
      setAlarm(2);
      updateAmbientLights(0.05);
      ok('警報：應急燈與室內燈轉紅',
        mapData.emergencyMat.emissiveIntensity > 0.5 &&
        mapData.roomLights[0].light.color.g < 0.6,
        'emg=' + mapData.emergencyMat.emissiveIntensity.toFixed(2) +
        ' g=' + mapData.roomLights[0].light.color.g.toFixed(2));
      setAlarm(0);
      updateAmbientLights(0.05);
      ok('警報解除：燈光恢復常態',
        mapData.emergencyMat.emissiveIntensity < 0.2 &&
        mapData.roomLights[0].light.color.g > 0.5,
        'emg=' + mapData.emergencyMat.emissiveIntensity.toFixed(2) +
        ' g=' + mapData.roomLights[0].light.color.g.toFixed(2));
      elAnnounce.classList.remove('show');

      /* 樓梯：起重機平台與屋頂外部樓梯都能走上二樓 */
      mode = 'elim'; gameState = 'live';
      startRound();
      player.alive = true; player.pos.set(-13.2, 0, -5.2); player.pos.y = 0;
      player.yaw = Math.PI; player.pitch = 0; player.vel.set(0, 0, 0); player.onGround = true;
      keys['KeyW'] = true;
      var stairMaxY = 0;
      for (var sw = 0; sw < 200; sw++) { updatePlayer(0.016); if (player.pos.y > stairMaxY) stairMaxY = player.pos.y; }
      keys['KeyW'] = false;
      ok('起重機平台樓梯可走上二樓', stairMaxY > 5.0, 'maxY=' + stairMaxY.toFixed(2));

      player.alive = true; player.pos.set(-10.5, 0, -5.2); player.pos.y = 0;
      player.yaw = Math.PI; player.pitch = 0; player.vel.set(0, 0, 0); player.onGround = true;
      keys['KeyW'] = true;
      var stair2MaxY = 0;
      for (var sw1 = 0; sw1 < 200; sw1++) { updatePlayer(0.016); if (player.pos.y > stair2MaxY) stair2MaxY = player.pos.y; }
      keys['KeyW'] = false;
      ok('平台第二條樓梯可走上二樓', stair2MaxY > 5.0, 'maxY=' + stair2MaxY.toFixed(2));

      player.alive = true; player.pos.set(2, 0, -34.5); player.pos.y = 0;
      player.yaw = 0; player.pitch = 0; player.vel.set(0, 0, 0); player.onGround = true;
      keys['KeyW'] = true;
      var roofMaxY = 0;
      for (var sw2 = 0; sw2 < 300; sw2++) { updatePlayer(0.016); if (player.pos.y > roofMaxY) roofMaxY = player.pos.y; }
      keys['KeyW'] = false;
      ok('屋頂外部樓梯可走上屋頂', roofMaxY > 9.5, 'maxY=' + roofMaxY.toFixed(2));

      player.alive = true; player.pos.set(-30, 0, 37.5); player.pos.y = 0;
      player.yaw = Math.PI; player.pitch = 0; player.vel.set(0, 0, 0); player.onGround = true;
      keys['KeyW'] = true;
      var roof2MaxY = 0;
      for (var sw3 = 0; sw3 < 300; sw3++) { updatePlayer(0.016); if (player.pos.y > roof2MaxY) roof2MaxY = player.pos.y; }
      keys['KeyW'] = false;
      ok('南側第二條樓梯可走上屋頂', roof2MaxY > 9.5, 'maxY=' + roof2MaxY.toFixed(2));

      player.alive = true; player.pos.set(-18, 0, 37.5); player.pos.y = 0;
      player.yaw = Math.PI; player.pitch = 0; player.vel.set(0, 0, 0); player.onGround = true;
      keys['KeyW'] = true;
      var doorMaxY = 0;
      for (var sw4 = 0; sw4 < 300; sw4++) { updatePlayer(0.016); if (player.pos.y > doorMaxY) doorMaxY = player.pos.y; }
      keys['KeyW'] = false;
      ok('入口旁樓梯可直上屋頂', doorMaxY > 9.5, 'maxY=' + doorMaxY.toFixed(2));

      /* 天台對戰場景 */
      roofMode = true;
      mode = 'elim';
      startGame();
      ok('天台對戰：玩家出生在屋頂', player.pos.y > 9.5, 'y=' + player.pos.y.toFixed(2));
      var roofBotCount = 0;
      for (var rb = 0; rb < bots.length; rb++) { if (bots[rb].pos.y > 9.5) roofBotCount++; }
      ok('天台對戰：全部 BOT 在屋頂', roofBotCount === bots.length, roofBotCount + '/' + bots.length);
      roofMode = false;

      /* 死亡觀戰 */
      mode = 'elim'; gameState = 'live';
      startRound();
      player.alive = false; playerDeathT = 0; spectateIdx = 0;
      updateDeathCamera(0.1);
      var camDist = Math.hypot(camera.position.x - player.pos.x, camera.position.z - player.pos.z);
      ok('死亡後可觀戰隊友', camDist > 1.0, 'camDist=' + camDist.toFixed(1));
      player.alive = true;

      /* 結算排名 */
      mode = 'elim'; gameState = 'live';
      scoreBlue = 5; scoreOrange = 2;
      gameOver();
      var rankRows = document.querySelectorAll('#endRank .rankRow').length;
      ok('結算排名顯示全部人員', rankRows === bots.length + 1, 'rows=' + rankRows + '/' + (bots.length + 1));
      showScoreboard();
      var sbRows = document.querySelectorAll('#scoreboard .sbRow').length;
      ok('計分板顯示全部人員', sbRows === bots.length + 1, 'rows=' + sbRows + '/' + (bots.length + 1));
      hideScoreboard();
    } catch (e) {
      out.push('EXCEPTION ' + e.message + '\n' + (e.stack || ''));
    }
    var el = document.getElementById('loaderr');
    el.style.display = 'block';
    el.textContent = out.join('\n');
    window.__SELFTEST = out;
  }

  /* ---------- 啟動 ---------- */
  elMenu.classList.remove('hidden');
  elHUD.classList.add('hidden');
  drawRadar();

  if (SELFTEST) runSelfTest();
  else if (SHOT) enterShotMode();
  else if (MOVIE) startMovieMode();
  else if (TEST) enterTestMode();
  else if (/[?&]photostart=1/.test(location.search)) {
    enterTestMode();
    setTimeout(function () { enterPhotoMode({ count: 20 }); }, 1200);
  }
  else {
    camera.position.set(0, 34, 62);
    camera.lookAt(0, 4, 0);
    renderFrame();
  }

  function enterTestMode() {
    difficulty = 'normal';
    var tq = new URLSearchParams(location.search);
    var qm = tq.get('mode');
    if (qm === 'happy' || qm === 'gungame' || qm === 'elim' || qm === 'defuse') mode = qm;
    if (tq.get('roof') === '1') roofMode = true;
    startGame();
    buyTimer = 0;
    gameState = 'live';
    player.pos.set(0, 0, 20);
    player.yaw = Math.PI;
    player.pitch = -0.02;
    var bs = bots.filter(function (b) { return b.team === 'blue'; });
    var os = bots.filter(function (b) { return b.team === 'orange'; });
    if (bs[0]) bs[0].spawn(-4, 14, 0);
    if (bs[1]) bs[1].spawn(-8, 16, 0);
    if (os[0]) os[0].spawn(4, 14, 0);
    if (os[1]) os[1].spawn(8, 16, 0);
    updateViewModel();
    updateHUD();
  }

  /* 開發用：無 rAF 的單張截圖模式（?shot=1） */
  function enterShotMode() {
    enterTestMode();
    var q = new URLSearchParams(location.search);
    var px = parseFloat(q.get('px'));
    var pz = parseFloat(q.get('pz'));
    player.pos.set(isNaN(px) ? 0 : px, 0, isNaN(pz) ? 14 : pz);
    var py = parseFloat(q.get('py'));
    player.pos.y = isNaN(py) ? supportHeight(player.pos.x, player.pos.z, 6, PLAYER_R) : py;
    player.yaw = parseFloat(q.get('yaw')) || Math.PI;
    player.pitch = parseFloat(q.get('pitch')) || -0.01;
    player.eyeH = EYE_STAND;
    /* 開發用：?gun=ak47 直接裝備指定武器，方便檢查模型 */
    var qg = q.get('gun');
    if (qg && window.WEAPONS[qg]) {
      var qW = window.WEAPONS[qg];
      if (qW.slot === 1) player.weapons.primary = qg;
      else if (qW.slot === 2) player.weapons.secondary = qg;
      else if (qW.slot === 3) player.weapons.knife = qg;
      else if (qW.slot === 4) player.weapons.grenade = qg;
      player.ammo[qg] = { mag: qW.mag, reserve: qW.reserve };
      setWeapon(qg, true);
    }
    if (q.get('rad') === '1') setRadMode(true);
    /* 開發用：?alarm=1 直接把燈光切到警報狀態，方便截圖檢查 */
    if (q.get('alarm') === '1') {
      setAlarm(2);
      updateAmbientLights(0.05);
    }
    if (q.get('nohud') === '1') {
      elHUD.classList.add('hidden');
      elCross.classList.add('hidden');
      if (elMovieBadge) elMovieBadge.style.display = 'none';
      if (elMovieCam) elMovieCam.style.display = 'none';
      var vg = document.getElementById('vignette');
      if (vg) vg.style.display = 'none';
      /* 指定 gun 參數時保留第一人稱槍模型（武器圖鑑截圖用） */
      if (!q.get('gun') && viewRoot) viewRoot.visible = false;
    }
    camera.position.set(player.pos.x, player.pos.y + player.eyeH, player.pos.z);
    camera.rotation.y = player.yaw + Math.PI;
    camera.rotation.x = player.pitch;
    if (q.get('photo') === '1') {
      enterPhotoMode({
        count: parseInt(q.get('count') || '20', 10),
        formation: q.get('formation') || 'fan'
      });
    }
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    updateHUD();
    renderFrame();
    if (/[?&]stats=1/.test(location.search)) {
      var si = renderer.info;
      document.title = 'STATS ' + JSON.stringify({ calls: si.render.calls, triangles: si.render.triangles, lines: si.render.lines, points: si.render.points, geometries: si.memory.geometries, textures: si.memory.textures });
      window.__RENDER_STATS = si;
    }
    var t0 = performance.now();
    (function shotLoop() {
      renderFrame();
      if (performance.now() - t0 < 12000) requestAnimationFrame(shotLoop);
    })();
  }

  if (!SHOT && !SELFTEST) animate();
})();
