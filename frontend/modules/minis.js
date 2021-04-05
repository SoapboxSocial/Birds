export function postMessage(key, payload) {
  window.webkit.messageHandlers[key].postMessage(payload);
}
