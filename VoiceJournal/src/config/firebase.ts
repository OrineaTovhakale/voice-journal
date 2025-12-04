import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnhK0nvIjb5xnauHj-XQclGnhSgzxEnOI",
  authDomain: "voicejournal-320d9.firebaseapp.com",
  projectId: "voicejournal-320d9",
  storageBucket: "voicejournal-320d9.firebasestorage.app",
  messagingSenderId: "103506227360",
  appId: "1:103506227360:web:249bb71436b93f028f59c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;