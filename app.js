// =========================================================
// 1. 導入設定の読み込み＆パスワード認証・ボタン入力（SHA-256）
// =========================================================
const CFG = window.STUDIO_CONFIG || {
  appTitle: "LINE 40-Stamp Motion Studio",
  badgeText: "ステップ式ウィザード・スマホ＆PC対応",
  auth: { enabled: false, passwordHashes: [] },
  defaults: {
    canvasWidth: 370,
    canvasHeight: 320,
    showMarginGuide: true,
    tolerance: 35,
    animationFramesPerStamp: 10,
    defaultCaptionColor: "#1e293b",
    defaultCaptionSize: 32,
    defaultSpeed: 1.0,
    defaultAmp: 1.0
  },
  preset40Pack: Array.from({ length: 40 }, (_, i) => ({ text: `セリフ${i + 1}`, motion: "bounce" }))
};

document.title = CFG.appTitle;
document.getElementById("headerTitle").textContent = CFG.appTitle;
document.getElementById("headerBadge").textContent = CFG.badgeText;

const AUTH_SESSION_KEY = "line40_studio_session_unlocked";
const allowedHashes = Array.isArray(CFG.auth?.passwordHashes)
  ? CFG.auth.passwordHashes.map((h) => String(h).trim().toLowerCase()).filter(Boolean)
  : [];

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hideLockScreen() {
  const el = document.getElementById("lockScreen");
  if (el) el.style.display = "none";
}

function showLockScreen() {
  const el = document.getElementById("lockScreen");
  if (!el) return;
  el.style.display = "flex";
  if (allowedHashes.length === 0) {
    document.getElementById("setupHelper").style.display = "block";
    document.getElementById("lockDesc").textContent = "初回導入時：パスワードハッシュを設定するか、一時利用で開けます";
  } else {
    document.getElementById("setupHelper").style.display = "none";
    document.getElementById("lockDesc").textContent = "専用パスワードを入力してロック解除してください";
  }
}

function openPasswordModal() {
  showLockScreen();
}

function lockApp() {
  if (!CFG.auth?.enabled) return;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  const input = document.getElementById("passInput");
  if (input) input.value = "";
  showLockScreen();
}

function enterTemporarySession() {
  sessionStorage.setItem(AUTH_SESSION_KEY, "1");
  hideLockScreen();
}

function togglePasswordVisibility() {
  const input = document.getElementById("passInput");
  const btn = document.getElementById("togglePassVisBtn");
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (btn) btn.textContent = "🙈";
  } else {
    input.type = "password";
    if (btn) btn.textContent = "👁";
  }
}

