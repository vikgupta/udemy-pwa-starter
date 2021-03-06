var deferredPrompt;
var enableNotifications = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
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
        badge: '/src/images/icons/app-icon-96x96.png',
        tag: 'confirm-notification',
        renotify: true,
        actions: [
          {
            action: 'confirm',
            title: 'OK',
            icon: '/src/images/icons/app-icon-96x96.png'
          },
          {
            action: 'cancel',
            title: 'Cancel',
            icon: '/src/images/icons/app-icon-96x96.png'
          }
        ]
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

const configurePushSub = () => {
  if ('serviceWorker' in navigator) {
    var reg;
    navigator.serviceWorker.ready
    .then(swreg => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(sub => {
      if(sub === null) {
        // create new subscription
        var vapidPublicKey = 'BIzt5vXN9rK9i3fnpA5Zf-t_j1tUXiE_fxetG2qW38g-PGz7NegRaVza0hkjcc8441t353EeUaTAWnaqLdCmhwI';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // we have a subscription
      }
    })
    .then(newSub => {
      return fetch('https://pwagram-44966.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(res => {
      if(res.ok) {
        displayConfirmNotification();
      }
    })
    .catch(err => {
      console.log('Error is - ', err);
    })
  }
}

const askForNotificationPermission = () => {
  Notification.requestPermission(result => {
    console.log('User chose to - ', result);
    if(result !== 'granted') {
      console.log('User denied notifications')
    } else {
      // display the notification
      //displayConfirmNotification();

      configurePushSub();
    }
  })
}

if('Notification' in window) {
  for(notificaton of enableNotifications) {
    notificaton.style.display = 'inline-block';
    notificaton.addEventListener('click', askForNotificationPermission)
  }
}
