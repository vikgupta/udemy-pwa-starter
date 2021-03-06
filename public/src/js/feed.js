var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#video');
var canvasElement = document.querySelector('#canvas');
var imageCaptureBtn = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationButton = document.querySelector('#location-btn');
var spinner = document.querySelector('#location-loader');
var fetchedLocation = {lat: 0, long: 0};

const initializeLocation = () => {
  if(!('geolocation' in navigator)) {
    locationButton.style.display = 'none';
  }
}

locationButton.addEventListener('click', (evt) => {
  locationButton.style.display = 'none';
  spinner.style.display = 'block';

  navigator.geolocation.getCurrentPosition(pos => {
    locationButton.style.display = 'inline';
    spinner.style.display = 'none';
    fetchedLocation = {
      lat: pos.coords.latitude,
      long: pos.coords.longitude
    };  // can use google maps apis can be used to get the location
    locationInput.value = 'Delhi';
    document.querySelector('#manual-location').classList.add('is-focused');
  }, err => {
    console.log('Error in geolocation - ', err);
    locationButton.style.display = 'inline';
    spinner.style.display = 'none';
    alert('Couldn\'t get the location, enter manually');
  }, {
    timeout: 5000
  });
})

const initializeMedia = () => {
  if(!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};  // for browsers that don't support the mediaDevices
  }

  if(!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = constraints => {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if(!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented'));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigatior, constraints, resolve, reject)
      })
    }
  }

  navigator.mediaDevices.getUserMedia({video: true})
  .then(stream => {
    videoPlayer.srcObject = stream;
    videoPlayer.style.display = 'block';
  })
  .catch(err => {
    console.log('Error in getUserMedia - ', err);
    imagePickerArea.style.display = 'block';
  })
}

imageCaptureBtn.addEventListener('click', (evt) => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  imageCaptureBtn.style.display = 'none';
  var context = canvasElement.getContext('2d');
  context.drawImage(
    videoPlayer, 
    0, 0, 
    canvas.width, 
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );

  // Stop the camera
  videoPlayer.srcObject.getVideoTracks().forEach( track => track.stop());

  // get the picture blob
  picture = dataURItoBlob(canvasElement.toDataURL());
})

imagePicker.addEventListener('change', (evt) => {
  picture = evt.target.files[0];
})

function openCreatePostModal() {
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);

  // initialize the camera access
  initializeMedia();

  // initialize the location access
  initializeLocation();
  
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
  locationButton.style.display = 'inline';
  spinner.style.display = 'none';
  imageCaptureBtn.style.display = 'inline';
  if(videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => track.stop());
  }

  setTimeout(() => {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1);
}

// To demonstrate the cache on demand feature - not in use unless save button is enabled
const onSaveButtonClicked = evt => {
  //console.log('Save clicked');
  if('caches' in window) {
    caches.open('user-requested')
    .then(cache => {
      cache.addAll([
        'https://httpbin.org/get',
        '/src/images/sf-boat.jpg'
      ]);
    })
  }
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

const clearCards = () => {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  // cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

const updateUI = data => {
  // clear the cards
  clearCards();

  for(let i = 0; i < data.length; ++i) {
    createCard(data[i]);
  }
}

// Direct cache access to make network call and simultaneously get the resource 
var url = 'https://pwagram-44966.firebaseio.com/posts.json';
var networkDataReceived = false;
fetch(url)
.then(function(res) {
  return res.json();
})
.then(function(data) {
  networkDataReceived = true;
  console.log('From Web - ', data);

  // convert object to array
  var dataArray = [];
  for(var key in data) {
    dataArray.push(data[key]);
  }
  updateUI(dataArray);
});

// Refer the indexedDB
if('indexedDB' in window) {
  readAllData('posts')
  .then(data => {
    if(!networkDataReceived) {
      console.log('From Cache - ', data);
      updateUI(data);
    }
  })
}

const sendData = () => {
  var id = new Date().toISOString();
  var postData = new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('lat', fetchedLocation.lat);
  postData.append('long', fetchedLocation.long);
  postData.append('image', picture, id + '.png');

  fetch('https://us-central1-pwagram-44966.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
  })
  .then(response => {
    console.log('Send Data response - ', response);
    //updateUI();
  })
}

form.addEventListener('submit', evt => {
  evt.preventDefault();

  // check if form has data
  if(titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Title or location is empty!');
    return;
  }

  // close the modal
  closeCreatePostModal();

  // Register sw for syncing
  if('ServiceWorker' in window && 'SyncManager' in window) {
    navigator.serviceWorker.ready
    .then(sw => {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
      };

      // write data to IndexedDB
      writeData('sync-posts', post)
      .then(() => {
        return sw.sync.register('sync-new-posts');
      })
      .then(() => {
        var snackbarContainer = document.querySelector('#confirmation-toast');
        var data = {message: 'Your Post Has Been Saved For Syncing'};
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
      })
      .catch(err => {
        console.log('[Feed] Error in writeData - ', err);
      })
    })
  } else {
    // Service worker or SyncManager is not supported
    sendData();
  }
})