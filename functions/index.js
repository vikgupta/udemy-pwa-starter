const functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webPush = require('web-push');
var fs = require('fs');
var UUID = require('uuid-v4');
var os = require("os");
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var gcConfig = {
    projectId: 'pwagram-44966',
    keyFilename: 'firebase-admin-key.json'
}
var gcs = require('@google-cloud/storage')(gcConfig);

var serviceAccount = require("./firebase-admin-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-44966.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        var uuid = UUID();
        const busboy = new Busboy({ headers: request.headers });
        // These objects will store the values (file + fields) extracted from busboy
        let upload;
        const fields = {};

        // This callback will be invoked for each file uploaded
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
            const filepath = path.join(os.tmpdir(), filename);
            upload = { file: filepath, type: mimetype };
            file.pipe(fs.createWriteStream(filepath));
        });

        // This will be invoked on every field detected
        busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
            fields[fieldname] = val;
        });

        // This callback will be invoked after all uploaded files are saved.
        busboy.on("finish", () => {
            var bucket = gcs.bucket('pwagram-44966.appspot.com');
            bucket.upload(upload.file, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: upload.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }, (err, file) => {
                if(!err) {
                    // save entries to db as file upload was successful
                    admin.database().ref('posts').push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        lat: fields.lat,
                        long: fields.long,
                        image: 'https://firebasestorage.googleapis.com/v0/b/' + 
                                bucket.name + 
                                '/o/' + 
                                encodeURIComponent(file.name) + 
                                '?alt=media&token=' + uuid
                    })
                    .then(() => {
                        webPush.setVapidDetails(
                            'mailto:guptavikalp@gmail.com', 
                            'BIzt5vXN9rK9i3fnpA5Zf-t_j1tUXiE_fxetG2qW38g-PGz7NegRaVza0hkjcc8441t353EeUaTAWnaqLdCmhwI', 
                            'pdywiLQF-EGy3UfV0HvM425ohLf9VXKMgHGS8FDBYik');
            
                        return admin.database().ref('subscriptions').once('value')
                    })
                    .then(subscriptions => {
                        subscriptions.forEach(sub => {
                            var pushConfig = {
                                endpoint: sub.val().endpoint,
                                keys: {
                                    auth: sub.val().keys.auth,
                                    p256dh : sub.val().keys.p256dh
                                }
                            }
                            webPush.sendNotification(pushConfig, JSON.stringify({
                                title: 'New Post',
                                content: 'New Post Added',
                                openUrl: '/'
                            }))
                            .catch(err => {
                                console.log(err)
                            })
                        })
                        response.status(201).json({message: 'Data stored', id: fields.id});
                    })
                    .catch(err => {
                        response.status(500).json({error: err})
                    })
                } else {
                    console.log(err);
                }
            });
        });

        // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
        // a callback when it's finished.
        busboy.end(request.rawBody);
    })
});
