var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

function openCreatePostModal() {
  //createPostArea.style.display = 'block';
  createPostArea.style.transform = 'translateY(0)';
  
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
  //createPostArea.style.display = 'none';
  createPostArea.style.transform = 'translateY(100vh)';
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
  fetch('https://us-central1-pwagram-44966.cloudfunctions.net/storePostData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: "https://firebasestorage.googleapis.com/v0/b/pwagram-44966.appspot.com/o/sf-boat.jpg?alt=media&token=9bbcd33c-a7a1-4d2a-accc-4ba8bd26d1cf"
    })
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
        image: "https://firebasestorage.googleapis.com/v0/b/pwagram-44966.appspot.com/o/sf-boat.jpg?alt=media&token=9bbcd33c-a7a1-4d2a-accc-4ba8bd26d1cf"
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