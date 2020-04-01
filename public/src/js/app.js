var deferredPrompt;

if('serviceWorker' in navigator) {
    navigator.serviceWorker
    .register('/sw.js')
    .then(() => {
        console.log('Service Worker registered');
    })
} else {
    console.log('Service worker is not supported');
}

window.addEventListener('beforeinstallprompt', evt => {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
})