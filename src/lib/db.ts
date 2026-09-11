import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/nova";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const cached = ((global as unknown as { mongoose?: Cache }).mongoose ??= { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}