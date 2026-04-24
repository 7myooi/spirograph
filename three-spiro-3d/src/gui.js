import GUI from "lil-gui";
import { AMBIENT_PRESET_OPTIONS } from "./ambient-presets.js";
import {
  COMMON_CURVE_CONTROLS,
  CURVE_MODE_DEFINITIONS,
  CURVE_MODE_OPTIONS,
  MOTION_CURVE_CONTROLS,
} from "./curve-modes.js";

export function createControlPanel({
  guiState,
  isGuiSyncLocked,
  onFocusModeToggle,
  onAmbientPresetChange,
  onShapeControlFinish,
  onBloomChange,
  onTipAppearanceChange,
  onTubeAppearanceChange,
  onAudioToggle,
  onAudioVolumeChange,
  onScheduleRandomize,
  onShowToast,
}) {
  // 日本語ラベルが見切れにくいよう、少し幅を広めに取る。
  const gui = new GUI({ title: "Spiro Controls", width: 380 });
  const guiControllers = [];

  function registerGuiController(controller) {
    guiControllers.push(controller);
    return controller;
  }

  function addShapeControl(folder, control) {
    const controller = registerGuiController(
      folder
        .add(guiState, control.key, control.min, control.max, control.step)
        .name(control.label),
    );

    controller.onFinishChange(() => {
      if (isGuiSyncLocked()) {
        return;
      }

      onShapeControlFinish();
    });

    return controller;
  }

  function addBloomControl(folder, prop, min, max, step, name) {
    const controller = registerGuiController(
      folder.add(guiState, prop, min, max, step).name(name),
    );

    controller.onChange(() => {
      onBloomChange();
    });

    return controller;
  }

  function addTipNumberControl(folder, prop, min, max, step, name) {
    const controller = registerGuiController(
      folder.add(guiState, prop, min, max, step).name(name),
    );

    controller.onChange(() => {
      onTipAppearanceChange();
    });

    return controller;
  }

  function addTipColorControl(folder, prop, name) {
    const controller = registerGuiController(
      folder.addColor(guiState, prop).name(name),
    );

    controller.onChange(() => {
      onTipAppearanceChange();
    });

    return controller;
  }

  function addLiveNumberControl(folder, prop, min, max, step, name, onChange) {
    const controller = registerGuiController(
      folder.add(guiState, prop, min, max, step).name(name),
    );

    controller.onChange(() => {
      onChange();
    });

    return controller;
  }

  function addLiveColorControl(folder, prop, name, onChange) {
    const controller = registerGuiController(
      folder.addColor(guiState, prop).name(name),
    );

    controller.onChange(() => {
      onChange();
    });

    return controller;
  }

  function setControllerVisible(controller, isVisible) {
    if (isVisible) {
      if (typeof controller.show === "function") {
        controller.show();
        return;
      }

      controller.domElement.style.display = "";
      return;
    }

    if (typeof controller.hide === "function") {
      controller.hide();
      return;
    }

    controller.domElement.style.display = "none";
  }

  function setFolderVisible(folder, isVisible) {
    folder.domElement.style.display = isVisible ? "" : "none";
  }

  const focusFolder = gui.addFolder("Focus：集中");
  const shapeFolder = gui.addFolder("Shape：形状");
  const shapeModeFolder = shapeFolder.addFolder("Mode：軌跡モード");
  const shapeCommonFolder = shapeFolder.addFolder("Common：共通");
  const motionFolder = gui.addFolder("Motion：動き");
  const tipFolder = gui.addFolder("Tip：先端発光");
  const tipSizeFolder = tipFolder.addFolder("Size：サイズ");
  const tipPulseFolder = tipFolder.addFolder("Pulse：脈動");
  const tipColorFolder = tipFolder.addFolder("Color：色");
  const bloomFolder = gui.addFolder("Bloom：発光");
  const audioFolder = gui.addFolder("Audio：音");
  const randomFolder = gui.addFolder("Random：ランダム");
  const randomAutoFolder = randomFolder.addFolder("Auto：自動");
  const randomActionFolder = randomFolder.addFolder("Action：操作");
  const randomPresetFolder = randomFolder.addFolder("Preset：保存");

  const shapeModeFolders = new Map(
    CURVE_MODE_DEFINITIONS.map((definition, index) => {
      const folder = shapeFolder.addFolder(definition.folderLabel);
      if (index > 0) {
        folder.close();
      }

      return [definition.key, folder];
    }),
  );
  const shapeTubeFolder = shapeFolder.addFolder("Tube：本体");

  focusFolder.open();
  shapeModeFolder.open();
  shapeCommonFolder.close();
  shapeTubeFolder.close();
  tipPulseFolder.close();
  tipColorFolder.close();
  bloomFolder.close();
  audioFolder.close();
  randomFolder.close();
  randomAutoFolder.close();
  randomPresetFolder.close();

  registerGuiController(
    focusFolder
      .add(guiState, "focusModeEnabled")
      .name("focusModeEnabled：Ambient化"),
  ).onChange(() => {
    onFocusModeToggle();
  });

  registerGuiController(
    focusFolder
      .add(guiState, "ambientPreset", AMBIENT_PRESET_OPTIONS)
      .name("ambientPreset：雰囲気"),
  ).onChange(() => {
    onAmbientPresetChange();
  });

  registerGuiController(
    shapeModeFolder
      .add(guiState, "curveMode", CURVE_MODE_OPTIONS)
      .name("curveMode：モード"),
  ).onChange(() => {
    syncVisibility();
    onShapeControlFinish();
  });

  COMMON_CURVE_CONTROLS.forEach((control) => {
    addShapeControl(shapeCommonFolder, control);
  });

  CURVE_MODE_DEFINITIONS.forEach((definition) => {
    const folder = shapeModeFolders.get(definition.key);
    definition.controls.forEach((control) => {
      addShapeControl(folder, control);
    });
  });

  addLiveNumberControl(
    shapeTubeFolder,
    "tubeRadius",
    0.08,
    0.65,
    0.01,
    "tubeRadius：チューブ半径",
    () => {
      onTubeAppearanceChange(true);
    },
  );

  registerGuiController(
    shapeTubeFolder
      .add(guiState, "tubeColorMode", {
        "Rainbow：虹色": "rainbow",
        "Manual：手動": "manual",
      })
      .name("tubeColorMode：本体色モード"),
  ).onChange(() => {
    onTubeAppearanceChange(false);
    syncVisibility();
  });

  const tubeColorController = addLiveColorControl(
    shapeTubeFolder,
    "tubeColor",
    "tubeColor：本体色",
    () => {
      onTubeAppearanceChange(false);
    },
  );

  addLiveNumberControl(
    shapeTubeFolder,
    "tubeEmissiveIntensity",
    0,
    2.4,
    0.01,
    "tubeEmissiveIntensity：本体発光",
    () => {
      onTubeAppearanceChange(false);
    },
  );

  MOTION_CURVE_CONTROLS.forEach((control) => {
    addShapeControl(motionFolder, control);
  });

  registerGuiController(
    tipFolder
      .add(guiState, "tipColorMode", {
        "Rainbow：虹追従": "rainbow",
        "Manual：手動": "manual",
      })
      .name("colorMode：色モード"),
  ).onChange(() => {
    onTipAppearanceChange();
    syncVisibility();
  });

  addTipNumberControl(
    tipSizeFolder,
    "headSize",
    0.2,
    1.8,
    0.01,
    "headSize：芯サイズ",
  );
  addTipNumberControl(
    tipSizeFolder,
    "glowSize",
    0.4,
    3.8,
    0.01,
    "glowSize：発光サイズ",
  );
  addTipNumberControl(
    tipSizeFolder,
    "haloSize",
    1.4,
    10,
    0.05,
    "haloSize：ハローサイズ",
  );

  const headColorController = addTipColorControl(
    tipColorFolder,
    "headColor",
    "headColor：芯の色",
  );
  const glowColorController = addTipColorControl(
    tipColorFolder,
    "glowColor",
    "glowColor：発光色",
  );
  const haloColorController = addTipColorControl(
    tipColorFolder,
    "haloColor",
    "haloColor：ハロー色",
  );

  addLiveNumberControl(
    tipPulseFolder,
    "pulseSpeed",
    0,
    0.3,
    0.005,
    "pulseSpeed：脈動速度",
    () => {},
  );
  addLiveNumberControl(
    tipPulseFolder,
    "pulseAmount",
    0,
    0.45,
    0.01,
    "pulseAmount：脈動の強さ",
    () => {},
  );

  addBloomControl(
    bloomFolder,
    "bloomStrength",
    0,
    3,
    0.01,
    "bloomStrength：発光の強さ",
  );
  addBloomControl(
    bloomFolder,
    "bloomRadius",
    0,
    2,
    0.01,
    "bloomRadius：にじみの広がり",
  );
  addBloomControl(
    bloomFolder,
    "bloomThreshold",
    0,
    1,
    0.01,
    "bloomThreshold：しきい値",
  );

  registerGuiController(
    audioFolder.add(guiState, "bgmEnabled").name("bgmEnabled：BGM"),
  ).onChange(() => {
    onAudioToggle();
  });

  addLiveNumberControl(
    audioFolder,
    "bgmVolume",
    0,
    1,
    0.01,
    "bgmVolume：音量",
    () => {
      onAudioVolumeChange();
    },
  );

  randomAutoFolder
    .add(guiState, "autoRandomize")
    .name("autoRandomize：自動ランダム")
    .onChange(() => {
      onScheduleRandomize();
      onShowToast(guiState.autoRandomize ? "Auto random on" : "Auto random off");
    });

  randomAutoFolder
    .add(guiState, "randomizeBloom")
    .name("randomizeBloom：Bloomもランダム")
    .onChange(() => {
      onShowToast(
        guiState.randomizeBloom ? "Bloom random on" : "Bloom random off",
      );
    });

  randomAutoFolder
    .add(guiState, "randomizeEveryMs", 2000, 20000, 500)
    .name("randomizeEveryMs：自動ランダム間隔(ms)")
    .onFinishChange(() => {
      onScheduleRandomize();
      onShowToast(`Randomize every ${guiState.randomizeEveryMs}ms`);
    });

  randomActionFolder
    .add(guiState, "randomizeNow")
    .name("randomizeNow：今すぐランダム");
  randomActionFolder.add(guiState, "redraw").name("redraw：再描画");

  randomPresetFolder
    .add(guiState, "copyShareUrl")
    .name("copyShareUrl：共有URLコピー");
  randomPresetFolder
    .add(guiState, "savePreset")
    .name("savePreset：プリセット保存");
  randomPresetFolder
    .add(guiState, "loadPreset")
    .name("loadPreset：プリセット読込");

  const tipManualColorControllers = [
    headColorController,
    glowColorController,
    haloColorController,
  ];
  const tubeManualColorControllers = [tubeColorController];
  const managedFolders = [
    shapeFolder,
    motionFolder,
    tipFolder,
    bloomFolder,
    audioFolder,
    randomFolder,
  ];
  let previousFocusState = guiState.focusModeEnabled;

  function syncVisibility() {
    CURVE_MODE_DEFINITIONS.forEach((definition) => {
      const folder = shapeModeFolders.get(definition.key);
      setFolderVisible(folder, guiState.curveMode === definition.key);
    });

    const tipUsesManualColor = guiState.tipColorMode === "manual";
    tipManualColorControllers.forEach((controller) => {
      setControllerVisible(controller, tipUsesManualColor);
    });

    const tubeUsesManualColor = guiState.tubeColorMode === "manual";
    tubeManualColorControllers.forEach((controller) => {
      setControllerVisible(controller, tubeUsesManualColor);
    });
  }

  function setFocusMode(isFocused) {
    gui.domElement.style.transition = "opacity 180ms ease, transform 180ms ease";
    gui.domElement.style.opacity = isFocused ? "0.92" : "1";
    gui.domElement.style.transform = "scale(1)";

    if (isFocused) {
      if (!previousFocusState) {
        managedFolders.forEach((folder) => folder.close());
        focusFolder.open();
        gui.close();
      }

      previousFocusState = true;
      return;
    }

    if (previousFocusState) {
      gui.open();
    }

    previousFocusState = false;
  }

  function refreshDisplay() {
    guiControllers.forEach((controller) => controller.updateDisplay());
  }

  function setVisible(isVisible) {
    gui.domElement.style.display = isVisible ? "" : "none";
  }

  syncVisibility();
  setFocusMode(guiState.focusModeEnabled);

  return {
    refreshDisplay,
    syncVisibility,
    setFocusMode,
    setVisible,
  };
}
