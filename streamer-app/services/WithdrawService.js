import BaseService from './BaseService'
import { serverTimestamp } from '@react-native-firebase/firestore'

class WithdrawService extends BaseService {
    #collection
    constructor(collectionName) {
        super(collectionName)
        this.#collection = collectionName
    }

    // Create a new withdrawal request
    async createWithdrawal(userId, bankName, accountNumber, ifsc, upiId, amount) {
        try {
            if (!bankName && !upiId) {
                throw new Error('Either Bank Name or UPI ID is required')
            }
            if (amount <= 0) {
                throw new Error('Amount must be greater than zero')
            }

            const withdrawalData = this.toFirestore(
                {
                    userId,
                    bankName: bankName || '',
                    accountNumber: accountNumber || '',
                    ifsc: ifsc || '',
                    upiId: upiId || '',
                    amount,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                },
                true
            )

            const { collection, addDoc } = await import('@react-native-firebase/firestore')
            const withdrawalRef = await addDoc(collection(this.db, this.#collection), withdrawalData)
            return { error: false, data: withdrawalRef.id }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Get withdrawal requests for a user
    async getWithdrawals(userId) {
        try {
            const { collection, query, where, orderBy, getDocs } = await import('@react-native-firebase/firestore')
            const q = query(collection(this.db, this.#collection), where('userId', '==', userId), orderBy('createdAt', 'desc'))
            let snapshot = await getDocs(q)

            if (snapshot.empty) {
                return { error: false, data: [] }
            }

            const withdrawals = snapshot.docs.map((doc) => this.fromFirestore(doc))
            return { error: false, data: withdrawals }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    async getTotalWithdrawnAmount(userId) {
        try {
            const { collection, query, where, getDocs } = await import('@react-native-firebase/firestore')
            const q = query(collection(this.db, 'withdrawals'), where('userId', '==', userId), where('status', '==', 'completed'))
            const snapshot = await getDocs(q)
            const totalWithdrawn = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
            return parseFloat(totalWithdrawn.toFixed(2))
        } catch (error) {
            console.error('Error fetching withdrawn amount:', error)
            return 0
        }
    }
}

export default new WithdrawService('withdrawals')