// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfd2AooteuQHu4CAWe60Rj2K275KO3WBw",
  authDomain: "parc-info-norsys.firebaseapp.com",
  projectId: "parc-info-norsys",
  storageBucket: "parc-info-norsys.firebasestorage.app",
  messagingSenderId: "178925587936",
  appId: "1:178925587936:web:9e0025a27cf893746f2f85",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db =getFirestore(app);