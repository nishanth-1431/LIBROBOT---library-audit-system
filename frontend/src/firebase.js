import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDgBNmFpbtR5Wb7dHVOftlXle-HNfJD0dU",
    authDomain: "librobot-ec2cf.firebaseapp.com",
    projectId: "librobot-ec2cf",
    storageBucket: "librobot-ec2cf.firebasestorage.app",
    messagingSenderId: "268272991532",
    appId: "1:268272991532:web:f4239b06bdfbdbe725c089",
    measurementId: "G-1PY0KZN4GP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