function toggleKeypad() {
  const panel = document.getElementById("keypadPanel");
  if (!panel) return;
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function appendPassChar(ch) {
  const input = document.getElementById("passInput");
  if (!input) return;
  input.value += ch;
  document.getElementById("lockError").textContent = "";
}

function backspacePassChar() {
  const input = document.getElementById("passInput");
  if (!input) return;
  input.value = input.value.slice(0, -1);
}

function clearPassInput() {
  const input = document.getElementById("passInput");
  if (!input) return;
  input.value = "";
  document.getElementById("lockError").textContent = "";
}

async function generateSetupHash() {
  const input = document.getElementById("passInput");
  const raw = (input?.value || "").trim();
  const box = document.getElementById("generatedHashBox");
  const errEl = document.getElementById("lockError");
  if (!raw) {
    errEl.textContent = "上の入力欄またはボタン入力でパスワードを入力してください";
    return;
  }
  errEl.textContent = "";
  const hex = await sha256Hex(raw);
  box.style.display = "block";
  box.textContent = `"${hex}"`;
}

async function unlockApp() {
  const input = document.getElementById("passInput");
  const errEl = document.getElementById("lockError");
  const raw = (input?.value || "").trim();

  if (!raw) {
    errEl.style.color = "#f87171";
    errEl.textContent = "パスワードを入力してください";
    return;
  }

  if (allowedHashes.length === 0) {
    await generateSetupHash();
    errEl.style.color = "#a7f3d0";
    errEl.textContent = "ハッシュを生成しました。config.js に貼るか、下のボタンから一時利用できます。";
    return;
  }

  const inputHash = await sha256Hex(raw);
  if (allowedHashes.includes(inputHash)) {
    sessionStorage.setItem(AUTH_SESSION_KEY, "1");
    errEl.textContent = "";
    hideLockScreen();
  } else {
    errEl.style.color = "#f87171";
    errEl.textContent = "パスワードが違います";
  }
}

if (CFG.auth?.enabled) {
  document.getElementById("lockBtn").style.display = "inline-block";
  if (sessionStorage.getItem(AUTH_SESSION_KEY) !== "1") {
    showLockScreen();
  }
}

// =========================================================
// 2. ウィザード（ステップ進行管理）
// =========================================================
let currentStep = 1;
const STEP_HINTS = {
  1: "STEP 1：写真・イラストを読み込んで位置やサイズを調整します",
  2: "STEP 2：背景透過や余白の自動切り抜きを行います",
  3: "STEP 3：40個のセリフとそれぞれの動きを確認・調整します",
  4: "STEP 4：LINE入稿用のZIPファイルとして一括保存します"
};

function goToStep(step) {
  currentStep = Math.max(1, Math.min(4, step));

  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById(`stepPanel${i}`);
    if (panel) panel.classList.toggle("active", i === currentStep);
  }

  document.querySelectorAll(".step-tab").forEach((tab) => {
    const s = Number(tab.dataset.step);
    tab.classList.toggle("active", s === currentStep);
    tab.classList.toggle("done", s < currentStep);
  });

  document.getElementById("prevStepBtn").disabled = currentStep === 1;
  const nextBtn = document.getElementById("nextStepBtn");
  if (currentStep === 4) {
    nextBtn.textContent = "完了（最初へ）";
  } else {
    nextBtn.textContent = "次へ進む ▶";
  }
  document.getElementById("wizardProgressText").textContent = `STEP ${currentStep} / 4`;
  setStatus(STEP_HINTS[currentStep]);
}

function prevStep() {
  if (currentStep > 1) goToStep(currentStep - 1);
}

function nextStep() {
  if (currentStep < 4) {
    goToStep(currentStep + 1);
  } else {
    goToStep(1);
  }
}

// =========================================================
// 3. 外部ライブラリ不要の自前ZIPビルダー（CRC32 + STORE方式）
// =========================================================
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function calcCRC32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZipBlob(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.data;
    const crc = calcCRC32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x0021, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x0021, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], { type: "application/zip" });
}

