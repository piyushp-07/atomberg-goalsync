const calculateScore = (type, planned, actual) => {
  let score = 0;
  
  if (type === 'Min') {
    // Higher is better
    if (planned === 0) return 0;
    score = (actual / planned) * 100;
  } else if (type === 'Max') {
    // Lower is better
    if (actual === 0 && planned === 0) return 100;
    if (actual === 0) return 100;
    score = (planned / actual) * 100;
  } else if (type === 'Timeline') {
    // Actual represents if it was done in time (e.g., 1 = yes, 0 = no)
    if (actual >= planned) score = 100;
    else score = 0;
  } else if (type === 'Zero-Based') {
    if (actual === 0) score = 100;
    else score = 0;
  }

  return Math.min(Math.max(score, 0), 100);
};

module.exports = { calculateScore };
