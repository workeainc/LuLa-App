import { serverTimestamp, collection, getDocs, updateDoc, deleteDoc, doc, getFirestore, getAuth, getStorage } from '@react-native-firebase/firestore'
import { getAuth as getFirebaseAuth } from '@react-native-firebase/auth'
import { getStorage as getFirebaseStorage } from '@react-native-firebase/storage'
import functions from "@react-native-firebase/functions"

class BaseService {
    db
    auth
    storage
    #collection

    constructor(collectionName) {
        this.#collection = collectionName
        try {
            // Initialize modules using the new modular API
            this.db = getFirestore()
            this.auth = getFirebaseAuth()
            this.storage = getFirebaseStorage()
        } catch (e) {
            console.error('RNFirebase initialization failed:', e?.message || e)
            this.db = null
            this.auth = null
            this.storage = null
        }
    }

    handleError(message) {
        console.error(message)
        return { error: true, message }
    }

    toFirestore(data, updatedAt = false) {
        if (updatedAt) {
            return {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }
        }

        return {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
    }

    fromFirestore(doc) {
        const data = doc.data()
        
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
            ...convertedData,
            id: doc.id,
        }
    }

    async update(docId, data) {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            
            console.log('BaseService.update called with:', { docId, data, collection: this.#collection });
            
            const ref = doc(this.db, this.#collection, docId)
            console.log('Document reference created:', ref.path);
            
            await updateDoc(ref, data)
            console.log('Document updated successfully');
            
            return { success: true, message: 'Document updated successfully' }
        } catch (error) {
            console.error('BaseService.update error:', error);
            return { success: false, message: `Failed to update document: ${error.message}` }
        }
    }

    async delete(docId) {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            const ref = doc(this.db, this.#collection, docId)
            await deleteDoc(ref)
            return { success: true, message: 'Document deleted successfully' }
        } catch (error) {
            return { success: false, message: 'Failed to delete document' }
        }
    }

    async getAsMap() {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            const snapshot = await getDocs(collection(this.db, this.#collection))
            const map = new Map()

            snapshot.forEach((d) => {
                map.set(d.id, d.data())
            })

            return map
        } catch (error) {
            return this.handleError('Failed to fetch documents')
        }
    }

    async uploadFiles(file, path) {
        try {
            if (!this.storage) return this.handleError('Firebase is not configured')
            
            console.log('Uploading file:', file, 'to path:', path);
            
            const filename = file.substring(file.lastIndexOf('/') + 1)
            const timestamp = Date.now()
            const uniqueFilename = `${timestamp}-${filename.replaceAll(' ', '-')}`
            const storageRef = this.storage.ref(`${path}/${uniqueFilename}`)
            
            console.log('Storage reference created:', storageRef.path);
            
            // Set metadata for better image handling
            const metadata = {
                contentType: 'image/jpeg', // Default to JPEG, can be enhanced to detect actual type
                cacheControl: 'public, max-age=31536000', // Cache for 1 year
                customMetadata: {
                    uploadedAt: timestamp.toString(),
                    originalFilename: filename,
                    uploadPath: path
                }
            };
            
            const uploadTask = storageRef.putFile(file, metadata)
            
            // Wait for upload to complete
            await uploadTask
            
            // Get download URL
            const downloadURL = await storageRef.getDownloadURL()
            
            console.log('File uploaded successfully. Download URL:', downloadURL);
            console.log('File size:', uploadTask.snapshot.bytesTransferred, 'bytes');
            console.log('Upload path:', storageRef.path);
            
            return downloadURL
        } catch (error) {
            console.error('Upload error:', error);
            return this.handleError(`Failed to upload file: ${error.message}`)
        }
    }
}

export default BaseService
