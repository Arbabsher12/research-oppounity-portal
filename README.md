# University Research Opportunity Portal

A web application for managing university research openings. The planned stack is Node.js/Express, MySQL, and a plain HTML/CSS/JavaScript frontend.

## Repository

GitHub repository: https://github.com/Arbabsher12/research-oppounity-portal

## Current progress

- **Step 1 — Project foundation:** repository structure, database schema, Express server bootstrap, database pool, and health endpoint.
- **Step 2 — CRUD REST API:** database-backed opportunity routes, input validation, and HTTP error responses.
- **Step 3 — Frontend:** API-backed listing, search and status filters, full details, create/edit form, close/reopen, delete, and feedback.
- Step 4 — API test collection and verification.
- Step 5 — Final documentation and submission checklist.

## Requirements

- Node.js 18.11 or newer
- MySQL 8 or a compatible MariaDB server, running locally

## Setup

1. Create the database and table using `database/schema.sql`. In XAMPP, start the MySQL module, open phpMyAdmin, select **Import**, and choose the schema file. You can also run it with the MySQL command-line client:

   ```powershell
   Get-Content .\database\schema.sql | mysql -u root -p
   ```

   Enter your local database password when prompted. MySQL Workbench can also execute the schema file.

2. Install the Node dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env` and set the local MySQL credentials in `.env`. Do not commit `.env`.

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Visit `http://localhost:3000` for the frontend and `http://localhost:3000/api/health` to check the server/database connection.

## API

All endpoints use JSON. The API returns `400` for invalid input, `404` when an opportunity does not exist, and `500` for an unexpected server/database error.

| Method | Endpoint | Success response |
| --- | --- | --- |
| `GET` | `/api/opportunities` | `200` and an array of opportunities |
| `GET` | `/api/opportunities/:id` | `200` and one opportunity |
| `POST` | `/api/opportunities` | `201` and the created opportunity |
| `PUT` | `/api/opportunities/:id` | `200` and the updated opportunity |
| `DELETE` | `/api/opportunities/:id` | `200` and a confirmation message |

Create requests require `title`, `description`, `research_area`, `faculty_name`, `department`, `required_skills`, `available_positions` (positive integer), and `application_deadline` (`YYYY-MM-DD`). `status` is optional and defaults to `Open`; valid values are `Open` and `Closed`. PUT accepts one or more of these fields to update.

Example create request:

```json
{
   "title": "Undergraduate Robotics Research Assistant",
   "description": "Assist with testing autonomous navigation methods.",
   "research_area": "Robotics",
   "faculty_name": "Dr. Ayesha Khan",
   "department": "Computer Science",
   "required_skills": "Python, ROS, basic electronics",
   "available_positions": 2,
   "application_deadline": "2027-01-31",
   "status": "Open"
}
```

## Assignment deliverables

The final repository will include backend and frontend source, the database schema, an exported Postman collection, setup instructions, and the repository URL. Add a link to the demonstration video before submission. Never commit database passwords or other credentials.
