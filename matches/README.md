# Badminton Match Management API

Complete RESTful API for managing badminton matches with intelligent player assignment, court management, and team tracking.

## Database Schema

### Tables

#### 1. matches
```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  match_type VARCHAR(50) NOT NULL, -- 'singles' or 'doubles'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP NULL
);
```

#### 2. match_courts
```sql
CREATE TABLE match_courts (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  court_number INTEGER NOT NULL,
  court_type VARCHAR(50) NOT NULL -- 'singles' or 'doubles'
);
```

#### 3. match_teams
```sql
CREATE TABLE match_teams (
  id SERIAL PRIMARY KEY,
  match_court_id INTEGER NOT NULL REFERENCES match_courts(id),
  team VARCHAR(1) NOT NULL, -- 'A' or 'B'
  won BOOLEAN NULL DEFAULT NULL
);
```

#### 4. match_team_players
```sql
CREATE TABLE match_team_players (
  id SERIAL PRIMARY KEY,
  match_team_id INTEGER NOT NULL REFERENCES match_teams(id),
  user_id INTEGER NOT NULL REFERENCES users(id)
);
```

#### 5. session_players (updated)
```sql
CREATE TABLE session_players (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  player_id INTEGER NOT NULL REFERENCES users(id),
  joined_at VARCHAR(255) NOT NULL,
  left_at VARCHAR(255) NULL,
  sitting_out_next BOOLEAN NOT NULL DEFAULT false
);
```

#### 6. sessions (updated)
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  date VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  size INTEGER NOT NULL,
  start_time VARCHAR(255) NOT NULL,
  end_time VARCHAR(255) NOT NULL,
  ended_at VARCHAR(255) NULL,
  group_id INTEGER REFERENCES groups(id),
  preferred_match_type VARCHAR(50) NULL DEFAULT 'doubles' -- 'singles' or 'doubles'
);
```

## API Endpoints

### 1. Generate Match

**POST** `/matches/generate`

Intelligently generates a match for a session with automatic player assignment to courts and teams.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "session_id": 1,
  "available_courts": 2
}
```

**Parameters:**
- `session_id` (required): ID of the session
- `available_courts` (optional): Number of courts available (default: 1)

**Logic:**
1. Fetches all eligible players (not sitting out, still in session)
2. Determines match type based on session's `preferred_match_type`
3. Falls back to singles if insufficient players for doubles
4. Shuffles players randomly for fair assignment
5. Assigns players to courts and teams (Team A vs Team B)
6. Marks assigned players with `sitting_out_next = true`
7. Creates match, courts, teams, and player assignments transactionally

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "match_id": 1,
    "session_id": 1,
    "match_type": "doubles",
    "courts_count": 2,
    "players_assigned": 8,
    "created_at": "2026-01-29T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Session not found
- `400`: Not enough eligible players
- `500`: Server error

---

### 2. End Match

**POST** `/matches/:id/end`

Marks a match as ended and optionally records winning teams.

**Authentication:** Required (JWT)

**URL Parameters:**
- `id`: Match ID

**Request Body:**
```json
{
  "results": [
    {
      "match_court_id": 1,
      "winning_team": "A"
    },
    {
      "match_court_id": 2,
      "winning_team": "B"
    }
  ]
}
```

**Parameters:**
- `results` (optional): Array of court results with winning team

**Logic:**
1. Validates match exists and is not already ended
2. Sets `ended_at` timestamp
3. Updates team `won` status based on results
4. Resets `sitting_out_next = false` for all players in the match

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "match_id": 1,
    "ended_at": "2026-01-29T11:15:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Match not found
- `400`: Match already ended
- `500`: Server error

---

### 3. Get Session Matches

**GET** `/matches/session/:sessionId`

Lists all matches (active and completed) for a specific session.

**Authentication:** Required (JWT)

