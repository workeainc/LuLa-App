import BaseService from "./BaseService";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from "firebase/firestore";

class WithdrawService extends BaseService {
  #collection;
  constructor(collection) {
    super(collection);
    this.#collection = collection;
  }

  // Get all withdrawal requests (for admin)
  getAllWithdrawals(callback) {
    const ref = query(
      collection(this.db, this.#collection),
      where("status", "in", ["pending", "completed", "rejected"]),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(ref, async (snapshot) => {
      const users = await this.getAsMap("user");
      const data = snapshot.docs.map((doc) => {
        const temp = this.fromFirestore(doc);
        temp.id = doc.id;
        if (temp.userId && users.has(temp.userId)) {
          temp.user = users.get(temp.userId);
        }
        return temp;
      });
      console.log("Withdrawals data in getAllWithdrawals:", data);
      callback(data);
    }, (error) => {
      console.error("Error in getAllWithdrawals:", error);
    });
    return unsubscribe;
  }

  // Update withdrawal status
  async updateWithdrawalStatus(withdrawalId, status) {
    try {
      if (!["pending", "completed", "rejected"].includes(status)) {
        throw new Error("Invalid status");
      }
      const withdrawalRef = doc(this.db, this.#collection, withdrawalId);
      await updateDoc(withdrawalRef, { status });
      console.log(`Withdrawal ${withdrawalId} status updated to: ${status}`);
      return { error: false, message: `Withdrawal ${status}` };
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      return { error: true, message: error.message };
    }
  }

  // Existing getTransaction method (for reference, not used in UserPage)
  getTransaction(type, callback) {
    const ref = query(collection(this.db, this.#collection), where("type", "==", type));
    const unsubscribe = onSnapshot(ref, async (snapshot) => {
      const users = await this.getAsMap("user");
      const data = snapshot.docs.map((doc) => {
        const temp = this.fromFirestore(doc);
        if (temp.userId && users.has(temp.userId)) {
          temp.user = users.get(temp.userId);
        }
        return temp;
      });
      callback(data);
    });
    return unsubscribe;
  }
}

export default new WithdrawService("withdrawals");