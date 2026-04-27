import {
  COMMON_CURVE_CONTROLS,
  CURVE_MODE_DEFINITIONS,
  MOTION_CURVE_CONTROLS,
} from "./curve-modes.js";

const CURVE_MODE_OPTIONS = [
  { value: "spiro", label: "Spiro：スピロ" },
  { value: "lissajous", label: "Lissajous：リサージュ" },
  { value: "lorenz", label: "Lorenz：ローレンツ" },
];

const AMBIENT_OPTIONS = [
  { value: "calm", label: "Calm：静か" },
  { value: "deep", label: "Deep：深め" },
  { value: "cosmic", label: "Cosmic：宇宙" },
  { value: "drift", label: "Drift：漂う" },
];

const CONTROL_LABELS = {
  turns: "turns：周回数",
  step: "step：点の細かさ",
  zAmp: "zAmp：高さの強さ",
  zFreq: "zFreq：高さの波数",
  spinX: "spinX：X回転速度",
  spinY: "spinY：Y回転速度",
  drawSpeed: "drawSpeed：描画速度",
  R: "R：大円半径",
  r: "r：小円半径",
  d: "d：ペン位置",
  lissajousAmpX: "lissajousAmpX：X振幅",
  lissajousAmpY: "lissajousAmpY：Y振幅",
  lissajousFreqX: "lissajousFreqX：X周波数",
  lissajousFreqY: "lissajousFreqY：Y周波数",
  lissajousPhase: "lissajousPhase：位相",
  lorenzSigma: "lorenzSigma：σ",
  lorenzRho: "lorenzRho：ρ",
  lorenzBeta: "lorenzBeta：β",
  lorenzDt: "lorenzDt：時間刻み",
  lorenzScale: "lorenzScale：拡大率",
  bloomStrength: "bloomStrength：発光の強さ",
  bloomRadius: "bloomRadius：にじみの広がり",
  pulseSpeed: "pulseSpeed：脈動速度",
  pulseAmount: "pulseAmount：脈動の強さ",
  bgmVolume: "bgmVolume：音量",
};

