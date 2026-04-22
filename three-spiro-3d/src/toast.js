export function createToast() {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.right = "16px";
  toast.style.bottom = "16px";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "999px";
  toast.style.border = "1px solid rgba(120, 160, 255, 0.24)";
  toast.style.background = "rgba(10, 14, 28, 0.78)";
  toast.style.color = "#d9e7ff";
  toast.style.fontFamily = "system-ui, sans-serif";
  toast.style.fontSize = "13px";
  toast.style.lineHeight = "1";
  toast.style.backdropFilter = "blur(10px)";
  toast.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.24)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(10px)";
  toast.style.transition = "opacity 180ms ease, transform 180ms ease";
  toast.style.pointerEvents = "none";
  document.body.appendChild(toast);

  let timeoutId = null;

  // DOM の詳細を触らなくても、他の処理から通知だけ出せる小さな関数を返す。
  return function showToast(message) {
    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 1600);
  };
}
