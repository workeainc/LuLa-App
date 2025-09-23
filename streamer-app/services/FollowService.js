import BaseService from './BaseService'
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs, query, where, serverTimestamp } from '@react-native-firebase/firestore'

class FollowService extends BaseService {
    #collection
    constructor(collectionName) {
        super(collectionName)
        this.#collection = collectionName
    }

    // Follow a user
    async followUser(followerId, followingId) {
        try {
            if (followerId === followingId) {
                throw new Error("You can't follow yourself")
            }

            const followRef = doc(this.db, this.#collection, `${followerId}_${followingId}`)
            const followDoc = await getDoc(followRef)

            if (!followDoc.exists) {
                await setDoc(followRef,
                    this.toFirestore(
                        {
                            followerId,
                            followingId,
                            createdAt: serverTimestamp(),
                            type: 'follow'
                        },
                        true
                    )
                )

                // Update followers and following arrays
                await this.updateUserArray(followingId, 'followers', followerId, true)
                await this.updateUserArray(followerId, 'following', followingId, true)
            }
            return { error: false, message: 'User followed successfully' }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Unfollow a user
    async unfollowUser(followerId, followingId) {
        try {
            const followRef = doc(this.db, this.#collection, `${followerId}_${followingId}`)
            await deleteDoc(followRef)

            // Update followers and following arrays
            await this.updateUserArray(followingId, 'followers', followerId, false)
            await this.updateUserArray(followerId, 'following', followingId, false)

            return { error: false, message: 'User unfollowed successfully' }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Get list of followers for a user
    async getFollowers(userId) {
        try {
            const userRef = doc(this.db, 'user', userId)
            const userDoc = await getDoc(userRef)
            if (!userDoc.exists) return { error: true, message: 'User not found' }

            const followerIds = userDoc.data().followers || []
            if (followerIds.length === 0) {
                return { error: false, followers:[] }
            }

            const followerSnapshot = await getDocs(query(collection(this.db, 'user'), where('id', 'in', followerIds)))

            const followers = followerSnapshot.docs.map((item) => this.fromFirestore(item))

            return { error: false, followers }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Get list of users that a user is following
    async getFollowing(userId) {
        try {
            
            const userRef = doc(this.db, 'user', userId)
            const userDoc = await getDoc(userRef)
            if (!userDoc.exists) return { error: true, message: "User Not Found" }
            
            const followingIds = userDoc.data().following || []
            console.log(followingIds);

            if (followingIds.length === 0) {
                return { error: false, following:[] }
            }

            const followerSnapshot = await getDocs(query(collection(this.db, 'user'), where('id', 'in', followingIds)))
            
            const following = followerSnapshot.docs.map((item) => this.fromFirestore(item))
            return { error: false, following, }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Utility function to update user followers/following arrays
    async updateUserArray(userId, field, targetId, add) {
        try {
            const userRef = doc(this.db, 'user', userId)
            await updateDoc(userRef, {
                [field]: add ? arrayUnion(targetId) : arrayRemove(targetId),
            })
        } catch (error) {
            console.error(`Failed to update ${field} for user ${userId}:`, error)
        }
    }
}

export default new FollowService('follows')
