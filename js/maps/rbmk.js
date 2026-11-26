/* maps/rbmk.js —— RBMK-1000 核電站地圖定義（純內容，引擎無關）
 * 新增地圖：複製本檔改 id / MAP / buildLayout，並在 index.html 引入即可。
 */
(function () {
  'use strict';
  window.CS_MAP_DEFS = window.CS_MAP_DEFS || {};
  window.CS_MAP_DEFS.rbmk = {
    id: 'rbmk',
    label: 'RBMK-1000 核電站',
    MAP: {
    name: 'RBMK-1000 核電站',
    bounds: { minX: -46, maxX: 46, minZ: -46, maxZ: 46 },
    spawns: {
      blue: [
        { x: 22, z: 21, yaw: Math.PI }, { x: 26, z: 21, yaw: Math.PI },
        { x: 30, z: 21, yaw: Math.PI }, { x: 20, z: 19, yaw: Math.PI },
        { x: 32, z: 19, yaw: Math.PI }, { x: 18, z: 21, yaw: Math.PI },
        { x: 20, z: 17, yaw: Math.PI }, { x: 24, z: 17, yaw: Math.PI },
        { x: 28, z: 17, yaw: Math.PI }, { x: 32, z: 17, yaw: Math.PI }
      ],
      orange: [
        { x: -6, z: 38, yaw: Math.PI }, { x: 0, z: 38, yaw: Math.PI },
        { x: 6, z: 38, yaw: Math.PI }, { x: 24, z: 38, yaw: Math.PI },
        { x: 28, z: 36, yaw: Math.PI }, { x: -3, z: 36, yaw: Math.PI },
        { x: 3, z: 36, yaw: Math.PI }, { x: 22, z: 37, yaw: Math.PI },
        { x: 26, z: 37, yaw: Math.PI }, { x: 30, z: 38, yaw: Math.PI }
      ]
    },
    sites: {
      A: { x: 0, z: 7, r: 11 },
      B: { x: 26, z: 16, r: 9 }
    },
    /* 反應堆規格（視覺細節數量；16 公尺 ≈ 31～32 個方塊） */
    reactor: { size: 16, fuelRods: 173, controlRods: 288, steamPipes: 320 },
    /* 屋頂梯子：按 W 攀爬 */
    ladders: [
      { x: 8, z: -22.7, y0: 0, y1: 10.4, radius: 1.05 }
    ],
    /* 入口走廊右側電梯：按 E 往返控制室 */
    elevators: [
      { x: 8.6, z: 28, radius: 1.7, to: { x: 20, z: 18 }, label: '控制室' },
      { x: 17.6, z: 18, radius: 1.7, to: { x: 8.6, z: 28 }, label: '入口走廊' }
    ],
    /* 會閃爍的紅色警示燈（部分帶旋轉光束） */
    beacons: [
      { x: 0, z: 26.5, y: 7.4, spin: true },
      { x: -13, z: 6, y: 8.7, spin: true },
      { x: 13, z: 6, y: 8.7, spin: true },
      { x: -13, z: -16, y: 8.7 },
      { x: 13, z: -16, y: 8.7 },
      { x: 0, z: 8.2, y: 9.1, spin: true },
      { x: -26, z: -20, y: 8.4, spin: true },
      { x: 0, z: -20, y: 8.4, spin: true },
      { x: 26, z: -20, y: 8.4, spin: true },
      { x: 26, z: 20.5, y: 8.6 },
      { x: -26, z: 20.5, y: 8.6 },
      { x: 26, z: -14, y: 8.6 },
      { x: -26, z: -14, y: 8.6 },
      /* 牆上低位警示燈：正常視角也看得到 */
      { x: -14.4, z: 0, y: 4.4 }, { x: 14.4, z: 0, y: 4.4 },
      { x: 15.56, z: 12, y: 4.4 }, { x: 22.3, z: 10.56, y: 4.4 },
      { x: -15.56, z: 20, y: 4.4 }, { x: 15.56, z: 0, y: 4.4 },
      { x: -9.4, z: 29.5, y: 4.4 }, { x: 9.4, z: 29.5, y: 4.4 }
    ],
    waypoints: [
      /* 入口外 / 變電站 */
      { x: 0, z: 38 }, { x: -8, z: 38 }, { x: 8, z: 38 }, { x: 24, z: 37 }, { x: 30, z: 37 },
      { x: 0, z: 33 },
      /* 入口走廊 */
      { x: 0, z: 28 }, { x: -5, z: 28 }, { x: 5, z: 28 },
      /* 南側大廳 */
      { x: 0, z: 21 }, { x: -8, z: 21 }, { x: 8, z: 21 },
      { x: -12, z: 15 }, { x: 12, z: 15 }, { x: 0, z: 14 },
      /* 反應堆大廳 */
      { x: 0, z: 6 }, { x: -4, z: 4 }, { x: 4, z: 4 },
      { x: -11, z: -2 }, { x: 11, z: -2 },
      { x: -11, z: -8 }, { x: 11, z: -8 },
      { x: -11, z: -14 }, { x: 11, z: -14 },
      { x: 0, z: -16 },
      /* 汽輪機室 */
      { x: -19, z: -14 }, { x: -30, z: -14 }, { x: -19, z: -6 },
      { x: -32, z: -2 }, { x: -19, z: 3 }, { x: -22, z: 6 },
      /* 水泵房 */
      { x: 19, z: -14 }, { x: 30, z: -14 }, { x: 19, z: -6 },
      { x: 34, z: -6 }, { x: 19, z: 3 }, { x: 30, z: 6 },
      /* 柴油發電室（節點放在發電機之間的走道） */
      { x: -19, z: 13 }, { x: -27, z: 13 }, { x: -30.5, z: 13 },
      { x: -19, z: 19 }, { x: -27, z: 19 }, { x: -30.5, z: 19 },
      { x: -20, z: 15.5 }, { x: -23, z: 15.5 }, { x: -27, z: 15.5 },
      { x: -30.5, z: 15.5 }, { x: -34, z: 15.5 },
      /* 控制室 */
      { x: 19, z: 14 }, { x: 26, z: 14 }, { x: 32, z: 14 },
      { x: 19, z: 20 }, { x: 26, z: 20 }, { x: 32, z: 20 },
      /* 門口節點：讓 BOT 能真正穿過各房間的兩側出入口 */
      { x: -28, z: 9 }, { x: -28, z: 7 }, { x: -27, z: 11 },
      { x: 22, z: 9 }, { x: 22, z: 7 }, { x: 22, z: 12 },
      { x: -13, z: 16 }, { x: -17, z: 16 },
      { x: 13, z: 16 }, { x: 17, z: 16 },
      { x: -13, z: -4 }, { x: -17, z: -4 }, { x: -13, z: 4 }, { x: -17, z: 4 },
      { x: 13, z: -4 }, { x: 17, z: -4 }, { x: 13, z: 4 }, { x: 17, z: 4 },
      /* 北側後勤走廊：汽輪機室 ↔ 水泵房，新增一條繞後包抄路線 */
      { x: -32, z: -20 }, { x: -20, z: -20 }, { x: 0, z: -20 },
      { x: 20, z: -20 }, { x: 32, z: -20 }
    ]
  },
    buildLayout: function (CORE) {

    /* 主建築地板（白色） */
    CORE.box(CORE.B(0, 1, 72, 46, 0.1, 'white', -0.05));
    /* 走廊地板（石磚） */
    CORE.box(CORE.B(0, 28, 20, 8, 0.1, 'stone', -0.05));
    /* 地下室地板 */
    CORE.box(CORE.B(0, 0, 64, 36, 0.1, 'concrete', -6.05));
    /* 屋頂板：唯一可到達的屋頂在 y=10.4（外部樓梯與梯子都到這裡） */

    /* === 外圍圍欄 === */
    CORE.box(CORE.B(0, -45, 92, 1, 5, 'concrete'));
    CORE.box(CORE.B(0, 45, 92, 1, 5, 'concrete'));
    CORE.box(CORE.B(-45, 0, 1, 90, 5, 'concrete'));
    CORE.box(CORE.B(45, 0, 1, 90, 5, 'concrete'));

    /* === 主建築外牆 (x -36..36, z -22..24, 高 10，與屋頂齊平) === */
    /* 北牆：左右各留一個門洞（x -16..-8 / 8..16），四面四通八達 */
    CORE.box(CORE.B(-26, -22, 20, 1, 10, 'white'));
    CORE.box(CORE.B(0, -22, 16, 1, 10, 'white'));
    CORE.box(CORE.B(26, -22, 20, 1, 10, 'white'));
    CORE.box(CORE.B(-23, 24, 26, 1, 10, 'white'));
    CORE.box(CORE.B(23, 24, 26, 1, 10, 'white'));
    /* 西牆：留門洞 z -12..-4 / 12..20 */
    CORE.box(CORE.B(-36, -17, 1, 10, 10, 'white'));
    CORE.box(CORE.B(-36, 4, 1, 16, 10, 'white'));
    CORE.box(CORE.B(-36, 22, 1, 4, 10, 'white'));
    /* 東牆：留門洞 z -12..-4 / 12..20 */
    CORE.box(CORE.B(36, -17, 1, 10, 10, 'white'));
    CORE.box(CORE.B(36, 4, 1, 16, 10, 'white'));
    CORE.box(CORE.B(36, 22, 1, 4, 10, 'white'));

    /* 外牆裝飾：霓虹觀察窗 + 黃黑飾帶，讓工業建築好看一點 */
    CORE.equip({ type: 'blueWindow', x: 35.44, z: -10, y: 5.2, w: 4.2, h: 2.1, ry: -Math.PI / 2 });
    CORE.equip({ type: 'blueWindow', x: -35.44, z: -10, y: 5.2, w: 4.2, h: 2.1, ry: Math.PI / 2 });
    CORE.equip({ type: 'blueWindow', x: 20, z: 23.44, y: 5.2, w: 4.2, h: 2.1, ry: Math.PI });
    CORE.equip({ type: 'blueWindow', x: -20, z: 23.44, y: 5.2, w: 4.2, h: 2.1, ry: Math.PI });
    CORE.equip({ type: 'blueWindow', x: 35.44, z: 8, y: 5.2, w: 3.4, h: 2.0, ry: -Math.PI / 2 });
    CORE.equip({ type: 'blueWindow', x: -35.44, z: 8, y: 5.2, w: 3.4, h: 2.0, ry: Math.PI / 2 });

    /* === 入口走廊 (x -10..10, z 24..32) === */
    CORE.box(CORE.B(-10, 28, 1, 8, 8, 'white'));
    CORE.box(CORE.B(10, 28, 1, 8, 8, 'white'));
    /* 玻璃金屬門：中央留 4 公尺開口，兩側是可擊碎玻璃 + 金屬框 */
    CORE.box(CORE.B(-2.2, 32, 0.4, 0.5, 4, 'metal'));
    CORE.box(CORE.B(2.2, 32, 0.4, 0.5, 4, 'metal'));
    CORE.box(CORE.B(-10, 32, 0.6, 0.5, 4, 'metal'));
    CORE.box(CORE.B(10, 32, 0.6, 0.5, 4, 'metal'));
    CORE.box(CORE.B(0, 32, 20, 0.4, 0.3, 'metal', 3.7));
    CORE.equip({ type: 'breakGlass', x: -6.1, z: 32, w: 7.4, h: 3.7, y: 1.85, ry: 0 });
    CORE.equip({ type: 'breakGlass', x: 6.1, z: 32, w: 7.4, h: 3.7, y: 1.85, ry: 0 });
    /* 黑色防輻射門（z=24 門框）+ 輻射標誌 */
    CORE.box(CORE.B(-6.5, 24, 7, 1, 6, 'hazard'));
    CORE.box(CORE.B(6.5, 24, 7, 1, 6, 'hazard'));
    CORE.equip({ type: 'radSign', x: 0, z: 24.08, y: 5.0, w: 2.4, h: 2.4, ry: 0 });
    CORE.box(CORE.B(0, 24, 6, 0.5, 0.12, 'hazard'));   // 防護門下黃黑警示條
    /* 走廊左側藍框觀察窗、右側通往控制室的電梯 */
    CORE.equip({ type: 'blueWindow', x: -9.44, z: 28, y: 4.0, w: 4.2, h: 2.2, ry: Math.PI / 2 });
    CORE.equip({ type: 'elevator', x: 9.44, z: 28, y: 2.1, w: 3.2, h: 4.2, ry: Math.PI / 2 });

    /* === 反應堆大廳 (x -14..14, z -18..8) === */
    /* 西牆 x=-15，門洞 z -6..-2 / 2..6 */
    CORE.box(CORE.B(-15, -12, 1, 12, 10, 'white'));
    CORE.box(CORE.B(-15, 0, 1, 4, 10, 'white'));
    CORE.box(CORE.B(-15, 7, 1, 2, 10, 'white'));
    /* 東牆 x=15 */
    CORE.box(CORE.B(15, -12, 1, 12, 10, 'white'));
    CORE.box(CORE.B(15, 0, 1, 4, 10, 'white'));
    CORE.box(CORE.B(15, 7, 1, 2, 10, 'white'));
    /* 南牆 z=8，門洞 x -4..4 */
    CORE.box(CORE.B(-9, 8, 10, 1, 10, 'white'));
    CORE.box(CORE.B(9, 8, 10, 1, 10, 'white'));
    /* 北牆（外牆已建），大廳北側內牆 */
    CORE.box(CORE.B(0, -17.5, 30, 1, 10, 'white'));
    /* 中央反應堆本體（不可穿越，灰色混凝土；16 公尺 ≈ 31 方塊） */
    CORE.box(CORE.B(0, -4, 16, 16, 12, 'concrete'));
    /* 反應堆四周黃黑警示條 */
    CORE.box(CORE.B(-8.4, -4, 0.6, 16, 1.2, 'hazard'));
    CORE.box(CORE.B(8.4, -4, 0.6, 16, 1.2, 'hazard'));
    CORE.box(CORE.B(0, 4.4, 17, 0.6, 1.2, 'hazard'));
    CORE.box(CORE.B(0, -12.4, 17, 0.6, 1.2, 'hazard'));
    /* 173 燃料棒 / 288 控制棒 / 320 蒸汽管道（建構時用 InstancedMesh 生成） */
    CORE.equip({ type: 'reactorDetail' });

    /* === 汽輪機室 (x -36..-15, z -18..8) === */
    /* 南牆 z=8，門洞 x -30..-26 */
    CORE.box(CORE.B(-33, 8, 6, 1, 10, 'white'));
    CORE.box(CORE.B(-21, 8, 12, 1, 10, 'white'));
    /* 汽輪機 1、2（深綠巨型圓柱） */
    CORE.equip({ type: 'turbine', x: -26, z: -10, r: 3.4, h: 5 });
    CORE.equip({ type: 'turbine', x: -26, z: 2, r: 3.4, h: 5 });
    /* 冷凝器 */
    CORE.equip({ type: 'condenser', x: -32, z: 5, w: 5, d: 4, h: 3.6 });

    /* === 水泵房 (x 16..36, z -18..8) === */
    /* 南牆 z=8，門洞 x 20..24 */
    CORE.box(CORE.B(18, 8, 4, 1, 10, 'white'));
    CORE.box(CORE.B(30, 8, 12, 1, 10, 'white'));
    /* 儲水罐 */
    CORE.equip({ type: 'tank', x: 23, z: -11, r: 2.8, h: 5 });
    CORE.equip({ type: 'tank', x: 31, z: -11, r: 2.8, h: 5 });
    CORE.equip({ type: 'tank', x: 23, z: -1, r: 2.8, h: 5 });
    CORE.equip({ type: 'tank', x: 31, z: -1, r: 2.8, h: 5 });
    /* 藍框觀察窗、輻射標誌、紅黑管道 */
    CORE.equip({ type: 'blueWindow', x: 22, z: 7.44, y: 4.0, w: 4.2, h: 2.4, ry: Math.PI });
    CORE.equip({ type: 'radSign', x: 30, z: 7.44, y: 4.2, w: 1.8, h: 1.8, ry: Math.PI });
    CORE.equip({ type: 'pipeRun', x: 27, z: -6, len: 14, y: 3.1, ry: 0, color: 'red' });
    CORE.equip({ type: 'pipeRun', x: 27, z: -6, len: 14, y: 3.75, ry: 0, color: 'black' });
    CORE.equip({ type: 'pipeRun', x: 20, z: -6, len: 12, y: 3.4, ry: Math.PI / 2, color: 'red' });

    /* === 柴油發電室 (x -36..-15, z 10..22) === */
    /* 北牆 z=10，門洞 x -30..-24 */
    CORE.box(CORE.B(-33, 10, 6, 1, 10, 'white'));
    CORE.box(CORE.B(-21, 10, 12, 1, 10, 'white'));
    /* 東牆 x=-15，門洞 z 14..18 */
    CORE.box(CORE.B(-15, 12, 1, 4, 10, 'white'));
    CORE.box(CORE.B(-15, 20, 1, 4, 10, 'white'));
    /* 柴油發電機 x8 */
    for (var gx = 0; gx < 4; gx++) {
      for (var gz = 0; gz < 2; gz++) {
        CORE.equip({
          type: 'generator',
          x: -32 + gx * 3.4, z: 13 + gz * 5,
          w: 1.8, d: 2.2, h: 2.4
        });
      }
    }
    /* 柴油罐 x2 */
    CORE.equip({ type: 'fuelTank', x: -34, z: 11, r: 2.2, h: 4.2 });
    CORE.equip({ type: 'fuelTank', x: -34, z: 21, r: 2.2, h: 4.2 });
    /* 紫色量子電池 */
    CORE.equip({ type: 'battery', x: -24, z: 21, w: 1.4, d: 1.4, h: 2.2 });
    CORE.equip({ type: 'battery', x: -28, z: 21, w: 1.4, d: 1.4, h: 2.2 });

    /* === 控制室 B 點 (x 16..36, z 10..22) === */
    /* 北牆 z=10，門洞 x 20..24 */
    CORE.box(CORE.B(17.5, 10, 3, 1, 10, 'white'));
    CORE.box(CORE.B(29, 10, 14, 1, 10, 'white'));
    /* 西牆 x=15，門洞 z 14..18；南段改成可擊碎觀察窗（可看往大廳方向） */
    CORE.box(CORE.B(15, 12, 1, 4, 10, 'white'));
    CORE.box(CORE.B(15, 20, 1, 4, 2, 'white'));
    CORE.box(CORE.B(15, 20, 1, 4, 4, 'white', 6));
    CORE.equip({ type: 'breakGlass', x: 15, z: 20, w: 3.6, h: 3.8, y: 4, ry: Math.PI / 2 });
    /* 觀察窗（北牆玻璃，裝飾） */
    CORE.equip({ type: 'window', x: 26, z: 10.0, w: 8, h: 4, ry: 0 });
    /* 儀表台（避開北門 x20..24，讓入口保持暢通） */
    CORE.equip({ type: 'console', x: 30, z: 11.6, w: 8, d: 1.4, h: 1.2 });
    CORE.equip({ type: 'console', x: 34.6, z: 16, w: 1.4, d: 9, h: 1.2 });
    /* 顯示幕：溫度 / 功率 / 中子通量 */
    CORE.equip({ type: 'readout', x: 18.6, z: 10.56, w: 3.3, h: 1.7, y: 4.7,
      text: ['反應堆溫度', '312 °C'], color: '#ffb347' });
    CORE.equip({ type: 'readout', x: 26, z: 10.56, w: 3.3, h: 1.7, y: 4.7,
      text: ['輸出功率', '1000 MW'], color: '#7dff9c' });
    CORE.equip({ type: 'readout', x: 33.4, z: 10.56, w: 3.3, h: 1.7, y: 4.7,
      text: ['中子通量', '3.2E13'], color: '#7dc9ff' });

    /* === 南側大廳（x -15..15, z 8..24）===
       兩側房間牆本身已有門洞，不要再補一道實牆把門封死；
       只在 z22..24 補上收邊。 */
    CORE.box(CORE.B(-15, 23, 1, 2, 10, 'white'));
    CORE.box(CORE.B(15, 23, 1, 2, 10, 'white'));

    /* === 地下室（y -6）：中央反應堆基座 === */
    CORE.box(CORE.B(0, 0, 30, 26, 6, 'concrete', -6));
    /* 地下室四周牆 */
    CORE.box(CORE.B(0, -18, 64, 1, 6, 'concrete', -6));
    CORE.box(CORE.B(0, 18, 64, 1, 6, 'concrete', -6));
    CORE.box(CORE.B(-32, 0, 1, 36, 6, 'concrete', -6));
    CORE.box(CORE.B(32, 0, 1, 36, 6, 'concrete', -6));

    /* 樓梯：水泵房 3 條、汽輪機室 1 條、柴油室 1 條、大廳東側 1 條 */
    CORE.stairDown(CORE.boxes, 19, 4.5, 0, -1, 2.4, 12, 0.5, 0.72, 0);
    CORE.stairDown(CORE.boxes, 27, 4.5, 0, -1, 2.4, 12, 0.5, 0.72, 0);
    CORE.stairDown(CORE.boxes, 33, 4.5, 0, -1, 2.4, 12, 0.5, 0.72, 0);
    CORE.stairDown(CORE.boxes, -20, 4.5, 0, -1, 2.4, 12, 0.5, 0.72, 0);
    CORE.stairDown(CORE.boxes, -26, 21, 0, -1, 2.4, 12, 0.5, 0.72, 0);
    CORE.stairDown(CORE.boxes, 11, 6.5, 0, -1, 2.8, 12, 0.5, 0.72, 0);

    /* === 起重機控制台（y 6，大廳北側）=== */
    CORE.box(CORE.B(-7, -16, 12, 3, 0.5, 'metal', 6));
    CORE.box(CORE.B(-9, -15.3, 2.0, 0.7, 1.0, 'metal', 6));
    CORE.equip({ type: 'readout', x: -9, z: -14.9, w: 1.8, h: 0.9, y: 7.25,
      text: ['起重機', '待機'], color: '#ffb347' });
    /* 平台樓梯（大廳西側往上，從南向北升高） */
    for (var st = 0; st < 12; st++) {
      CORE.box(CORE.B(-13.2, -6 - st * 0.7, 1.6, 0.7, 0.5 * (st + 1), 'metal', 0));
    }
    /* 平台第二條樓梯：大廳西側偏中，讓玩家從不同位置都能上二樓 */
    for (var st2 = 0; st2 < 12; st2++) {
      CORE.box(CORE.B(-9.8, -6 - st2 * 0.7, 1.6, 0.7, 0.5 * (st2 + 1), 'metal', 0));
    }
    /* 護欄 */
    CORE.box(CORE.B(-7, -14.5, 12, 0.3, 1, 'metal', 6.5));

    /* === 屋頂板（y=10）=== */
    CORE.box(CORE.B(0, 1, 72, 46, 0.4, 'white', 10));
    /* 屋頂女兒牆：深色邊框蓋住白色屋頂邊緣（原本遠看像懸空長管） */
    CORE.box(CORE.B(0, -22.2, 72.6, 0.6, 0.55, 'metal', 10.4));
    CORE.box(CORE.B(0, 24.2, 72.6, 0.6, 0.55, 'metal', 10.4));
    CORE.box(CORE.B(-36.2, 1, 0.6, 46.6, 0.55, 'metal', 10.4));
    CORE.box(CORE.B(36.2, 1, 0.6, 46.6, 0.55, 'metal', 10.4));
    /* 外部樓梯（混凝土台階 + 金屬扶手柱） */
    function pushStair(x, z0, dir) {
      for (var rt = 0; rt < 20; rt++) {
        var zz = z0 + rt * 0.6 * dir;
        var hh = 0.5 * (rt + 1);
        CORE.box(CORE.B(x, zz, 3.2, 0.8, hh, 'concrete', 0));
        if (rt % 2 === 0) {
          CORE.box(CORE.B(x - 1.5, zz, 0.14, 0.14, 1.0, 'metal', hh));
          CORE.box(CORE.B(x + 1.5, zz, 0.14, 0.14, 1.0, 'metal', hh));
        }
      }
    }
    /* 北側外草地上屋頂 */
    pushStair(2, -34, 1);
    /* 南側外草地上屋頂 */
    pushStair(-30, 37, -1);
    /* 入口旁邊直上屋頂：左右各一條 */
    pushStair(-18, 37, -1);
    pushStair(14, 37, -1);
    /* 屋頂梯子上方的小平台（第 2 條上屋頂的路） */
    CORE.box(CORE.B(8, -21.7, 1.8, 1.6, 0.4, 'metal', 10));
    /* 天台對戰掩體：屋頂上的金屬箱與補給箱 */
    CORE.box(CORE.B(-14, 2, 3, 2, 1.2, 'metal', 10.4));
    CORE.box(CORE.B(14, 2, 3, 2, 1.2, 'metal', 10.4));
    CORE.box(CORE.B(-6, 16, 2, 2, 1.0, 'crate', 10.4));
    CORE.box(CORE.B(6, 16, 2, 2, 1.0, 'crate', 10.4));
    CORE.box(CORE.B(-20, 12, 2, 2, 1.1, 'crate', 10.4));
    CORE.box(CORE.B(20, 12, 2, 2, 1.1, 'crate', 10.4));
    /* 屋頂通風塔 */
    CORE.equip({ type: 'vent', x: -20, z: -8, r: 1.5, h: 3, y: 10.4 });
    CORE.equip({ type: 'vent', x: 20, z: -8, r: 1.5, h: 3, y: 10.4 });
    CORE.equip({ type: 'vent', x: 0, z: -18, r: 1.2, h: 2.4, y: 10.4 });

    /* === 設備：汽輪機室管道 / 變電站 === */
    CORE.equip({ type: 'pipe', x: -30, z: -18, w: 70, h: 0.4, y: 6, ry: 0 });
    /* 變電站（建築東南外） */
    CORE.equip({ type: 'transformer', x: 26, z: 34, w: 4, d: 3, h: 3 });
    CORE.equip({ type: 'transformer', x: 32, z: 34, w: 4, d: 3, h: 3 });
    CORE.equip({ type: 'pylon', x: 38, z: 40 });
    CORE.equip({ type: 'pylon', x: 38, z: 28 });
    /* 紅色高壓線與變電站黃黑警示條 */
    /* 高壓電纜（原本懸空兩條長線會看起來像穿模，移除） */
    CORE.box(CORE.B(29, 36.2, 10, 0.5, 0.12, 'hazard'));
    CORE.box(CORE.B(35.2, 32, 0.5, 8, 0.12, 'hazard'));
    /* 反應堆大廳頂部起重機軌道與方形燈 */
    CORE.equip({ type: 'crane' });

    /* 北側後勤走廊：新的繞後路線，沿牆有紅黑管道 */
    CORE.box(CORE.B(0, -20, 72, 4, 0.04, 'concrete', 0.02));
    CORE.equip({ type: 'pipeRun', x: 0, z: -21.1, len: 26, y: 3.2, ry: 0, color: 'red' });
    CORE.equip({ type: 'pipeRun', x: 0, z: -21.1, len: 26, y: 3.8, ry: 0, color: 'black' });
    CORE.box(CORE.B(0, -18.1, 30, 0.4, 0.12, 'hazard'));

    /* 草叢裝飾 / 沙袋 */
    CORE.equip({ type: 'sandbags', x: -4, z: 34, ry: 0 });
    CORE.equip({ type: 'sandbags', x: 22, z: 32, ry: Math.PI / 2 });
    CORE.equip({ type: 'sandbags', x: -14, z: 33, ry: 0 });
    CORE.equip({ type: 'sandbags', x: 4, z: 12, ry: 0 });
    CORE.equip({ type: 'sandbags', x: -11, z: -16, ry: Math.PI / 2 });
    CORE.equip({ type: 'sandbags', x: 11, z: -16, ry: Math.PI / 2 });

    /* 外圍草地裝飾：核燃料桶、貨櫃、木箱、管道、警示錐 */
    CORE.equip({ type: 'barrel', x: -41, z: 14, color: 'yellow' });
    CORE.equip({ type: 'barrel', x: -39.5, z: 15.6, color: 'yellow' });
    CORE.equip({ type: 'barrel', x: -42, z: 17, color: 'metal' });
    CORE.equip({ type: 'barrel', x: -40, z: 18.5, color: 'red' });
    CORE.equip({ type: 'barrel', x: 41, z: -14, color: 'yellow' });
    CORE.equip({ type: 'barrel', x: 39.5, z: -12.5, color: 'metal' });
    CORE.equip({ type: 'barrel', x: 42, z: -10, color: 'red' });
    CORE.equip({ type: 'barrel', x: -38, z: 41, color: 'yellow' });
    CORE.equip({ type: 'barrel', x: 38, z: 41, color: 'yellow' });
    CORE.equip({ type: 'barrel', x: 34, z: -34, color: 'metal' });
    CORE.equip({ type: 'barrel', x: -34, z: -34, color: 'metal' });
    CORE.equip({ type: 'cone', x: -8, z: 41 });
    CORE.equip({ type: 'cone', x: 8, z: 41 });
    CORE.equip({ type: 'cone', x: 32, z: 41 });
    CORE.equip({ type: 'cone', x: -32, z: 41 });
    CORE.equip({ type: 'cone', x: 43, z: 0 });
    CORE.equip({ type: 'cone', x: -43, z: 0 });
    CORE.box(CORE.B(40, 4, 2.6, 2.6, 2.6, 'metal'));
    CORE.box(CORE.B(-40, -4, 2.6, 2.6, 2.6, 'metal'));
    CORE.box(CORE.B(20, 41, 1.6, 1.6, 1.4, 'crate'));
    CORE.box(CORE.B(-20, 41, 1.6, 1.6, 1.4, 'crate'));
    CORE.box(CORE.B(-38, 34, 1.4, 1.4, 1.2, 'crate'));
    CORE.box(CORE.B(36, 34, 1.4, 1.4, 1.2, 'crate'));
    CORE.box(CORE.B(39, 20, 1.8, 1.2, 1.0, 'crate'));
    CORE.box(CORE.B(-39, -14, 1.8, 1.2, 1.0, 'crate'));
    CORE.equip({ type: 'pipeRun', x: 38, z: 24, len: 5, y: 0.5, ry: Math.PI / 2, color: 'red' });
    CORE.equip({ type: 'pipeRun', x: -38, z: -20, len: 5, y: 0.5, ry: Math.PI / 2, color: 'black' });

    /* === 外圍設施元素：變壓器、儲罐、通風塔、輸電塔、輻射牌 === */
    CORE.equip({ type: 'transformer', x: 30, z: 40, w: 3.4, h: 2.4, d: 2.4 });
    CORE.equip({ type: 'transformer', x: -30, z: -40, w: 3.4, h: 2.4, d: 2.4 });
    CORE.equip({ type: 'tank', x: 42, z: 12, r: 2.0, h: 3.6 });
    CORE.equip({ type: 'tank', x: -42, z: -14, r: 2.0, h: 3.6 });
    CORE.equip({ type: 'vent', x: 0, z: -42, r: 0.9, h: 3.2 });
    CORE.equip({ type: 'vent', x: 0, z: 43, r: 0.9, h: 3.2 });
    CORE.equip({ type: 'pylon', x: 40, z: -40 });
    CORE.equip({ type: 'pylon', x: -40, z: 42 });
    CORE.equip({ type: 'radSign', x: 10, y: 2.4, z: 40, w: 2.0, h: 2.0, ry: 0 });
    CORE.equip({ type: 'radSign', x: -10, y: 2.4, z: -40, w: 2.0, h: 2.0, ry: Math.PI });
    CORE.equip({ type: 'cone', x: 34, z: -40 });
    CORE.equip({ type: 'cone', x: -34, z: 40 });

    /* === 外圍核武展示區（純裝飾）：四件歷史核彈模型 === */
    CORE.equip({ type: 'nuke', kind: 'tsar',    x: -18,  z: -36 });   // RDS-220 沙皇炸彈（北側）
    CORE.equip({ type: 'nuke', kind: 'fatman',  x: 40.5, z: -27 });   // RDS-1 第一閃電（東側）
    CORE.equip({ type: 'nuke', kind: 'missile', x: -41,  z: -31 });   // SS-20 先鋒導彈（西側）
    CORE.equip({ type: 'nuke', kind: 'tactical',x: -40,  z: 38 });    // B-61 戰術核彈（西南角）
    CORE.equip({ type: 'nukeLabel', x: -18, y: 1.15, z: -32.4, ry: 0,               text: 'RDS-220', sub: '沙皇炸彈 1961' });
    CORE.equip({ type: 'nukeLabel', x: 36.2, y: 1.15, z: -27, ry: -Math.PI / 2,     text: 'RDS-1',   sub: '第一閃電 1949' });
    CORE.equip({ type: 'nukeLabel', x: -37.6, y: 1.15, z: -31, ry: Math.PI / 2,     text: 'SS-20',   sub: '先鋒導彈 1976' });
    CORE.equip({ type: 'nukeLabel', x: -40, y: 1.15, z: 35.7, ry: Math.PI,          text: 'B-61',    sub: '戰術核彈 1968' });
      }
  };
})();
