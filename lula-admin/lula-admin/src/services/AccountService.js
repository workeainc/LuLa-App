import BaseService from "./BaseService";
import { AuthErrorCodes, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, query, onSnapshot, collection, getDoc } from "firebase/firestore";

class AuthService extends BaseService {
  #collection;
  constructor(collection) {
    super();
    this.#collection = collection;
  }

  async create(data) {
    try {
      const { user } = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
      delete data.password;
      const dummyUser = {
        ...data,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: user.uid,
      };

      await setDoc(doc(this.db, this.#collection, user.uid), dummyUser);

      return { error: false, message: "Account Created Successfully" };
    } catch (error) {
      if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
        return this.handleError("Email is Already Taken");
      } else {
        return this.handleError(error.message);
      }
    }
  }

  getAccount(callback) {
    const ref = query(collection(this.db, this.#collection));
    const unsubscribe = onSnapshot(ref, async (snapshot) => {
      const data = snapshot.docs.map((doc) => this.fromFirestore(doc));
      callback(data);
    });
    return unsubscribe;
  }

  async updateStatus(id, newStatus) {
    try {
      const ref = doc(this.db, this.#collection, id);
      await updateDoc(ref, {
        status: newStatus,
      });
      return { error: false, message: 'Status Updated Successfully' };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  async getAccountById(id) {
    try {
      const ref = doc(this.db, this.#collection, id);
      const snapshot = await getDoc(ref);
      return { error: false, data:this.fromFirestore(snapshot) };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  async updateDetails(data) {
    try {
      const ref = doc(this.db, this.#collection, data.id);
      await updateDoc(ref, {
        name: data.name,
        phone: data.phone,
      });

      return { error: false, message: "Details Updated Successfully" };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
}

export default new AuthService("super-admin");
