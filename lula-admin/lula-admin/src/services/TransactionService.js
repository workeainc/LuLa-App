import BaseService from "./BaseService";
import { collection,  onSnapshot, query, where } from "firebase/firestore";

class TransactionService extends BaseService {
  #collection;
  constructor(collection) {
    super(collection);
    this.#collection = collection;
  }

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

export default new TransactionService("transactions");
