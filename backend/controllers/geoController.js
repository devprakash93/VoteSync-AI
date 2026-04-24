const mongoose = require('mongoose');
const Constituency = require('../models/Constituency');
const Booth = require('../models/Booth');
const Vote = require('../models/Vote');

// @desc  Get all constituencies
// @route GET /api/geo/constituencies
const getConstituencies = async (req, res) => {
  try {
    const constituencies = await Constituency.find({}).sort({ state: 1, name: 1 });
    return res.json(constituencies);
  } catch (error) { 
    console.error('[getConstituencies]', error.message);
    return res.status(500).json({ message: 'Error fetching constituencies.' }); 
  }
};

// @desc  Create a constituency
// @route POST /api/geo/constituencies
// @access Private/Admin
const createConstituency = async (req, res) => {
  try {
    const { name, state, district, pincode } = req.body;
    
    if (!name || !state || !district) {
      return res.status(400).json({ message: 'Name, state, and district are required.' });
    }

    const constituency = await Constituency.create({ name, state, district, pincode });
    return res.status(201).json(constituency);
  } catch (error) { 
    console.error('[createConstituency]', error.message);
    return res.status(500).json({ message: 'Error creating constituency.' }); 
  }
};

// @desc  Get booths, optionally filtered by constituency
// @route GET /api/geo/booths?constituency=<id>
const getBooths = async (req, res) => {
  try {
    const filter = req.query.constituency ? { constituency: req.query.constituency } : {};
    const booths = await Booth.find(filter).populate('constituency', 'name state district');
    return res.json(booths);
  } catch (error) { 
    console.error('[getBooths]', error.message);
    return res.status(500).json({ message: 'Error fetching booths.' }); 
  }
};

// @desc  Create a booth
// @route POST /api/geo/booths
// @access Private/Admin
const createBooth = async (req, res) => {
  try {
    const { name, constituency, location, maxCapacity } = req.body;
    
    if (!name || !constituency) {
      return res.status(400).json({ message: 'Booth name and constituency are required.' });
    }

    const booth = await Booth.create({ name, constituency, location, maxCapacity });
    return res.status(201).json(booth);
  } catch (error) { 
    console.error('[createBooth]', error.message);
    return res.status(500).json({ message: 'Error creating booth.' }); 
  }
};

// @desc  Get booth-wise turnout analytics for a given election
// @route GET /api/geo/turnout/:electionId
// @access Private/Admin
const getBoothTurnout = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ message: 'Invalid election ID.' });
    }

    const turnout = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$booth', count: { $sum: 1 } } }
    ]);

    const boothIds = turnout.map(t => t._id).filter(Boolean);
    const booths = await Booth.find({ _id: { $in: boothIds } }).populate('constituency', 'name');
    
    const result = turnout.map(t => {
      const booth = booths.find(b => b._id.toString() === (t._id || '').toString());
      const currentAssigned = booth ? booth.currentAssigned : 1; // avoid division by zero
      
      return {
        boothId: t._id,
        boothName: booth ? booth.name : 'Unknown',
        constituency: booth ? booth.constituency?.name : 'Unknown',
        maxCapacity: booth ? booth.maxCapacity : 0,
        votesCount: t.count,
        turnoutPct: booth ? ((t.count / currentAssigned) * 100).toFixed(1) : '0'
      };
    });

    return res.json(result);
  } catch (error) { 
    console.error('[getBoothTurnout]', error.message);
    return res.status(500).json({ message: 'Error fetching booth turnout stats.' }); 
  }
};

module.exports = { getConstituencies, createConstituency, getBooths, createBooth, getBoothTurnout };
