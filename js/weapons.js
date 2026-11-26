/* weapons.js —— 武器数据与第一人称视图模型 */
(function () {
  'use strict';

  // slot: 1=主武器 2=副武器 3=刀 4=手雷
  var WEAPONS = {
    knife: {
      key: 'knife', name: '小刀', slot: 3, type: 'melee', price: 0,
      dmg: 42, rpm: 120, mag: 0, reserve: 0, range: 2.0,
      spread: 0, recoil: 0, reload: 0, sound: 'knife', killReward: 300
    },
    glock: {
      key: 'glock', name: '小快槍', slot: 2, type: 'pistol', price: 200,
      dmg: 30, rpm: 400, mag: 20, reserve: 120, range: 110,
      spread: 0.020, moveSpread: 0.06, recoil: 0.013, reload: 2.1, sound: 'pistol', killReward: 300
    },
    usp: {
      key: 'usp', name: '靜音先生', slot: 2, type: 'pistol', price: 200,
      dmg: 35, rpm: 352, mag: 12, reserve: 100, range: 110,
      spread: 0.011, moveSpread: 0.055, recoil: 0.015, reload: 2.2, sound: 'pistol', killReward: 300
    },
    deagle: {
      key: 'deagle', name: '大炮筒', slot: 2, type: 'pistol', price: 700,
      dmg: 63, rpm: 267, mag: 7, reserve: 35, range: 130,
      spread: 0.018, moveSpread: 0.09, recoil: 0.045, reload: 2.2, sound: 'pistol', killReward: 300
    },
    mp5: {
      key: 'mp5', name: '疾風槍', slot: 1, type: 'smg', price: 1500,
      dmg: 27, rpm: 750, mag: 30, reserve: 120, range: 100,
      spread: 0.030, moveSpread: 0.07, recoil: 0.011, reload: 2.6, sound: 'smg', killReward: 300
    },
    ak47: {
      key: 'ak47', name: '老鐵槍', slot: 1, type: 'rifle', price: 2700,
      dmg: 36, rpm: 600, mag: 30, reserve: 90, range: 160,
      spread: 0.028, moveSpread: 0.10, recoil: 0.026, reload: 2.5, sound: 'rifle', killReward: 300
    },
    m4a4: {
      key: 'm4a4', name: '星火卡賓', slot: 1, type: 'rifle', price: 3100,
      dmg: 33, rpm: 666, mag: 30, reserve: 90, range: 160,
      spread: 0.024, moveSpread: 0.09, recoil: 0.020, reload: 3.0, sound: 'rifle', killReward: 300
    },
    awp: {
      key: 'awp', name: '天穹狙', slot: 1, type: 'sniper', price: 4750,
      dmg: 115, rpm: 41, mag: 10, reserve: 30, range: 240,
      spread: 0.035, scopedSpread: 0.0008, moveSpread: 0.14, recoil: 0.085, reload: 3.6, sound: 'awp',
      scope: true, killReward: 300, moveSpeedMul: 0.82
    },
    nova: {
      key: 'nova', name: '碎星霰彈', slot: 1, type: 'shotgun', price: 1050,
      dmg: 20, pellets: 8, rpm: 68, mag: 8, reserve: 32, range: 32,
      spread: 0.085, moveSpread: 0.10, recoil: 0.055, reload: 3.2, sound: 'shotgun', killReward: 300
    },
    /* --- 擴充武器（固定配置） --- */
    tec9: {
      key: 'tec9', name: '蜂鳴器', slot: 2, type: 'pistol', price: 500,
      dmg: 28, rpm: 500, mag: 18, reserve: 90, range: 120,
      spread: 0.024, moveSpread: 0.07, recoil: 0.018, reload: 2.3, sound: 'pistol'
    },
    fiveseven: {
      key: 'fiveseven', name: '穿甲蝴蝶', slot: 2, type: 'pistol', price: 500,
      dmg: 32, rpm: 400, mag: 20, reserve: 100, range: 120,
      spread: 0.014, moveSpread: 0.06, recoil: 0.016, reload: 2.3, sound: 'pistol'
    },
    ump45: {
      key: 'ump45', name: '重錘手', slot: 1, type: 'smg', price: 1200,
      dmg: 35, rpm: 666, mag: 25, reserve: 100, range: 110,
      spread: 0.032, moveSpread: 0.07, recoil: 0.020, reload: 2.8, sound: 'smg'
    },
    p90: {
      key: 'p90', name: '閃電魚', slot: 1, type: 'smg', price: 2350,
      dmg: 27, rpm: 857, mag: 50, reserve: 100, range: 110,
      spread: 0.030, moveSpread: 0.08, recoil: 0.014, reload: 3.0, sound: 'smg'
    },
    famas: {
      key: 'famas', name: '連珠炮', slot: 1, type: 'rifle', price: 2250,
      dmg: 30, rpm: 666, mag: 25, reserve: 90, range: 150,
      spread: 0.026, moveSpread: 0.09, recoil: 0.021, reload: 2.6, sound: 'rifle'
    },
    galil: {
      key: 'galil', name: '雷鳴槍', slot: 1, type: 'rifle', price: 2000,
      dmg: 30, rpm: 666, mag: 35, reserve: 90, range: 150,
      spread: 0.030, moveSpread: 0.10, recoil: 0.024, reload: 2.9, sound: 'rifle'
    },
    ar15: {
      key: 'ar15', name: '鐵脊步槍', slot: 1, type: 'rifle', price: 2900,
      dmg: 34, rpm: 620, mag: 30, reserve: 90, range: 170,
      spread: 0.020, moveSpread: 0.08, recoil: 0.020, reload: 2.7, sound: 'rifle'
    },
    aug: {
      key: 'aug', name: '幻影槍', slot: 1, type: 'rifle', price: 3300,
      dmg: 32, rpm: 666, mag: 30, reserve: 90, range: 175,
      spread: 0.018, moveSpread: 0.09, recoil: 0.019, reload: 3.1, sound: 'rifle',
      scope: true, scopedSpread: 0.004, zoomFov: 45
    },
    ssg08: {
      key: 'ssg08', name: '遠山狙', slot: 1, type: 'sniper', price: 1700,
      dmg: 88, rpm: 48, mag: 10, reserve: 90, range: 200,
      spread: 0.030, scopedSpread: 0.001, moveSpread: 0.12, recoil: 0.060, reload: 3.2,
      sound: 'awp', scope: true, moveSpeedMul: 0.88
    },
    m249: {
      key: 'm249', name: '烈焰機槍', slot: 1, type: 'mg', price: 5200,
      dmg: 32, rpm: 750, mag: 100, reserve: 200, range: 170,
      spread: 0.040, moveSpread: 0.12, recoil: 0.028, reload: 5.2,
      sound: 'rifle', moveSpeedMul: 0.85
    },
    /* --- V2 趣味武器：輻射漆彈 --- */
    radpaint: {
      key: 'radpaint', name: '輻射漆彈槍', slot: 4, type: 'paint', price: 450,
      dmg: 14, rpm: 150, mag: 8, reserve: 24, range: 60,
      spread: 0.007, moveSpread: 0.045, recoil: 0.006, reload: 2.4,
      sound: 'paint', killReward: 300
    },
    /* 保留資料供舊存檔／除錯用，購買選單不再販售 */
    hegrenade: {
      key: 'hegrenade', name: '高爆手榴彈', slot: 4, type: 'grenade', price: 300,
      dmg: 98, radius: 8, mag: 1, reserve: 0, range: 0, spread: 0, recoil: 0,
      reload: 0, sound: 'grenade', killReward: 300
    }
  };

  // 购买菜单（按分类显示）
  var BUY_LIST = [
    { cat: '手槍', items: ['glock', 'usp', 'deagle', 'tec9', 'fiveseven'] },
    { cat: '衝鋒槍', items: ['mp5', 'ump45', 'p90'] },
    { cat: '步槍', items: ['ak47', 'm4a4', 'ar15', 'famas', 'galil', 'aug'] },
    { cat: '狙擊 / 霰彈', items: ['awp', 'ssg08', 'nova'] },
    { cat: '重武器 / 趣味', items: ['m249', 'radpaint', 'hegrenade'] }
  ];

  /* ---------- 视图模型 ---------- */

  var M = {
    dark: new THREE.MeshStandardMaterial({ color: 0x2b2e34, roughness: 0.5, metalness: 0.35 }),
    mid: new THREE.MeshStandardMaterial({ color: 0x454a52, roughness: 0.45, metalness: 0.4 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8a5528, roughness: 0.8, metalness: 0.05 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.6 }),
    green: new THREE.MeshStandardMaterial({ color: 0x4a5a40, roughness: 0.7, metalness: 0.15 })
  };

  function box(w, h, d, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    return m;
  }

  function cylinder(r, len, mat, x, y, z, rot) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.x = rot;
    return m;
  }

  // 构建单把枪的视图模型；坐标原点在"枪身中心"，枪口朝 -Z
  function buildGunModel(key) {
    var g = new THREE.Group();
    var muzzle = new THREE.Vector3(0, 0, -0.5);

    if (key === 'knife') {
      g.add(box(0.035, 0.05, 0.26, M.dark, 0, 0, -0.08));         // 刀身
      g.add(box(0.045, 0.045, 0.13, M.wood, 0, 0, 0.12));         // 刀柄
      g.add(box(0.06, 0.012, 0.03, M.mid, 0, -0.025, 0.06));      // 护手
      muzzle.set(0, 0, -0.22);
      g.rotation.x = -0.15;
    } else if (key === 'glock' || key === 'usp' || key === 'deagle' || key === 'tec9' || key === 'fiveseven') {
      var isDeagle = key === 'deagle';
      var isUSP = key === 'usp';
      var slideLen = isDeagle ? 0.30 : (key === 'tec9' ? 0.30 : 0.24);
      var slideMat = isDeagle ? M.steel : M.dark;
      var slideZ = -0.10;
      // 套筒
      g.add(box(0.040, 0.052, slideLen, slideMat, 0, 0.012, slideZ));
      // 枪口
      g.add(box(0.030, 0.030, 0.022, M.mid, 0, 0.012, slideZ - slideLen / 2 - 0.008));
      if (isUSP) {
        var sup = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.13, 10), M.steel);
        sup.rotation.x = Math.PI / 2;
        sup.position.set(0, 0.012, slideZ - slideLen / 2 - 0.07);
        g.add(sup);
      }
      // 套筒防滑纹
      for (var si = 0; si < 3; si++) {
        g.add(box(0.042, 0.040, 0.006, M.mid, 0, 0.012, slideZ + slideLen / 2 - 0.02 - si * 0.014));
      }
      // 握把（后倾）
      var grip = box(0.038, 0.10, 0.055, M.dark, 0, -0.045, 0.045);
      grip.rotation.x = -0.20;
      g.add(grip);
      // 扳机护圈
      var guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12), M.mid);
      guard.position.set(0, -0.026, 0.008);
      guard.rotation.y = Math.PI / 2;
      g.add(guard);
      // 准星 / 照门
      g.add(box(0.008, 0.012, 0.010, M.mid, 0, 0.042, slideZ - slideLen / 2 + 0.015));
      g.add(box(0.020, 0.010, 0.010, M.mid, 0, 0.040, slideZ + slideLen / 2 - 0.012));
      muzzle.set(0, 0.012, slideZ - slideLen / 2 - 0.02);
    } else if (key === 'mp5' || key === 'ump45' || key === 'p90') {
      g.add(box(0.055, 0.075, 0.30, M.dark, 0, 0.01, -0.06));      // 机匣
      g.add(cylinder(0.018, 0.22, M.steel, 0, 0.02, -0.30, Math.PI / 2)); // 枪管
      g.add(box(0.05, 0.045, 0.10, M.mid, 0, -0.055, 0.03));       // 握把
      g.add(box(0.042, 0.15, 0.06, M.mid, 0, -0.09, -0.09));       // 弹匣
      g.add(box(0.035, 0.03, 0.12, M.mid, 0, 0.055, 0.09));        // 枪托杆
      g.add(box(0.045, 0.08, 0.04, M.dark, 0, 0.04, 0.15));        // 枪托
      g.add(box(0.02, 0.04, 0.10, M.mid, 0, 0.065, -0.12));        // 上导轨
      if (key === 'p90') g.add(box(0.05, 0.07, 0.12, M.mid, 0, 0.08, 0.02)); // P90 上弹匣
      muzzle.set(0, 0.02, -0.42);
    } else if (key === 'ak47' || key === 'm4a4' || key === 'famas' || key === 'galil' || key === 'ar15' || key === 'aug') {
      var isAK = key === 'ak47' || key === 'galil';
      var bodyMat = isAK ? M.wood : M.dark;
      g.add(box(0.055, 0.08, 0.36, M.dark, 0, 0.01, -0.08));       // 机匣
      g.add(cylinder(0.017, 0.30, M.steel, 0, 0.02, -0.40, Math.PI / 2)); // 枪管
      g.add(box(0.05, 0.05, 0.12, bodyMat, 0, -0.01, -0.27));      // 护木
      g.add(box(0.05, 0.045, 0.10, M.dark, 0, -0.055, 0.03));      // 握把
      g.add(box(0.045, 0.20, 0.07, M.dark, 0, -0.105, -0.13, isAK ? 0.28 : 0.18)); // 弹匣
      g.add(box(0.045, 0.07, 0.20, bodyMat, 0, -0.015, 0.17));     // 枪托
      g.add(box(0.02, 0.045, 0.09, M.mid, 0, 0.065, -0.15));       // 导气管
      if (isAK) g.add(box(0.024, 0.03, 0.05, M.mid, 0, 0.07, -0.40)); // 准星护翼
      if (key === 'm4a4' || key === 'ar15') g.add(box(0.018, 0.035, 0.18, M.mid, 0, 0.075, -0.06)); // 提把
      if (key === 'famas') g.add(box(0.03, 0.05, 0.16, M.mid, 0, 0.08, -0.02)); // FAMAS 提把
      if (key === 'aug') {
        var augScope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 8), M.dark);
        augScope.rotation.x = Math.PI / 2;
        augScope.position.set(0, 0.085, -0.10);
        g.add(augScope);
      }
      muzzle.set(0, 0.02, -0.55);
    } else if (key === 'awp' || key === 'ssg08') {
      var isSSG = key === 'ssg08';
      g.add(box(0.06, 0.09, 0.42, M.green, 0, 0.01, -0.08));       // 枪身
      g.add(cylinder(0.019, isSSG ? 0.30 : 0.42, M.dark, 0, 0.02, isSSG ? -0.42 : -0.48, Math.PI / 2)); // 枪管
      g.add(cylinder(0.026, 0.05, M.dark, 0, 0.02, isSSG ? -0.58 : -0.70, Math.PI / 2)); // 制退器
      g.add(box(0.05, 0.05, 0.12, M.dark, 0, -0.06, 0.05));        // 握把
      g.add(box(0.05, 0.12, 0.09, M.dark, 0, -0.075, -0.14));      // 弹匣
      g.add(box(0.06, 0.09, 0.26, M.green, 0, -0.01, 0.22));       // 枪托
      g.add(cylinder(0.026, 0.20, M.dark, 0, 0.085, -0.10, Math.PI / 2)); // 瞄准镜
      g.add(box(0.03, 0.05, 0.04, M.mid, 0, 0.055, -0.16));        // 镜座
      muzzle.set(0, 0.02, isSSG ? -0.60 : -0.72);
    } else if (key === 'm249') {
      g.add(box(0.09, 0.11, 0.46, M.dark, 0, 0.01, -0.10));        // 粗机匣
      g.add(cylinder(0.026, 0.40, M.steel, 0, 0.02, -0.52, Math.PI / 2)); // 重枪管
      g.add(box(0.06, 0.05, 0.12, M.mid, 0, -0.06, 0.05));         // 握把
      g.add(box(0.12, 0.16, 0.14, M.mid, 0.02, -0.10, -0.02));     // 弹箱
      g.add(box(0.05, 0.08, 0.22, M.dark, 0, -0.02, 0.20));        // 枪托
      muzzle.set(0, 0.02, -0.74);
    } else if (key === 'nova') {
      g.add(box(0.06, 0.075, 0.30, M.wood, 0, 0.01, -0.04));
      g.add(cylinder(0.025, 0.34, M.steel, 0, 0.035, -0.34, Math.PI / 2)); // 上管
      g.add(cylinder(0.022, 0.30, M.dark, 0, 0.0, -0.32, Math.PI / 2));     // 下管
      g.add(box(0.05, 0.05, 0.10, M.dark, 0, -0.06, 0.05));        // 握把
      g.add(box(0.055, 0.07, 0.18, M.wood, 0, -0.01, 0.16));       // 枪托
      g.add(box(0.045, 0.04, 0.10, M.wood, 0, -0.005, -0.22));     // 护木
      muzzle.set(0, 0.02, -0.52);
    } else if (key === 'radpaint') {
      var paintGreen = new THREE.MeshStandardMaterial({ color: 0x3fcf5a, emissive: 0x1f7a30, emissiveIntensity: 0.35, roughness: 0.5 });
      var paintDark = new THREE.MeshStandardMaterial({ color: 0x23402a, roughness: 0.6, metalness: 0.3 });
      g.add(box(0.10, 0.10, 0.26, paintDark, 0, 0.01, -0.06));       // 機匣
      g.add(cylinder(0.032, 0.26, paintGreen, 0, 0.03, -0.34, Math.PI / 2)); // 漆彈管
      g.add(cylinder(0.024, 0.34, paintDark, 0, -0.055, -0.02, Math.PI / 2)); // 下方漆罐
      g.add(box(0.055, 0.05, 0.10, paintDark, 0, -0.055, 0.04));      // 握把
      g.add(box(0.06, 0.06, 0.10, paintGreen, 0, 0.10, -0.05));       // 頂部漆壺
      g.add(box(0.02, 0.02, 0.06, M.steel, 0, 0.03, -0.47));          // 槍口
      var glow = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x7dff8a }));
      glow.position.set(0, 0.03, -0.075);
      g.add(glow);
      muzzle.set(0, 0.03, -0.50);
    } else if (key === 'hegrenade') {
      var ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), M.green);
      g.add(ball);
      g.add(box(0.03, 0.035, 0.03, M.dark, 0, 0.09, 0));
      muzzle.set(0, 0, -0.1);
    }

    // 第一人称的方块手（Minecraft 风格）
    var handMat = new THREE.MeshStandardMaterial({ color: 0xc9a17a, roughness: 0.95 });
    var sleeveMat = new THREE.MeshStandardMaterial({ color: 0x1f9e9e, roughness: 0.95 });
    function makeHand(x, y, z, rx, rz) {
      var h = new THREE.Group();
      var palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), handMat);
      h.add(palm);
      var cuff = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.078, 0.10), sleeveMat);
      cuff.position.set(0, 0, 0.088);
      h.add(cuff);
      h.position.set(x, y, z);
      if (rx) h.rotation.x = rx;
      if (rz) h.rotation.z = rz;
      return h;
    }
    if (key === 'knife') {
      g.add(makeHand(0, -0.02, 0.13, -0.1));
    } else if (key === 'hegrenade') {
      g.add(makeHand(0, -0.10, 0.02, -0.3));
    } else if (key === 'radpaint') {
      g.add(makeHand(0, -0.07, 0.06, -0.2));
      g.add(makeHand(0, -0.02, -0.20, -0.3, 0.2));
    } else if (key === 'glock' || key === 'usp' || key === 'deagle') {
      g.add(makeHand(0, -0.09, 0.055, -0.15));
    } else {
      g.add(makeHand(0, -0.09, 0.045, -0.15));
      g.add(makeHand(0, -0.02, -0.22, -0.25, 0.2));
    }

    g.userData.muzzle = muzzle;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return g;
  }

  /* 枪口火焰贴图 */
  function makeFlashTexture() {
    var s = 64;
    var cv = document.createElement('canvas');
    cv.width = cv.height = s;
    var g = cv.getContext('2d');
    var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,250,200,1)');
    grad.addColorStop(0.25, 'rgba(255,210,90,0.95)');
    grad.addColorStop(0.6, 'rgba(255,130,30,0.5)');
    grad.addColorStop(1, 'rgba(255,90,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    // 星芒
    g.strokeStyle = 'rgba(255,230,150,.9)';
    g.lineWidth = 3;
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2 + 0.3;
      g.beginPath();
      g.moveTo(s / 2, s / 2);
      g.lineTo(s / 2 + Math.cos(a) * s * 0.48, s / 2 + Math.sin(a) * s * 0.48);
      g.stroke();
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  window.WEAPONS = WEAPONS;
  window.BUY_LIST = BUY_LIST;
  window.buildGunModel = buildGunModel;
  window.makeFlashTexture = makeFlashTexture;
})();