function ensureMobileUiStyle() {
  if (document.getElementById("spiro-mobile-ui-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "spiro-mobile-ui-style";
  style.textContent = `
    .spiro-mobile-ui {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: none;
      pointer-events: none;
      font-family: "Segoe UI", "Hiragino Sans", "Yu Gothic UI", sans-serif;
    }

    .spiro-mobile-ui[data-visible="true"] {
      display: block;
    }

    .spiro-mobile-ui__backdrop {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top, rgba(99, 161, 255, 0.16), transparent 38%),
        rgba(3, 8, 18, 0.58);
      opacity: 0;
      pointer-events: none;
      transition: opacity 180ms ease;
    }

    .spiro-mobile-ui[data-open="true"] .spiro-mobile-ui__backdrop {
      opacity: 1;
      pointer-events: auto;
    }

    .spiro-mobile-ui__toggle {
      position: absolute;
      right: 16px;
      bottom: calc(18px + env(safe-area-inset-bottom));
      border: 0;
      border-radius: 999px;
      padding: 12px 16px;
      background:
        linear-gradient(135deg, rgba(18, 35, 86, 0.94), rgba(12, 18, 42, 0.96));
      color: #eef5ff;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.34);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.02em;
      pointer-events: auto;
    }

    .spiro-mobile-ui[data-focus="true"] .spiro-mobile-ui__toggle {
      opacity: 0.88;
    }

    .spiro-mobile-ui__sheet {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      max-height: min(78vh, 760px);
      padding:
        14px 14px calc(22px + env(safe-area-inset-bottom))
        14px;
      border-top-left-radius: 22px;
      border-top-right-radius: 22px;
      background:
        linear-gradient(180deg, rgba(10, 18, 38, 0.96), rgba(4, 9, 20, 0.98));
      box-shadow: 0 -18px 42px rgba(0, 0, 0, 0.42);
      overflow: auto;
      transform: translateY(calc(100% + 24px));
      transition: transform 220ms ease;
      pointer-events: auto;
    }

    .spiro-mobile-ui[data-open="true"] .spiro-mobile-ui__sheet {
      transform: translateY(0);
    }

    .spiro-mobile-ui__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      color: #edf4ff;
    }

    .spiro-mobile-ui__title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .spiro-mobile-ui__hint {
      margin-top: 4px;
      color: rgba(218, 230, 255, 0.74);
      font-size: 11px;
      line-height: 1.45;
    }

    .spiro-mobile-ui__close {
      border: 0;
      border-radius: 999px;
      width: 34px;
      height: 34px;
      background: rgba(255, 255, 255, 0.08);
      color: #eef5ff;
      font-size: 18px;
    }

    .spiro-mobile-ui__section {
      margin-top: 10px;
      border: 1px solid rgba(162, 190, 255, 0.12);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.04);
      overflow: hidden;
    }

    .spiro-mobile-ui__section summary {
      cursor: pointer;
      list-style: none;
      padding: 14px 16px;
      color: #f2f7ff;
      font-size: 14px;
      font-weight: 700;
    }

    .spiro-mobile-ui__section summary::-webkit-details-marker {
      display: none;
    }

    .spiro-mobile-ui__section-body {
      padding: 0 14px 14px;
    }

    .spiro-mobile-ui__control {
      display: grid;
      gap: 8px;
      padding: 12px 2px;
      border-top: 1px solid rgba(162, 190, 255, 0.08);
    }

    .spiro-mobile-ui__control:first-child {
      border-top: 0;
    }

    .spiro-mobile-ui__label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: #edf4ff;
      font-size: 13px;
    }

    .spiro-mobile-ui__value {
      color: rgba(180, 214, 255, 0.92);
      font-variant-numeric: tabular-nums;
      font-size: 12px;
    }

    .spiro-mobile-ui__select,
    .spiro-mobile-ui__range,
    .spiro-mobile-ui__checkbox {
      width: 100%;
    }

    .spiro-mobile-ui__select {
      border: 1px solid rgba(158, 189, 255, 0.18);
      border-radius: 12px;
      padding: 10px 12px;
      background: rgba(5, 11, 26, 0.78);
      color: #eef5ff;
      font-size: 14px;
    }

    .spiro-mobile-ui__range {
      accent-color: #7db3ff;
    }

    .spiro-mobile-ui__toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .spiro-mobile-ui__toggle-row label {
      color: #edf4ff;
      font-size: 13px;
      font-weight: 600;
    }

    .spiro-mobile-ui__checkbox {
      width: 22px;
      height: 22px;
      accent-color: #7db3ff;
    }

    .spiro-mobile-ui__actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      padding-top: 12px;
    }

    .spiro-mobile-ui__button {
      border: 1px solid rgba(144, 183, 255, 0.16);
      border-radius: 14px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.06);
      color: #eef5ff;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
    }

    .spiro-mobile-ui__button--primary {
      background:
        linear-gradient(135deg, rgba(51, 95, 255, 0.28), rgba(17, 28, 76, 0.76));
    }
  `;

  document.head.appendChild(style);
}

function formatControlValue(step, value) {
  const numericValue = Number(value);

  if (step >= 1) {
    return `${Math.round(numericValue)}`;
  }

  if (step >= 0.1) {
    return numericValue.toFixed(1);
  }

  if (step >= 0.01) {
    return numericValue.toFixed(2);
  }

  if (step >= 0.001) {
    return numericValue.toFixed(3);
  }

  return numericValue.toFixed(4);
}

function createSection(title, isOpen = false, testId = "") {
  const details = document.createElement("details");
  details.className = "spiro-mobile-ui__section";
  if (testId) {
    details.dataset.testid = testId;
  }
  details.open = isOpen;

  const summary = document.createElement("summary");
  summary.textContent = title;
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "spiro-mobile-ui__section-body";
  details.appendChild(body);

  return { details, body };
}

function createToggleControl({
  mount,
  guiState,
  prop,
  label,
  onChange,
  testId = prop,
}) {
  const row = document.createElement("div");
  row.className = "spiro-mobile-ui__control";
  row.dataset.testid = `control-${testId}`;

  const toggleRow = document.createElement("div");
  toggleRow.className = "spiro-mobile-ui__toggle-row";

  const text = document.createElement("label");
  text.textContent = label;
  toggleRow.appendChild(text);

  const input = document.createElement("input");
  input.className = "spiro-mobile-ui__checkbox";
  input.type = "checkbox";
  input.checked = Boolean(guiState[prop]);
  toggleRow.appendChild(input);

  input.addEventListener("change", () => {
    guiState[prop] = input.checked;
    onChange();
  });

  row.appendChild(toggleRow);
  mount.appendChild(row);

  return {
    refresh() {
      input.checked = Boolean(guiState[prop]);
    },
  };
}

function createSelectControl({
  mount,
  guiState,
  prop,
  label,
  options,
  onChange,
  testId = prop,
}) {
  const row = document.createElement("div");
  row.className = "spiro-mobile-ui__control";
  row.dataset.testid = `control-${testId}`;

  const labelRow = document.createElement("div");
  labelRow.className = "spiro-mobile-ui__label-row";
  labelRow.textContent = label;
  row.appendChild(labelRow);

  const select = document.createElement("select");
  select.className = "spiro-mobile-ui__select";

  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  });

  select.value = guiState[prop];
  select.addEventListener("change", () => {
    guiState[prop] = select.value;
    onChange();
  });

  row.appendChild(select);
  mount.appendChild(row);

  return {
    refresh() {
      select.value = guiState[prop];
    },
  };
}