async function dataUrlToUint8Array(dataUrl) {
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// =========================================================
// 4. 40スロット＆セリフ別モーションエンジン（スマホタッチ完全対応）
// =========================================================
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

canvas.width = CFG.defaults?.canvasWidth || 370;
canvas.height = CFG.defaults?.canvasHeight || 320;
document.getElementById("showMarginGuide").checked = CFG.defaults?.showMarginGuide ?? true;
document.getElementById("tolerance").value = CFG.defaults?.tolerance ?? 35;
document.getElementById("tolVal").textContent = document.getElementById("tolerance").value;

const presetPack = Array.from({ length: 40 }, (_, i) => {
  const item = CFG.preset40Pack?.[i];
  return {
    text: item?.text || `セリフ${i + 1}`,
    motion: item?.motion || "bounce"
  };
});

let slots = Array.from({ length: 40 }, (_, i) => ({
  index: i,
  caption: presetPack[i].text,
  captionColor: CFG.defaults?.defaultCaptionColor || "#1e293b",
  captionSize: CFG.defaults?.defaultCaptionSize || 32,
  motion: presetPack[i].motion,
  speed: CFG.defaults?.defaultSpeed || 1.0,
  amp: CFG.defaults?.defaultAmp || 1.0,
  imgCanvas: null,
  imgX: canvas.width / 2,
  imgY: canvas.height / 2 + 22,
  imgScale: 1.0,
  textX: canvas.width / 2,
  textY: 42
}));

let currentSlotIdx = 0;
let startTime = performance.now();

const activePointers = new Map();
let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let initialPinchDist = 0;
let initialPinchScale = 1.0;

function setStatus(msg) {
  document.getElementById("statusBar").textContent = msg;
}

function syncScaleSlider() {
  const s = slots[currentSlotIdx];
  const pct = Math.round(s.imgScale * 100);
  const slider = document.getElementById("imgScaleRange");
  const label = document.getElementById("imgScaleVal");
  if (slider) slider.value = Math.max(15, Math.min(250, pct));
  if (label) label.textContent = pct + "%";
}

function updateSlotScaleFromSlider(val) {
  const s = slots[currentSlotIdx];
  s.imgScale = Number(val) / 100;
  document.getElementById("imgScaleVal").textContent = val + "%";
}

function renderSlotGrid() {
  const grid = document.getElementById("slotGrid");
  grid.innerHTML = "";
  slots.forEach((s, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn" + (idx === currentSlotIdx ? " active" : "") + (s.imgCanvas ? " has-img" : "");
    const num = String(idx + 1).padStart(2, "0");
    btn.textContent = `${num}:${s.caption || "無題"}`;
    btn.title = `${num}: ${s.caption} (${s.motion})`;
    btn.onclick = () => selectSlot(idx);
    grid.appendChild(btn);
  });
}

function selectSlot(idx) {
  currentSlotIdx = idx;
  const s = slots[idx];
  document.getElementById("currentSlotBadge").textContent = `No.${String(idx + 1).padStart(2, "0")}`;
  document.getElementById("captionInput").value = s.caption;
  document.getElementById("captionColor").value = s.captionColor;
  document.getElementById("captionSize").value = s.captionSize;
  document.getElementById("fontSizeVal").textContent = s.captionSize + "px";
  document.getElementById("speedRange").value = s.speed;
  document.getElementById("speedVal").textContent = s.speed.toFixed(1) + "x";
  document.getElementById("ampRange").value = Math.round(s.amp * 100);
  document.getElementById("ampVal").textContent = Math.round(s.amp * 100) + "%";
  syncScaleSlider();

  document.querySelectorAll(".preset-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.motion === s.motion);
  });
  renderSlotGrid();
}

function prevSlot() { selectSlot((currentSlotIdx + 39) % 40); }
function nextSlot() { selectSlot((currentSlotIdx + 1) % 40); }

function load40PresetPack() {
  slots.forEach((s, i) => {
    s.caption = presetPack[i].text;
    s.motion = presetPack[i].motion;
  });
  selectSlot(currentSlotIdx);
  setStatus("✨ 40セリフ＆最適モーションセットを反映しました！");
}

function applyCurrentImgToAll40() {
  const src = slots[currentSlotIdx];
  if (!src.imgCanvas) return setStatus("先に現在のスロットに画像を読み込んでください");
  slots.forEach((s) => {
    s.imgCanvas = src.imgCanvas;
    s.imgX = src.imgX;
    s.imgY = src.imgY;
    s.imgScale = src.imgScale;
  });
  renderSlotGrid();
  setStatus("📋 現在の画像を全40スロットにコピーしました");
}

function detectMotionFromText(text) {
  if (/ありがとう|よろしく|おつかれ|ペコリ|失礼|お願/.test(text)) return "bow";
  if (/ごめん|すみません|無理|泣|えーん|しょぼ|ちーん|疲/.test(text)) return "droop";
  if (/えっ|うそ|ガーン|驚|急|なんで|！\?|\?!/.test(text)) return "shock";
  if (/了解|うん|なるほど|それな|はい|OK/.test(text)) return "nod";
  if (/大好き|♡|愛|尊|いいね|ガンバレ|応援/.test(text)) return "pulse";
  if (/眠|おやすみ|ほっ|癒|ふわ/.test(text)) return "float";
  if (/最高|神|おめでとう|わーい|やった/.test(text)) return "spin";
  if (/照|ふふ|笑|ワクワク|ぷる/.test(text)) return "jelly";
  if (/またね|まって|ルンルン|〜/.test(text)) return "swing";
  return "bounce";
}

