import BaseService from "./BaseService";
import {
  signInWithEmailAndPassword,
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

class AuthService extends BaseService {
  #collection;
  constructor(collection) {
    super();
    this.#collection = collection;
  }

  async register(email, password) {
    try {
      const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
      const dummyUser = {
        email,
        name: "Dummy User",
        phone: "",
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: user.uid,
      };

      await setDoc(doc(this.db, this.#collection, user.uid), dummyUser);

      return { error: false, data: dummyUser };
    } catch (error) {
      if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
        return this.handleError("Email is Already Taken");
      } else {
        return this.handleError(error.message);
      }
    }
  }

  async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email, password);
      const snapshot = await getDoc(doc(this.db, this.#collection, user.uid));

      if (!snapshot.exists()) {
        return this.handleError("Account not found");
      }

      return { error: false, data: snapshot.data() };
    } catch (error) {
      if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
        // if (email === "dummy@gmail.com" && password === "Admin@123") {
        //   const res = await this.register(email, password);
        //   return { error: false, data: res.data };
        // }
        return this.handleError("Invalid Credentials");
      } else {
        return this.handleError(error.message);
      }
    }
  }

  async updatePassword(data) {
    try {
      if (!data.password) return;
      const user = this.auth.currentUser;
      const creds = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, creds);
      await updatePassword(user, data.password);
      return { error: false, message: "Password Updated Successfully" };
    } catch (error) {
      if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
        return { error: true, message: "Invalid Current Password" };
      } else {
        return { error: false, message: error.message };
      }
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