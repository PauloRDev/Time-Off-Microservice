
const express = require('express');
const app = express();
app.use(express.json());

const API_KEY = process.env.HCM_API_KEY || 'mock-key';
const PORT = process.env.MOCK_HCM_PORT || 4000;

// ── In-memory seed data ────────────────────────────────────────────────────
const balances = [
  { employeeId: 'EMP001', daysTotal: 20, daysUsed: 5,  year: new Date().getFullYear() },
  { employeeId: 'EMP002', daysTotal: 15, daysUsed: 0,  year: new Date().getFullYear() },
  { employeeId: 'EMP003', daysTotal: 30, daysUsed: 12, year: new Date().getFullYear() },
  { employeeId: 'EMP004', daysTotal: 10, daysUsed: 10, year: new Date().getFullYear() },
];

const errors = [];

// ── Auth middleware ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized — invalid API key' });
  }
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /balances — return all
app.get('/balances', (_req, res) => {
  // Simulate occasional latency
  setTimeout(() => res.json(balances), 50);
});

// GET /balances/:employeeId
app.get('/balances/:employeeId', (req, res) => {
  const record = balances.find((b) => b.employeeId === req.params.employeeId);
  if (!record) {
    return res.status(404).json({ error: `Employee ${req.params.employeeId} not found` });
  }
  res.json(record);
});

// POST /errors — receive error notifications
app.post('/errors', (req, res) => {
  errors.push({ ...req.body, receivedAt: new Date().toISOString() });
  console.log('[mock-hcm] Error received:', req.body);
  res.status(202).json({ acknowledged: true });
});

// GET /errors — inspect received errors (dev helper)
app.get('/errors', (_req, res) => res.json(errors));

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'mock-hcm' }));

app.listen(PORT, () => {
  console.log(`🟢 Mock HCM running on http://localhost:${PORT}`);
  console.log(`   API Key: ${API_KEY}`);
  console.log(`   Seeded ${balances.length} balance records`);
});