function createRangeControl({
  mount,
  guiState,
  prop,
  label,
  min,
  max,
  step,
  onInput,
  onChange,
  testId = prop,
}) {
  const row = document.createElement("div");
  row.className = "spiro-mobile-ui__control";
  row.dataset.testid = `control-${testId}`;

  const labelRow = document.createElement("div");
  labelRow.className = "spiro-mobile-ui__label-row";

  const text = document.createElement("span");
  text.textContent = label;
  labelRow.appendChild(text);

  const value = document.createElement("span");
  value.className = "spiro-mobile-ui__value";
  labelRow.appendChild(value);

  const input = document.createElement("input");
  input.className = "spiro-mobile-ui__range";
  input.type = "range";
  input.min = `${min}`;
  input.max = `${max}`;
  input.step = `${step}`;

  function syncFromState() {
    input.value = `${guiState[prop]}`;
    value.textContent = formatControlValue(step, guiState[prop]);
  }

  input.addEventListener("input", () => {
    guiState[prop] = Number(input.value);
    value.textContent = formatControlValue(step, guiState[prop]);

    if (onInput) {
      onInput();
    }
  });

  input.addEventListener("change", () => {
    guiState[prop] = Number(input.value);

    if (onChange) {
      onChange();
    }
  });

  syncFromState();
  row.appendChild(labelRow);
  row.appendChild(input);
  mount.appendChild(row);

  return {
    row,
    refresh: syncFromState,
  };
}

function createActionButtonRow(buttons) {
  const row = document.createElement("div");
  row.className = "spiro-mobile-ui__actions";

  buttons.forEach((buttonConfig) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `spiro-mobile-ui__button ${buttonConfig.primary ? "spiro-mobile-ui__button--primary" : ""}`.trim();
    if (buttonConfig.testId) {
      button.dataset.testid = buttonConfig.testId;
    }
    button.textContent = buttonConfig.label;
    button.addEventListener("click", buttonConfig.onClick);
    row.appendChild(button);
  });

  return row;
}

