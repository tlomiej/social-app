const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

//const fc = require('./secret');


const firebaseConfig = {
    apiKey: "AIzaSyDQtNbPHtS9LZfZcgthFhd1VPZkW8jR7FA",
    authDomain: "socialape-5a865.firebaseapp.com",
    databaseURL: "https://socialape-5a865.firebaseio.com",
    projectId: "socialape-5a865",
    storageBucket: "socialape-5a865.appspot.com",
    messagingSenderId: "764981075186",
    appId: "1:764981075186:web:3a4fcd5db836912a"
};

admin.initializeApp();


const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello WORLD!");
});


app.get('/screams', (req, res) => {
    db.collection('screams').orderBy('createAt', 'desc').get().then((data) => {
        let screams = [];
        data.forEach((doc) => {
            screams.push(
                {
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createAt: new Date().toISOString()
                }
            )
        })
        return res.json(screams);
    }).
        catch(err => { console.error(err) });
})

/* exports.getScreams = functions.https.onRequest((req, res) => {
    admin.firestore().collection('screams').get().then((data) => {
        let screams = [];
        data.forEach((doc) => {
            screams.push(doc.data())
        })
        return res.json(screams);
    }).
        catch(err => { console.error(err) });
}) */

app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createAt: new Date().toISOString()
    };
    db.collection('screams').add(newScream).then(doc => {
        res.json({ message: `Documnet ${doc.id} created sucessfully` })
    }).catch(err => {
        res.status(500).json({ error: `something went wrong  ${err}` })
        console.error(err)
    })

})

app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if (doc.exists) {
            return res.status(400).json({ handle: `this handle is alredy taken` })
        } else {
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    }).then(data => {
        return data.user.getIdToken();
    }).then(token => {
        return res.status(201).json({ token })
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code })
    })

})

exports.api = functions.region('europe-west1').https.onRequest(app)