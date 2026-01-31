**Placement Portal — Backend**

This is the backend for the Placement Portal application (Express + Node + MongoDB). It provides REST endpoints for authentication, student and recruiter management, job postings, applications, and email utilities.

**Requirements**
- **Node.js**: 18+ recommended
- **MongoDB**: a running MongoDB instance (local or cloud)
- **Brevo (Sendinblue) API key**: used for transactional emails

**Environment**
Create a `.env` file in the project root with the following variables (example):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/placement-portal
NODE_ENV=development
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=sender@example.com
BREVO_SENDER_NAME="Placement Portal"
FRONTEND_URL=http://localhost:3000
```

**Installation**

```bash
# install dependencies
npm install
```

**Run**
- Development (auto-restart): `npm run dev`
- Production: `npm start`

The server entrypoint is `src/server.js` and the Express app is in `src/app.js`.

**API Routes (Overview)**
- `routes/auth.routes.js` — authentication (login, register, token refresh, logout)
- `routes/student.routes.js` — student endpoints
- `routes/recruiter.routes.js` — recruiter endpoints
- `routes/job.routes.js` — job posting and listing
- `routes/admin.routes.js` — admin-only operations
- `routes/officers.routes.js` — placement officer related routes
- `routes/health.routes.js` — simple health check endpoint

For detailed behavior check the corresponding controllers in the `controllers/` folder (for example `controllers/student.controller.js`).

**Project Structure**
- `src/` — application entry and server setup (`app.js`, `server.js`)
- `config/` — configuration and DB connection (`env.js`, `db.js`)
- `controllers/` — route handlers
- `routes/` — route definitions
- `models/` — Mongoose models
- `services/` — utilities (email, tokens, password reset)
- `middleware/` — request middleware (auth, uploads, error handling)
- `uploads/` — uploaded files (committed here for development only)

**Important Files**
- `config/env.js` — environment variables consumed by the app
- `services/email.service.js` — uses Brevo (Sendinblue) via `BREVO_API_KEY`
- `services/token.service.js` — signs JWTs using `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`

**Uploads**
Uploaded files are placed in the `uploads/` directory. In production you may want to use cloud storage instead.

**Testing**
There are no automated tests included in this repository. You can test endpoints with tools like `Postman` or `curl`.

**Development Notes**
- The project uses ES modules (`"type": "module"` in `package.json`).
- Nodemon is included as a dev dependency for development reloads.

**Contributing**
- Open an issue describing the change you want to make.
- Create a branch, implement your changes, and open a pull request.

