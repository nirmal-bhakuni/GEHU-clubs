const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

const initializeFirebase = () => {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET, 
        });

        console.log('☁️ Firebase Admin SDK Initialized.');
        
        const bucket = admin.storage().bucket();
        return bucket;

    } catch (error) {
        console.error(`🛑 Error initializing Firebase: ${error.message}`);
        return null;
    }
};

const firebaseBucket = initializeFirebase();

module.exports = firebaseBucket;