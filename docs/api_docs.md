# Spotify-Style Microservices API Documentation

This document describes the REST API endpoints exposed by the **Auth Service** (Port 5000) and the **Music Service** (Port 5002) through the Nginx gateway (Port 3000).

---

## 🔐 Auth Service APIs (`/api/auth`)

All auth endpoints set or read the `token` cookie.

### 1. User Registration (`POST /signup`)
Create a new user with a specified role.

**Request Body:**
```json
{
  "name": "Alex Mercer",
  "email": "alex@example.com",
  "password": "securepassword123",
  "role": "USER" // Or "ARTIST"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "64ef2a188f1...",
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "provider": "local",
    "role": "USER",
    "createdAt": "2026-06-09T09:00:00.000Z"
  }
}
```

---

### 2. User Login (`POST /login`)
Authenticate with email and password.

**Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome back!",
  "user": {
    "id": "64ef2a188f1...",
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "provider": "local",
    "role": "USER",
    "createdAt": "2026-06-09T09:00:00.000Z"
  }
}
```

---

### 3. Get Current User (`GET /me`)
Fetch the authenticated user's session data. Requires JWT cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "64ef2a188f1...",
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "provider": "local",
    "role": "USER",
    "createdAt": "2026-06-09T09:00:00.000Z"
  }
}
```

---

### 4. Logout (`POST /logout`)
Clear the JWT token cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🎵 Music Service APIs (`/api`)

Requires an active JWT token cookie.

### 1. Create Playlist (`POST /playlists`)
Create a playlist with a cover image. **Artist only.**

**Headers:**
`Content-Type: multipart/form-data`

**Body Params:**
- `title` (text): Playlist Title
- `description` (text): Description text
- `coverImage` (file): Cover image binary

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Playlist created successfully",
  "playlist": {
    "_id": "64ef4821a22...",
    "title": "Summer Vibes",
    "description": "Chill beats for summer nights",
    "coverImageUrl": "covers/1780829103_summer.png",
    "artistId": "64ef2a188f1...",
    "artistName": "Alex Mercer",
    "songs": []
  }
}
```

---

### 2. Upload Song (`POST /songs`)
Upload a song track and album art. **Artist only.**

**Headers:**
`Content-Type: multipart/form-data`

**Body Params:**
- `title` (text): Song Title
- `duration` (text): Duration in seconds (e.g. `210`)
- `genre` (text): e.g. `Pop`, `Jazz`
- `playlistId` (text, optional): Associated playlist ID
- `coverImageFile` (file): Track artwork binary
- `audioFile` (file): Audio file track binary (mp3, wav, etc.)

**Response (210 Created):**
```json
{
  "success": true,
  "message": "Music uploaded successfully",
  "song": {
    "_id": "64ef5133a88...",
    "title": "Midnight Ride",
    "artistName": "Alex Mercer",
    "coverImageUrl": "covers/1780830112_art.png",
    "audioUrl": "audio/1780830112_track.mp3",
    "duration": 210,
    "genre": "Synthwave",
    "playlistId": "64ef4821a22...",
    "uploadedBy": "64ef2a188f1..."
  }
}
```

---

### 3. Get Playlist Details (`GET /playlists/:id`)
Retrieve playlist metadata and populates song details with pre-signed S3 download/streaming URLs (valid for 1 hour).

**Response (200 OK):**
```json
{
  "success": true,
  "playlist": {
    "_id": "64ef4821a22...",
    "title": "Summer Vibes",
    "description": "Chill beats for summer nights",
    "coverImageUrl": "https://spotify-project-2-bucket.s3.ap-south-1.amazonaws.com/covers/1780829103_summer.png?AWSAccessKeyId=...",
    "artistId": "64ef2a188f1...",
    "artistName": "Alex Mercer",
    "songs": [
      {
        "_id": "64ef5133a88...",
        "title": "Midnight Ride",
        "artistName": "Alex Mercer",
        "coverImageUrl": "https://spotify-project-2-bucket.s3.ap-south-1.amazonaws.com/covers/1780830112_art.png?AWSAccessKeyId=...",
        "audioUrl": "https://spotify-project-2-bucket.s3.ap-south-1.amazonaws.com/audio/1780830112_track.mp3?AWSAccessKeyId=...",
        "duration": 210,
        "genre": "Synthwave",
        "playlistId": "64ef4821a22...",
        "uploadedBy": "64ef2a188f1..."
      }
    ]
  }
}
```

---

### 4. Search Music (`GET /search?q=...`)
Search for songs and playlists matching title, artist name, or genre.

**Query Params:**
- `q` (string): Query search term

**Response (200 OK):**
```json
{
  "success": true,
  "results": {
    "songs": [...],
    "playlists": [...]
  }
}
```

---

### 5. Follow Artist (`POST /users/artists/:id/follow`)
Follow an artist to subscribe to their uploads. **User only.**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscribed to artist successfully"
}
```