export function createMobileControlPanel({
  guiState,
  onFocusModeToggle,
  onAmbientPresetChange,
  onShapeControlFinish,
  onBloomChange,
  onAudioToggle,
  onAudioVolumeChange,
  onScheduleRandomize,
  onShowToast,
}) {
  ensureMobileUiStyle();

  const root = document.createElement("div");
  root.className = "spiro-mobile-ui";
  root.dataset.testid = "mobile-ui";
  root.dataset.open = "false";
  root.dataset.visible = "false";
  root.dataset.focus = "false";

  const backdrop = document.createElement("div");
  backdrop.className = "spiro-mobile-ui__backdrop";
  root.appendChild(backdrop);

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "spiro-mobile-ui__toggle";
  toggleButton.dataset.testid = "mobile-ui-toggle";
  toggleButton.textContent = "調整";
  root.appendChild(toggleButton);

  const sheet = document.createElement("div");
  sheet.className = "spiro-mobile-ui__sheet";
  sheet.dataset.testid = "mobile-ui-sheet";
  root.appendChild(sheet);

  const header = document.createElement("div");
  header.className = "spiro-mobile-ui__header";

  const titleWrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = "spiro-mobile-ui__title";
  title.textContent = "Mobile：操作パネル";
  titleWrap.appendChild(title);

  const hint = document.createElement("div");
  hint.className = "spiro-mobile-ui__hint";
  hint.textContent = "スマホではよく触る項目を絞って表示しています。";
  titleWrap.appendChild(hint);
  header.appendChild(titleWrap);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "spiro-mobile-ui__close";
  closeButton.textContent = "×";
  header.appendChild(closeButton);
  sheet.appendChild(header);

  const ambientSection = createSection("Ambient：雰囲気", true);
  const shapeSection = createSection("Shape：形状", true);
  const motionSection = createSection("Motion：動き");
  const lightSection = createSection("Light：発光");
  const audioSection = createSection("Audio：音");
  const actionSection = createSection("Actions：操作");

  sheet.append(
    ambientSection.details,
    shapeSection.details,
    motionSection.details,
    lightSection.details,
    audioSection.details,
    actionSection.details,
  );

  const refreshers = [];
  const modeControlGroups = new Map();
  let previousFocusState = guiState.focusModeEnabled;

  function setOpen(isOpen) {
    root.dataset.open = isOpen ? "true" : "false";
  }

  function registerRefresher(control) {
    refreshers.push(control);
    return control;
  }

  toggleButton.addEventListener("click", () => {
    setOpen(root.dataset.open !== "true");
  });

  closeButton.addEventListener("click", () => {
    setOpen(false);
  });

  backdrop.addEventListener("click", () => {
    setOpen(false);
  });

  registerRefresher(
    createToggleControl({
      mount: ambientSection.body,
      guiState,
      prop: "focusModeEnabled",
      label: "Focus：集中",
      onChange: () => {
        onFocusModeToggle();
      },
    }),
  );

  registerRefresher(
    createSelectControl({
      mount: ambientSection.body,
      guiState,
      prop: "ambientPreset",
      label: "ambientPreset：雰囲気",
      options: AMBIENT_OPTIONS,
      onChange: () => {
        onAmbientPresetChange();
      },
    }),
  );

  registerRefresher(
    createToggleControl({
      mount: ambientSection.body,
      guiState,
      prop: "autoRandomize",
      label: "autoRandomize：自動ランダム",
      onChange: () => {
        onScheduleRandomize();
        onShowToast(guiState.autoRandomize ? "Auto random on" : "Auto random off");
      },
    }),
  );

  registerRefresher(
    createToggleControl({
      mount: ambientSection.body,
      guiState,
      prop: "autoDriftEnabled",
      label: "autoDriftEnabled：自動ドリフト",
      onChange: () => {
        onScheduleRandomize();
        onShowToast(guiState.autoDriftEnabled ? "Auto drift on" : "Auto drift off");
      },
    }),
  );

  registerRefresher(
    createRangeControl({
      mount: ambientSection.body,
      guiState,
      prop: "autoDriftEveryMs",
      label: "autoDriftEveryMs：切替間隔(ms)",
      min: 15000,
      max: 180000,
      step: 5000,
      onChange: () => {
        onScheduleRandomize();
        onShowToast(`Drift every ${guiState.autoDriftEveryMs}ms`);
      },
    }),
  );

  registerRefresher(
    createSelectControl({
      mount: shapeSection.body,
      guiState,
      prop: "curveMode",
      label: "curveMode：モード",
      options: CURVE_MODE_OPTIONS,
      onChange: () => {
        syncVisibility();
        onShapeControlFinish();
      },
    }),
  );

  COMMON_CURVE_CONTROLS.forEach((control) => {
    registerRefresher(
      createRangeControl({
        mount: shapeSection.body,
        guiState,
        prop: control.key,
        label: CONTROL_LABELS[control.key] ?? control.label,
        min: control.min,
        max: control.max,
        step: control.step,
        onChange: () => {
          onShapeControlFinish();
        },
      }),
    );
  });

  CURVE_MODE_DEFINITIONS.forEach((definition) => {
    const group = document.createElement("div");
    shapeSection.body.appendChild(group);
    modeControlGroups.set(definition.key, group);

    definition.controls.forEach((control) => {
      registerRefresher(
        createRangeControl({
          mount: group,
          guiState,
          prop: control.key,
          label: CONTROL_LABELS[control.key] ?? control.label,
          min: control.min,
          max: control.max,
          step: control.step,
          onChange: () => {
            onShapeControlFinish();
          },
        }),
      );
    });
  });

  MOTION_CURVE_CONTROLS.forEach((control) => {
    registerRefresher(
      createRangeControl({
        mount: motionSection.body,
        guiState,
        prop: control.key,
        label: CONTROL_LABELS[control.key] ?? control.label,
        min: control.min,
        max: control.max,
        step: control.step,
        onChange: () => {
          onShapeControlFinish();
        },
      }),
    );
  });

  registerRefresher(
    createRangeControl({
      mount: lightSection.body,
      guiState,
      prop: "bloomStrength",
      label: CONTROL_LABELS.bloomStrength,
      min: 0,
      max: 3,
      step: 0.01,
      onInput: () => {
        onBloomChange();
      },
      onChange: () => {
        onBloomChange();
      },
    }),
  );

  registerRefresher(
    createRangeControl({
      mount: lightSection.body,
      guiState,
      prop: "bloomRadius",
      label: CONTROL_LABELS.bloomRadius,
      min: 0,
      max: 2,
      step: 0.01,
      onInput: () => {
        onBloomChange();
      },
      onChange: () => {
        onBloomChange();
      },
    }),
  );

  registerRefresher(
    createRangeControl({
      mount: lightSection.body,
      guiState,
      prop: "pulseSpeed",
      label: CONTROL_LABELS.pulseSpeed,
      min: 0,
      max: 0.3,
      step: 0.005,
    }),
  );

  registerRefresher(
    createRangeControl({
      mount: lightSection.body,
      guiState,
      prop: "pulseAmount",
      label: CONTROL_LABELS.pulseAmount,
      min: 0,
      max: 0.45,
      step: 0.01,
    }),
  );

  registerRefresher(
    createToggleControl({
      mount: audioSection.body,
      guiState,
      prop: "bgmEnabled",
      label: "bgmEnabled：BGM",
      onChange: () => {
        onAudioToggle();
      },
    }),
  );

  registerRefresher(
    createRangeControl({
      mount: audioSection.body,
      guiState,
      prop: "bgmVolume",
      label: CONTROL_LABELS.bgmVolume,
      min: 0,
      max: 1,
      step: 0.01,
      onInput: () => {
        onAudioVolumeChange();
      },
      onChange: () => {
        onAudioVolumeChange();
      },
    }),
  );

  actionSection.body.appendChild(
    createActionButtonRow([
      {
        label: "今すぐランダム",
        primary: true,
        onClick: () => {
          guiState.randomizeNow();
          refreshDisplay();
        },
      },
      {
        label: "再描画",
        onClick: () => {
          guiState.redraw();
          refreshDisplay();
        },
      },
      {
        label: "共有URLコピー",
        onClick: () => {
          guiState.copyShareUrl();
        },
      },
      {
        label: "プリセット保存",
        onClick: () => {
          guiState.savePreset();
        },
      },
      {
        label: "全画面",
        onClick: () => {
          void guiState.toggleFullscreen();
        },
      },
      {
        label: "アプリ追加",
        onClick: () => {
          void guiState.installApp();
        },
      },
      {
        label: "プリセット読込",
        onClick: () => {
          guiState.loadPreset();
          refreshDisplay();
        },
      },
    ]),
  );

  function syncVisibility() {
    modeControlGroups.forEach((group, modeKey) => {
      group.style.display = guiState.curveMode === modeKey ? "" : "none";
    });
  }

  function refreshDisplay() {
    refreshers.forEach((control) => control.refresh());
    syncVisibility();
  }

  function setFocusMode(isFocused) {
    root.dataset.focus = isFocused ? "true" : "false";

    if (isFocused && !previousFocusState) {
      setOpen(false);
    }

    previousFocusState = isFocused;
  }

  function setVisible(isVisible) {
    root.dataset.visible = isVisible ? "true" : "false";

    if (!isVisible) {
      setOpen(false);
    }
  }

  syncVisibility();
  setFocusMode(guiState.focusModeEnabled);
  document.body.appendChild(root);

  return {
    refreshDisplay,
    syncVisibility,
    setFocusMode,
    setVisible,
  };
}
