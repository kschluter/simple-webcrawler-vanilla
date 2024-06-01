// Initialize Socket.io
const socket = io('http://localhost:3000'); // Adjust the backend URL if necessary

// DOM Elements
const startingUrlInput = document.getElementById('startingUrl');
const maxDomainsInput = document.getElementById('maxDomains');
const maxDeepInput = document.getElementById('maxDeep');
const startCrawlButton = document.getElementById('startCrawl');
const domainsList = document.getElementById('domainsList');
const testModeRadio = document.getElementById('testMode');
const liveModeRadio = document.getElementById('liveMode');

// Event Listeners
startCrawlButton.addEventListener('click', startCrawl);

function startCrawl() {
  try {
    const startingUrl = startingUrlInput.value;
    const maxDomains = parseInt(maxDomainsInput.value) || 20;
    const maxDeep = parseInt(maxDeepInput.value) || 2;
    const mode = testModeRadio.checked ? 'test' : 'live';

    console.log('Starting Crawl with settings:', {
      startingUrl,
      maxDomains,
      maxDeep,
      mode,
    });

    if (mode === 'live') {
      socket.emit('startCrawl', { startingUrl, maxDomains, maxDeep });
    } else {
      simulateTestMode(maxDomains);
    }
  } catch (error) {
    console.error('Error starting crawl:', error);
  }
}

socket.on('newDomain', (domain) => {
  try {
    console.log('New domain received:', domain);
    displayDomain(domain);
  } catch (error) {
    console.error('Error handling new domain:', error);
  }
});

function displayDomain(domain) {
  const domainElement = document.createElement('div');
  domainElement.className = 'domain';
  domainElement.textContent = domain;
  domainsList.appendChild(domainElement);
}

function simulateTestMode(maxDomains) {
  const historicalFigures = [
    'zeus.com',
    'hercules.com',
    'athena.com',
    'apollo.com',
    'aphrodite.com',
    'hades.com',
    'poseidon.com',
    'demeter.com',
    'hermes.com',
    'dionysus.com',
    'ares.com',
    'artemis.com',
    'hephaestus.com',
    'persephone.com',
    'prometheus.com',
    'pandora.com',
    'odysseus.com',
    'achilles.com',
    'hector.com',
    'theseus.com',
  ];
  let count = 0;

  const interval = setInterval(() => {
    if (count >= maxDomains) {
      clearInterval(interval);
      return;
    }
    const domain =
      historicalFigures[Math.floor(Math.random() * historicalFigures.length)];
    console.log('Simulated new domain:', domain);
    displayDomain(domain);
    count++;
  }, 500); // Simulate new domains every 500ms
}

try {
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
} catch (error) {
  console.error('Error setting up socket events:', error);
}
