/**
 * Demo Server - Simple Mock API for Testing
 * No database required, in-memory storage
 */

import express, { Express, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
interface Sale {
  id: string;
  store_id: number;
  date: string;
  total_revenue: number;
  cash_payment: number;
  card_payment: number;
  version: number;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

const salesDB: Map<string, Sale> = new Map();

// Generate HTML test page
function getTestPage(): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Store Hub API - Test Console</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.1em; opacity: 0.9; }
    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 40px;
    }
    .section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background: #f9f9f9;
    }
    .section h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 1.3em;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }
    input, textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.95em;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
      width: 100%;
    }
    button:hover { background: #764ba2; }
    button:active { transform: scale(0.98); }
    .response {
      background: #000;
      color: #fff;
      padding: 15px;
      border-radius: 4px;
      font-family: "Courier New", monospace;
      font-size: 0.9em;
      max-height: 300px;
      overflow-y: auto;
      margin-top: 15px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .success { color: #ffff00; font-weight: bold; }
    .error { color: #ff6b6b; font-weight: bold; }
    .loading { color: #ffcc00; }
    .test-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .test-btn {
      background: #667eea;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      color: white;
      text-align: center;
      transition: all 0.2s;
    }
    .test-btn:hover {
      background: #764ba2;
      transform: translateX(5px);
    }
    @media (max-width: 768px) {
      .content {
        grid-template-columns: 1fr;
      }
      .header h1 { font-size: 1.8em; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Store Hub API Test Console</h1>
      <p>Mock In-Memory Database • No PostgreSQL Required</p>
    </div>

    <div class="content">
      <!-- Create Sales Section -->
      <div class="section">
        <h2>📝 Create Sales</h2>
        <div class="form-group">
          <label>Store ID</label>
          <input type="number" id="store_id" value="1" />
        </div>
        <div class="form-group">
          <label>Date (YYYY-MM-DD)</label>
          <input type="date" id="date" />
        </div>
        <div class="form-group">
          <label>Total Revenue</label>
          <input type="number" id="total_revenue" value="1500.00" step="0.01" />
        </div>
        <div class="form-group">
          <label>Cash Payment</label>
          <input type="number" id="cash_payment" value="1000.00" step="0.01" />
        </div>
        <div class="form-group">
          <label>Card Payment</label>
          <input type="number" id="card_payment" value="500.00" step="0.01" />
        </div>
        <button onclick="createSales()">✨ Create Sales</button>
        <div class="response" id="create-response"></div>
      </div>

      <!-- Manage Sales Section -->
      <div class="section">
        <h2>⚡ Manage Sales</h2>
        <div class="form-group">
          <label>Sales ID (from creation)</label>
          <input type="text" id="sales_id" placeholder="Paste ID from Create response" />
        </div>
        <button onclick="getSales()" style="margin-bottom: 10px;">🔍 Get Sales</button>
        <button onclick="listSales()" style="margin-bottom: 10px;">📋 List All Sales</button>

        <h3 style="margin-top: 20px; color: #667eea;">Optimistic Locking Test</h3>
        <div class="form-group">
          <label>New Total Revenue</label>
          <input type="number" id="new_total_revenue" value="2000.00" step="0.01" />
        </div>
        <div class="form-group">
          <label>New Cash Payment</label>
          <input type="number" id="new_cash_payment" value="1200.00" step="0.01" />
        </div>
        <div class="form-group">
          <label>New Card Payment</label>
          <input type="number" id="new_card_payment" value="800.00" step="0.01" />
        </div>
        <div class="form-group">
          <label>Version (try 1 then 2)</label>
          <input type="number" id="update_version" value="1" />
        </div>
        <button onclick="updateSales()">🔄 Update Sales</button>
        <div class="response" id="manage-response"></div>
      </div>

      <!-- Test Scenarios -->
      <div class="section" style="grid-column: 1 / -1;">
        <h2>🧪 Quick Test Scenarios</h2>
        <p style="margin-bottom: 15px; color: #666;">Click to run predefined tests</p>
        <div class="test-list">
          <div class="test-btn" onclick="runQuickTest1()">
            ✅ Test 1: Create → Get → List
          </div>
          <div class="test-btn" onclick="runQuickTest2()">
            ⚠️ Test 2: Validation Error (Wrong sum)
          </div>
          <div class="test-btn" onclick="runQuickTest3()">
            🔐 Test 3: Optimistic Locking (409 Conflict)
          </div>
        </div>
        <div class="response" id="test-response"></div>
      </div>
    </div>
  </div>

  <script>
    // Set today's date
    document.getElementById('date').valueAsDate = new Date();

    function log(response) {
      return JSON.stringify(response, null, 2);
    }

    async function createSales() {
      const elem = document.getElementById('create-response');
      elem.innerHTML = '<span class="loading">⏳ Creating...</span>';

      try {
        const response = await fetch('/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: parseInt(document.getElementById('store_id').value),
            date: document.getElementById('date').value,
            total_revenue: parseFloat(document.getElementById('total_revenue').value),
            cash_payment: parseFloat(document.getElementById('cash_payment').value),
            card_payment: parseFloat(document.getElementById('card_payment').value),
          })
        });
        const data = await response.json();
        elem.innerHTML = '<span class="' + (response.ok ? 'success' : 'error') + '">' +
          log(data) + '</span>';
        if (data.data?.id) {
          document.getElementById('sales_id').value = data.data.id;
          document.getElementById('sales_id').style.borderColor = '#0f0';
        }
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Error: ' + err.message + '</span>';
      }
    }

    async function getSales() {
      const elem = document.getElementById('manage-response');
      const id = document.getElementById('sales_id').value;
      if (!id) { alert('Please enter Sales ID'); return; }
      elem.innerHTML = '<span class="loading">⏳ Getting...</span>';

      try {
        const response = await fetch('/v1/sales/' + id);
        const data = await response.json();
        elem.innerHTML = '<span class="success">' + log(data) + '</span>';
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Error: ' + err.message + '</span>';
      }
    }

    async function listSales() {
      const elem = document.getElementById('manage-response');
      elem.innerHTML = '<span class="loading">⏳ Fetching list...</span>';

      try {
        const response = await fetch('/v1/sales');
        const data = await response.json();
        elem.innerHTML = '<span class="success">' + log(data) + '</span>';
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Error: ' + err.message + '</span>';
      }
    }

    async function updateSales() {
      const elem = document.getElementById('manage-response');
      const id = document.getElementById('sales_id').value;
      if (!id) { alert('Please enter Sales ID'); return; }
      elem.innerHTML = '<span class="loading">⏳ Updating...</span>';

      try {
        const response = await fetch('/v1/sales/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total_revenue: parseFloat(document.getElementById('new_total_revenue').value),
            cash_payment: parseFloat(document.getElementById('new_cash_payment').value),
            card_payment: parseFloat(document.getElementById('new_card_payment').value),
            version: parseInt(document.getElementById('update_version').value),
          })
        });
        const data = await response.json();
        const isSuccess = response.ok;
        elem.innerHTML = '<span class="' + (isSuccess ? 'success' : 'error') + '">' +
          (isSuccess ? '✅ ' : '❌ ') + log(data) + '</span>';
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Error: ' + err.message + '</span>';
      }
    }

    async function runQuickTest1() {
      const elem = document.getElementById('test-response');
      elem.innerHTML = '<span class="loading">⏳ Running Test 1...</span>';

      try {
        // Create
        const createRes = await fetch('/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: 1,
            date: new Date().toISOString().split('T')[0],
            total_revenue: 1500,
            cash_payment: 1000,
            card_payment: 500,
          })
        });
        const created = await createRes.json();

        // Get
        const getRes = await fetch('/v1/sales/' + created.data.id);
        const gotSale = await getRes.json();

        // List
        const listRes = await fetch('/v1/sales');
        const listed = await listRes.json();

        elem.innerHTML = '<span class="success">✅ Test 1 Passed!\n' +
          'Created: ' + created.data.id + '\n' +
          'Retrieved: ' + gotSale.data.id + '\n' +
          'Total in list: ' + listed.data.length + '</span>';
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Test 1 Failed: ' + err.message + '</span>';
      }
    }

    async function runQuickTest2() {
      const elem = document.getElementById('test-response');
      elem.innerHTML = '<span class="loading">⏳ Running Test 2...</span>';

      try {
        const response = await fetch('/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: 1,
            date: new Date().toISOString().split('T')[0],
            total_revenue: 1500,
            cash_payment: 1000,
            card_payment: 600,  // Wrong! Should be 500
          })
        });
        const data = await response.json();

        if (!response.ok) {
          elem.innerHTML = '<span class="success">✅ Test 2 Passed! (Validation error caught)\n' + log(data) + '</span>';
        } else {
          elem.innerHTML = '<span class="error">❌ Test 2 Failed: Should have rejected invalid sum</span>';
        }
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Test 2 Failed: ' + err.message + '</span>';
      }
    }

    async function runQuickTest3() {
      const elem = document.getElementById('test-response');
      elem.innerHTML = '<span class="loading">⏳ Running Test 3...</span>';

      try {
        // Create
        const createRes = await fetch('/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: 1,
            date: new Date().toISOString().split('T')[0],
            total_revenue: 1500,
            cash_payment: 1000,
            card_payment: 500,
          })
        });
        const created = await createRes.json();

        // Try update with wrong version
        const updateRes = await fetch('/v1/sales/' + created.data.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total_revenue: 2000,
            cash_payment: 1200,
            card_payment: 800,
            version: 999,  // Wrong version!
          })
        });
        const result = await updateRes.json();

        if (updateRes.status === 409) {
          elem.innerHTML = '<span class="success">✅ Test 3 Passed! (409 Conflict detected)\n' + log(result) + '</span>';
        } else {
          elem.innerHTML = '<span class="error">❌ Test 3 Failed: Should return 409</span>';
        }
      } catch (err) {
        elem.innerHTML = '<span class="error">❌ Test 3 Failed: ' + err.message + '</span>';
      }
    }
  </script>
