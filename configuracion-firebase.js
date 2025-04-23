
const firebaseConfig = {
  apiKey: "AIzaSyAKoDtHyAwjVd02M-MjcuQ0awoIDxhvJKc",
  authDomain: "donativos-patronato-zacualpan.firebaseapp.com",
  projectId: "donativos-patronato-zacualpan",
  storageBucket: "donativos-patronato-zacualpan.appspot.com",
  messagingSenderId: "173840953766",
  appId: "1:173840953766:web:efb9fb08ecb93f69989f67"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
