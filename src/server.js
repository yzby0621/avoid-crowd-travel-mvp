import './lib/env.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDestinations, recommend, validateRequest } from './recommendation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, statusCode, content, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, pathname) {
  const target = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(publicDir, target);

  if (!filePath.startsWith(publicDir)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, 'Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const typeMap = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };

  sendText(res, 200, fs.readFileSync(filePath), typeMap[ext] || 'application/octet-stream');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'travel-destination-mvp' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/destinations') {
    const destinations = loadDestinations();
    sendJson(res, 200, { items: destinations, count: destinations.length });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/recommendations') {
    try {
      const body = await parseBody(req);
      const error = validateRequest(body);
      if (error) {
        sendJson(res, 400, { error });
        return;
      }
      const result = recommend(body, loadDestinations());
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Internal Server Error' });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/feedback') {
    try {
      const body = await parseBody(req);
      sendJson(res, 200, { ok: true, received: body });
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Internal Server Error' });
    }
    return;
  }

  if (req.method === 'GET') {
    serveStatic(res, url.pathname);
    return;
  }

  sendText(res, 404, 'Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`MVP server running at http://${HOST}:${PORT}`);
});
