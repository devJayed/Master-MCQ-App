const mongoose = require('mongoose');

let connectionPromise;

module.exports = async function connectDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        console.log('MongoDB connected');
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
};
