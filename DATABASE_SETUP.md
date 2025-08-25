# RadioCalico Database Setup

This document explains how to set up the PostgreSQL database for the RadioCalico rating system.

## Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and npm installed
3. **.env file** with database connection string

## Environment Setup

Create a `.env` file in the project root with your database connection:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/radiocalico
NODE_ENV=development
PORT=5000
```

## Database Setup

### Option 1: Automatic Setup (Recommended)

Run the setup script:

```bash
npm run setup-db
```

This script will:
- Create all necessary tables
- Set up database functions
- Run tests to verify everything works
- Clean up test data

### Option 2: Manual Setup

1. Create the database:
```sql
CREATE DATABASE radiocalico;
```

2. Run the SQL script manually:
```bash
psql -d radiocalico -f init-db.sql
```

### Option 3: API Endpoint

You can also initialize the database via the API:

```bash
# Start the server first
npm start

# Then call the init endpoint
curl -X POST http://localhost:5000/api/init-db
```

## Database Schema

### Tables Created

1. **users** - Stores user information
   - `id` (Serial Primary Key)
   - `user_id` (Unique VARCHAR)
   - `ip_address` (INET)
   - `user_agent` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **songs** - Stores song information
   - `id` (Serial Primary Key)
   - `song_id` (Unique VARCHAR)
   - `artist`, `title`, `album` (VARCHAR)
   - `created_at` (TIMESTAMP)

3. **song_ratings** - Stores user ratings
   - `id` (Serial Primary Key)
   - `user_id`, `song_id` (VARCHAR)
   - `rating` ('up' or 'down')
   - `created_at`, `updated_at` (TIMESTAMP)
   - Unique constraint on (user_id, song_id)

### Views and Functions

- **song_rating_summary** - View with aggregated ratings
- **upsert_song_rating()** - Function to save/update ratings
- **get_song_rating()** - Function to get rating summary
- **get_user_vote()** - Function to get user's vote for a song

## API Endpoints

### User Management
- `POST /api/users/register` - Register/update user
- Body: `{ "user_id": "unique_user_id" }`

### Song Ratings
- `POST /api/ratings` - Submit a rating
- Body: `{ "user_id": "user123", "artist": "Artist Name", "title": "Song Title", "album": "Album Name", "rating": "up" }`

- `GET /api/ratings/:artist/:title?user_id=user123` - Get song rating
- Returns: `{ "thumbs_up": 5, "thumbs_down": 2, "user_vote": "up" }`

- `GET /api/ratings/top?limit=10` - Get top rated songs

### Database Management
- `POST /api/init-db` - Initialize database tables
- `GET /api/health` - Check database connection

## Usage in Frontend

The radio player now automatically:
1. Generates unique user IDs stored in localStorage
2. Registers users with the database
3. Saves ratings to PostgreSQL
4. Displays real-time vote counts from all users
5. Prevents duplicate voting (users can change their vote)

## Testing

After setup, test the system:

1. Start the server: `npm start`
2. Open the radio player: `http://localhost:5000/radio-player.html`
3. Rate some songs and verify counts update
4. Check the database: `SELECT * FROM song_rating_summary;`

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `ps aux | grep postgres`
- Check connection string in `.env`
- Ensure database exists: `psql -l`

### Permission Issues
- Make sure user has CREATE privileges
- Check if tables exist: `\dt` in psql

### API Errors
- Check server logs for detailed error messages
- Verify all required fields are being sent
- Use browser dev tools to inspect API calls

## Production Considerations

For production deployment:

1. **Security**: Use connection pooling, SSL, and proper user permissions
2. **Indexes**: The setup includes performance indexes
3. **Backup**: Set up regular database backups
4. **Monitoring**: Monitor database performance and connection counts
5. **Rate Limiting**: Consider rate limiting the API endpoints
6. **CORS**: Configure CORS properly for your domain