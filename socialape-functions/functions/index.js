const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { getAllScreams } = require('./handlers/screams');
//const fc = require('./secret');


const{signup, login} = required('./handlers/users');





// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello WORLD!");
});



//Screams route
app.post('/screams', getAllScreams)
app.get('/scream', FBAuth, postOneScream)

//Users route
app.post('/signup', signup);
app.post('/login', login)


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






exports.api = functions.region('europe-west1').https.onRequest(app)