function updateSlotCaption(val) {
  slots[currentSlotIdx].caption = val;
  renderSlotGrid();
}

function autoMatchMotionByText() {
  const s = slots[currentSlotIdx];
  s.motion = detectMotionFromText(s.caption);
  selectSlot(currentSlotIdx);
  setStatus(`「${s.caption}」に合う動き（${s.motion}）を自動選択しました`);
}

function updateSlotStyle() {
  const s = slots[currentSlotIdx];
  s.captionColor = document.getElementById("captionColor").value;
  s.captionSize = Number(document.getElementById("captionSize").value);
}

function updateSlotMotionParams() {
  const s = slots[currentSlotIdx];
  s.speed = Number(document.getElementById("speedRange").value);
  s.amp = Number(document.getElementById("ampRange").value) / 100;
  document.getElementById("speedVal").textContent = s.speed.toFixed(1) + "x";
  document.getElementById("ampVal").textContent = Math.round(s.amp * 100) + "%";
}

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    slots[currentSlotIdx].motion = btn.dataset.motion;
    selectSlot(currentSlotIdx);
  });
});

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => e.preventDefault();
dropZone.ondrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
fileInput.onchange = (e) => handleFiles(e.target.files);

function handleFiles(files) {
  const imgFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
  imgFiles.forEach((file, offset) => {
    const targetIdx = (currentSlotIdx + offset) % 40;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const off = document.createElement("canvas");
        off.width = img.width;
        off.height = img.height;
        off.getContext("2d").drawImage(img, 0, 0);

        const maxW = canvas.width - 30;
        const maxH = canvas.height - 75;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);

        slots[targetIdx].imgCanvas = off;
        slots[targetIdx].imgX = canvas.width / 2;
        slots[targetIdx].imgY = canvas.height / 2 + 22;
        slots[targetIdx].imgScale = scale;
        if (targetIdx === currentSlotIdx) syncScaleSlider();
        renderSlotGrid();
        setStatus(`✅ ${imgFiles.length}枚の画像を読み込みました（「次へ進む」で背景透過へ）`);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function removeBgCanvas(srcCanvas, tolerance) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const c = srcCanvas.getContext("2d");
  const imgData = c.getImageData(0, 0, w, h);
  const d = imgData.data;
  const [tr, tg, tb] = [d[0], d[1], d[2]];
  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.hypot(d[i] - tr, d[i + 1] - tg, d[i + 2] - tb);
    if (dist <= tolerance) d[i + 3] = 0;
  }
  c.putImageData(imgData, 0, 0);
}

function autoRemoveBg() {
  const s = slots[currentSlotIdx];
  if (!s.imgCanvas) return setStatus("先にSTEP 1で画像を読み込んでください");
  removeBgCanvas(s.imgCanvas, Number(document.getElementById("tolerance").value));
  setStatus(`No.${String(currentSlotIdx + 1).padStart(2, "0")} の背景を透過しました`);
}

function autoRemoveBgAll40() {
  const tol = Number(document.getElementById("tolerance").value);
  let count = 0;
  slots.forEach((s) => {
    if (s.imgCanvas) {
      removeBgCanvas(s.imgCanvas, tol);
      count++;
    }
  });
  setStatus(`🪄 画像が入っている ${count} スロットの背景を一括透過しました`);
}

function autoTrimLayer() {
  const s = slots[currentSlotIdx];
  if (!s.imgCanvas) return;
  const w = s.imgCanvas.width, h = s.imgCanvas.height;
  const d = s.imgCanvas.getContext("2d").getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 10) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        found = true;
      }
    }
  }
  if (!found) return;
  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  trimmed.getContext("2d").drawImage(s.imgCanvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  s.imgCanvas = trimmed;
  centerCurrentSlot();
  setStatus("✂️ 余白を切り抜いて中央にフィットしました");
}

