const Constituency = require('../models/Constituency');
const Booth = require('../models/Booth');

// @desc  Get all constituencies
// @route GET /api/geo/constituencies
const getConstituencies = async (req, res) => {
  try {
    const constituencies = await Constituency.find({}).sort({ state: 1, name: 1 });
    res.json(constituencies);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Create a constituency
// @route POST /api/geo/constituencies
const createConstituency = async (req, res) => {
  try {
    const { name, state, district, pincode } = req.body;
    const c = await Constituency.create({ name, state, district, pincode });
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Get booths, optionally filtered by constituency
// @route GET /api/geo/booths?constituency=<id>
const getBooths = async (req, res) => {
  try {
    const filter = req.query.constituency ? { constituency: req.query.constituency } : {};
    const booths = await Booth.find(filter).populate('constituency', 'name state district');
    res.json(booths);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Create a booth
// @route POST /api/geo/booths
const createBooth = async (req, res) => {
  try {
    const { name, constituency, location, maxCapacity } = req.body;
    const booth = await Booth.create({ name, constituency, location, maxCapacity });
    res.status(201).json(booth);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Get booth-wise turnout analytics for a given election
// @route GET /api/geo/turnout/:electionId
const getBoothTurnout = async (req, res) => {
  try {
    const Vote = require('../models/Vote');
    const turnout = await Vote.aggregate([
      { $match: { election: new require('mongoose').Types.ObjectId(req.params.electionId) } },
      { $group: { _id: '$booth', count: { $sum: 1 } } }
    ]);
    const boothIds = turnout.map(t => t._id).filter(Boolean);
    const booths = await Booth.find({ _id: { $in: boothIds } }).populate('constituency', 'name');
    const result = turnout.map(t => {
      const booth = booths.find(b => b._id.toString() === (t._id || '').toString());
      return {
        boothId: t._id,
        boothName: booth ? booth.name : 'Unknown',
        constituency: booth ? booth.constituency?.name : 'Unknown',
        maxCapacity: booth ? booth.maxCapacity : 0,
        votesCount: t.count,
        turnoutPct: booth ? ((t.count / booth.currentAssigned) * 100).toFixed(1) : '0'
      };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getConstituencies, createConstituency, getBooths, createBooth, getBoothTurnout };