**URL Parameters:**
- `sessionId`: Session ID

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "session_id": 1,
      "match_type": "doubles",
      "created_at": "2026-01-29T11:00:00.000Z",
      "ended_at": null,
      "status": "active"
    },
    {
      "id": 1,
      "session_id": 1,
      "match_type": "doubles",
      "created_at": "2026-01-29T10:30:00.000Z",
      "ended_at": "2026-01-29T11:15:00.000Z",
      "status": "completed"
    }
  ]
}
```

**Error Responses:**
- `500`: Server error

---

### 4. Get Match Details

**GET** `/matches/:id/details`

Retrieves comprehensive match information including courts, teams, and players.

**Authentication:** Required (JWT)

**URL Parameters:**
- `id`: Match ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "match": {
      "id": 1,
      "session_id": 1,
      "match_type": "doubles",
      "created_at": "2026-01-29T10:30:00.000Z",
      "ended_at": "2026-01-29T11:15:00.000Z",
      "status": "completed"
    },
    "courts": [
      {
        "court_number": 1,
        "court_type": "doubles",
        "teams": [
          {
            "team": "A",
            "won": true,
            "players": [
              {
                "id": 5,
                "name": "John Doe",
                "email": "john@example.com"
              },
              {
                "id": 8,
                "name": "Jane Smith",
                "email": "jane@example.com"
              }
            ]
          },
          {
            "team": "B",
            "won": false,
            "players": [
              {
                "id": 3,
                "name": "Bob Wilson",
                "email": "bob@example.com"
              },
              {
                "id": 12,
                "name": "Alice Brown",
                "email": "alice@example.com"
              }
            ]
          }
        ]
      },
      {
        "court_number": 2,
        "court_type": "doubles",
        "teams": [
          {
            "team": "A",
            "won": false,
            "players": [
              {
                "id": 7,
                "name": "Charlie Davis",
                "email": "charlie@example.com"
              },
              {
                "id": 15,
                "name": "Diana Evans",
                "email": "diana@example.com"
              }
            ]
          },
          {
            "team": "B",
            "won": true,
            "players": [
              {
                "id": 9,
                "name": "Frank Miller",
                "email": "frank@example.com"
              },
              {
                "id": 11,
                "name": "Grace Lee",
                "email": "grace@example.com"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
- `404`: Match not found
- `500`: Server error

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The JWT token should be obtained through your authentication endpoints and contain the user's ID.

---

## Match Generation Algorithm

### Player Eligibility
- Players must be in the session (`session_players`)
- Must not have `left_at` set (still active)
- Must have `sitting_out_next = false`

### Match Type Selection
1. Check session's `preferred_match_type`
2. Verify sufficient players for selected type:
   - **Doubles**: 4 players per court (2 vs 2)
   - **Singles**: 2 players per court (1 vs 1)
3. Fallback to singles if insufficient players for doubles

### Court Assignment
- Maximum courts = `min(available_courts, floor(eligible_players / players_per_court))`
- Players randomly shuffled for fair distribution
- Each court gets Team A and Team B

### Sitting Out Logic
- Players assigned to a match have `sitting_out_next` set to `true`
- When match ends, all participating players reset to `sitting_out_next = false`
- Next match generation prioritizes players who sat out

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

Common error codes:
- `400`: Bad request (validation errors, business logic violations)
- `404`: Resource not found
- `500`: Internal server error

---

## Transactional Integrity

All write operations use database transactions to ensure:
- Match creation includes all related courts, teams, and players
- Match ending updates all affected records atomically
- Failures rollback all changes

---

## Best Practices

### Generating Matches
1. Always provide `available_courts` based on physical court availability
2. Consider session's `preferred_match_type` when planning
3. Monitor eligible player count before generation
4. Handle edge cases (odd player counts, insufficient players)

### Ending Matches
1. Record results promptly after match completion
2. Optionally include winning team data for statistics
3. Verify match is not already ended

### Querying Matches
1. Use `/matches/session/:sessionId` for session-level views
2. Use `/matches/:id/details` for comprehensive match data
3. Cache match details for completed matches

---

## Example Usage Flow

```javascript
// 1. Generate a match for session
const generateResponse = await fetch('/matches/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id: 1,
    available_courts: 2
  })
});

const { data: matchData } = await generateResponse.json();
// matchData.match_id = 1

// 2. Get match details
const detailsResponse = await fetch('/matches/1/details', {
  headers: { 'Authorization': 'Bearer <token>' }
});

// 3. End match with results
await fetch('/matches/1/end', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    results: [
      { match_court_id: 1, winning_team: 'A' },
      { match_court_id: 2, winning_team: 'B' }
    ]
  })
});

// 4. List all session matches
const matchesResponse = await fetch('/matches/session/1', {
  headers: { 'Authorization': 'Bearer <token>' }
});
```

---

## Testing Considerations

### Unit Tests
- Test match type selection logic
- Test player eligibility filtering
- Test sitting out flag management
- Test transaction rollback scenarios

### Integration Tests
- Test full match generation flow
- Test concurrent match generation
- Test match ending with/without results
- Test edge cases (1 player, odd numbers)

### Load Tests
- Concurrent match generations
- Large player pools
- Multiple simultaneous matches

---

## Future Enhancements

- **Skill-based matching**: Assign players based on skill levels
- **Player preferences**: Respect player partnership preferences
- **Court rotation**: Automatic court rotation between matches
- **Match history**: Track player statistics and win rates
- **Scheduling**: Auto-schedule matches at optimal intervals
