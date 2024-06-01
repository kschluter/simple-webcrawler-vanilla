// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  })
);
app.use(express.json());

const PORT = 3000;
const MAX_DOMAINS_DEFAULT = 20;
const MAX_DEPTH_DEFAULT = 2;
const SOCIAL_MEDIA_DOMAINS = [
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'pinterest.com',
];

// In-memory data structures for URL and domain management
const discoveredDomains = new Set();
const visitedUrls = new Set();
const urlQueue = [];

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('startCrawl', (data) => {
    console.log('Crawl started with data:', data);
    const { startingUrl, maxDomains, maxDepth } = data;
    initializeCrawl(startingUrl, maxDomains, maxDepth, socket);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const initializeCrawl = (
  startingUrl,
  maxDomains = MAX_DOMAINS_DEFAULT,
  maxDepth = MAX_DEPTH_DEFAULT,
  socket
) => {
  try {
    // Reset data structures for a new crawl
    discoveredDomains.clear();
    visitedUrls.clear();
    urlQueue.length = 0;

    // Initialize queue with the starting URL
    urlQueue.push({ url: startingUrl, depth: 0 });

    // Start crawling
    crawlUrls(maxDomains, maxDepth, socket);
  } catch (error) {
    console.error('Error initializing crawl:', error);
  }
};

const crawlUrls = async (maxDomains, maxDepth, socket) => {
  while (urlQueue.length > 0 && discoveredDomains.size < maxDomains) {
    const { url, depth } = urlQueue.shift();
    if (depth > maxDepth) continue;
    try {
      await crawlUrl(url, depth, socket, maxDomains);
    } catch (error) {
      console.error(`Error crawling URL ${url}:`, error);
    }
  }
  console.log('Crawl completed or maxDomains limit reached.');
};

const crawlUrl = async (url, depth, socket, maxDomains) => {
  if (visitedUrls.has(url) || discoveredDomains.size >= maxDomains) return;
  visitedUrls.add(url);
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const baseUrl = new URL(url);
    $('a').each((index, element) => {
      if (discoveredDomains.size >= maxDomains) return;
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = new URL(href, baseUrl.origin).href;
        const domain = new URL(fullUrl).hostname;
        if (
          !discoveredDomains.has(domain) &&
          !SOCIAL_MEDIA_DOMAINS.includes(domain)
        ) {
          discoveredDomains.add(domain);
          socket.emit('newDomain', domain);
          if (depth + 1 <= MAX_DEPTH_DEFAULT) {
            urlQueue.push({ url: fullUrl, depth: depth + 1 });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
  }
};

app.post('/start', (req, res) => {
  try {
    const { startingUrl, maxDomains, maxDepth } = req.body;
    io.emit('startCrawl', { startingUrl, maxDomains, maxDepth });
    res.status(200).send('Crawl started');
  } catch (error) {
    console.error('Error starting crawl:', error);
    res.status(500).send('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
