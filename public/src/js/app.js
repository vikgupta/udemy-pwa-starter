var deferredPrompt;
var enableNotifications = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

const displayConfirmNotification = () => {
  if ('serviceWorker' in navigator) {
    // use service worker for showing notifications
    navigator.serviceWorker.ready
    .then(swreg => {
      var options = {
        body: 'You successfully subscribed to the PWAGram notifications',
        icon: '/src/images/icons/app-icon-96x96.png',
        image: '/src/images/sf-boat.jpg',
        dir: 'ltr', // direction is left to right
        lang: 'en-US',
        vibrate: [100, 50, 200],
        badge: '/src/images/icons/app-icon-96x96.png'
      };
      swreg.showNotification('Successfully subscribed', options);
    })
  } else {
    // No service worker support, show direct; though not of much use since it would mean no 'push' support
    var options = {
      body: 'You successfully subscribed to the PWAGram notifications'
    };
    new Notification('Successfully subscribed', options);
  }
}

const askForNotificationPermission = () => {
  Notification.requestPermission(result => {
    console.log('User chose to - ', result);
    if(result !== 'granted') {
      console.log('User denied notifications')
    } else {
      // display the notification
      displayConfirmNotification();
    }
  })
}

if('Notification' in window) {
  for(notificaton of enableNotifications) {
    notificaton.style.display = 'inline-block';
    notificaton.addEventListener('click', askForNotificationPermission)
  }
}
