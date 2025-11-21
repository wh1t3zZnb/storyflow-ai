export const createMockImage = (text) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e293b"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="44" font-family="Inter, system-ui">${text || '预览图'}</text></svg>`;
  const base64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : '';
  return `data:image/svg+xml;base64,${base64}`;
};