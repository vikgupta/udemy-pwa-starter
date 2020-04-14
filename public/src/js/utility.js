var dbPromise = idb.open('posts-store', 1, db => {
    // store for caching posts data
    if(!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
    }

    // store for caching new posts till it is sent successfully
    if(!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', { keyPath: 'id' });
    }
});

const writeData = (storeName, data) => {
    return dbPromise
    .then(db => {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        store.put(data);
        return tx.complete;
    });
}

const readAllData = storeName => {
    return dbPromise
    .then(db => {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        return store.getAll();
    });
}

const clearAllData = storeName => {
    return dbPromise
    .then(db => {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        store.clear();
        return tx.complete;
    });
}

const deleteItemFromStore = (storeName, id) => {
    dbPromise
    .then(db => {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        store.delete(id);
        return tx.complete;
    })
    .then(() => {
        console.log('Item deleted from IndexedDB');
    });
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
  
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}