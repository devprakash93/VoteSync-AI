require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Constituency = require('./models/Constituency');
const Booth = require('./models/Booth');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');
const AuditLog = require('./models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-voting-system';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB Connected');

  // ── Clear all existing data ────────────────────────────────────────────────
  await Vote.deleteMany({});
  await AuditLog.deleteMany({});
  await Candidate.deleteMany({});
  await Election.deleteMany({});
  await Booth.deleteMany({});
  await Constituency.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️  Cleared all previous data');

  // ── 1. Constituencies ──────────────────────────────────────────────────────
  const constituenciesData = [
    { name: 'New Delhi Sadar',   state: 'Delhi',         district: 'Central Delhi',     pincode: '110001' },
    { name: 'Chandni Chowk',     state: 'Delhi',         district: 'North Delhi',       pincode: '110006' },
    { name: 'Andheri East',      state: 'Maharashtra',   district: 'Mumbai Suburban',   pincode: '400069' },
    { name: 'Bandra West',       state: 'Maharashtra',   district: 'Mumbai',            pincode: '400050' },
    { name: 'Connaught Place',   state: 'Delhi',         district: 'New Delhi',         pincode: '110001' },
  ];
  const constituencies = await Constituency.insertMany(constituenciesData);
  console.log(`✅ Created ${constituencies.length} constituencies`);

  // ── 2. Booths ──────────────────────────────────────────────────────────────
  const boothsData = [];
  for (const c of constituencies) {
    boothsData.push(
      { name: `${c.name} — Booth A`, constituency: c._id, location: `Primary School, ${c.name}`,   maxCapacity: 800 },
      { name: `${c.name} — Booth B`, constituency: c._id, location: `Community Hall, ${c.name}`,    maxCapacity: 600 }
    );
  }
  const booths = await Booth.insertMany(boothsData);
  console.log(`✅ Created ${booths.length} polling booths`);

  // ── 3. Elections ───────────────────────────────────────────────────────────
  const now = new Date();

  // A. Constituency-level elections (one per constituency, currently ACTIVE)
  const electionsByConstituency = [];
  for (const c of constituencies) {
    const election = await Election.create({
      title: `General Assembly Election — ${c.name}`,
      description: `Constituency-level legislative assembly election for ${c.name}, ${c.state}. Voters in this constituency choose their MLA.`,
      type: 'Constituency',
      state: c.state,
      constituencies: [c._id],
      startDate: new Date(now.getTime() - 60 * 60 * 1000),       // started 1 hour ago
      endDate:   new Date(now.getTime() + 12 * 60 * 60 * 1000),  // ends in 12 hours
    });
    electionsByConstituency.push({ election, constituency: c });
  }
  console.log(`✅ Created ${electionsByConstituency.length} constituency elections`);

  // B. State-level election — Delhi only
  const delhiConstituencies = constituencies.filter(c => c.state === 'Delhi');
  const delhiStateElection = await Election.create({
    title: 'Delhi Legislative Assembly — State Election 2025',
    description: 'State-wide legislative assembly election across all Delhi constituencies. All registered Delhi voters are eligible.',
    type: 'State',
    state: 'Delhi',
    constituencies: delhiConstituencies.map(c => c._id),
    startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),     // started 2 hours ago
    endDate:   new Date(now.getTime() + 10 * 60 * 60 * 1000),    // ends in 10 hours
  });
  console.log('✅ Created Delhi state election');

  // C. National election — all constituencies
  const nationalElection = await Election.create({
    title: 'Lok Sabha General Election 2025 — National',
    description: 'Indian General Election for the 18th Lok Sabha. All registered voters across all constituencies are eligible to participate.',
    type: 'National',
    constituencies: constituencies.map(c => c._id),
    startDate: new Date(now.getTime() - 3 * 60 * 60 * 1000),     // started 3 hours ago
    endDate:   new Date(now.getTime() + 15 * 60 * 60 * 1000),    // ends in 15 hours
  });
  console.log('✅ Created national Lok Sabha election');

  // ── 4. Candidates ──────────────────────────────────────────────────────────
  const parties  = ['Bharatiya Janata Party', 'Indian National Congress', 'Aam Aadmi Party', 'Samajwadi Party'];
  const candidateNames = [
    ['Arjun Mehta',    'Priya Sharma',  'Ravi Khanna',   'Sunita Yadav'],
    ['Deepak Gupta',   'Anita Singh',   'Manish Patel',  'Kavita Nair'],
    ['Rohit Verma',    'Swati Desai',   'Ajay Kumar',    'Pooja Mishra'],
    ['Nikhil Joshi',   'Rekha Das',     'Suresh Rao',    'Meena Pillai'],
    ['Vishal Agarwal', 'Neha Bose',     'Arun Tiwari',   'Divya Menon'],
  ];

  // Constituency candidates
  for (let i = 0; i < electionsByConstituency.length; i++) {
    const { election, constituency } = electionsByConstituency[i];
    const names = candidateNames[i] || candidateNames[0];
    for (let j = 0; j < 4; j++) {
      await Candidate.create({ name: names[j], party: parties[j], election: election._id, constituency: constituency._id });
    }
  }
  console.log('✅ Created 4 candidates per constituency election');

  // Delhi State candidates (use Delhi constituency set)
  const delhiStateCandidates = [
    { name: 'Kejriwal Sharma',  party: 'Aam Aadmi Party',             constituency: delhiConstituencies[0]._id },
    { name: 'Rahul Joshi',      party: 'Indian National Congress',    constituency: delhiConstituencies[1]._id },
    { name: 'Amit Tiwari',      party: 'Bharatiya Janata Party',      constituency: delhiConstituencies[2]._id },
  ];
  for (const cand of delhiStateCandidates) {
    await Candidate.create({ ...cand, election: delhiStateElection._id });
  }
  console.log('✅ Created candidates for Delhi state election');

  // National candidates
  const nationalCandidates = [
    { name: 'Narendra Verma',   party: 'Bharatiya Janata Party' },
    { name: 'Sonia Gupta',      party: 'Indian National Congress' },
    { name: 'Arvind Nair',      party: 'Aam Aadmi Party' },
    { name: 'Akhilesh Singh',   party: 'Samajwadi Party' },
  ];
  for (const nc of nationalCandidates) {
    await Candidate.create({ ...nc, election: nationalElection._id, constituency: constituencies[0]._id });
  }
  console.log('✅ Created candidates for national election');

  // ── 5. Users ───────────────────────────────────────────────────────────────
  // Admin user (no constituency)
  await User.create({
    name: 'Chief Election Officer',
    email: 'admin@elections.gov.in',
    password: 'Admin@123',
    role: 'admin',
    organization: 'Election Commission of India',
    isVerified: true,
    voterId: 'ADMIN-ECI-001',
  });

  // 2 voters per constituency
  const voterEmails = [];
  for (let i = 0; i < constituencies.length; i++) {
    const c = constituencies[i];
    const boothA = booths[i * 2];
    const boothB = booths[i * 2 + 1];
    const stateCode = c.state.substring(0, 3).toUpperCase();

    const emailA = `voter.a.${i}@elections.demo`;
    const emailB = `voter.b.${i}@elections.demo`;

    await User.create({
      name: `${c.name.split(' ')[0]} Voter Alpha`,
      email: emailA,
      password: 'Voter@123',
      role: 'voter',
      constituency: c._id,
      assignedBooth: boothA._id,
      isVerified: true,
      voterId: `${stateCode}-${String(i * 2 + 1001).padStart(6, '0')}-V`,
    });
    await User.create({
      name: `${c.name.split(' ')[0]} Voter Beta`,
      email: emailB,
      password: 'Voter@123',
      role: 'voter',
      constituency: c._id,
      assignedBooth: boothB._id,
      isVerified: true,
      voterId: `${stateCode}-${String(i * 2 + 1002).padStart(6, '0')}-V`,
    });
    await Booth.findByIdAndUpdate(boothA._id, { $inc: { currentAssigned: 1 } });
    await Booth.findByIdAndUpdate(boothB._id, { $inc: { currentAssigned: 1 } });
    voterEmails.push({ emailA, emailB, constituency: c.name, state: c.state });
  }
  console.log(`✅ Created admin + ${constituencies.length * 2} voters`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║            VoteSync AI — Demo Credentials                   ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  ADMIN                                                       ║');
  console.log('║  Email   : admin@elections.gov.in                            ║');
  console.log('║  Password: Admin@123                                         ║');
  console.log('║  Role    : Chief Election Officer (full dashboard access)    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  VOTER ACCOUNTS  (password for all: Voter@123)               ║');
  voterEmails.forEach(({ emailA, emailB, constituency, state }) => {
    const pad = (s, len) => s.substring(0, len).padEnd(len);
    console.log(`║  ${pad(emailA, 30)} [${pad(state, 13)}] ║`);
    console.log(`║  ${pad(emailB, 30)} [${pad(constituency.substring(0,13), 13)}] ║`);
  });
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  ACTIVE ELECTIONS                                            ║');
  console.log('║  • 5 Constituency elections (active for 12 hours)           ║');
  console.log('║  • 1 Delhi State election  (active for 10 hours)            ║');
  console.log('║  • 1 National Lok Sabha election (active for 15 hours)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await mongoose.disconnect();
  console.log('\n✅ Seed complete! Run `npm run dev` to start the server.');
};

run().catch(err => {
  console.error('❌ Seed error:', err);
  mongoose.disconnect();
  process.exit(1);
});
