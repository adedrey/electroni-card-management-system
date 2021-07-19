const mongoose = require('mongoose');
const MongoDBURI = 'mongodb+srv://klez:' + process.env.MONGO_ATLAS_PW +'@cluster0-nm91y.mongodb.net/ecard';
// const MongoDBURI = 'mongodb://127.0.0.1:27017/ecard';
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MongoDBURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}
module.exports = connectDB;