function centerCurrentSlot() {
  const s = slots[currentSlotIdx];
  if (!s.imgCanvas) return;
  const maxW = canvas.width - 30;
  const maxH = canvas.height - 75;
  s.imgScale = Math.min(maxW / s.imgCanvas.width, maxH / s.imgCanvas.height);
  s.imgX = canvas.width / 2;
  s.imgY = canvas.height / 2 + 22;
  syncScaleSlider();
}

function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const s = slots[currentSlotIdx];

  if (activePointers.size === 1) {
    const pt = getCanvasCoords(e.clientX, e.clientY);
    if (Math.abs(pt.y - s.textY) < 34 && s.caption) {
      dragTarget = "text";
      dragOffsetX = pt.x - s.textX;
      dragOffsetY = pt.y - s.textY;
    } else {
      dragTarget = "img";
      dragOffsetX = pt.x - s.imgX;
      dragOffsetY = pt.y - s.imgY;
    }
  } else if (activePointers.size === 2) {
    dragTarget = null;
    const pts = Array.from(activePointers.values());
    initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    initialPinchScale = s.imgScale;
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const s = slots[currentSlotIdx];

  if (activePointers.size === 1 && dragTarget) {
    const pt = getCanvasCoords(e.clientX, e.clientY);
    if (dragTarget === "text") {
      s.textX = pt.x - dragOffsetX;
      s.textY = pt.y - dragOffsetY;
    } else {
      s.imgX = pt.x - dragOffsetX;
      s.imgY = pt.y - dragOffsetY;
    }
  } else if (activePointers.size === 2 && initialPinchDist > 0) {
    const pts = Array.from(activePointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    s.imgScale = Math.max(0.15, Math.min(2.5, initialPinchScale * (dist / initialPinchDist)));
    syncScaleSlider();
  }
});

function releasePointer(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) initialPinchDist = 0;
  if (activePointers.size === 0) dragTarget = null;
}
canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const s = slots[currentSlotIdx];
  s.imgScale = Math.max(0.15, Math.min(2.5, s.imgScale * (e.deltaY < 0 ? 1.06 : 0.94)));
  syncScaleSlider();
}, { passive: false });

function calcTransform(motion, progress, amp) {
  const rad = progress * Math.PI * 2;
  let dx = 0, dy = 0, sx = 1, sy = 1, rot = 0;
  switch (motion) {
    case "bounce":
      dy = -Math.abs(Math.sin(rad)) * 20 * amp;
      sy = 1 + Math.sin(rad * 2) * 0.08 * amp;
      sx = 1 - Math.sin(rad * 2) * 0.06 * amp;
      break;
    case "bow":
      rot = Math.max(0, Math.sin(rad)) * 0.34 * amp;
      dy = Math.max(0, Math.sin(rad)) * 12 * amp;
      break;
    case "jelly":
      dx = Math.sin(rad * 4) * 5 * amp;
      rot = Math.sin(rad * 4) * 0.06 * amp;
      break;
    case "shock":
      dx = Math.sin(rad * 8) * 8 * amp;
      dy = Math.cos(rad * 6) * 4 * amp;
      sx = sy = 1 + Math.sin(rad * 2) * 0.07 * amp;
      break;
    case "swing":
      rot = Math.sin(rad) * 0.2 * amp;
      dx = Math.sin(rad) * 9 * amp;
      break;
    case "float":
      dy = Math.sin(rad) * 12 * amp;
      break;
    case "pulse":
      const beat = Math.pow(Math.max(0, Math.sin(rad)), 4);
      sx = sy = 1 + beat * 0.2 * amp;
      break;
    case "nod":
      dy = Math.abs(Math.sin(rad * 2)) * 11 * amp;
      rot = Math.abs(Math.sin(rad * 2)) * 0.12 * amp;
      break;
    case "spin":
      rot = rad;
      dy = -Math.abs(Math.sin(rad)) * 10 * amp;
      break;
    case "droop":
      dy = Math.sin(rad * 0.5) * 10 * amp;
      rot = -0.08 * amp;
      sy = 1 - Math.abs(Math.sin(rad)) * 0.06 * amp;
      break;
  }
  return { dx, dy, sx, sy, rot };
}

