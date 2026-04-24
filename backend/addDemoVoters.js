require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Constituency = require('./models/Constituency');
const Booth = require('./models/Booth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-voting-system';

const firstNames = ['Amit', 'Sunil', 'Rajesh', 'Priya', 'Anjali', 'Karan', 'Deepak', 'Sonia', 'Vikram', 'Neha', 'Rohan', 'Pooja', 'Arjun', 'Meera', 'Suresh', 'Kavita'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Yadav', 'Mehta', 'Joshi', 'Nair', 'Das', 'Reddy', 'Chopra', 'Mishra', 'Iyer', 'Bose', 'Tiwari'];

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for Demo Population');

    const constituencies = await Constituency.find();
    if (constituencies.length === 0) {
      console.log('❌ No constituencies found. Please run seedGov.js first.');
      process.exit(1);
    }

    const countPerConstituency = 10; // Number of voters to add per constituency
    let totalAdded = 0;

    console.log(`🚀 Adding ${countPerConstituency} voters to each of the ${constituencies.length} constituencies...`);

    for (let i = 0; i < constituencies.length; i++) {
      const c = constituencies[i];
      const booths = await Booth.find({ constituency: c._id });
      
      if (booths.length === 0) {
        console.log(`⚠️ Skipping ${c.name} (no booths found)`);
        continue;
      }

      for (let j = 0; j < countPerConstituency; j++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;
        const email = `voter.demo.${i}.${j}@elections.showcase`;
        const stateCode = c.state.substring(0, 3).toUpperCase();
        const voterId = `${stateCode}-DMO-${String(i * 100 + j + 5000).padStart(6, '0')}`;
        
        // Assign to a random booth in the constituency
        const booth = booths[j % booths.length];

        try {
          await User.create({
            name,
            email,
            password: 'Voter@123',
            role: 'voter',
            constituency: c._id,
            assignedBooth: booth._id,
            isVerified: true,
            voterId,
          });
          
          await Booth.findByIdAndUpdate(booth._id, { $inc: { currentAssigned: 1 } });
          totalAdded++;
        } catch (err) {
          // Skip if duplicate email/voterId
          if (err.code !== 11000) console.error(err.message);
        }
      }
      console.log(`✅ Populated ${c.name} (${c.state})`);
    }

    console.log('\n' + '='.repeat(40));
    console.log(`🎉 Demo Population Complete!`);
    console.log(`Added ${totalAdded} new voters across ${constituencies.length} constituencies.`);
    console.log(`Password for all demo accounts: Voter@123`);
    console.log('='.repeat(40));

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
