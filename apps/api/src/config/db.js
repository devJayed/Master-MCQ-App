const mongoose = require('mongoose');
module.exports = async function connectDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};
