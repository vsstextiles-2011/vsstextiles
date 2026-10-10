// Contact-form messages (Firestore collection "contactMessages").
//  - Customers send a message from the Contact page  -> sendContactMessage()
//  - The admin reads them in Admin -> Messages       -> useContactMessages()
// Security lives in firestore.rules: anyone may CREATE a (validated) message,
// only a signed-in admin may read, mark read/unread, or delete them.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

export const MESSAGES_COLLECTION = 'contactMessages'

export async function sendContactMessage({ name, email, subject, message }) {
  const payload = {
    name: name.trim().slice(0, 100),
    email: email.trim().slice(0, 200),
    subject: subject.trim().slice(0, 200),
    message: message.trim().slice(0, 3000),
    status: 'new',
    readAt: null,
    createdAt: serverTimestamp(),
  }
  const uid = auth.currentUser?.uid
  if (uid) payload.userId = uid
  await addDoc(collection(db, MESSAGES_COLLECTION), payload)
}

export function messageDate(m) {
  const d = m?.createdAt?.toDate ? m.createdAt.toDate() : null
  return d
}

export function useContactMessages(enabled) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) {
      setMessages([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    const q = query(collection(db, MESSAGES_COLLECTION), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setError('')
        setLoading(false)
      },
      (err) => {
        console.error('Messages listener failed:', err)
        setError(
          err?.code === 'permission-denied'
            ? 'Firestore rules do not allow reading messages yet. Publish the updated firestore.rules in the Firebase console.'
            : 'Could not load messages.',
        )
        setLoading(false)
      },
    )
  }, [enabled])

  const setRead = useCallback(async (id, read) => {
    await updateDoc(doc(db, MESSAGES_COLLECTION, id), {
      status: read ? 'read' : 'new',
      readAt: read ? serverTimestamp() : null,
    })
  }, [])

  const remove = useCallback(async (id) => {
    await deleteDoc(doc(db, MESSAGES_COLLECTION, id))
  }, [])

  const unreadCount = useMemo(() => messages.filter((m) => m.status !== 'read').length, [messages])
  return { messages, loading, error, unreadCount, setRead, remove }
}
