import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs, getDoc,
    doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    getAuth, signInWithPopup, signOut, onAuthStateChanged,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBQb7_ssZA7XzxNu9aliXwutehInCq-Wf0",
    authDomain: "jhing-price-calculator.firebaseapp.com",
    projectId: "jhing-price-calculator",
    storageBucket: "jhing-price-calculator.firebasestorage.app",
    messagingSenderId: "1030340102397",
    appId: "1:1030340102397:web:e96c69e106f17de0ae1694",
    measurementId: "G-J6BDRVZTNY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Auth functions ---
window.firebaseAuth = {
    auth,
    signInWithGoogle: () => signInWithPopup(auth, googleProvider),
    signOut: () => signOut(auth),
    onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback)
};

class ProductDB {
    constructor() {
        const params = new URLSearchParams(window.location.search);
        const dbParam = params.get('db');
        this.collectionName = dbParam ? dbParam : 'products';
    }

    async open() {
        // Firestore is ready once initialized
    }

    async add(product) {
        product.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, this.collectionName), product);
        product.id = docRef.id;
        return product.id;
    }

    async getAll() {
        const snapshot = await getDocs(collection(db, this.collectionName));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    async get(id) {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    }

    async update(product) {
        const { id, ...data } = product;
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, data);
        return product;
    }

    async delete(id) {
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
    }

    async clearAll() {
        const snapshot = await getDocs(collection(db, this.collectionName));
        const deletePromises = snapshot.docs.map(d =>
            deleteDoc(doc(db, this.collectionName, d.id))
        );
        await Promise.all(deletePromises);
    }
}

window.productDB = new ProductDB();