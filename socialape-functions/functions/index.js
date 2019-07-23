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

const FBAuth = (req, res, next) => {
    if (req.headers.authorization && req.headres.authorization.startWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];

    } else {
        console.error('No token found')
        return res.status(403).json({ error: 'Unauthorized' });
    }

    admin.auth().verifyIdToken(idToken).then(decodeToken => {
        req.user = decodeToken;
        console.log(decodeToken);
        return db.collection('users').where('userId', '==', req.user.uid).limit(1).get();
    }).then(data => {
        req.user.handle = data.docs[0].data().handle;
        return next();
    }).catch(err => {
        console.error('Error while veryfiyng token', err);
        return res.status(403).json(err);
    })
}

app.get('/screams', FBAuth, (req, res) => {
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

const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}
const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
};

app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    let errors = {};

    if (isEmpty(newUser.email)) {
        error.email = 'Must not be empty'

    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address'
    }

    if (isEmpty(newUser.email))
        error.email = 'Must not be empty'

    if (newUser.password !== newUser.confirmPassword) errors.password = 'Password must match'

    if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }
    let token, userId;

    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: `this handle is alredy taken` })
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        }).then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        }).then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createAt: new Date().toISOString(),
                userId
            };
            db.doc(`/users/${newUser.handle}`).set(userCredentials);
        }).then(() => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use' });
            }
            else {
                return res.status(500).json({ error: err.code });
            }
        })

})

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if (isEmpty(user.email)) errors.email = 'Must not be empty';
    if (isEmpty(user.password)) errors.password = 'Must not be empty';

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(data => {
        return data.user.getIdToken();
    }).then(token => {
        return res.json({ token });
    }).catch(err => {
        console.error(err)
        if (err.code === 'auth/wrong-password') {
            return res.status(403).json({ general: 'Wrong creadential, pleas try again' })
        }
        else
            return res.status(500).json({ errors: err.code });
    });
})

exports.api = functions.region('europe-west1').https.onRequest(app)