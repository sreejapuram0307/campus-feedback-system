import mongoose from 'mongoose'
import { env } from './env.js'

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI)

    console.log('✅ MongoDB Connected')
    console.log('Host:', mongoose.connection.host)
    console.log('Database:', mongoose.connection.name)
  } catch (error) {
  console.error("===== FULL MONGODB ERROR =====");
  console.error(error);
  process.exit(1);
}
}

export default connectDB