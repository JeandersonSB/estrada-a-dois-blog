'use client';

export function CookieSettingsButton() {
  const openSettings = () => {
    window.dispatchEvent(new Event('open-cookie-settings'));
  };

  return (
    <button
      type="button"
      onClick={openSettings}
      className="text-xs text-[#AAAAAA] hover:text-white transition-colors underline decoration-[#555555] hover:decoration-white"
    >
      Preferências de Cookies
    </button>
  );
}
