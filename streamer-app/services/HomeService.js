import BaseService from './BaseService'
import moment from 'moment'
import { Timestamp, collection, query, where, getDocs, doc, getDoc } from '@react-native-firebase/firestore'

class HomeService extends BaseService {
    constructor() {
        super('asd')
    }

    /**
     * Fetches total earnings in the last 4 weeks
     * @param {string} userId - The ID of the user
     * @returns {Promise<Array>} - Total coins earned
     */
    async getLastFourWeeksEarnings(userId) {
        try {
            const fourWeeksAgo = Timestamp.fromDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)) // 4 weeks ago

            const q = query(collection(this.db, 'transactions'), where('userId', '==', userId), where('type', '==', 'earn'), where('createdAt', '>=', fourWeeksAgo))
            const snapshot = await getDocs(q)

            // Get last 4 weeks' data
            const weeks = {}
            for (let i = 0; i < 4; i++) {
                const weekStart = moment().subtract(i, 'weeks').startOf('week').format('YYYY-MM-DD')
                weeks[weekStart] = 0 // Initialize week-wise earnings
            }

            // Process earnings data
            snapshot.docs.forEach((doc) => {
                const tx = this.fromFirestore(doc)

                // Convert to moment without using non-ISO string representations
                const createdAtDate = new Date(tx.createdAt)
                const createdAt = moment(createdAtDate).startOf('week').format('YYYY-MM-DD')

                if (tx.type === 'earn' && weeks.hasOwnProperty(createdAt)) {
                    weeks[createdAt] += tx.coins
                }
            })
            // Convert to pie chart format
            const pieChartData = Object.entries(weeks).map(([week, totalEarnings], index) => ({
                name: `Week ${4 - index} Earnings`, // Labels as Week 4, Week 3, etc.
                population: parseFloat(totalEarnings?.toFixed(2)),
                color: ['#F1B5CB', 'rgba(171, 73, 161, 0.8)', 'rgba(97, 86, 226, 1)', '#FFD700'][index], // Assign colors
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            }))

            return pieChartData
        } catch (error) {
            console.error('Error fetching earnings:', error)
            return []
        }
    }

    async getHomeCounts(userId) {
        try {
            const userRef = doc(this.db, 'user', userId)
            const userSnap = await getDoc(userRef)
            if (!userSnap.exists) {
                throw Error('User Not Found')
            }

            const data = this.fromFirestore(userSnap)

            const snapshot = await getDocs(query(collection(this.db, 'chats'), where('streamerId', '==', userId)))

            const transactionSnapshot = await getDocs(query(collection(this.db, 'transactions'), where('userId', '==', userId), where('type', '==', 'earn')))

            const totalEarnings = transactionSnapshot.docs.reduce((sum, doc) => sum + (doc.data().coins || 0), 0);

            const body = {
                followers: data?.followers?.length || 0,
                following: data?.following?.length || 0,
                chats: snapshot.size,
                totalEarnings: parseFloat(totalEarnings).toFixed(2),
            }

            return { error: false, data: body }
        } catch (error) {
            this.handleError(error.message)
        }
    }

    /**
     * Fetches total withdrawn amount for completed withdrawals
     * @param {string} userId - The ID of the user
     * @returns {Promise<number>} - Total withdrawn amount
     */
    async getTotalWithdrawnAmount(userId) {
        try {
            const snapshot = await getDocs(query(collection(this.db, 'withdrawals'), where('userId', '==', userId), where('status', '==', 'completed')))
            const totalWithdrawn = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
            return parseFloat(totalWithdrawn.toFixed(2))
        } catch (error) {
            console.error('Error fetching withdrawn amount:', error)
            return 0
        }
    }
    
    async getProcessWithdrawnAmount(userId) {
        try {
            const snapshot = await getDocs(query(collection(this.db, 'withdrawals'), where('userId', '==', userId), where('status', '==', 'pending')))
            const totalWithdrawnProcessAmount = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
            return parseFloat(totalWithdrawnProcessAmount.toFixed(2))
        } catch (error) {
            console.error('Error fetching withdrawn amount:', error)
            return 0
        }
    }
}

export default new HomeService()