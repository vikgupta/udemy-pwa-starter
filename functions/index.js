const functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webPush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./firebase-admin-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-44966.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
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
                    openUrl: '/help'
                }))
                .catch(err => {
                    console.log(err)
                })
            })
            response.status(201).json({message: 'Data stored', id: request.body.id});
        })
        .catch(err => {
            response.status(500).json({error: err})
        })
    })
});
