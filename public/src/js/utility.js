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