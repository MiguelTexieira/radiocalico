# RadioCalico Project Information

## Project Structure
```
radiocalico/
├── DATABASE_SETUP.md        # Database setup documentation
├── README.md                 # Project readme
├── CLAUDE.md                 # This file - project reference for AI assistants
├── RadioCalicoLayout.png     # Layout design reference
├── RadioCalicoLogoTM.png     # Official logo with trademark
├── RadioCalicoStyle.zip      # Style assets archive
├── RadioCalico_Style_Guide.txt # Text version of style guide
├── db.js                     # SQLite database connection module
├── init-db.sql               # SQLite database schema
├── node_modules/             # Dependencies
├── package-lock.json         # Dependency lock file
├── package.json              # Project dependencies and scripts
├── public/                   # Static files served by Express
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── database-viewer.html # Admin interface for viewing ratings
│   ├── index.html           # Main radio streaming interface (formerly radio-player.html)
│   ├── js/
│   │   └── main.js          # Main JavaScript file
│   └── logo.png             # Logo used in web pages
├── server.js                 # Express server with API endpoints
├── setup-db.js               # Database initialization script
├── stream_URL.txt            # Streaming URL configuration
└── views/
    └── index.ejs            # EJS template (currently unused)
```

## Database
- **Type**: SQLite3
- **Database file**: `radiocalico.db`
- **Configuration**: Set `DATABASE_PATH` environment variable to customize location

## Project Assets

### Logo
- **Location**: `/Users/miguel.teixeira/Code/radiocalico/RadioCalicoLogoTM.png`
- The Radio Calico logo features a calico cat wearing headphones and sunglasses in a circular mint green background

### Style Guide
- **Text version**: `/Users/miguel.teixeira/Code/radiocalico/RadioCalico_Style_Guide.txt`
- Contains the complete branding guidelines and color scheme for the RadioCalico project

### Brand Colors
- Mint: #d8f2d5
- Forest Green: #1f4e23
- Teal: #38a29d
- Calico Orange: #efa63c
- Charcoal: #231f20
- Cream: #f5eada
- White: #ffffff

## Key Files
- **Radio Player**: `/public/index.html` - Main streaming interface
- **Database Viewer**: `/public/database-viewer.html` - Admin interface for viewing ratings
- **Server**: `server.js` - Express server with SQLite integration
- **Database Schema**: `init-db.sql` - SQLite database structure

## Development Commands
- `npm install` - Install dependencies
- `npm run setup-db` - Initialize SQLite database
- `npm start` - Start the server (port 5000)
- `npm run dev` - Start with nodemon for development

## Recent Changes
- Converted from PostgreSQL to SQLite3 for better portability
- Debug controls hidden on radio player page for cleaner UI
- Refactored radio-player.html to public/index.html as main entry point
- Removed root route from server.js (now served as static file)