function drawSlotToContext(targetCtx, w, h, slot, progress, showGuide) {
  targetCtx.clearRect(0, 0, w, h);
  const scaleRatioX = w / 370;
  const scaleRatioY = h / 320;
  const tf = calcTransform(slot.motion, progress, slot.amp);

  if (slot.imgCanvas) {
    targetCtx.save();
    targetCtx.translate((slot.imgX + tf.dx) * scaleRatioX, (slot.imgY + tf.dy) * scaleRatioY);
    targetCtx.rotate(tf.rot);
    targetCtx.scale(slot.imgScale * tf.sx * scaleRatioX, slot.imgScale * tf.sy * scaleRatioY);
    targetCtx.drawImage(slot.imgCanvas, -slot.imgCanvas.width / 2, -slot.imgCanvas.height / 2);
    targetCtx.restore();
  }

  if (slot.caption) {
    targetCtx.save();
    const fontSize = Math.round(slot.captionSize * scaleRatioY);
    targetCtx.font = `900 ${fontSize}px 'Hiragino Sans', 'Yu Gothic', sans-serif`;
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";
    const tx = (slot.textX + tf.dx * 0.4) * scaleRatioX;
    const ty = (slot.textY + tf.dy * 0.4) * scaleRatioY;
    targetCtx.lineWidth = Math.max(4, fontSize * 0.18);
    targetCtx.strokeStyle = "#ffffff";
    targetCtx.lineJoin = "round";
    targetCtx.strokeText(slot.caption, tx, ty);
    targetCtx.fillStyle = slot.captionColor;
    targetCtx.fillText(slot.caption, tx, ty);
    targetCtx.restore();
  }

  if (showGuide) {
    targetCtx.save();
    targetCtx.strokeStyle = "rgba(239, 68, 68, 0.85)";
    targetCtx.lineWidth = 1.5;
    targetCtx.setLineDash([5, 4]);
    targetCtx.strokeRect(10, 10, w - 20, h - 20);
    targetCtx.restore();
  }
}

function animate(now) {
  const s = slots[currentSlotIdx];
  const progress = (((now - startTime) / 1000) * s.speed) % 1;
  const guide = document.getElementById("showMarginGuide").checked;
  drawSlotToContext(ctx, canvas.width, canvas.height, s, progress, guide);
  requestAnimationFrame(animate);
}
selectSlot(0);
goToStep(1);
requestAnimationFrame(animate);

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportAll40StaticZIP() {
  const [w, h] = document.getElementById("exportSize").value.split("x").map(Number);
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const octx = off.getContext("2d");
  const entries = [];

  setStatus("⏳ 自前ZIPエンジンで40個のPNGを生成中...");
  for (let i = 0; i < 40; i++) {
    drawSlotToContext(octx, w, h, slots[i], 0.25, false);
    const bytes = await dataUrlToUint8Array(off.toDataURL("image/png"));
    entries.push({ name: `${String(i + 1).padStart(2, "0")}.png`, data: bytes });
  }
  const blob = buildZipBlob(entries);
  triggerBlobDownload(blob, "line_stamps_40set.zip");
  setStatus("✅ 40個のPNG（01.png〜40.png）をZIP保存しました！");
}

