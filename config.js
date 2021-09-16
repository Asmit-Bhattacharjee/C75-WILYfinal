import * as firebase from 'firebase'
require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyBP7wViqhG1kpyiGTSklhdZFN_rlaD3-V8",
    authDomain: "wily-app-d1707.firebaseapp.com",
    projectId: "wily-app-d1707",
    databaseURL: "https://willy-app-f2f57.firebaseio.com",
    storageBucket: "wily-app-d1707.appspot.com",
    messagingSenderId: "591173452643",
    appId: "1:591173452643:web:22b0a7b1bf57ed2e624956"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase.firestore();