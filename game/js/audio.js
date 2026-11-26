/* audio.js —— 程序化音效引擎（WebAudio，无外部音频文件） */
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var enabled = true;
  var recDest = null;

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);

    // 2 秒白噪声缓存，所有噪声类音效复用
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function resume() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function now() { return ctx.currentTime; }

  /* ---------- 基础构件 ---------- */

  // 噪声爆发：duration 秒，频率滤波与音量包络可调
  function noiseBurst(opts) {
    if (!enabled || !ctx) return;
    var o = opts || {};
    var t = now();
    var dur = o.dur || 0.1;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;

    var filter = ctx.createBiquadFilter();
    filter.type = o.filterType || 'lowpass';
    filter.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(40, o.freqEnd), t + dur);
    filter.Q.value = o.q || 0.7;

    var g = ctx.createGain();
    var vol = o.vol == null ? 0.5 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter); filter.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // 音调：from → to 频率滑音
  function tone(opts) {
    if (!enabled || !ctx) return;
    var o = opts || {};
    var t = now() + (o.delay || 0);
    var dur = o.dur || 0.15;
    var osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.from || 440, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);

    var g = ctx.createGain();
    var vol = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /* ---------- 音效定义 ---------- */

  var W = window;

  W.SFX = {
    resume: resume,

    // 枪声：每类枪有不同频率与尾音
    shot: function (kind) {
      if (!enabled) return;
      if (kind === 'awp') {
        noiseBurst({ dur: 0.42, freq: 2400, freqEnd: 180, vol: 0.85, filterType: 'lowpass' });
        tone({ from: 120, to: 40, dur: 0.36, type: 'triangle', vol: 0.55 });
      } else if (kind === 'rifle') {
        noiseBurst({ dur: 0.20, freq: 3200, freqEnd: 500, vol: 0.62 });
        tone({ from: 180, to: 55, dur: 0.16, type: 'square', vol: 0.28 });
      } else if (kind === 'smg') {
        noiseBurst({ dur: 0.11, freq: 4200, freqEnd: 900, vol: 0.42 });
        tone({ from: 300, to: 120, dur: 0.07, type: 'square', vol: 0.12 });
      } else if (kind === 'shotgun') {
        noiseBurst({ dur: 0.38, freq: 1800, freqEnd: 200, vol: 0.9 });
        tone({ from: 100, to: 35, dur: 0.3, type: 'triangle', vol: 0.5 });
      } else { // pistol
        noiseBurst({ dur: 0.14, freq: 3600, freqEnd: 700, vol: 0.5 });
        tone({ from: 260, to: 90, dur: 0.09, type: 'square', vol: 0.16 });
      }
    },

    dryFire: function () {
      if (!enabled) return;
      tone({ from: 900, to: 700, dur: 0.05, type: 'square', vol: 0.12 });
    },

    paint: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.09, freq: 1800, freqEnd: 500, vol: 0.32, filterType: 'bandpass', q: 1.4 });
      tone({ from: 520, to: 300, dur: 0.09, type: 'triangle', vol: 0.16 });
    },
    paintSplat: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.08, freq: 900, freqEnd: 240, vol: 0.2, filterType: 'lowpass' });
      tone({ from: 340, to: 220, dur: 0.06, type: 'sine', vol: 0.12 });
    },
    glass: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.30, freq: 7000, freqEnd: 2200, vol: 0.4, filterType: 'highpass' });
      tone({ from: 2400, to: 1200, dur: 0.22, type: 'triangle', vol: 0.14 });
      tone({ from: 3100, to: 1800, dur: 0.16, type: 'sine', vol: 0.1, delay: 0.03 });
    },
    celebrate: function () {
      if (!enabled) return;
      tone({ from: 660, dur: 0.07, type: 'square', vol: 0.12 });
      tone({ from: 880, dur: 0.07, type: 'square', vol: 0.12, delay: 0.07 });
      tone({ from: 1180, dur: 0.12, type: 'triangle', vol: 0.12, delay: 0.14 });
    },
    plantTick: function () {
      if (!enabled) return;
      tone({ from: 700, dur: 0.035, type: 'square', vol: 0.07 });
    },

    reloadStart: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.06, freq: 1200, vol: 0.25, filterType: 'bandpass' });
      tone({ from: 500, to: 300, dur: 0.08, type: 'square', vol: 0.08, delay: 0.12 });
    },
    reloadEnd: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.07, freq: 900, vol: 0.3, filterType: 'bandpass' });
      tone({ from: 700, to: 900, dur: 0.05, type: 'square', vol: 0.1, delay: 0.05 });
    },

    hit: function () {
      if (!enabled) return;
      tone({ from: 1200, to: 900, dur: 0.05, type: 'sine', vol: 0.2 });
    },
    headshot: function () {
      if (!enabled) return;
      tone({ from: 1800, to: 1400, dur: 0.09, type: 'sine', vol: 0.3 });
      tone({ from: 2600, to: 2200, dur: 0.07, type: 'triangle', vol: 0.12, delay: 0.02 });
    },
    hurt: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.18, freq: 500, freqEnd: 200, vol: 0.3 });
      tone({ from: 160, to: 90, dur: 0.16, type: 'sawtooth', vol: 0.14 });
    },
    death: function () {
      if (!enabled) return;
      tone({ from: 220, to: 60, dur: 0.7, type: 'sawtooth', vol: 0.2 });
      noiseBurst({ dur: 0.5, freq: 600, freqEnd: 100, vol: 0.25 });
    },

    footstep: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.055, freq: 700, freqEnd: 300, vol: 0.12, filterType: 'bandpass', q: 1.2 });
    },
    footstepLoud: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.09, freq: 520, freqEnd: 180, vol: 0.3, filterType: 'bandpass', q: 1.8 });
      tone({ from: 110, to: 60, dur: 0.07, type: 'sine', vol: 0.1 });
    },
    metalFootstep: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.1, freq: 2600, freqEnd: 900, vol: 0.22, filterType: 'highpass' });
      tone({ from: 720, to: 420, dur: 0.08, type: 'triangle', vol: 0.1 });
    },

    click: function () {
      if (!enabled) return;
      tone({ from: 1000, to: 800, dur: 0.05, type: 'square', vol: 0.1 });
    },
    switchWeapon: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.07, freq: 1400, vol: 0.16, filterType: 'bandpass' });
      tone({ from: 420, to: 620, dur: 0.09, type: 'square', vol: 0.1, delay: 0.05 });
    },
    buy: function () {
      if (!enabled) return;
      tone({ from: 660, to: 880, dur: 0.08, type: 'square', vol: 0.12 });
      tone({ from: 880, to: 1320, dur: 0.1, type: 'square', vol: 0.12, delay: 0.07 });
    },
    deny: function () {
      if (!enabled) return;
      tone({ from: 220, to: 150, dur: 0.18, type: 'square', vol: 0.14 });
    },

    /* 廠區廣播：叮咚 + 無線電底噪（不含人聲，文字由 HUD 顯示） */
    broadcast: function () {
      if (!enabled) return;
      tone({ from: 880, to: 880, dur: 0.16, type: 'triangle', vol: 0.09 });
      tone({ from: 660, to: 660, dur: 0.28, type: 'triangle', vol: 0.09, delay: 0.18 });
      noiseBurst({ dur: 0.8, freq: 1300, freqEnd: 380, vol: 0.028, filterType: 'bandpass', q: 1.1 });
    },
    /* 對講機：短促按鍵聲 + 無線電底噪 */
    radio: function () {
      if (!enabled) return;
      noiseBurst({ dur: 0.055, freq: 2600, freqEnd: 900, vol: 0.07, filterType: 'bandpass', q: 2.0 });
      tone({ from: 1250, to: 950, dur: 0.035, type: 'square', vol: 0.035 });
    },
    /* 警報：低沉兩音，配合紅燈 */
    alarm: function () {
      if (!enabled) return;
      tone({ from: 520, to: 520, dur: 0.30, type: 'square', vol: 0.075 });
      tone({ from: 390, to: 390, dur: 0.42, type: 'square', vol: 0.075, delay: 0.32 });
      noiseBurst({ dur: 0.5, freq: 700, freqEnd: 300, vol: 0.03, filterType: 'lowpass' });
    },

    roundStart: function () {
      if (!enabled) return;
      tone({ from: 520, to: 520, dur: 0.12, type: 'triangle', vol: 0.16 });
      tone({ from: 780, to: 780, dur: 0.22, type: 'triangle', vol: 0.16, delay: 0.16 });
    },
    roundWin: function () {
      if (!enabled) return;
      tone({ from: 523, dur: 0.12, type: 'triangle', vol: 0.18 });
      tone({ from: 659, dur: 0.12, type: 'triangle', vol: 0.18, delay: 0.11 });
      tone({ from: 784, dur: 0.3, type: 'triangle', vol: 0.18, delay: 0.22 });
    },
    roundLose: function () {
      if (!enabled) return;
      tone({ from: 400, dur: 0.16, type: 'sawtooth', vol: 0.14 });
      tone({ from: 300, dur: 0.16, type: 'sawtooth', vol: 0.14, delay: 0.14 });
      tone({ from: 200, dur: 0.4, type: 'sawtooth', vol: 0.14, delay: 0.28 });
    },

    /* 錄影用：把 master 分流到 MediaStream，讓 MediaRecorder 錄遊戲原聲 */
    getCaptureStream: function () {
      init();
      if (!ctx) return null;
      if (!recDest) {
        recDest = ctx.createMediaStreamDestination();
        master.connect(recDest);
        /* 極低音量振盪器：讓錄音串流持續有資料，避免 MediaRecorder 在安靜時停住 */
        var keep = ctx.createOscillator();
        keep.frequency.value = 30;
        var keepGain = ctx.createGain();
        keepGain.gain.value = 0.00001;
        keep.connect(keepGain);
        keepGain.connect(recDest);
        keep.start();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return recDest.stream;
    },

    toggle: function (on) { enabled = on; },
    isEnabled: function () { return enabled; }
  };
})();
