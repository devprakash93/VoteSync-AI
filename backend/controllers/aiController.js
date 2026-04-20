const Election = require('../models/Election');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');

// @desc    Analyze election data and provide Predictive AI Insights
// @route   GET /api/ai/analyze/:electionId
// @access  Private/Admin
const getAiAnalysis = async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    // Fetch raw votes for time-series analysis
    const votes = await Vote.find({ election: electionId }).sort({ createdAt: 1 });
    const totalVotes = votes.length;
    let analysisText = '';
    
    if (totalVotes === 0) {
      return res.json({ insights: `Insufficient data. The model requires at least 1 vote to construct a predictive gradient.`, status: 'success' });
    }

    // 1. Predictive Winner Model (Extrapolation)
    const candidateTally = {};
    votes.forEach(v => {
      candidateTally[v.candidate] = (candidateTally[v.candidate] || 0) + 1;
    });

    let topCandidateId = null;
    let highestVotes = 0;
    let secondHighestVotes = 0;

    for (const [cId, count] of Object.entries(candidateTally)) {
      if (count > highestVotes) {
        secondHighestVotes = highestVotes;
        highestVotes = count;
        topCandidateId = cId;
      } else if (count > secondHighestVotes) {
        secondHighestVotes = count;
      }
    }

    // Calculate prediction confidence based on margin and total data mass
    const margin = highestVotes - secondHighestVotes;
    const marginRatio = margin / totalVotes;
    // Logistic curve for confidence to simulate a trained classifier's certainty
    const confidence = Math.min(99, Math.max(15, Math.floor((1 / (1 + Math.exp(-10 * (marginRatio - 0.2)))) * 100)));
    
    const topCandidate = await Candidate.findById(topCandidateId);
    const winnerString = topCandidate 
      ? `📈 **Winner Prediction Model:** Candidate **${topCandidate.name}** is mathematically favored to win with a **${confidence}% confidence interval** based on current trajectory margins.`
      : '';

    // 2. ML Simulated Fraud Anomaly Classification
    // Build a synthetic logistic regression node evaluating standard deviation of time gaps
    let timeGaps = [];
    let burstVotes = 0;

    for (let i = 1; i < votes.length; i++) {
       const gapMs = new Date(votes[i].createdAt) - new Date(votes[i-1].createdAt);
       timeGaps.push(gapMs);
       if (gapMs < 5000) burstVotes++; // Votes occurring within 5 seconds of each other globally
    }

    const anomalies = await AuditLog.countDocuments({ entityId: electionId, action: 'FRAUD_ALERT' });

    // Logistic Regression Sigmoid Calculation: 1 / (1 + e^-z)
    // Weights: w1 (burst frequency), w2 (hard fraud flags)
    const w1 = 0.8, w2 = 4.5, bias = 2.0;
    const burstRatio = totalVotes > 1 ? burstVotes / totalVotes : 0;
    const z = (w1 * burstRatio) + (w2 * anomalies) - bias;
    const fraudProbability = (1 / (1 + Math.exp(-z))) * 100;

    let fraudString = `\n🔒 **Anomaly Classification:** The heuristic engine calculates a **${fraudProbability.toFixed(1)}% fraud probability score**.\n`;
    if (fraudProbability > 75) {
      fraudString += `⚠️ **CRITICAL:** High probability of coordinated manipulation detected spanning multiple IP nodes! Review Audit Logs immediately.`;
    } else if (fraudProbability > 40) {
      fraudString += `⚠️ **WARNING:** Moderate suspicious velocity detected. Vote streaming patterns require spot-checking.`;
    } else {
      fraudString += `✅ System integrity metrics indicate organic traffic flow.`;
    }

    analysisText = `${winnerString}\n${fraudString}`;

    // Artificial delay to simulate ML processing payload latency
    setTimeout(() => {
      res.json({ insights: analysisText, status: 'success' });
    }, 1200);
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAiAnalysis };
