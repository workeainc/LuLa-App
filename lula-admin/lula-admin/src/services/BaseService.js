import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { firestore, auth, storage } from "../configs/firebase.config";
import { serverTimestamp, getDocs, collection, updateDoc, doc, deleteDoc } from "firebase/firestore";

class BaseService {
  db = firestore;
  auth = auth;
  storage = storage;
  #collection;
  constructor(collectionName) {
    this.#collection = collectionName;
  }

  handleError(message) {
    console.error(message);
    return { error: true, message };
  }

  toFirestore(data) {
    return {
      ...data,
      createdAt: serverTimestamp(),
    };
  }

  fromFirestore(doc) {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
    };
  }

  async update(docId, data) {
    try {
      await updateDoc(doc(this.db, this.#collection, docId), data);
      return { success: true, message: "Document updated successfully" };
    } catch (error) {
      console.error(error)
      return { success: false, message: "Failed to update document" };
    }
  }

  async delete(docId) {
    try {
      await deleteDoc(doc(this.db, this.#collection, docId));
      return { success: true, message: "Document deleted successfully" };
    } catch (error) {
      return { success: false, message: "Failed to delete document" };
    }
  }

  async getAsMap(collectionName) {
    const snapshop = await getDocs(collection(firestore, collectionName));

    const map = new Map();

    snapshop.docs.forEach((doc) => {
      map.set(doc.id, doc.data());
    });

    return map;
  }

  async uploadFiles(file, path) {
    const storageRef = ref(this.storage, `${path}/${Date.now()}-${file.name.replaceAll(" ", "-")}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    const snapshot = await uploadTask;
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }
}

export default BaseService;