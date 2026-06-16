const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://hg232103_db_user:5SIGUQlN0b1lXSrk@cluster0.pmlgf73.mongodb.net/him_project';

async function check() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Find users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Registered Users:');
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Provider: ${u.provider}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