async function exportAll40AnimationZIP() {
  const [w, h] = document.getElementById("exportSize").value.split("x").map(Number);
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const octx = off.getContext("2d");
  const entries = [];
  const framesPerStamp = Number(CFG.defaults?.animationFramesPerStamp) || 10;

  setStatus(`⏳ 40個×${framesPerStamp}コマを自前ZIPエンジンで生成中...`);
  for (let i = 0; i < 40; i++) {
    const folder = String(i + 1).padStart(2, "0");
    for (let f = 0; f < framesPerStamp; f++) {
      drawSlotToContext(octx, w, h, slots[i], f / framesPerStamp, false);
      const bytes = await dataUrlToUint8Array(off.toDataURL("image/png"));
      entries.push({ name: `${folder}/${String(f + 1).padStart(2, "0")}.png`, data: bytes });
    }
  }
  const blob = buildZipBlob(entries);
  triggerBlobDownload(blob, "line_40_animations_all.zip");
  setStatus(`✅ 40個×${framesPerStamp}コマの連番ZIPを保存しました！`);
}
  document.getElementById("enableKeying").addEventListener("change", e => {
    state.enableKeying = e.target.checked;
    rebuildKeyedImage();
  });

  const tolRange = document.getElementById("toleranceRange");
  tolRange.value = state.tolerance;
  document.getElementById("toleranceVal").textContent = state.tolerance;
  tolRange.addEventListener("input", e => {
    state.tolerance = Number(e.target.value);
    document.getElementById("toleranceVal").textContent = state.tolerance;
    rebuildKeyedImage();
  });

  const marginChk = document.getElementById("showMarginGuide");
  marginChk.checked = state.showMarginGuide;
  marginChk.addEventListener("change", e => {
    state.showMarginGuide = e.target.checked;
  });

  document.getElementById("scaleRange").addEventListener("input", e => {
    state.scale = Number(e.target.value) / 100;
    document.getElementById("scaleVal").textContent = `${e.target.value}%`;
  });

  const speedRange = document.getElementById("speedRange");
  speedRange.value = state.speed;
  document.getElementById("speedVal").textContent = state.speed.toFixed(1);
  speedRange.addEventListener("input", e => {
    state.speed = Number(e.target.value);
    document.getElementById("speedVal").textContent = state.speed.toFixed(1);
  });

  const ampRange = document.getElementById("ampRange");
  ampRange.value = state.amp;
  document.getElementById("ampVal").textContent = state.amp.toFixed(1);
  ampRange.addEventListener("input", e => {
    state.amp = Number(e.target.value);
    document.getElementById("ampVal").textContent = state.amp.toFixed(1);
  });

  const capColor = document.getElementById("captionColor");
  capColor.value = state.captionColor;
  capColor.addEventListener("input", e => {
    state.captionColor = e.target.value;
  });

  const capSize = document.getElementById("captionSize");
  capSize.value = state.captionSize;
  document.getElementById("captionSizeVal").textContent = state.captionSize;
  capSize.addEventListener("input", e => {
    state.captionSize = Number(e.target.value);
    document.getElementById("captionSizeVal").textContent = state.captionSize;
  });

  const framesRange = document.getElementById("framesPerStamp");
  framesRange.value = state.framesPerStamp;
  document.getElementById("framesVal").textContent = state.framesPerStamp;
  framesRange.addEventListener("input", e => {
    state.framesPerStamp = Number(e.target.value);
    document.getElementById("framesVal").textContent = state.framesPerStamp;
  });

  function renderSlotList() {
    const list = document.getElementById("slotList");
    if (!list) return;
    list.innerHTML = "";
    state.slots.forEach((slot, idx) => {
      const card = document.createElement("div");
      card.className = `slot-item${idx === state.selectedSlot ? " selected" : ""}`;
      card.addEventListener("click", () => {
        state.selectedSlot = idx;
        renderSlotList();
      });

      const num = document.createElement("div");
      num.className = "slot-num";
      num.textContent = `#${String(idx + 1).padStart(2, "0")}`;

      const input = document.createElement("input");
      input.type = "text";
      input.value = slot.text;
      input.addEventListener("click", ev => ev.stopPropagation());
      input.addEventListener("input", ev => {
        slot.text = ev.target.value;
      });

      const select = document.createElement("select");
      select.addEventListener("click", ev => ev.stopPropagation());
      MOTIONS.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = MOTION_LABELS[m] || m;
        if (m === slot.motion) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", ev => {
        slot.motion = ev.target.value;
      });

      card.appendChild(num);
      card.appendChild(input);
      card.appendChild(select);
      list.appendChild(card);
    });
  }
  renderSlotList();

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / (rect.width || 1)) * canvas.width,
      y: ((clientY - rect.top) / (rect.height || 1)) * canvas.height
    };
  }

  function

