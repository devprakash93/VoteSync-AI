require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Path relative to backend root

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-voting-system';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding.');

    // Check if admin exists to prevent duplicates
    const adminExists = await User.findOne({ email: 'admin@test.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123', // Will be automatically hashed by User model pre-save hook
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created Test Admin (admin@test.com | password123)');
    } else {
      console.log('⚡ Test Admin already exists.');
    }

    const voterExists = await User.findOne({ email: 'voter@test.com' });

    if (!voterExists) {
      await User.create({
        name: 'Test Voter',
        email: 'voter@test.com',
        password: 'password123', // Will be automatically hashed
        role: 'voter',
        isVerified: true
      });
      console.log('✅ Created Test Voter (voter@test.com | password123)');
    } else {
      console.log('⚡ Test Voter already exists.');
    }

    console.log('Seeding complete! Closing connection...');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
