const DEFAULT_BGM_PATH = "audio/bgm.mp3";
const DEFAULT_AUDIO_PROFILE = {
  playbackRate: 1,
  lowpassFrequency: 18000,
  highShelfGain: 0,
  masterGain: 1,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveAssetUrl(relativePath) {
  const pageUrl = new URL(window.location.href);
  pageUrl.hash = "";
  return new URL(`${import.meta.env.BASE_URL}${relativePath}`, pageUrl).toString();
}

export function createAmbientAudioController({ onStarted } = {}) {
  let audioElement = null;
  let audioContext = null;
  let mediaSourceNode = null;
  let lowpassNode = null;
  let highShelfNode = null;
  let masterGainNode = null;
  let bgmEnabled = false;
  let bgmVolume = 0.32;
  let audioProfile = { ...DEFAULT_AUDIO_PROFILE };
  let sourceCandidates = [DEFAULT_BGM_PATH];
  let activeSourceIndex = 0;
  let userActivated = false;
  let waitingForGesture = false;
  let missingFile = false;
  let hasStarted = false;

  function getResolvedActiveSource() {
    return resolveAssetUrl(sourceCandidates[activeSourceIndex] ?? DEFAULT_BGM_PATH);
  }

  function ensureAudioElement() {
    if (audioElement !== null) {
      return audioElement;
    }

    const nextAudio = new Audio(getResolvedActiveSource());
    nextAudio.loop = true;
    nextAudio.preload = "auto";
    nextAudio.volume = clamp(bgmVolume, 0, 1);

    nextAudio.addEventListener("error", () => {
      if (activeSourceIndex < sourceCandidates.length - 1) {
        activeSourceIndex += 1;
        nextAudio.src = getResolvedActiveSource();
        nextAudio.load();
        return;
      }

      missingFile = true;
    });

    nextAudio.addEventListener("canplay", () => {
      missingFile = false;
    });

    audioElement = nextAudio;
    return audioElement;
  }

  function ensureAudioGraph() {
    const nextAudio = ensureAudioElement();

    if (audioContext !== null) {
      return;
    }

    const ContextConstructor =
      window.AudioContext ?? window.webkitAudioContext;

    if (!ContextConstructor) {
      return;
    }

    audioContext = new ContextConstructor();
    mediaSourceNode = audioContext.createMediaElementSource(nextAudio);

    lowpassNode = audioContext.createBiquadFilter();
    lowpassNode.type = "lowpass";

    highShelfNode = audioContext.createBiquadFilter();
    highShelfNode.type = "highshelf";
    highShelfNode.frequency.value = 2400;

    masterGainNode = audioContext.createGain();

    mediaSourceNode.connect(lowpassNode);
    lowpassNode.connect(highShelfNode);
    highShelfNode.connect(masterGainNode);
    masterGainNode.connect(audioContext.destination);
  }

  function applyAudioProfile() {
    const nextAudio = ensureAudioElement();
    nextAudio.playbackRate = clamp(audioProfile.playbackRate, 0.7, 1.25);

    if (lowpassNode !== null) {
      lowpassNode.frequency.value = clamp(
        audioProfile.lowpassFrequency,
        300,
        20000,
      );
    }

    if (highShelfNode !== null) {
      highShelfNode.gain.value = clamp(audioProfile.highShelfGain, -12, 12);
    }

    if (masterGainNode !== null) {
      masterGainNode.gain.value = clamp(audioProfile.masterGain, 0.2, 1.8);
    }
  }

  function applyVolume() {
    if (audioElement === null) {
      return;
    }

    audioElement.volume = clamp(bgmVolume, 0, 1);
  }

  function syncAudioSource(nextPaths = [DEFAULT_BGM_PATH]) {
    const normalizedPaths =
      Array.isArray(nextPaths) && nextPaths.length > 0
        ? nextPaths
        : [DEFAULT_BGM_PATH];

    const nextPrimarySource = normalizedPaths[0];
    const currentPrimarySource = sourceCandidates[0];
    sourceCandidates = normalizedPaths;

    if (nextPrimarySource === currentPrimarySource && audioElement !== null) {
      return;
    }

    activeSourceIndex = 0;
    missingFile = false;

    const nextAudio = ensureAudioElement();
    const wasPlaying = !nextAudio.paused;
    nextAudio.pause();
    nextAudio.src = getResolvedActiveSource();
    nextAudio.load();

    if (wasPlaying && bgmEnabled && userActivated) {
      void nextAudio.play().catch(() => {
        missingFile = true;
      });
    }
  }

  async function syncPlayback() {
    const nextAudio = ensureAudioElement();
    applyVolume();
    applyAudioProfile();

    if (!bgmEnabled) {
      waitingForGesture = false;
      nextAudio.pause();
      return {
        available: true,
        awaitingGesture: false,
        running: false,
        missingFile,
      };
    }

    if (!userActivated) {
      waitingForGesture = true;
      return {
        available: true,
        awaitingGesture: true,
        running: false,
        missingFile,
      };
    }

    ensureAudioGraph();
    applyAudioProfile();

    if (audioContext !== null && audioContext.state === "suspended") {
      await audioContext.resume();
    }

    try {
      await nextAudio.play();
      waitingForGesture = false;
      missingFile = false;

      if (!hasStarted) {
        hasStarted = true;
        onStarted?.();
      }

      return {
        available: true,
        awaitingGesture: false,
        running: true,
        missingFile: false,
      };
    } catch {
      return {
        available: true,
        awaitingGesture: false,
        running: false,
        missingFile: true,
      };
    }
  }

  function handleUserGesture() {
    if (userActivated) {
      return;
    }

    userActivated = true;
    void syncPlayback();
  }

  window.addEventListener("pointerdown", handleUserGesture, { passive: true });
  window.addEventListener("keydown", handleUserGesture, { passive: true });
  window.addEventListener("touchstart", handleUserGesture, { passive: true });

  return {
    syncState: async ({ enabled, volume, profile, paths }) => {
      bgmEnabled = enabled;
      bgmVolume = volume;
      audioProfile = {
        ...DEFAULT_AUDIO_PROFILE,
        ...(profile ?? {}),
      };
      syncAudioSource(paths);
      return syncPlayback();
    },
  };
}
