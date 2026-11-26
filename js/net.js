/* net.js —— 連線介面預留（V2 仍是單機，先把 host/join/快照介面固定下來）
 *
 * 之後要接 WebSocket / WebRTC 時，只要替換 NET 內部的 transport，
 * game.js 只需要在每個固定 tick 呼叫 NET.pushSnapshot()，並在
 * 收到遠端快照時呼叫 NET.onSnapshot 回呼即可。
 */
(function () {
  'use strict';

  var NET = {
    version: 2,
    enabled: false,          // 本版固定 false：單機
    status: 'offline',       // offline | hosting | joining | connected | error
    room: null,
    peers: 0,
    tickRate: 20,            // 之後同步用的固定 tick（每秒 20 次）
    lastSnapshot: null,
    onSnapshot: null,

    isAvailable: function () { return false; },

    host: function () {
      NET.status = 'error';
      return { ok: false, reason: 'V2 為單機版，連線功能尚未啟用（介面已預留）' };
    },

    join: function () {
      NET.status = 'error';
      return { ok: false, reason: 'V2 為單機版，連線功能尚未啟用（介面已預留）' };
    },

    leave: function () {
      NET.status = 'offline';
      NET.room = null;
      NET.peers = 0;
    },

    /* 壓成可傳輸的狀態；之後換成二進位或 delta 都可以 */
    pushSnapshot: function (state) {
      NET.lastSnapshot = state;
      return state;
    },

    applySnapshot: function (snap) {
      NET.lastSnapshot = snap;
      if (typeof NET.onSnapshot === 'function') NET.onSnapshot(snap);
    }
  };

  window.NET = NET;
})();
