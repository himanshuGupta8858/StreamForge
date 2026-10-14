# 🎵 StreamForge — Cloud-Native Music Streaming Microservices Platform

A production-grade, containerized full-stack cloud-native music streaming platform. Built on an event-driven microservices architecture supporting role-based user management (Users & Artists), playlist creation, music track uploading to AWS S3, pre-signed streaming links, artist subscription channels, and automated RabbitMQ email notifications.

---

## 🏗 Architecture

```
                                  [User Client (React SPA)]
                                             │
                                             ▼ (Port 3000)
                                    [Nginx API Gateway]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (Port 5000)                               ▼ (Port 5002)
             [Auth Microservice]                         [Music Microservice]
                       │                                           │
                       ├───────────────▶ [MongoDB Atlas] ◀─────────┤
                       │                                           │
                       │                                           ▼
                       │                                    [AWS S3 Bucket]
                       │                               (Audio files & Album Art)
                       │                                           │
                       ▼ (Publish Events)                          ▼ (Publish Events)
                 'USER_REGISTERED'                           'MUSIC_UPLOADED'
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                                 [CloudAMQP RabbitMQ Broker]
                                             │
                                             ▼ (Consume Events)
                                [Notification Microservice] (Port 5001)
                                             │
                                             ▼ (Gmail API OAuth2)
                                   [Send Stylized Emails]
```

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, React Hook Form, Zod, Axios, Lucide Icons |
| **Auth Service** | Node.js, Express, Mongoose, JWT (HttpOnly Cookies), Passport.js (Google OAuth) |
| **Music Service** | Node.js, Express, Mongoose, Multer, AWS SDK v3 (`@aws-sdk/client-s3`) |
| **Notification** | Node.js, Express, googleapis (Gmail API OAuth 2.0) |
| **Broker / DB** | CloudAMQP (RabbitMQ), MongoDB Atlas (Shared Database Cluster) |
| **Storage** | AWS S3 (`spotify-project-2-bucket`) |
| **Deployment** | Docker, Docker Compose, AWS ECS Fargate, AWS ECR |

---

## 📁 Project Structure

```
StreamForge/
│
├── frontend/                           # React + Vite SPA (Tailwind CSS)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Context API Authentication State
│   │   ├── pages/
│   │   │   ├── Home/                   # Landings with Hero & Trending Playlists
│   │   │   ├── Login/                  # Credentials Login & Google OAuth
│   │   │   ├── Register/               # User / Artist Signup Forms
│   │   │   ├── UserDashboard/          # Search, Browse, & Subscriptions Page
│   │   │   ├── ArtistDashboard/        # Song/Playlist Uploads & Analytics
│   │   │   ├── Playlist/               # Tracks list & details
│   │   │   └── MusicPlayer/            # StreamForge audio player controls & speed selection
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Responsive header
│   │   │   └── ProtectedRoute.jsx      # RBAC Route Guard middleware
│   │   ├── services/
│   │   │   ├── authAPI.js              # Auth endpoints Axios client
│   │   │   └── musicAPI.js             # Music & Playlist Axios client
│   │   ├── App.jsx                     # Routes registration
│   │   └── index.css                   # Tailwind compilation imports
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── auth-service/                       # Auth Microservice (Port 5000)
│   ├── src/
│   │   ├── config/ (db, passport, rabbitmq)
│   │   ├── models/ (User.js)
│   │   ├── controllers/ (authController.js)
│   │   ├── middleware/ (authMiddleware.js - RBAC guards)
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
│
├── music-service/                      # Music & S3 Microservice (Port 5002) [NEW]
│   ├── src/
│   │   ├── config/ (db, rabbitmq, s3.js)
│   │   ├── models/ (User, Playlist, Song, Subscription)
│   │   ├── repositories/ (playlistRepository, songRepository)
│   │   ├── services/ (s3Service, musicService, eventProducer)
│   │   ├── controllers/ (musicController.js)
│   │   ├── routes/ (musicRoutes.js)
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
│
├── notification-service/               # Notification Microservice (Port 5001)
│   ├── src/
│   │   ├── consumers/ (userConsumer, musicConsumer)
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔑 Environment Variables

### Music Service (`music-service/.env`)
Create a `.env` in `music-service` with:
```env
PORT=5002
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_signing_secret
RABBITMQ_URL=your_cloudamqp_rabbitmq_url
CLIENT_URL=http://localhost:3000

# AWS S3 Settings
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=spotify-project-2-bucket
```

Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` have S3 read/write/presign permissions for your bucket.

---

## 📡 API Endpoints

### Auth Service (`/api/auth`)
- `POST /signup` : Register as USER or ARTIST.
- `POST /login` : Authenticate credentials.
- `POST /logout` : Discard JWT HttpOnly cookie.
- `GET /me` : Fetch current session user.
- `GET /google?role=USER|ARTIST` : Redirect to Google login passing chosen role.

### Music Service (`/api`)
- `POST /playlists` : Create a playlist (Artist only, Multipart cover image file).
- `GET /playlists` : Retrieve all playlists (signed cover URLs).
- `GET /playlists/:id` : Retrieve playlist details & songs.
- `POST /songs` : Upload music tracks (Artist only, Multipart cover image + audio file).
- `GET /songs` : Retrieve all songs (signed media URLs).
- `GET /songs/:id` : Retrieve song details.
- `DELETE /songs/:id` : Delete a song (Artist owner only).
- `GET /artist/dashboard` : Fetch analytics & uploads (Artist only).
- `GET /search?q=...` : Search songs & playlists by title, artist, or genre.
- `POST /users/artists/:id/follow` : Follow an artist (User only).
- `POST /users/artists/:id/unfollow` : Unfollow an artist (User only).
- `GET /users/artists/:id/is-following` : Check follow status (User only).

---

## 📬 Queue Event Flows

1. **User Welcome Event**:
   - Event: `USER_REGISTERED` (Published by `auth-service` on signup/callback).
   - Queue: `user.registration.queue`
   - Routing: Consumed by `notification-service` to deliver the welcome HTML email.

2. **Music Release Event**:
   - Event: `MUSIC_UPLOADED` (Published by `music-service` on track creation).
   - Payload: `{ songTitle, artistName, artistEmail, subscriberEmails: [...] }`
   - Queue: `music.uploads.queue`
   - Routing: Consumed by `notification-service`. Dispatches an upload confirmation to the artist and a "New Release" notification to each subscriber email.

---

## 🐳 Running with Docker

Start the entire environment locally:
```bash
docker-compose up --build
```
Open **http://localhost:3000** to load the StreamForge music streaming client.
