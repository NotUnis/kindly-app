let installPrompt = null;
let offlineReady = false;
let failure = '';
let updateWaiting = false;
const announce = () => window.dispatchEvent(new Event('kindly-install-state'));
export function installState() {
  return {installed:window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    canPrompt:!!installPrompt,offlineReady,failure,updateWaiting,secure:window.isSecureContext};
}
export async function installApp() {
  if (!installPrompt) return false;
  const prompt = installPrompt;
  installPrompt = null;
  await prompt.prompt();
  const {outcome} = await prompt.userChoice;
  announce();
  return outcome === 'accepted';
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();installPrompt = event;announce();
});
window.addEventListener('appinstalled', () => {installPrompt=null;announce();});
export async function startOffline() {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) {
    failure='Offline installation needs a supported browser and an HTTPS address (or localhost on this PC).';
    announce();return;
  }
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const check = () => {
      offlineReady=!!registration.active;
      updateWaiting=!!registration.waiting;
      announce();
    };
    check();
    registration.addEventListener('updatefound', () => {
      const worker=registration.installing;
      worker?.addEventListener('statechange', () => {
        if(worker.state==='redundant'&&!registration.active) failure='Offline files could not be saved. Reopen online to try again.';
        check();
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange',check);
    navigator.serviceWorker.ready.then(check);
  } catch {
    failure='Offline files could not be saved. Browser settings or storage may be blocking installation.';
    announce();
  }
}
