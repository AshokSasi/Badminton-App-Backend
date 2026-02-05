const sequelize = require('../database/database');
const defineSession = require('../common/models/Sessions');
const defineSessionPlayers = require('../common/models/SessionPlayers');
const defineUser = require('../common/models/User');

const { Sessions, User, SessionPlayers, Matches, MatchCourts, MatchTeams, MatchTeamPlayers, Group } = require('../common/models');

// Load push notification service if available
let sendNotificationToGroup = null;
try {
  const pushService = require('../common/pushNotificationService');
  sendNotificationToGroup = pushService.sendNotificationToGroup;
} catch (error) {
  console.log('Push notification service not available');
}

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const currentPlayers = await SessionPlayers.count({
      where: { session_id: id }
    });
    res.status(200).json({
      success: true,
      data: { id: session.id, location: session.location, size: session.size, current_players: currentPlayers, start_time: session.start_time, end_time: session.end_time, ended_at: session.ended_at, group_id: session.group_id } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.joinSession = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { sessionId } = req.params;
    const userId = req.userId;
    console.log(`[joinSession] Starting - SessionID: ${sessionId}, UserID: ${userId}`);
    
    
    const session = await Sessions.findByPk(sessionId, { transaction: t });
    if (!session) {
      console.log(`[joinSession] Session not found - SessionID: ${sessionId}`);
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    console.log(`[joinSession] Session found - Size: ${session.size}`);
    
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      console.log(`[joinSession] User not found - UserID: ${userId}`);
      await t.rollback();
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.log(`[joinSession] User validated - UserID: ${userId}`);
    
    // Check current player count
    const currentPlayerCount = await SessionPlayers.count({
      where: { session_id: sessionId },
      transaction: t
    });
    console.log(`[joinSession] Current players: ${currentPlayerCount}/${session.size}`);
    
    if (currentPlayerCount >= session.size) {
      console.log(`[joinSession] Session full - SessionID: ${sessionId}`);
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Session is full' });
    }
    
    await SessionPlayers.create({
      session_id: sessionId,
      player_id: userId,
      joined_at: new Date().toISOString()
    }, { transaction: t });
    console.log(`[joinSession] Player added to session - SessionID: ${sessionId}, UserID: ${userId}`);
    
    await t.commit();
    console.log(`[joinSession] Transaction committed successfully`);
    
    res.status(200).json({
      success: true,
      message: 'User joined the session successfully',
      current_players: currentPlayerCount + 1,
      total_spots: session.size
    });
  } catch (err) {
    console.error(`[joinSession] Error: ${err.message}`, err);
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    console.log('[createSession] Starting - Request body:', req.body);
    const { date, location, size, start_time, end_time, ended_at, group_id } = req.body;
    
    console.log('[createSession] Creating session...');
    const session = await Sessions.create({
      date,
      location,
      size,
      start_time,
      end_time,
      ended_at,
      group_id
    });
    console.log('[createSession] Session created:', session.id);

    // Send push notifications to all group members
    if (group_id && sendNotificationToGroup) {
      // Run notifications in background - don't block response
      setImmediate(async () => {
        try {
          // Only send notifications if VAPID keys are configured
          if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            // Get group details for notification
            const group = await Group.findByPk(group_id);
            const groupName = group ? group.name : 'Your group';
            
            const notificationPayload = {
              title: 'New Session Created! 🏸',
              body: `A new badminton session has been created in ${groupName}`,
              data: {
                type: 'new_session',
                session_id: session.id,
                group_id: group_id,
                location: location,
                start_time: start_time,
                url: `/sessions/${session.id}` // Your frontend route
              },
              icon: '/icon-192x192.png', // Add your app icon path
              badge: '/badge-72x72.png' // Add your badge icon path
            };

            // Send notifications asynchronously (don't wait for completion)
            sendNotificationToGroup(group_id, notificationPayload)
              .then(result => {
                console.log(`Session ${session.id} notifications sent: ${result.totalSent} successful, ${result.totalFailed} failed`);
              })
              .catch(error => {
                console.error(`Error sending notifications for session ${session.id}:`, error);
              });
          } else {
            console.log('Push notifications not configured - skipping notification sending');
          }
        } catch (notificationError) {
          console.error('Error preparing push notifications:', notificationError);
        }
      });
    }

    console.log('[createSession] Sending response...');
    res.status(201).json({
      success: true,
      data: { id: session.id, date: session.date, location: session.location, size: session.size, start_time: session.start_time, end_time: session.end_time, ended_at: session.ended_at, group_id: session.group_id }
    });
    console.log('[createSession] Response sent successfully');
  } catch (err) {
    console.error('[createSession] ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.checkUserInSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    console.log(`[checkUserInSession] Checking - SessionID: ${id}, UserID: ${userId}`);
    
    const sessionPlayer = await SessionPlayers.findOne({
      where: {
        session_id: id,
        player_id: userId
      }
    });
    
    const currentPlayers = await SessionPlayers.count({
      where: { session_id: id }
    });
    
    const hasJoined = !!sessionPlayer;
    console.log(`[checkUserInSession] Result - UserID: ${userId}, HasJoined: ${hasJoined}, CurrentPlayers: ${currentPlayers}`);
    
    res.status(200).json({
      success: true,
      has_joined: hasJoined,
      current_players: currentPlayers
    });
  } catch (err) {
    console.error(`[checkUserInSession] Error: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSessionPlayers = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[getSessionPlayers] Fetching players - SessionID: ${id}`);
    
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const players = await SessionPlayers.findAll({
      where: { session_id: id },
      include: [{
        model: User,
        as: 'player',
        attributes: ['id', 'name', 'email']
      }],
      order: [['joined_at', 'ASC']]
    });
    
    const playersData = players.map(sp => ({
      id: sp.player.id,
      name: sp.player.name,
      email: sp.player.email,
      joined_at: sp.joined_at
    }));
    
    console.log(`[getSessionPlayers] Found ${playersData.length} players in SessionID: ${id}`);
    
    res.status(200).json({
      success: true,
      data: playersData,
      total_players: playersData.length
    });
  } catch (err) {
    console.error(`[getSessionPlayers] Error: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSessionEndAt = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    // Set ended_at as a string in EST timezone, formatted as 'YYYY-MM-DD HH:mm:ss.SSS'
    const now = new Date();
    const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const pad = (n, z = 2) => ('' + n).padStart(z, '0');
    const formatted = `${estDate.getFullYear()}-${pad(estDate.getMonth() + 1)}-${pad(estDate.getDate())} ${pad(estDate.getHours())}:${pad(estDate.getMinutes())}:${pad(estDate.getSeconds())}.${pad(estDate.getMilliseconds(), 3)}`;
    session.ended_at = formatted;
    await session.save();
    res.status(200).json({
      success: true,
      data: { date: session.ended_at }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.leaveSession = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.userId;
    console.log(`[leaveSession] Starting - SessionID: ${id}, UserID: ${userId}`);
    
    const session = await Sessions.findByPk(id, { transaction: t });
    if (!session) {
      console.log(`[leaveSession] Session not found - SessionID: ${id}`);
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    console.log(`[leaveSession] Session found - Size: ${session.size}`);
    
    const sessionPlayer = await SessionPlayers.findOne({
      where: {
        session_id: id,
        player_id: userId
      },
      transaction: t
    });
    
    if (!sessionPlayer) {
      console.log(`[leaveSession] User not in session - SessionID: ${id}, UserID: ${userId}`);
      await t.rollback();
      return res.status(400).json({ success: false, error: 'User is not in this session' });
    }
    
    await sessionPlayer.destroy({ transaction: t });
    console.log(`[leaveSession] Player removed from session - SessionID: ${id}, UserID: ${userId}`);
    
    // Check current player count after removal
    const currentPlayerCount = await SessionPlayers.count({
      where: { session_id: id },
      transaction: t
    });
    
    await t.commit();
    console.log(`[leaveSession] Transaction committed successfully`);
    
    res.status(200).json({
      success: true,
      message: 'User left the session successfully',
      current_players: currentPlayerCount,
      total_spots: session.size
    });
  } catch (err) {
    console.error(`[leaveSession] Error: ${err.message}`, err);
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSessionStats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[getSessionStats] Fetching stats - SessionID: ${id}`);
    
    // Verify session exists
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Get all matches for this session with all related data
    const matches = await Matches.findAll({
      where: { session_id: id },
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
    
    // Calculate stats per player
    const playerStats = {};
    
    matches.forEach(match => {
      match.courts.forEach(court => {
        court.teams.forEach(team => {
          team.players.forEach(player => {
            const userId = player.user_id;
            
            if (!playerStats[userId]) {
              playerStats[userId] = {
                user_id: userId,
                name: player.user.name,
                email: player.user.email,
                wins: 0,
                losses: 0,
                matches_played: 0
              };
            }
            
            // Only count if match has results (won is not null)
            if (team.won !== null) {
              playerStats[userId].matches_played++;
              if (team.won === 1) {
                playerStats[userId].wins++;
              } else {
                playerStats[userId].losses++;
              }
            }
          });
        });
      });
    });
    
    const stats = Object.values(playerStats);
    
    // Count total matches (each court counts as one match)
    let totalMatches = 0;
    matches.forEach(match => {
      totalMatches += match.courts.length;
    });
    
    console.log(`[getSessionStats] Generated stats for ${stats.length} players in SessionID: ${id}, Total matches: ${totalMatches}`);
    
    res.status(200).json({
      success: true,
      data: stats,
      total_matches: totalMatches
    });
    
  } catch (err) {
    console.error(`[getSessionStats] Error: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSessionPairStats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[getSessionPairStats] Fetching pair stats - SessionID: ${id}`);
    
    // Verify session exists
    const session = await Sessions.findByPk(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Get all matches for this session with all related data
    const matches = await Matches.findAll({
      where: { session_id: id },
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
    
    // Calculate pair stats (for doubles matches)
    const pairStats = {};
    
    matches.forEach(match => {
      match.courts.forEach(court => {
        court.teams.forEach(team => {
          // Only process doubles teams (2 players) with results
          if (team.players.length === 2 && team.won !== null) {
            const playerData = team.players.map(p => ({
              id: p.user_id,
              name: p.user.name,
              email: p.user.email
            }));
            
            // Sort player IDs to ensure consistent pair identification
            const sortedIds = playerData.map(p => p.id).sort((a, b) => a - b);
            const pairKey = sortedIds.join('-');
            
            if (!pairStats[pairKey]) {
              pairStats[pairKey] = {
                player1: playerData.find(p => p.id === sortedIds[0]),
                player2: playerData.find(p => p.id === sortedIds[1]),
                wins: 0,
                losses: 0,
                matches_played: 0
              };
            }
            
            pairStats[pairKey].matches_played++;
            if (team.won === 1) {
              pairStats[pairKey].wins++;
            } else {
              pairStats[pairKey].losses++;
            }
          }
        });
      });
    });
    
    const pairs = Object.values(pairStats);
    console.log(`[getSessionPairStats] Generated stats for ${pairs.length} pairs in SessionID: ${id}`);
    
    res.status(200).json({
      success: true,
      data: pairs
    });
    
  } catch (err) {
    console.error(`[getSessionPairStats] Error: ${err.message}`, err);
    res.status(500).json({ success: false, error: err.message });
  }
};

