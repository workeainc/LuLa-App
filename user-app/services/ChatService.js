import { serverTimestamp, collection, doc, getDoc, getDocs, query, where, limit, setDoc, addDoc, startAfter, orderBy, onSnapshot } from '@react-native-firebase/firestore'
import BaseService from './BaseService'

class ChatService extends BaseService {
    #collection
    constructor(collectionName) {
        super(collectionName)
        this.#collection = collectionName
    }
    // Create a chat session between a user and a streamer
    async createChat(userId, streamerId) {
        try {
            const chatId = this.getChatId(userId, streamerId)
            const chatDocRef = doc(this.db, this.#collection, chatId)
            // Create chat if it doesn't exist
            let chatDoc = await getDoc(chatDocRef)
            if (!chatDoc.exists) {
                await setDoc(chatDocRef,
                    this.toFirestore(
                        {
                            userId,
                            streamerId,
                            lastMessage: '',
                            id: chatId,
                        },
                        true
                    )
                )
            }
            return { error: false, data: chatId }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    async getChatList(pageSize = 10, lastVisible = null, streamerId) {
        try {
            console.log(lastVisible)

            // Build the query to get chats for the given streamerId
            let q = query(collection(this.db, this.#collection), where('streamerId', '==', streamerId), limit(pageSize))

            // Add pagination if lastVisible exists
            if (lastVisible) {
                q = query(q, startAfter(lastVisible))
            }

            // Fetch the chat documents
            const snapshot = await getDocs(q)
            if (snapshot.empty) {
                return { chats: [], lastVisible: null }
            }

            // Get the last document to use for pagination
            const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]

            // Get all unique userIds for this batch of chats
            const userIds = snapshot.docs.map((doc) => doc.data().userId)
            const uniqueUserIds = [...new Set(userIds)] // Ensure unique userIds

            // Fetch the users in a single query
            const userSnapshot = await getDocs(query(collection(this.db, 'user'), where('id', 'in', uniqueUserIds)))

            // Create a map of users for fast lookup
            const users = new Map()
            userSnapshot.docs.forEach((doc) => {
                users.set(doc.id, this.fromFirestore(doc))
            })

            // Map the chat data with the user details
            const chats = snapshot.docs.map((doc) => {
                const chat = this.fromFirestore(doc)
                chat.user = users.has(chat.userId) ? users.get(chat.userId) : null
                return chat
            })

            // Return the result with the chats and lastVisible for pagination
            return {
                chats,
                lastVisible: lastVisibleDoc, // Provide the last document for the next page
            }
        } catch (error) {
            return this.handleError(error.message)
        }
    }

    // Send a message from user to streamer or streamer to user
    async sendMessage(chatId, body) {
        try {
            console.log('📱 Sending message:', { chatId, body });
            
            // Ensure the message has required fields
            const messageData = {
                ...body,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            console.log('📱 Message data to send:', messageData);
            
            // Create a chat session if it doesn't exist
            const messageRef = await addDoc(collection(this.db, this.#collection, chatId, 'messages'), this.toFirestore(messageData, true))
            
            console.log('📱 Message sent successfully with ID:', messageRef.id);
            
            // Update chat with last message
            await this.update(chatId, { 
                lastMessage: body.content, 
                updatedAt: serverTimestamp() 
            });
            
            console.log('📱 Chat updated with last message');
            
            return { error: false, message: 'Message sent successfully', messageId: messageRef.id }
        } catch (error) {
            console.error('❌ Error sending message:', error)
            return { error: true, message: 'Failed to send message' }
        }
    }

    // Listen for real-time updates on new messages
    listenToMessages(chatId, callback) {
        try {
            if (!chatId || !this.db) {
                console.warn('Invalid chatId or database not initialized')
                return () => {}
            }
            
            // Listen for changes in the messages subcollection
            const messagesRef = collection(this.db, 'chats', chatId, 'messages')
            const messagesQuery = query(messagesRef, orderBy('createdAt'))
            
            return onSnapshot(messagesQuery, (snapshot) => {
                try {
                    const newMessages = snapshot.docs.map((doc) => {
                        return this.fromFirestore(doc)
                    })
                    callback(newMessages)
                } catch (error) {
                    console.error('Error processing messages snapshot:', error)
                    callback([])
                }
            }, (error) => {
                console.error('Error listening to messages:', error)
                callback([])
            })
        } catch (error) {
            console.error('Error setting up message listener:', error)
            return () => {}
        }
    }

    // Utility to generate a chat ID based on user and streamer IDs
    getChatId(userId, streamerId) {
        return userId < streamerId ? `${userId}_${streamerId}` : `${streamerId}_${userId}`
    }
}

export default new ChatService('chats')
