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

const askForNotificationPermission = () => {
  Notification.requestPermission(result => {
    console.log('User chose to - ', result);
    if(result !== 'granted') {
      console.log('User denied notifications')
    } else {
      // display the notification
    }
  })
}

if('Notification' in window) {
  for(notificaton of enableNotifications) {
    notificaton.style.display = 'inline-block';
    notificaton.addEventListener('click', askForNotificationPermission)
  }
}
