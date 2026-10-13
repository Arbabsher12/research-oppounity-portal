require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);
const opportunityFields = {
  title: { maxLength: 200 },
  description: {},
  research_area: { maxLength: 120 },
  faculty_name: { maxLength: 150 },
  department: { maxLength: 120 },
  required_skills: {},
  available_positions: { type: 'positiveInteger' },
  application_deadline: { type: 'date' },
  status: { type: 'status' }
};

function parseOpportunityId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= 4294967295 ? id : null;
}

function validateOpportunity(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const opportunity = {};
  for (const [field, rules] of Object.entries(opportunityFields)) {
    if (!Object.hasOwn(input, field)) continue;
    const value = input[field];

    if (rules.type === 'positiveInteger') {
      if (!Number.isInteger(value) || value < 1) {
        return { error: 'available_positions must be a positive integer.' };
      }
    } else if (rules.type === 'date') {
      const parsedDate = typeof value === 'string'
        ? new Date(`${value}T00:00:00Z`)
        : null;
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value) {
        return { error: 'application_deadline must be a valid date in YYYY-MM-DD format.' };
      }
    } else if (rules.type === 'status') {
      if (value !== 'Open' && value !== 'Closed') {
        return { error: 'status must be either Open or Closed.' };
      }
    } else if (typeof value !== 'string' || !value.trim()) {
      return { error: `${field} must be a non-empty string.` };
    } else if (rules.maxLength && value.trim().length > rules.maxLength) {
      return { error: `${field} must be ${rules.maxLength} characters or fewer.` };
    }

    opportunity[field] = typeof value === 'string' ? value.trim() : value;
  }

  const requiredFields = Object.keys(opportunityFields).filter((field) => field !== 'status');
  if (!partial) {
    const missingField = requiredFields.find((field) => !Object.hasOwn(opportunity, field));
    if (missingField) return { error: `${missingField} is required.` };
    opportunity.status = opportunity.status || 'Open';
  } else if (Object.keys(opportunity).length === 0) {
    return { error: 'Provide at least one opportunity field to update.' };
  }

  return { opportunity };
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    response.status(500).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/api/opportunities', async (_request, response, next) => {
  try {
    const [opportunities] = await pool.query(
      'SELECT * FROM opportunities ORDER BY created_at DESC, id DESC'
    );
    response.status(200).json(opportunities);
  } catch (error) {
    next(error);
  }
});

app.get('/api/opportunities/:id', async (request, response, next) => {
  const id = parseOpportunityId(request.params.id);
  if (!id) return response.status(400).json({ error: 'Opportunity ID must be a positive integer.' });

  try {
    const [opportunities] = await pool.execute(
      'SELECT * FROM opportunities WHERE id = ?', [id]
    );
    if (opportunities.length === 0) {
      return response.status(404).json({ error: 'Research opportunity not found.' });
    }
    response.status(200).json(opportunities[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/opportunities', async (request, response, next) => {
  const result = validateOpportunity(request.body);
  if (result.error) return response.status(400).json({ error: result.error });

  try {
    const opportunity = result.opportunity;
    const [insertResult] = await pool.execute(
      `INSERT INTO opportunities
        (title, description, research_area, faculty_name, department, required_skills,
         available_positions, application_deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opportunity.title,
        opportunity.description,
        opportunity.research_area,
        opportunity.faculty_name,
        opportunity.department,
        opportunity.required_skills,
        opportunity.available_positions,
        opportunity.application_deadline,
        opportunity.status
      ]
    );
    const [created] = await pool.execute(
      'SELECT * FROM opportunities WHERE id = ?', [insertResult.insertId]
    );
    response.status(201).json(created[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/opportunities/:id', async (request, response, next) => {
  const id = parseOpportunityId(request.params.id);
  if (!id) return response.status(400).json({ error: 'Opportunity ID must be a positive integer.' });

  const result = validateOpportunity(request.body, true);
  if (result.error) return response.status(400).json({ error: result.error });

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM opportunities WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      return response.status(404).json({ error: 'Research opportunity not found.' });
    }

    const fields = Object.keys(result.opportunity);
    const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');
    await pool.execute(
      `UPDATE opportunities SET ${assignments} WHERE id = ?`,
      [...fields.map((field) => result.opportunity[field]), id]
    );
    const [updated] = await pool.execute(
      'SELECT * FROM opportunities WHERE id = ?', [id]
    );
    response.status(200).json(updated[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/opportunities/:id', async (request, response, next) => {
  const id = parseOpportunityId(request.params.id);
  if (!id) return response.status(400).json({ error: 'Opportunity ID must be a positive integer.' });

  try {
    const [deleteResult] = await pool.execute(
      'DELETE FROM opportunities WHERE id = ?', [id]
    );
    if (deleteResult.affectedRows === 0) {
      return response.status(404).json({ error: 'Research opportunity not found.' });
    }
    response.status(200).json({ message: 'Research opportunity deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API endpoint not found.' });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && Object.hasOwn(error, 'body')) {
    return response.status(400).json({ error: 'Request body contains invalid JSON.' });
  }
  console.error('Request failed:', error.message);
  response.status(500).json({ error: 'An internal server error occurred.' });
});

app.listen(port, () => {
  console.log(`Research Opportunity Portal running at http://localhost:${port}`);
});
