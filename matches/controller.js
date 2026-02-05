const sequelize = require('../database/database');
const { Op } = require('sequelize');
const { 
  Sessions, 
  SessionPlayers, 
  User, 
  Matches, 
  MatchCourts, 
  MatchTeams, 
  MatchTeamPlayers 
} = require('../common/models');

/**
 * POST /matches/generate
 * Generate a match for a session with intelligent player assignment
 * 
 * Request body: { session_id, available_courts }
 * Response: { success, data: { match, courts, teams } }
 */
exports.generateMatch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { session_id, available_courts = 1, match_type } = req.body;
    
    console.log(`[generateMatch] Starting - SessionID: ${session_id}, Courts: ${available_courts}, Match Type: ${match_type}`);
    
    // Validate session exists
    const session = await Sessions.findByPk(session_id, { transaction: t });
    if (!session) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Get eligible players (active players not sitting out)
    const eligiblePlayers = await SessionPlayers.findAll({
      where: {
        session_id,
        sitting_out_next: false,
        left_at: null
      },
      include: [{
        model: User,
        as: 'player',
        attributes: ['id', 'name', 'email']
      }],
      transaction: t
    });
    
    if (eligiblePlayers.length < 2) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Not enough eligible players to generate a match (minimum 2 required)' 
      });
    }
    
    console.log(`[generateMatch] Found ${eligiblePlayers.length} eligible players`);
    
    // Determine match type based on request or default to doubles
    let matchType = match_type && (match_type === 'singles' || match_type === 'doubles') ? match_type : 'doubles';
    console.log(`[generateMatch] Match type set to: ${matchType}`);
    
    // Fallback to singles if not enough players for doubles
    if (matchType === 'doubles' && eligiblePlayers.length < 4) {
      matchType = 'singles';
      console.log(`[generateMatch] Falling back to singles (insufficient players for doubles)`);
    }
    
    // Calculate courts based on final match type
    const playersPerCourt = matchType === 'doubles' ? 4 : 2;
    const maxCourts = Math.min(available_courts, Math.floor(eligiblePlayers.length / playersPerCourt));
    const actualCourts = maxCourts;
    
    console.log(`[generateMatch] Players per court: ${playersPerCourt}, Max courts: ${maxCourts}, Actual courts: ${actualCourts}`);
    
    if (actualCourts === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Not enough players for ${matchType} match`
      });
    }
    
    // SIMPLE RANDOM ASSIGNMENT - Fisher-Yates shuffle for true randomness
    const shuffledPlayers = [...eligiblePlayers];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    
    const totalPlayersNeeded = actualCourts * playersPerCourt;
    const selectedPlayers = shuffledPlayers.slice(0, totalPlayersNeeded);
    
    console.log(`[generateMatch] Selected ${selectedPlayers.length} players randomly`);
    console.log(`[generateMatch] Player order: ${selectedPlayers.map(p => p.player_id).join(', ')}`);
    
    const assignedPlayers = [];
    for (let court = 0; court < actualCourts; court++) {
      const courtPlayers = selectedPlayers.slice(court * playersPerCourt, (court + 1) * playersPerCourt);
      const playersPerTeam = matchType === 'doubles' ? 2 : 1;
      
      assignedPlayers.push({
        teamA: courtPlayers.slice(0, playersPerTeam).map(ep => ep.player_id),
        teamB: courtPlayers.slice(playersPerTeam).map(ep => ep.player_id)
      });
      
      console.log(`[generateMatch] Court ${court + 1} - Team A: [${assignedPlayers[court].teamA}], Team B: [${assignedPlayers[court].teamB}]`);
    }
    
    console.log(`[generateMatch] Random assignment completed`);
    
    console.log(`[generateMatch] About to create match with match_type: "${matchType}"`);
    
    // Create the match
    const match = await Matches.create({
      session_id,
      match_type: matchType
    }, { transaction: t });
    
    console.log(`[generateMatch] Created match ${match.id} - Type: ${matchType}, Courts: ${actualCourts}`);
    
    const courtsData = [];
    let playerIndex = 0;
    
    // Assign players to courts and teams
    for (let courtNum = 1; courtNum <= actualCourts; courtNum++) {
      // Create court
      const court = await MatchCourts.create({
        match_id: match.id,
        court_number: courtNum,
        court_type: matchType
      }, { transaction: t });
      
      // Create Team A
      const teamA = await MatchTeams.create({
        match_court_id: court.id,
        team: 'A',
        won: null
      }, { transaction: t });
      
      // Create Team B
      const teamB = await MatchTeams.create({
        match_court_id: court.id,
        team: 'B',
        won: null
      }, { transaction: t });
      
      // Get assigned players for this court
      const courtAssignment = assignedPlayers[courtNum - 1];
      
      // Assign players to Team A
      for (const playerId of courtAssignment.teamA) {
        await MatchTeamPlayers.create({
          match_team_id: teamA.id,
          user_id: playerId
        }, { transaction: t });
        
        // Mark player as sitting out next round
        const sessionPlayer = eligiblePlayers.find(ep => ep.player_id === playerId);
        if (sessionPlayer) {
          sessionPlayer.sitting_out_next = true;
          await sessionPlayer.save({ transaction: t });
        }
      }
      
      // Assign players to Team B
      for (const playerId of courtAssignment.teamB) {
        await MatchTeamPlayers.create({
          match_team_id: teamB.id,
          user_id: playerId
        }, { transaction: t });
        
        // Mark player as sitting out next round
        const sessionPlayer = eligiblePlayers.find(ep => ep.player_id === playerId);
        if (sessionPlayer) {
          sessionPlayer.sitting_out_next = true;
          await sessionPlayer.save({ transaction: t });
        }
      }
      
      courtsData.push({
        court_number: courtNum,
        court_type: matchType
      });
      
      console.log(`[generateMatch] Court ${courtNum} assigned with ${courtAssignment.teamA.length + courtAssignment.teamB.length} players`);
    }
    
    const totalPlayersAssigned = assignedPlayers.reduce((sum, court) => sum + court.teamA.length + court.teamB.length, 0);
    
    await t.commit();
    console.log(`[generateMatch] Transaction committed successfully`);
    
    res.status(201).json({
      success: true,
      data: {
        match_id: match.id,
        session_id: match.session_id,
        match_type: match.match_type,
        courts_count: actualCourts,
        players_assigned: totalPlayersAssigned
      }
    });
    
  } catch (err) {
    console.error(`[generateMatch] Error: ${err.message}`, err);
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Smart player assignment algorithm
 * Considers: play time balance, partner diversity, opponent diversity, recent pairings
 */
function smartPlayerAssignment(eligiblePlayers, playerStats, partnerHistory, opponentHistory, recentMatches, currentMatchIndex, courtsNeeded, matchType) {
  const playersPerCourt = matchType === 'doubles' ? 4 : 2;
  const playersPerTeam = matchType === 'doubles' ? 2 : 1;
  const totalPlayersNeeded = courtsNeeded * playersPerCourt;
  
  // Sort players by priority (fewer matches played = higher priority)
  const sortedPlayers = [...eligiblePlayers].sort((a, b) => {
    const aStats = playerStats[a.player_id];
    const bStats = playerStats[b.player_id];
    
    // Primary: fewer matches played
    if (aStats.matchesPlayed !== bStats.matchesPlayed) {
      return aStats.matchesPlayed - bStats.matchesPlayed;
    }
    
    // Secondary: played less recently
    return aStats.lastMatchIndex - bStats.lastMatchIndex;
  });
  
  // Select players for this round
  const selectedPlayers = sortedPlayers.slice(0, totalPlayersNeeded).map(ep => ep.player_id);
  
  console.log(`[smartPlayerAssignment] Selected ${selectedPlayers.length} players for ${courtsNeeded} courts`);
  
  // For singles, simple pairing with opponent diversity consideration
  if (matchType === 'singles') {
    return assignSinglesMatches(selectedPlayers, opponentHistory, recentMatches, currentMatchIndex, courtsNeeded);
  }
  
  // For doubles, complex assignment considering partnerships and opponents
  return assignDoublesMatches(selectedPlayers, partnerHistory, opponentHistory, recentMatches, currentMatchIndex, courtsNeeded);
}

/**
 * Assign players for singles matches
 * Prioritizes opponent diversity and avoids recent opponents
 */
function assignSinglesMatches(players, opponentHistory, recentMatches, currentMatchIndex, courtsNeeded) {
  const assignments = [];
  const used = new Set();
  
  for (let court = 0; court < courtsNeeded && used.size < players.length - 1; court++) {
    let bestPair = null;
    let bestScore = -Infinity;
    
    // Try all possible pairs
    for (let i = 0; i < players.length; i++) {
      if (used.has(players[i])) continue;
      
      for (let j = i + 1; j < players.length; j++) {
        if (used.has(players[j])) continue;
        
        const p1 = players[i], p2 = players[j];
        const score = calculateOpponentScore(p1, p2, opponentHistory, recentMatches, currentMatchIndex);
        
        if (score > bestScore) {
          bestScore = score;
          bestPair = [p1, p2];
        }
      }
    }
    
    if (bestPair) {
      assignments.push({
        teamA: [bestPair[0]],
        teamB: [bestPair[1]]
      });
      used.add(bestPair[0]);
      used.add(bestPair[1]);
    }
  }
  
  return assignments;
}

/**
 * Assign players for doubles matches
 * Prioritizes partner diversity, opponent diversity, and avoids recent pairings
 */
function assignDoublesMatches(players, partnerHistory, opponentHistory, recentMatches, currentMatchIndex, courtsNeeded) {
  const assignments = [];
  const used = new Set();
  
  for (let court = 0; court < courtsNeeded && used.size <= players.length - 4; court++) {
    let bestMatch = null;
    let bestScore = -Infinity;
    
    // Try different team combinations
    for (let i = 0; i < players.length - 3; i++) {
      if (used.has(players[i])) continue;
      
      for (let j = i + 1; j < players.length - 2; j++) {
        if (used.has(players[j])) continue;
        
        for (let k = i + 1; k < players.length - 1; k++) {
          if (used.has(players[k]) || k === j) continue;
          
          for (let l = k + 1; l < players.length; l++) {
            if (used.has(players[l]) || l === j) continue;
            
            const teamA = [players[i], players[j]];
            const teamB = [players[k], players[l]];
            
            const score = calculateDoublesMatchScore(
              teamA, teamB, partnerHistory, opponentHistory, recentMatches, currentMatchIndex
            );
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = { teamA, teamB };
            }
          }
        }
      }
    }
    
    if (bestMatch) {
      assignments.push(bestMatch);
      bestMatch.teamA.forEach(p => used.add(p));
      bestMatch.teamB.forEach(p => used.add(p));
    }
  }
  
  return assignments;
}

/**
 * Calculate score for an opponent pairing (higher = better match)
 */
function calculateOpponentScore(p1, p2, opponentHistory, recentMatches, currentMatchIndex) {
  let score = 100;
  
  // Penalize if they've played against each other before
  const timesPlayed = opponentHistory[p1]?.[p2] || 0;
  score -= timesPlayed * 20;
  
  // Heavy penalty if they played against each other recently
  const p1Recent = recentMatches[p1] || [];
  const p2Recent = recentMatches[p2] || [];
  const playedRecently = p1Recent.some(idx => Math.abs(idx - currentMatchIndex) <= 1) &&
                         p2Recent.some(idx => Math.abs(idx - currentMatchIndex) <= 1);
  if (playedRecently && timesPlayed > 0) {
    score -= 50;
  }
  
  return score;
}

/**
 * Calculate score for a doubles match (higher = better match)
 */
function calculateDoublesMatchScore(teamA, teamB, partnerHistory, opponentHistory, recentMatches, currentMatchIndex) {
  let score = 100;
  
  // Partner diversity within teams - MUCH HIGHER PENALTY for repeated partners
  const teamAPartnerCount = partnerHistory[teamA[0]]?.[teamA[1]] || 0;
  const teamBPartnerCount = partnerHistory[teamB[0]]?.[teamB[1]] || 0;
  score -= (teamAPartnerCount + teamBPartnerCount) * 40; // Increased from 15 to 40
  
  // Exponential penalty for playing with same partner multiple times
  if (teamAPartnerCount >= 2) score -= teamAPartnerCount * 30;
  if (teamBPartnerCount >= 2) score -= teamBPartnerCount * 30;
  
  // Opponent diversity across teams - HIGHER PENALTY
  let opponentCount = 0;
  teamA.forEach(p1 => {
    teamB.forEach(p2 => {
      opponentCount += opponentHistory[p1]?.[p2] || 0;
    });
  });
  score -= opponentCount * 25; // Increased from 10 to 25
  
  // SEVERE penalty for recent pairings (partners or opponents)
  const allPlayers = [...teamA, ...teamB];
  const allPlayedRecently = allPlayers.every(p => {
    const recent = recentMatches[p] || [];
    return recent.some(idx => Math.abs(idx - currentMatchIndex) <= 1);
  });
  
  if (allPlayedRecently && (teamAPartnerCount > 0 || teamBPartnerCount > 0 || opponentCount > 0)) {
    score -= 100; // Increased from 40 to 100
  }
  
  // Bonus for new pairings (never played together)
  if (teamAPartnerCount === 0) score += 50;
  if (teamBPartnerCount === 0) score += 50;
  
  return score;
}

/**
 * POST /matches/:id/end
 * Mark a match as ended
 * 
 * Request body: { results: [{ match_court_id, winning_team: 'A'|'B' }] }
 * Response: { success, data: match }
 */
exports.endMatch = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { results = [] } = req.body;
    
    console.log(`[endMatch] Ending match ${id}`);
    console.log(`[endMatch] Results received:`, JSON.stringify(results, null, 2));
    
    const match = await Matches.findByPk(id, { transaction: t });
    if (!match) {
      console.error(`[endMatch] ERROR: Match ${id} not found`);
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Match not found' });
    }
    
    // Update match end time only if not already ended
    if (!match.ended_at) {
      match.ended_at = new Date();
      await match.save({ transaction: t });
      console.log(`[endMatch] Match ${id} marked as ended`);
    } else {
      console.log(`[endMatch] Match ${id} already ended, updating results only`);
    }
    
    console.log(`[endMatch] About to check results. Length: ${results.length}, Array:`, results);
    
    // Get all courts for this match to show valid court IDs
    const matchCourts = await MatchCourts.findAll({
      where: { match_id: id },
      attributes: ['id', 'court_number'],
      transaction: t
    });
    console.log(`[endMatch] Valid court IDs for match ${id}:`, matchCourts.map(c => `Court ${c.court_number} = ID ${c.id}`).join(', '));
    
    // Update team results if provided
    if (results.length > 0) {
      console.log(`[endMatch] Results array has items, processing...`);
      for (const result of results) {
        console.log(`[endMatch] Processing result for court ${result.match_court_id}, winning team: ${result.winning_team}`);
        
        if (!result.match_court_id || !result.winning_team) {
          console.error(`[endMatch] ERROR: Invalid result format - match_court_id: ${result.match_court_id}, winning_team: ${result.winning_team}`);
          continue;
        }
        
        if (result.winning_team !== 'A' && result.winning_team !== 'B') {
          console.error(`[endMatch] ERROR: Invalid winning_team value: ${result.winning_team}. Must be 'A' or 'B'`);
          continue;
        }
        
        const teams = await MatchTeams.findAll({
          where: { match_court_id: result.match_court_id },
          transaction: t
        });
        
        console.log(`[endMatch] Found ${teams.length} teams for court ${result.match_court_id}`);
        
        if (teams.length === 0) {
          console.error(`[endMatch] ERROR: No teams found for court ${result.match_court_id}`);
          continue;
        }
        
        for (const team of teams) {
          const wonValue = team.team === result.winning_team ? 1 : 0;
          console.log(`[endMatch] Team ${team.team}: comparing '${team.team}' === '${result.winning_team}' = ${team.team === result.winning_team}`);
          console.log(`[endMatch] Setting team ${team.team} (id: ${team.id}) won to: ${wonValue}`);
          console.log(`[endMatch] wonValue type: ${typeof wonValue}, value: ${wonValue}`);
          
          const [updateCount] = await MatchTeams.update(
            { won: wonValue },
            { 
              where: { id: team.id },
              transaction: t 
            }
          );
          
          if (updateCount === 0) {
            console.error(`[endMatch] ERROR: Failed to update team ${team.team} (id: ${team.id}). Update count: ${updateCount}`);
          } else {
            console.log(`[endMatch] Team ${team.team} updated successfully. Rows affected: ${updateCount}`);
          }
          
          // Verify the update by fetching the team again
          const updatedTeam = await MatchTeams.findByPk(team.id, { transaction: t });
          console.log(`[endMatch] VERIFICATION - Team ${team.team} (id: ${team.id}) won field after update: ${updatedTeam.won} (type: ${typeof updatedTeam.won})`);
        }
      }
    } else {
      console.log(`[endMatch] No results provided, won field will remain null for all teams`);
    }
    
    // Reset sitting_out_next flags for all players in this match
    const courts = await MatchCourts.findAll({
      where: { match_id: id },
      include: [{
        model: MatchTeams,
        as: 'teams',
        include: [{
          model: MatchTeamPlayers,
          as: 'players'
        }]
      }],
      transaction: t
    });
    
    if (courts.length === 0) {
      console.error(`[endMatch] ERROR: No courts found for match ${id}`);
    }
    
    const playerIds = new Set();
    courts.forEach(court => {
      court.teams.forEach(team => {
        team.players.forEach(player => {
          playerIds.add(player.user_id);
        });
      });
    });
    
    console.log(`[endMatch] Resetting sitting_out_next for ${playerIds.size} players`);
    
    const [resetCount] = await SessionPlayers.update(
      { sitting_out_next: false },
      {
        where: {
          session_id: match.session_id,
          player_id: Array.from(playerIds)
        },
        transaction: t
      }
    );
    
    console.log(`[endMatch] Reset sitting_out_next for ${resetCount} session players`);
    
    if (resetCount === 0 && playerIds.size > 0) {
      console.error(`[endMatch] ERROR: Failed to reset sitting_out_next flags. Expected ${playerIds.size}, updated ${resetCount}`);
    }
    
    console.log(`[endMatch] About to commit transaction`);
    await t.commit();
    console.log(`[endMatch] Transaction committed successfully for match ${id}`);
    
    // Verify final state outside transaction
    const courtIds = courts.map(c => c.id);
    console.log(`[endMatch] Verifying teams for court IDs: ${courtIds.join(', ')}`);
    const finalTeams = await MatchTeams.findAll({
      where: { match_court_id: { [Op.in]: courtIds } }
    });
    console.log(`[endMatch] FINAL VERIFICATION - Teams after commit:`);
    finalTeams.forEach(team => {
      console.log(`  Team ${team.team} (id: ${team.id}): won = ${team.won} (type: ${typeof team.won})`);
    });
    
    res.status(200).json({
      success: true,
      data: {
        match_id: match.id,
        ended_at: match.ended_at
      }
    });
    
  } catch (err) {
    console.error(`[endMatch] ERROR: ${err.message}`, err);
    console.error(`[endMatch] Stack trace:`, err.stack);
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /matches/:sessionId
 * List all matches for a session
 * 
 * Response: { success, data: matches[] }
 */
exports.getSessionMatches = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`[getSessionMatches] Fetching matches for session ${sessionId}`);
    
    const matches = await Matches.findAll({
      where: { session_id: sessionId },
      order: [['id', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: matches.map(m => ({
        id: m.id,
        session_id: m.session_id,
        match_type: m.match_type,
        ended_at: m.ended_at,
        status: m.ended_at ? 'completed' : 'active'
      }))
    });
    
  } catch (err) {
    console.error(`[getSessionMatches] Error: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /matches/:id/details
 * Get detailed match information including courts, teams, and players
 * 
 * Response: { success, data: { match, courts: [...] } }
 */
exports.getMatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[getMatchDetails] Fetching details for match ${id}`);
    
    const match = await Matches.findByPk(id, {
      include: [{
        model: MatchCourts,
        as: 'courts',
        include: [{
          model: MatchTeams,
          as: 'teams',
          include: [{
            model: MatchTeamPlayers,
            as: 'players',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }]
          }]
        }]
      }]
    });
    
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }
    
    // Format response
    const courtsData = match.courts.map(court => ({
      id: court.id,  // match_court_id - needed for submitting results
      court_number: court.court_number,
      court_type: court.court_type,
      teams: court.teams.map(team => ({
        team: team.team,
        won: team.won,
        players: team.players.map(p => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email
        }))
      }))
    }));
    
    res.status(200).json({
      success: true,
      data: {
        match: {
          id: match.id,
          session_id: match.session_id,
          match_type: match.match_type,
          ended_at: match.ended_at,
          status: match.ended_at ? 'completed' : 'active'
        },
        courts: courtsData
      }
    });
    
  } catch (err) {
    console.error(`[getMatchDetails] Error: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

