/* phone-view.js - a Three Columns class feature, 19 September 2026.

   A "Phone view" button opens this page inside a phone-sized frame, at the real CSS widths of
   common phones and a small tablet, so the phone layout can be checked from a desktop browser.
   What shows in the frame is the page itself at that width: its own breakpoints decide the
   layout, exactly as on the device.

   - Uses the page's own button with id="phoneview" if it has one; otherwise adds a small
     floating button at the bottom right.
   - Hidden on screens that are already phone-sized, inside the frame itself, and in print.
   - Same file in every instance. Change it in Three Columns Tools/template first, then copy it
     out to the sites, so the class and the instances never drift apart. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;

  // Inside the viewer's own frame: no button and no second viewer.
  var framed;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed) {
    var own = doc.getElementById('phoneview');
    if (own) own.hidden = true;
    return;
  }

  // CSS viewport sizes, portrait.
  var DEVICES = [
    { name: 'Galaxy S23',        w: 360, h: 780 },
    { name: 'iPhone SE',         w: 375, h: 667 },
    { name: 'iPhone 15',         w: 393, h: 852 },
    { name: 'iPhone 15 Pro Max', w: 430, h: 932 },
    { name: 'iPad mini',         w: 744, h: 1133, tablet: true }
  ];
  var current = 2;

  var css =
    '#phoneview[hidden],.pv-overlay[hidden]{display:none!important}' +
    'button.pv-float{position:fixed;right:18px;bottom:18px;z-index:900;cursor:pointer;margin:0;' +
      'font:600 12px/1 "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;letter-spacing:.05em;' +
      'padding:10px 14px;border-radius:999px;border:1px solid #1E1B16;' +
      'background:#1E1B16;color:#FCFAF5;box-shadow:0 4px 14px rgba(0,0,0,.22)}' +
    'button.pv-float:hover{background:#000;border-color:#000;color:#FCFAF5}' +
    'button.pv-float:focus-visible{outline:2px solid #C8992F;outline-offset:2px}' +
    '@media (max-width:700px){#phoneview{display:none!important}}' +
    '@media print{#phoneview,.pv-overlay{display:none!important}}' +
    '.pv-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;' +
      'align-items:center;gap:12px;padding:14px 16px 16px;background:rgba(18,16,12,.88);' +
      'font:500 12px/1.2 "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;color:#EDE7DA}' +
    '.pv-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;max-width:100%}' +
    '.pv-bar button{font:inherit;letter-spacing:.02em;cursor:pointer;margin:0;color:#EDE7DA;' +
      'background:transparent;border:1px solid rgba(237,231,218,.4);border-radius:999px;padding:7px 11px}' +
    '.pv-bar button:hover{border-color:#EDE7DA;color:#EDE7DA}' +
    '.pv-bar button[aria-pressed="true"]{background:#EDE7DA;color:#1E1B16;border-color:#EDE7DA}' +
    '.pv-bar button:focus-visible{outline:2px solid #C8992F;outline-offset:2px}' +
    '.pv-bar .pv-close{margin-left:10px}' +
    '.pv-size{color:#B9B2A4;margin-left:6px;font-variant-numeric:tabular-nums}' +
    '.pv-stage{flex:1;min-height:0;width:100%;display:flex;justify-content:center;overflow:hidden}' +
    '.pv-device{flex:none;background:#0E0D0B;border-radius:48px;padding:14px;transform-origin:top center;' +
      'box-shadow:0 0 0 1px rgba(255,255,255,.1),0 24px 60px rgba(0,0,0,.55)}' +
    '.pv-device.pv-tablet{border-radius:30px;padding:20px}' +
    '.pv-screen{display:block;border:0;border-radius:34px;background:#fff}' +
    '.pv-device.pv-tablet .pv-screen{border-radius:12px}';
  var style = doc.createElement('style');
  style.id = 'pv-style';
  style.textContent = css;
  (doc.head || root).appendChild(style);

  var btn = doc.getElementById('phoneview');
  if (!btn) {
    btn = doc.createElement('button');
    btn.id = 'phoneview';
    btn.className = 'pv-float';
    btn.textContent = 'Phone view';
    doc.body.appendChild(btn);
  }
  btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.title = 'See this page at phone and tablet widths';

  var overlay, stage, device, frame, sizeLabel, devButtons = [], lastFocus = null, prevOverflow = '';

  function build() {
    overlay = doc.createElement('div');
    overlay.className = 'pv-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Phone view');

    var bar = doc.createElement('div');
    bar.className = 'pv-bar';
    DEVICES.forEach(function (d, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.textContent = d.name + ' · ' + d.w;
      b.addEventListener('click', function () { show(i); });
      devButtons.push(b);
      bar.appendChild(b);
    });
    sizeLabel = doc.createElement('span');
    sizeLabel.className = 'pv-size';
    bar.appendChild(sizeLabel);
    var close = doc.createElement('button');
    close.type = 'button';
    close.className = 'pv-close';
    close.textContent = 'Close ×';
    close.addEventListener('click', hide);
    bar.appendChild(close);

    stage = doc.createElement('div');
    stage.className = 'pv-stage';
    device = doc.createElement('div');
    device.className = 'pv-device';
    frame = doc.createElement('iframe');
    frame.className = 'pv-screen';
    frame.title = 'This page at phone width';
    device.appendChild(frame);
    stage.appendChild(device);

    overlay.appendChild(bar);
    overlay.appendChild(stage);
    // A click on the dark backdrop, not on the phone or the buttons, closes the viewer.
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === stage) hide();
    });
    doc.body.appendChild(overlay);
    window.addEventListener('resize', function () { if (!overlay.hidden) fit(); });
  }

  // Scale the whole phone down when it is taller or wider than the window. The page inside
  // keeps the device's real width, so its layout is unchanged; only the picture shrinks.
  function fit() {
    var d = DEVICES[current], pad = d.tablet ? 20 : 14;
    var s = Math.min(1, stage.clientWidth / (d.w + 2 * pad), stage.clientHeight / (d.h + 2 * pad));
    device.style.transform = 'scale(' + s + ')';
  }

  function show(i) {
    current = i;
    var d = DEVICES[i];
    frame.style.width = d.w + 'px';
    frame.style.height = d.h + 'px';
    device.classList.toggle('pv-tablet', !!d.tablet);
    devButtons.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    sizeLabel.textContent = d.w + ' × ' + d.h;
    fit();
  }

  function open() {
    if (!overlay) build();
    lastFocus = doc.activeElement;
    if (!frame.getAttribute('src')) frame.src = location.href.split('#')[0];
    overlay.hidden = false;
    prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    show(current);
    devButtons[current].focus();
  }

  function hide() {
    overlay.hidden = true;
    root.style.overflow = prevOverflow;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  btn.addEventListener('click', open);
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && !overlay.hidden) { e.preventDefault(); hide(); }
  });
})();
