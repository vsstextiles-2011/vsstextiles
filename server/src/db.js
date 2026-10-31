import dns from 'node:dns'
import { MongoClient } from 'mongodb'

// Some networks/ISPs refuse the DNS "SRV" lookup that mongodb+srv:// needs
// (error: querySrv ECONNREFUSED). Using public DNS for this server fixes it.
dns.setServers(['8.8.8.8', '1.1.1.1'])

let client
let database

export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set in server/.env')
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
  await client.connect()
  database = client.db(process.env.MONGODB_DB || 'vsstextiles')
  // Indexes are a speed-up only - never stop the server over one.
  const indexes = [
    ['products', { category: 1, type: 1 }],
    ['orders', { userId: 1, placedAt: -1 }],
    ['orders', { status: 1 }],
    ['messages', { createdAt: -1 }],
    ['customers', { email: 1 }],
  ]
  for (const [name, spec] of indexes) {
    try { await database.collection(name).createIndex(spec) } catch (e) { console.warn(`[server] index skipped on ${name}: ${e.message}`) }
  }
  return database
}

export const col = (name) => {
  if (!database) throw new Error('Database not connected')
  return database.collection(name)
}

export async function ping() {
  await database.command({ ping: 1 })
  return true
}

// Mongo field names may not contain "." or start with "$" in some contexts;
// Firestore maps keyed by e.g. colour names are fine, but be safe for keys with dots.
export function cleanKeys(value) {
  if (Array.isArray(value)) return value.map(cleanKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k.replace(/\./g, '_').replace(/^\$/, '_'), cleanKeys(v)])
    )
  }
  return value
}
