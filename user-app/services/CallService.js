import BaseService from "./BaseService";
import app from '@react-native-firebase/app';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, getFirestore } from '@react-native-firebase/firestore';

class CallService extends BaseService {
    #callLogsCollection;

    constructor() {
        super("");
        try {
            const defaultApp = app();
            if (defaultApp?.name) {
                this.#callLogsCollection = collection(getFirestore(), 'callLogs');
            }
        } catch (e) {
            this.#callLogsCollection = null;
        }
    }

    /**
     * Adds a new call log entry to Firestore.
     * @param {object} logData - The data for the call log entry.
     * @param {string} logData.callerId - The ID of the caller.
     * @param {string} logData.receiverId - The ID of the receiver.
     * @param {number} logData.startTime - The start time of the call (timestamp).
     * @param {string} logData.status - The status of the call (e.g., 'ongoing', 'completed', 'missed', 'declined').
     * @param {number} [logData.endTime] - The end time of the call (timestamp, optional).
     * @param {number} [logData.duration] - The duration of the call in seconds (optional).
     * @returns {Promise<{error: boolean, message?: string, data?: string}>} - Result of the operation.
     */
    async addCallLog(logData) {
        try {
            if (!this.#callLogsCollection) return this.handleError("Firebase is not configured");
            const docRef = await addDoc(this.#callLogsCollection, {
                ...logData,
                createdAt: serverTimestamp(),
            });
            return { error: false, data: docRef.id };
        } catch (error) {
            console.error("Error adding call log:", error);
            return this.handleError("Failed to add call log");
        }
    }

    /**
     * Updates an existing call log entry in Firestore.
     * @param {string} logId - The ID of the call log document to update.
     * @param {object} updateData - The data to update in the call log entry.
     * @param {number} [updateData.endTime] - The end time of the call (timestamp, optional).
     * @param {number} [updateData.duration] - The duration of the call in seconds (optional).
     * @param {string} [updateData.status] - The status of the call (e.g., 'completed', 'missed', 'declined', optional).
     * @returns {Promise<{error: boolean, message?: string}>} - Result of the operation.
     */
    async updateCallLog(logId, updateData) {
        try {
            if (!this.#callLogsCollection) return this.handleError("Firebase is not configured");
            const ref = doc(getFirestore(), 'callLogs', logId)
            await updateDoc(ref, { ...updateData, updatedAt: serverTimestamp() });
            return { error: false, message: "Call log updated successfully" };
        } catch (error) {
            console.error("Error updating call log:", error);
            return this.handleError("Failed to update call log");
        }
    }

    /**
     * Fetches call logs for a given user ID where the user is either the caller or the receiver.
     * @param {string} userId - The ID of the user whose call logs to fetch.
     * @returns {Promise<{error: boolean, message?: string, data?: Array<object>}>} - Result of the operation.
     */
    async getCallLogs(userId) {
        try {
            if (!this.#callLogsCollection) return this.handleError("Firebase is not configured");
            // Query for logs where the user is the caller
            const callerSnapshot = await getDocs(query(this.#callLogsCollection, where('callerId', '==', userId)));

            // Query for logs where the user is the receiver
            const receiverSnapshot = await getDocs(query(this.#callLogsCollection, where('receiverId', '==', userId)));

            // Combine the results
            const allLogs = [...callerSnapshot.docs, ...receiverSnapshot.docs];

            // Map documents to data objects and convert numeric timestamps to Date objects
            const callLogs = allLogs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    callerId: data.callerId,
                    receiverId: data.receiverId,
                    status: data.status,
                    // Convert numeric timestamp to JavaScript Date object
                    startTime: data.startTime ? new Date(data.startTime) : undefined,
                    // Convert numeric timestamp to JavaScript Date object (if it exists)
                    endTime: data.endTime ? new Date(data.endTime) : undefined,
                    duration: data.duration,
                };
            });

            // Sort the combined logs by start time (latest first) using getTime()
            // Filter out any logs where startTime might still be undefined after conversion
            const filteredCallLogs = callLogs
                .filter(log => log.startTime)
                .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

            return { error: false, data: filteredCallLogs };
        } catch (error) {
            console.error("Error fetching call logs:", error);
            return this.handleError("Failed to fetch call logs");
        }
    }
}

export default new CallService();