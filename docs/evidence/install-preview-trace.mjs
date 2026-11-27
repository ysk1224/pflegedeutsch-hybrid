import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const index = 'dist/index.html';
const observer = 'dist/audit-cloud-network.js';
if (existsSync(observer)) throw new Error('Start from a clean build');
const html = readFileSync(index, 'utf8');
if (!html.includes('v0.9 Final Competition Edition') || !html.includes('</head>')) {
  throw new Error('This audit is for the v0.9 candidate');
}
writeFileSync(index, html.replace('</head>', '<script src="/audit-cloud-network.js"></script>\n</head>'));
writeFileSync(observer, `
if (location.hostname === 'pflegedeutsch-hybrid--v08-review-pkbb3x48.web.app' &&
    new URLSearchParams(location.search).get('v09-audit') === '1') {
  const fetchOriginal = window.fetch.bind(window);
  const marker = 'PFLEGE_SYNTHETIC_V09_NETWORK_MARKER';
  let consentRequests = 0;
  let providerPosts = 0;
  console.info('v09-network-proof ready');
  document.addEventListener('submit', event => {
    if (event.target.id !== 'coachForm') return;
    if (document.getElementById('coachConsent').checked) consentRequests++;
    console.info('v09-network-proof submit ' + JSON.stringify({
      consentRequests, providerPosts, markerInDraft: document.getElementById('labDraft').value === marker
    }));
  }, true);
  window.fetch = (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    const method = options?.method ?? (input instanceof Request ? input.method : 'GET');
    if (url.hostname !== 'firebasevertexai.googleapis.com' || method.toUpperCase() !== 'POST' ||
        !url.pathname.includes('GenerateContent')) return fetchOriginal(input, options);
    const body = options?.body;
    const serial = ++providerPosts;
    const evidence = {
      providerPost: serial, consentRequests, textBodyObserved: typeof body === 'string',
      publicCasePresent: typeof body === 'string' && body.includes('breathlessness while walking'),
      syntheticMarkerPresent: typeof body === 'string' && body.includes(marker)
    };
    return fetchOriginal(input, options).then(response => {
      console.info('v09-network-proof provider ' + JSON.stringify({ ...evidence, httpStatus: response.status }));
      return response;
    });
  };
}
`);
console.log('Preview trace installed. Do not promote this instrumented build to live.');
