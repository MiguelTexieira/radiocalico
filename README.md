# RadioCalico - Lossless Streaming Radio Player

A modern web-based radio player for streaming high-quality lossless audio with real-time metadata, user ratings, and a responsive design following RadioCalico brand guidelines.

## Features

### 🎵 Audio Streaming
- **HLS (HTTP Live Streaming)** support with automatic fallback
- **Multiple codec support**: FLAC lossless, AAC Hi-Fi
- **Smart stream fallback**: Automatically tries AAC first for maximum compatibility, falls back to FLAC
- **Real-time audio quality display**: Shows source and stream quality (16-bit/24-bit, 44.1kHz/48kHz)

### 🎨 Modern User Interface
- **RadioCalico brand styling**: Custom color palette (Mint, Forest Green, Teal, Calico Orange)
- **Typography**: Montserrat for headings, Open Sans for body text
- **Responsive design**: Works on desktop and mobile devices
- **Full-width header**: Dark header with centered logo spanning entire viewport
- **Two-column layout**: Large album artwork on left, song information on right
- **Mint green footer**: Full-width previous tracks section

### 📻 Real-Time Metadata
- **Live track information**: Artist, title, album, release year
- **Automatic updates**: Fetches new metadata every 5 seconds
- **Previous tracks widget**: Shows last 5 played tracks
- **Album artwork**: Automatically refreshes with each new track
- **Quality indicators**: Displays both source and stream quality information

### 👍 User Rating System
- **Thumbs up/down ratings**: Users can rate each track
- **PostgreSQL database**: Persistent storage of all ratings and user data
- **Vote deduplication**: Prevents users from rating the same song multiple times
- **Real-time vote counts**: Shows current rating totals
- **Session management**: Unique user IDs stored in localStorage

### 🔧 Technical Features
- **Express.js backend**: RESTful API for user management and ratings
- **Database integration**: PostgreSQL with custom functions for atomic operations
- **CORS handling**: Proper cross-origin request support
- **Error handling**: Comprehensive error recovery and user feedback
- **Debug logging**: Detailed logging for troubleshooting

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- NPM or Yarn package manager

### Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd radiocalico
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with your database configuration:
```env
DATABASE_URL=postgresql://username:password@localhost/radiocalico_dev
PORT=5000
NODE_ENV=development
```

4. Initialize the database:
```bash
# Run the database initialization
curl -X POST http://localhost:5000/api/init-db
```

5. Start the server:
```bash
node server.js
```

6. Open the radio player:
Navigate to `http://localhost:5000/radio-player.html`

## API Endpoints

### User Management
- `POST /api/users/register` - Register a new user
- `GET /api/health` - Check server and database health

### Rating System
- `POST /api/ratings` - Submit a song rating (up/down)
- `GET /api/ratings/:artist/:title` - Get rating data for a specific song
- `GET /api/ratings/top` - Get top-rated songs with minimum vote threshold

### Admin & Monitoring
- `GET /api/admin/data` - Get complete database overview (songs, users, votes)
- `GET /api/test` - Database connection test

## Database Schema

### Tables
- **users**: User sessions with IP tracking
- **songs**: Track metadata (artist, title, album)
- **song_ratings**: User votes (thumbs up/down)

### Views
- **song_rating_summary**: Aggregated rating statistics per song

### Functions
- `upsert_song_rating()`: Atomic rating updates with deduplication
- `get_song_rating()`: Retrieve rating summary for a song
- `get_user_vote()`: Check user's existing vote

## Stream Configuration

The player supports multiple stream URLs with automatic fallback:

1. **AAC Hi-Fi** (Primary): `aac_hifi.m3u8` - Most compatible
2. **Master Playlist**: `live.m3u8` - Auto-quality selection
3. **FLAC Lossless**: `flac_hires.m3u8` - Highest quality, limited browser support

Metadata is fetched from: `metadatav2.json`
Album artwork from: `cover.jpg`

## Brand Guidelines

### Color Palette
- **Mint**: #D8F2D5 (Backgrounds, accents)
- **Forest Green**: #1F4E23 (Headers, primary buttons)
- **Teal**: #38A29D (Navigation, controls)
- **Calico Orange**: #EFA63C (Call-to-action elements)
- **Charcoal**: #231F20 (Body text, outlines)
- **Cream**: #F5EADA (Secondary backgrounds)
- **White**: #FFFFFF (Text on dark backgrounds)

### Typography
- **Headings**: Montserrat (500, 600, 700 weights)
- **Body Text**: Open Sans (400, 600 weights)
- **Fallback**: System fonts for maximum compatibility

## Recent Changes & Updates

### Layout Redesign
- ✅ Full-width header with centered logo
- ✅ Two-column main layout (album art + song info)
- ✅ Removed year badge overlay from album artwork
- ✅ Smaller, dark grey audio controls widget
- ✅ Full-width mint green footer for previous tracks
- ✅ Centered track listings with improved spacing

### Functionality Improvements
- ✅ Fixed metadata initialization on page load
- ✅ Resolved JavaScript execution issues
- ✅ Improved error handling and debugging
- ✅ Enhanced rating system reliability
- ✅ Better stream fallback mechanism
- ✅ Real-time metadata synchronization

### Bug Fixes
- ✅ Fixed volumeLabel reference error
- ✅ Resolved DOM element access issues
- ✅ Fixed rating button functionality
- ✅ Corrected initial track display mismatch
- ✅ Improved album art refresh timing

## File Structure

```
radiocalico/
├── public/
│   ├── radio-player.html      # Main radio player interface
│   ├── database-viewer.html   # Admin database viewer
│   └── logo.png              # RadioCalico logo
├── server.js                  # Express.js server
├── init-db.sql              # Database schema and functions
├── db.js                    # Database connection module
├── RadioCalico_Style_Guide.txt # Brand guidelines
└── README.md                # This file
```

## Development & Debugging

The radio player includes comprehensive debug logging:
- Enable debug mode by making `.debug-controls` visible
- Check browser console for detailed error messages
- Monitor metadata fetch status and timing
- Track user interactions and rating submissions

## Browser Compatibility

- **Chrome/Edge**: Full support (HLS.js)
- **Firefox**: Full support (HLS.js)
- **Safari**: Native HLS support
- **Mobile browsers**: Responsive design with touch-friendly controls

## Managing Services

### PostgreSQL:
```bash
# Start
brew services start postgresql@16

# Stop
brew services stop postgresql@16

# Status
brew services list
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm install` - Install dependencies

## Quick Start

### Start the server:
```bash
node server.js
```

### Access the application:
- **Radio Player**: http://localhost:5000/radio-player.html
- **Database Admin**: http://localhost:5000/database-viewer.html
- **Health check**: http://localhost:5000/api/health
- **Database info**: http://localhost:5000/api/test

## Technologies Used

- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Powerful open-source database
- **HLS.js** - JavaScript HLS client library
- **Morgan** - HTTP request logger
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management
- **pg** - PostgreSQL client for Node.js

## Contributing

1. Follow the established brand guidelines
2. Maintain responsive design principles
3. Test across multiple browsers
4. Include comprehensive error handling
5. Update documentation for new features

## License

[Add your license information here]

## Support

For issues or questions:
- Check the debug log in the browser
- Review server logs for API errors
- Verify database connectivity
- Test stream URLs for availability