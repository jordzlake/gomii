import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "gomii";

if (!uri) {
  throw new Error("MONGODB_URI is missing. Copy .env.local.example to .env.local and fill it in.");
}

let client: MongoClient;
let promise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _gomiiMongo: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._gomiiMongo) {
    client = new MongoClient(uri);
    global._gomiiMongo = client.connect();
  }
  promise = global._gomiiMongo;
} else {
  client = new MongoClient(uri);
  promise = client.connect();
}

let indexesReady = false;

export async function getDb(): Promise<Db> {
  const c = await promise;
  const db = c.db(dbName);
  if (!indexesReady) {
    indexesReady = true;
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("users").createIndex({ username: 1 }, { unique: true }),
      db.collection("tasks").createIndex({ userId: 1, category: 1 }),
      db.collection("completions").createIndex({ userId: 1, completedAt: -1 }),
      db.collection("completions").createIndex({ userId: 1, taskKey: 1, completedAt: -1 }),
      db.collection("goals").createIndex({ userId: 1 }),
      db.collection("categories").createIndex({ userId: 1 }),
    ]).catch(() => undefined);
  }
  return db;
}
