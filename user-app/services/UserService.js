import BaseService from "./BaseService";
import { collection, query, where, limit, getDocs, startAfter, doc, getDoc } from '@react-native-firebase/firestore';

class UserService extends BaseService {
    #collection;

    constructor(collectionName) {
        super(collectionName);
        this.#collection = collectionName; 
    }

    /**
     * Fetch users with the role 'USER' and support pagination for infinite scroll.
     * 
     * @param {number} limit - Number of users to fetch per request (for pagination)
     * @param {DocumentSnapshot} lastVisible - The last document from the previous fetch for pagination
     * @returns {Promise<Object>} - Object containing users data and a reference to the last document
     */
    async getUsers(pageSize = 20, lastVisible = null) {
        try {
            // Build query to show active users (statusShow = true); do not require online status
            let q = query(
                collection(this.db, this.#collection),
                where('role', '==', 'USER'),
                where('isDeleted', '==', false),
                where('statusShow', '==', true),
                limit(pageSize)
            );

            // Pagination if lastVisible provided
            if (lastVisible) {
                q = query(q, startAfter(lastVisible));
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { users: [], lastVisible: null };
            }

            // Map and filter out users with missing or empty phoneNumber
            const users = snapshot.docs
            .map(doc => this.fromFirestore(doc))
            .filter(user => 
                user.phoneNumber?.trim() && 
                user.name?.trim() &&
                user.statusShow === true
            );

            const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

            return {
                users,
                lastVisible: lastVisibleDoc,
            };
        } catch (error) {
            console.error("Error fetching users:", error);
            return this.handleError("Failed to fetch users.");
        }
    }

    async getOnlineUsers(pageSize = 20, lastVisible = null) {
        try {
            // Online users: require both statusShow and isOnline
            let q = query(
                collection(this.db, this.#collection),
                where('role', '==', 'USER'),
                where('statusShow', '==', true),
                where('isOnline', '==', true),
                where('isDeleted', '==', false),
                limit(pageSize)
            );

             if (lastVisible) {
                q = query(q, startAfter(lastVisible));
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return { users: [], lastVisible: null }; // No more users to fetch
            }

            // Map the users to a format
            const users = snapshot.docs
                .map(doc => this.fromFirestore(doc))
                .filter(user => 
                    user.phoneNumber?.trim() && 
                    user.name?.trim() &&
                    user.statusShow === true &&
                    user.isOnline === true
                );
            const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

            return {
                users,
                lastVisible: lastVisibleDoc, // Provide the last document for the next page
            };
        } catch (error) {
            console.error('Error fetching online users:', error);
            throw error; // Or handle error as needed
        }
    }

    /**
     * Fetch ALL online users in a single query (no pagination).
     * Intended for cases where we want the full online roster at once.
     */
    async getAllOnlineUsers() {
        try {
            const q = query(
                collection(this.db, this.#collection),
                where('role', '==', 'USER'),
                where('statusShow', '==', true),
                where('isOnline', '==', true),
                where('isDeleted', '==', false)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { users: [], lastVisible: null };
            }

            const users = snapshot.docs
                .map(doc => this.fromFirestore(doc))
                .filter(user => 
                    user.phoneNumber?.trim() && 
                    user.name?.trim() &&
                    user.statusShow === true &&
                    user.isOnline === true
                );

            return { users, lastVisible: null };
        } catch (error) {
            console.error('Error fetching all online users:', error);
            throw error;
        }
    }

    async getAllActiveUsers(pageSize = 20, lastVisible = null) {
        try {
            // Get all active users regardless of online status
            let q = query(
                collection(this.db, this.#collection),
                where('role', '==', 'USER'),
                where('isDeleted', '==', false),
                where('statusShow', '==', true),
                limit(pageSize)
            );

            if (lastVisible) {
                q = query(q, startAfter(lastVisible));
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return { users: [], lastVisible: null };
            }

            const users = snapshot.docs
                .map(doc => this.fromFirestore(doc))
                .filter(user => 
                    user.phoneNumber?.trim() && 
                    user.name?.trim() &&
                    user.statusShow === true
                );
            
            const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

            return {
                users,
                lastVisible: lastVisibleDoc,
            };
        } catch (error) {
            console.error('Error fetching all active users:', error);
            throw error;
        }
    }

    async testUserFetch() {
        try {
            console.log('Testing user fetch...');
            console.log('Database instance:', !!this.db);
            console.log('Collection:', this.#collection);
            
            // Try to get any users without filters first
            let q = query(
                collection(this.db, this.#collection),
                limit(5)
            );
            
            const snapshot = await getDocs(q);
            console.log('Raw snapshot size:', snapshot.size);
            
            if (!snapshot.empty) {
                const sampleUser = snapshot.docs[0];
                console.log('Sample user data:', sampleUser.data());
            }
            
            return { success: true, count: snapshot.size };
        } catch (error) {
            console.error('Test user fetch error:', error);
            return { success: false, error: error.message };
        }
    }

    async getOfflineUsers(pageSize, lastVisible) {
        try {
            let q = query(
                collection(this.db, this.#collection),
                where('role', '==', 'USER'),
                where('statusShow', '==', false)
            ); // orderBy moved below

            if (lastVisible) {
                q = query(q, startAfter(lastVisible));
            }

            // Note: If ordering is required, add orderBy before limit
            q = query(q, limit(pageSize));

            const snapshot = await getDocs(q);

            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Get the last document for the next pagination
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];

            return { users, lastVisible: lastDoc };
        } catch (error) {
            console.error('Error fetching offline users:', error);
            throw error; // Or handle error as needed
        }
    }

    /**
     * Fetches a single user by their document ID.
     * @param {string} userId - The ID of the user document to fetch.
     * @returns {Promise<Object>} - Object containing the user data or an error.
     */
    async getUserById(userId) {
        try {
            const docRef = doc(this.db, this.#collection, userId);
            const docSnapshot = await getDoc(docRef);

            if (!docSnapshot.exists) {
                return this.handleError("User not found.");
            }

            return { error: false, user: this.fromFirestore(docSnapshot) };
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            return this.handleError("Failed to fetch user.");
        }
    }

    // Assuming you have a method to transform Firestore document to user object
    fromFirestore(doc) {
        const data = doc.data();
        
        // Helper function to convert any Firebase timestamp to ISO string
        const convertTimestamp = (timestamp) => {
            if (timestamp?.toDate) {
                return timestamp.toDate().toISOString()
            }
            return timestamp || null
        }
        
        // Convert all timestamp fields to ISO strings
        const convertedData = {}
        for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                // This is a Firebase Timestamp object
                convertedData[key] = convertTimestamp(value)
            } else {
                convertedData[key] = value
            }
        }
        
        return {
            id: doc.id,
            ...convertedData,
        }
    }
}

export default new UserService("user");
