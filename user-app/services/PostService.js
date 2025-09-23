import { arrayUnion, arrayRemove, collection, addDoc, doc, deleteDoc, updateDoc, getDocs, query, where, orderBy } from '@react-native-firebase/firestore'
import BaseService from './BaseService'

class PostService extends BaseService {
    #collection
    constructor(collectionName) {
        super(collectionName)
        this.#collection = collectionName
    }

    // Create a new post (image or video)
    async createPost(userId, type, mediaUrl, caption = '') {
        try {
            if (!['FEED', 'VIDEO'].includes(type)) {
                throw new Error('Invalid post type')
            }

            const postData = this.toFirestore(
                {
                    userId,
                    type,
                    mediaUrl,
                    caption,
                    likes: [],
                    comments: [],
                },
                true
            )

            const postRef = await addDoc(collection(this.db, this.#collection), postData)
            return { error: false, data: postRef.id }
        } catch (error) {
            return this.handleError(error.message)
        }
    }
    
    // Delete a post
    async deletePost(postId) {
        try {
            await deleteDoc(doc(this.db, this.#collection, postId))
            return { error: false, message: 'Post deleted successfully' }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Update an existing post
    async updatePost(post) {
        try {
            const postRef = doc(this.db, this.#collection, post.id);
            // Prepare data to update, excluding the ID and any fields that shouldn't be changed this way
            const updateData = { ...post };
            delete updateData.id; // Don't try to update the document ID
            delete updateData.createdAt; // Don't try to update the document ID
            await updateDoc(postRef, updateData);
            return { error: false, message: 'Post updated successfully' };
        } catch (error) {
            return this.handleError(error.message);
        }
    }

    // Get posts with pagination
    async getPosts(id) {
        try {
            let snapshot = await getDocs(query(collection(this.db, this.#collection), where('userId', '==', id), orderBy('createdAt', 'desc')))

            if (snapshot.empty) {
                return { error: false, data: [] }
            }

            const posts = snapshot.docs.map((doc) => this.fromFirestore(doc))

            return { error: false, data: posts }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Like a post
    async likePost(postId, userId) {
        try {
            const postRef = doc(this.db, this.#collection, postId)
            await updateDoc(postRef, { likes: arrayUnion(userId) })
            return { error: false, message: 'Post liked' }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Unlike a post
    async unlikePost(postId, userId) {
        try {
            const postRef = doc(this.db, this.#collection, postId)
            await updateDoc(postRef, { likes: arrayRemove(userId) })
            return { error: false, message: 'Post unliked' }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Add a comment to a post
    async addComment(postId, userId, comment) {
        try {
            const commentData = this.toFirestore({
                userId,
                comment,
            })

            const postRef = doc(this.db, this.#collection, postId)
            await updateDoc(postRef, { comments: arrayUnion(commentData) })
            return { error: false, message: 'Comment added' }
        } catch (error) {
            return this.handleError(error.message)
        }
    }
}

export default new PostService('posts')
