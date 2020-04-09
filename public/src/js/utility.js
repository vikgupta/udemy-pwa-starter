var dbPromise = idb.open('posts-store', 1, db => {
    if(!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {
            keyPath: 'id'
        });
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