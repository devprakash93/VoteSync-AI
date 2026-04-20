require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Constituency = require('./models/Constituency');
const Booth = require('./models/Booth');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-voting-system';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB Connected');

  // Clear existing gov data
  await Constituency.deleteMany({});
  await Booth.deleteMany({});
  await Candidate.deleteMany({});
  await Election.deleteMany({});
  await User.deleteMany({ role: { $ne: undefined } }); // wipe all
  console.log('Cleared previous data');

  // ─── 1. Constituencies ─────────────────────────────────────────────────────
  const constituenciesData = [
    { name: 'New Delhi Sadar', state: 'Delhi', district: 'Central Delhi', pincode: '110001' },
    { name: 'Chandni Chowk',  state: 'Delhi', district: 'North Delhi',   pincode: '110006' },
    { name: 'Andheri East',   state: 'Maharashtra', district: 'Mumbai Suburban', pincode: '400069' },
    { name: 'Bandra West',    state: 'Maharashtra', district: 'Mumbai',   pincode: '400050' },
    { name: 'Connaught Place', state: 'Delhi', district: 'New Delhi', pincode: '110001' },
  ];
  const constituencies = await Constituency.insertMany(constituenciesData);
  console.log(`✅ Created ${constituencies.length} constituencies`);

  // ─── 2. Booths ─────────────────────────────────────────────────────────────
  const boothsData = [];
  for (const c of constituencies) {
    boothsData.push(
      { name: `${c.name} - Booth A`, constituency: c._id, location: `Primary School, ${c.name}`, maxCapacity: 800 },
      { name: `${c.name} - Booth B`, constituency: c._id, location: `Community Hall, ${c.name}`, maxCapacity: 600 }
    );
  }
  const booths = await Booth.insertMany(boothsData);
  console.log(`✅ Created ${booths.length} polling booths`);

  // ─── 3. Elections ──────────────────────────────────────────────────────────
  const now = new Date();
  const electionsByConstituency = [];
  for (const c of constituencies) {
    const election = await Election.create({
      title: `General Election - ${c.name}`,
      description: `Constituency-level election for ${c.name}, ${c.state}`,
      type: 'Constituency',
      state: c.state,
      constituencies: [c._id],
      startDate: new Date(now.getTime() - 60 * 60 * 1000), // started 1 hour ago
      endDate: new Date(now.getTime() + 8 * 60 * 60 * 1000), // ends in 8 hours
    });
    electionsByConstituency.push({ election, constituency: c });
  }
  console.log(`✅ Created ${electionsByConstituency.length} constituency elections`);

  // ─── 4. Candidates ─────────────────────────────────────────────────────────
  const parties = ['Bharatiya Janata Party', 'Indian National Congress', 'Aam Aadmi Party', 'Samajwadi Party'];
  const candidateNames = [
    ['Arjun Mehta', 'Priya Sharma', 'Ravi Khanna', 'Sunita Yadav'],
    ['Deepak Gupta', 'Anita Singh',  'Manish Patel', 'Kavita Nair'],
    ['Rohit Verma', 'Swati Desai',  'Ajay Kumar',   'Pooja Mishra'],
    ['Nikhil Joshi', 'Rekha Das',   'Suresh Rao',   'Meena Pillai'],
    ['Vishal Agarwal', 'Neha Bose', 'Arun Tiwari',  'Divya Menon'],
  ];

  for (let i = 0; i < electionsByConstituency.length; i++) {
    const { election, constituency } = electionsByConstituency[i];
    const names = candidateNames[i] || candidateNames[0];
    for (let j = 0; j < 4; j++) {
      await Candidate.create({
        name: names[j],
        party: parties[j],
        election: election._id,
        constituency: constituency._id,
      });
    }
  }
  console.log('✅ Created 4 candidates per constituency');

  // ─── 5. Users ──────────────────────────────────────────────────────────────
  // NOTE: Plain text password — the User model's pre-save hook hashes it automatically.

  // Admin user
  await User.create({
    name: 'Chief Election Officer',
    email: 'admin@elections.gov.in',
    password: 'password123',
    role: 'admin',
    organization: 'Election Commission of India',
    isVerified: true,
    voterId: 'ADMIN-GOV-001',
  });

  // Create 2 voters per constituency, assigned to Booth A and B
  for (let i = 0; i < constituencies.length; i++) {
    const c = constituencies[i];
    const boothA = booths[i * 2];
    const boothB = booths[i * 2 + 1];
    const stateCode = c.state.substring(0, 3).toUpperCase();

    await User.create({
      name: `Voter A - ${c.name}`,
      email: `voter.a.${i}@example.com`,
      password: 'password123',
      role: 'voter',
      constituency: c._id,
      assignedBooth: boothA._id,
      isVerified: true,
      voterId: `${stateCode}-${String(i * 2 + 1001).padStart(6, '0')}-V`,
    });
    await User.create({
      name: `Voter B - ${c.name}`,
      email: `voter.b.${i}@example.com`,
      password: 'password123',
      role: 'voter',
      constituency: c._id,
      assignedBooth: boothB._id,
      isVerified: true,
      voterId: `${stateCode}-${String(i * 2 + 1002).padStart(6, '0')}-V`,
    });

    // Increment booth assignments
    await Booth.findByIdAndUpdate(boothA._id, { $inc: { currentAssigned: 1 } });
    await Booth.findByIdAndUpdate(boothB._id, { $inc: { currentAssigned: 1 } });
  }
  console.log('✅ Created admin + 2 voters per constituency');

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║       Government Seed Complete                   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║ Admin: admin@elections.gov.in / password123      ║');
  constituencies.forEach((c, i) => {
    const stateCode = c.state.substring(0, 3).toUpperCase();
    console.log(`║ Voter a.${i}: voter.a.${i}@example.com / password123 ║`);
    console.log(`║ VoterID: ${stateCode}-${String(i*2+1001).padStart(6,'0')}-V (${c.name.substring(0,15)})       ║`);
  });
  console.log('╚══════════════════════════════════════════════════╝');

  mongoose.disconnect();
};

run().catch(err => { console.error(err); mongoose.disconnect(); });
