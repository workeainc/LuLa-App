import BaseService from "./BaseService";
import { collection, getDocs, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";

class UserService extends BaseService {
    #collection;
    constructor(collection) {
        super(collection);
        this.#collection = collection;
    }

    getUser(role, callback) {
        const ref = query(collection(this.db, this.#collection), where("role", "==", role));
        const unsubscribe = onSnapshot(ref, (snapshot) => {
            const data = snapshot.docs.map((doc) => this.fromFirestore(doc));
            callback(data);
        });
        return unsubscribe;
    }

    async approveUser(userId) {
        const userRef = doc(this.db, this.#collection, userId);
            await updateDoc(userRef, {
            status: true,
        });
    }

    async getUserCountByRole() {
        const counts = {
            TOTALUSER: 0,
            USERCHART: [],
            STREAMERCHART: [],
            STREAMER: 0,
            TRANSACTION: 0,
            WITHDRAWAL_REQUESTS: 0,
            TOPUSERCOINS: [],
            TOPSTREAMERFOLLOWERS: []
        };

        try {

            // Count Total USER role
            const totalUserRef = query(collection(this.db, this.#collection), where("role", "==", "USER"));
            const totalUserSnapshot = await getDocs(totalUserRef);
            counts.TOTALUSER = totalUserSnapshot.size;


            // Get USERs and sort by coins client-side
            const userChartRef = query(collection(this.db, this.#collection), where("role", "==", "USER"));
            const userChartSnapshot = await getDocs(userChartRef);
            const userChart = userChartSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...this.fromFirestore(doc)
            }));
            counts.USERCHART = userChart
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));


            // Get STREAMERs and sort by coins client-side
            const streamerChartRef = query(collection(this.db, this.#collection), where("role", "==", "STREAMER"));
            const streamerChartSnapshot = await getDocs(streamerChartRef);
            const streamerChart = streamerChartSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...this.fromFirestore(doc)
            }));
            counts.STREAMERCHART = streamerChart
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));


            // Get USERs and sort by coins client-side
            const topUserCoinsRef = query(collection(this.db, this.#collection), where("role", "==", "USER"));
            const topUserCoinsSnapshot = await getDocs(topUserCoinsRef);
            const users = topUserCoinsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...this.fromFirestore(doc)
            }));
            counts.TOPUSERCOINS = users
                .sort((a, b) => (b.coins || 0) - (a.coins || 0))
                .slice(0, 5);


            // Count STREAMER role
            const streamerRef = query(collection(this.db, this.#collection), where("role", "==", "STREAMER"));
            const streamerSnapshot = await getDocs(streamerRef);
            counts.STREAMER = streamerSnapshot.size;


            // Get Streamers and sort by followers client-side
            const topStreamerFollowersRef = query(collection(this.db, this.#collection), where("role", "==", "STREAMER"));
            const topStreamerFollowerSnapshot = await getDocs(topStreamerFollowersRef);
            const streamers = topStreamerFollowerSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...this.fromFirestore(doc),
                followerCount: doc.data().followers ? doc.data().followers.length : 0,
                languageCount: doc.data().selectedLanguages ? doc.data().selectedLanguages.length : 0
            }));
            counts.TOPSTREAMERFOLLOWERS = streamers
                .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
                .slice(0, 5);


            // Sum of completed transaction amounts
            const transactionRef = query(
                collection(this.db, "transactions"),
                where("type", "==", "purchase"),
                where("status", "==", "completed")
            );
            const transactionSnapshot = await getDocs(transactionRef);
            counts.TRANSACTION = transactionSnapshot.docs.reduce(
                (sum, doc) => sum + (this.fromFirestore(doc).amount || 0),
                0
            );


            // Count total withdrawal requests
            const withdrawalRef = query(collection(this.db, "withdrawals"));
            const withdrawalSnapshot = await getDocs(withdrawalRef);
            counts.WITHDRAWAL_REQUESTS = withdrawalSnapshot.size;

        } catch (error) {
            console.error("Error fetching data:", error);
        }

        return counts;
    }
}

export default new UserService("user");