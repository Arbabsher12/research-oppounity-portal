# University Research Opportunity Portal

A web application for managing university research openings. The planned stack is Node.js/Express, MySQL, and a plain HTML/CSS/JavaScript frontend.

## Repository

GitHub repository: _Add your repository URL after creating it._

## Current progress

- **Step 1 — Project foundation:** repository structure, MySQL schema, Express server bootstrap, database pool, and health endpoint.
- Step 2 — CRUD REST API and validation.
- Step 3 — Frontend listing, details, create, edit, close, and delete flows.
- Step 4 — API test collection and verification.
- Step 5 — Final documentation and submission checklist.

## Requirements

- Node.js 18.11 or newer
- MySQL 8 or newer, running locally

## Setup

1. Create the database and table using the SQL setup file:

   ```powershell
   Get-Content .\database\schema.sql | mysql -u root -p
   ```

   Enter your local MySQL password when prompted. Alternatively, open `database/schema.sql` in MySQL Workbench and execute it.

2. Install the Node dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env` and set the local MySQL credentials in `.env`. Do not commit `.env`.

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Visit `http://localhost:3000` for the frontend shell and `http://localhost:3000/api/health` to check the server/database connection.

## API

The CRUD endpoints will be documented here after implementation in Step 2.

## Assignment deliverables

The final repository will include backend and frontend source, the database schema, an exported Postman collection, setup instructions, and the repository URL. Add a link to the demonstration video before submission. Never commit database passwords or other credentials.