</body>
</html>
  `;
}

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test page
app.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(getTestPage());
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Create Sales
app.post('/v1/sales', (req: Request, res: Response) => {
  try {
    const { store_id, date, total_revenue, cash_payment, card_payment } = req.body;

    // Validation
    if (!store_id || !date || total_revenue === undefined || cash_payment === undefined || card_payment === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (cash_payment + card_payment !== total_revenue) {
      return res.status(422).json({ error: 'Cash + Card must equal Total Revenue' });
    }

    const sale: Sale = {
      id: uuid(),
      store_id,
      date,
      total_revenue,
      cash_payment,
      card_payment,
      version: 1,
      created_by: 1,
      updated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    salesDB.set(sale.id, sale);

    res.status(201).json({
      success: true,
      data: sale,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Sales by ID
app.get('/v1/sales/:id', (req: Request, res: Response) => {
  const sale = salesDB.get(req.params.id);
  if (!sale) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ success: true, data: sale });
});

// List Sales
app.get('/v1/sales', (req: Request, res: Response) => {
  const sales = Array.from(salesDB.values());
  res.json({ success: true, data: sales, meta: { total: sales.length } });
});

// Update Sales
app.put('/v1/sales/:id', (req: Request, res: Response) => {
  try {
    const { total_revenue, cash_payment, card_payment, version } = req.body;
    const sale = salesDB.get(req.params.id);

    if (!sale) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Optimistic Locking
    if (version !== sale.version) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Record was modified',
        current_version: sale.version,
      });
    }

    // Validation
    if (cash_payment + card_payment !== total_revenue) {
      return res.status(422).json({ error: 'Cash + Card must equal Total Revenue' });
    }

    // Update
    sale.total_revenue = total_revenue;
    sale.cash_payment = cash_payment;
    sale.card_payment = card_payment;
    sale.version += 1;
    sale.updated_by = 1;
    sale.updated_at = new Date().toISOString();

    salesDB.set(sale.id, sale);

    res.json({
      success: true,
      data: sale,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Store Hub Demo API Server         ║
║   Running on: http://localhost:${PORT}    ║
║                                        ║
║   ✨ Mock In-Memory Database           ║
║   Perfect for testing!                 ║
╚════════════════════════════════════════╝

Available Endpoints:
  ✅ GET    /health           - Health check
  ✅ POST   /v1/sales         - Create sales
  ✅ GET    /v1/sales         - List all sales
  ✅ GET    /v1/sales/{id}    - Get sales
  ✅ PUT    /v1/sales/{id}    - Update sales (Optimistic Locking)

Try it:
  curl http://localhost:${PORT}/health
  `);
});
