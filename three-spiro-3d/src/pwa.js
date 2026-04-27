export function createPwaController({ onInstalled } = {}) {
  let deferredInstallPrompt = null;

  if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      onInstalled?.();
    });
  }

  async function registerServiceWorker() {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      import.meta.env.DEV
    ) {
      return false;
    }

    try {
      const serviceWorkerUrl = new URL("./sw.js", window.location.href);
      await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: "./",
      });
      return true;
    } catch {
      return false;
    }
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) {
      return {
        available: false,
      };
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    return {
      available: true,
      outcome: choice.outcome,
    };
  }

  async function toggleFullscreen() {
    const rootElement = document.documentElement;
    const requestFullscreen =
      rootElement.requestFullscreen?.bind(rootElement) ?? null;
    const exitFullscreen = document.exitFullscreen?.bind(document) ?? null;

    if (!requestFullscreen || !exitFullscreen) {
      return {
        supported: false,
        fullscreen: false,
      };
    }

    if (document.fullscreenElement) {
      await exitFullscreen();
      return {
        supported: true,
        fullscreen: false,
      };
    }

    await requestFullscreen();
    return {
      supported: true,
      fullscreen: true,
    };
  }

  return {
    registerServiceWorker,
    promptInstall,
    toggleFullscreen,
  };
}
