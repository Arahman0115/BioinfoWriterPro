import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import axios from 'axios';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Secrets — set via: firebase functions:secrets:set GEMINI_API_KEY
const geminiKey = defineSecret('GEMINI_API_KEY');

admin.initializeApp();
const db = admin.firestore();

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_DAILY = { free: 10, pro: 1000 };

// Input size limits
const MAX_TEXT_BYTES = 10_000;       // ~10k chars for AI text completion
const MAX_CONTENT_BYTES = 50_000;    // ~50k chars for summarization
const MAX_IMAGE_BYTES = 5_000_000;   // ~5MB for base64 image (~3.75MB decoded)
const MAX_SEQUENCE_BYTES = 100_000;  // ~100k chars for biological sequences

// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Throws HttpsError if request has no auth */
const requireAuth = (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
};

/** Checks input length and throws if too large */
const requireSize = (value, max, label) => {
  if (typeof value === 'string' && value.length > max) {
    throw new HttpsError('invalid-argument', `${label} exceeds maximum allowed size`);
  }
};

/**
 * Gets user plan and enforces rate limit atomically using a Firestore transaction.
 * Auto-creates user doc if missing.
 * Returns the user's plan string.
 */
const checkAccessAndLimit = async (uid, email = '') => {
  const ref = db.collection('users').doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    let plan, completionsToday, lastReset;

    if (!snap.exists) {
      // First-time user — create doc and grant first request
      plan = 'free';
      completionsToday = 1;
      lastReset = todayMs;
      tx.set(ref, { uid, email, plan, createdAt: new Date(), completionsToday, lastReset });
      return plan;
    }

    ({ plan = 'free', completionsToday = 0, lastReset = 0 } = snap.data());
    const count = lastReset < todayMs ? 0 : completionsToday;

    if (count >= (MAX_DAILY[plan] || 10)) {
      throw new HttpsError('resource-exhausted', 'Daily limit reached. Try again tomorrow.');
    }

    tx.update(ref, {
      completionsToday: count + 1,
      lastReset: lastReset < todayMs ? todayMs : lastReset,
    });

    return plan;
  });
};

/** Polls EBI job until FINISHED or FAILED */
const pollEBI = async (jobId, service) => {
  while (true) {
    await new Promise(r => setTimeout(r, 5000));
    const { data: status } = await axios.get(
      `https://www.ebi.ac.uk/Tools/services/rest/${service}/status/${jobId}`
    );
    if (status === 'FINISHED') return;
    if (status === 'FAILED') throw new Error(`${service} job failed`);
  }
};

// ── onCall Functions (auth verified automatically by Firebase SDK) ────────────

export const predict = onCall({ secrets: [geminiKey], timeoutSeconds: 60 }, async (request) => {
  requireAuth(request);
  const { text } = request.data;
  if (!text) throw new HttpsError('invalid-argument', 'Text is required');
  requireSize(text, MAX_TEXT_BYTES, 'Text');

  await checkAccessAndLimit(request.auth.uid, request.auth.token.email);

  const prompt = text.toLowerCase().includes('@template')
    ? `You are a professional writing assistant. Create a detailed template structure with sections for: ${text.replace(/@template/gi, '').trim()}`
    : `You are a helpful writing assistant. Continue the following text naturally with 1-2 sentences:\n\n${text}`;

  const result = await new GoogleGenerativeAI(geminiKey.value())
    .getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    .generateContent(prompt);

  return { suggestion: result.response.text().trim() };
});

export const summarize = onCall({ secrets: [geminiKey], timeoutSeconds: 120 }, async (request) => {
  requireAuth(request);
  const { content } = request.data;
  if (!content) throw new HttpsError('invalid-argument', 'Content is required');
  requireSize(content, MAX_CONTENT_BYTES, 'Content');

  await checkAccessAndLimit(request.auth.uid, request.auth.token.email);

  const result = await new GoogleGenerativeAI(geminiKey.value())
    .getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    .generateContent(`Summarize the following scientific text concisely:\n\n${content}`);

  return { summary: result.response.text().trim() };
});

export const explainFigure = onCall({ secrets: [geminiKey], timeoutSeconds: 120 }, async (request) => {
  requireAuth(request);
  const { imageBase64, mimeType } = request.data;
  if (!imageBase64) throw new HttpsError('invalid-argument', 'Image data is required');
  requireSize(imageBase64, MAX_IMAGE_BYTES, 'Image');

  // Validate MIME type
  const safeMime = ALLOWED_MIME_TYPES.has(mimeType) ? mimeType : 'image/jpeg';

  await checkAccessAndLimit(request.auth.uid, request.auth.token.email);

  const result = await new GoogleGenerativeAI(geminiKey.value())
    .getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    .generateContent([
      'Please explain this scientific figure in detail.',
      { inlineData: { data: imageBase64, mimeType: safeMime } }
    ]);

  return { explanation: result.response.text().trim() };
});

export const initUser = onCall({ timeoutSeconds: 30 }, async (request) => {
  requireAuth(request);
  const { name, email } = request.data;
  await db.collection('users').doc(request.auth.uid).set(
    { name, email, plan: 'free', createdAt: new Date() },
    { merge: true }
  );
  return { message: 'User profile initialized' };
});

export const align = onCall({ timeoutSeconds: 300 }, async (request) => {
  requireAuth(request);
  const { sequences } = request.data;
  if (!sequences) throw new HttpsError('invalid-argument', 'Sequences are required');
  requireSize(sequences, MAX_SEQUENCE_BYTES, 'Sequences');

  const { data: jobId } = await axios.post(
    'https://www.ebi.ac.uk/Tools/services/rest/clustalo/run',
    new URLSearchParams({ email: 'rahmanahnafbio@gmail.com', sequence: sequences, stype: 'dna', outfmt: 'clustal_num' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  await pollEBI(jobId, 'clustalo');
  const { data } = await axios.get(
    `https://www.ebi.ac.uk/Tools/services/rest/clustalo/result/${jobId}/aln-clustal_num`
  );
  return { alignedSequences: data };
});

export const constructTree = onCall({ timeoutSeconds: 300 }, async (request) => {
  requireAuth(request);
  const { sequences } = request.data;
  if (!sequences) throw new HttpsError('invalid-argument', 'Sequences are required');
  requireSize(sequences, MAX_SEQUENCE_BYTES, 'Sequences');

  const { data: jobId } = await axios.post(
    'https://www.ebi.ac.uk/Tools/services/rest/simple_phylogeny/run',
    new URLSearchParams({ email: 'rahmanahnafbio@gmail.com', sequence: sequences, stype: 'dna', treeformat: 'newick' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  await pollEBI(jobId, 'simple_phylogeny');
  const { data } = await axios.get(
    `https://www.ebi.ac.uk/Tools/services/rest/simple_phylogeny/result/${jobId}/tree`
  );
  return { tree: data, treeFormat: 'newick' };
});

export const mafft = onCall({ timeoutSeconds: 300 }, async (request) => {
  requireAuth(request);
  const { sequences } = request.data;
  if (!sequences) throw new HttpsError('invalid-argument', 'Sequences are required');
  requireSize(sequences, MAX_SEQUENCE_BYTES, 'Sequences');

  const { data: jobId } = await axios.post(
    'https://www.ebi.ac.uk/Tools/services/rest/mafft/run',
    new URLSearchParams({ email: 'rahmanahnafbio@gmail.com', sequence: sequences, format: 'fasta', outfmt: 'clustal' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  await pollEBI(jobId, 'mafft');
  const { data } = await axios.get(
    `https://www.ebi.ac.uk/Tools/services/rest/mafft/result/${jobId}/out`
  );
  return { alignedSequences: data };
});

// ── onRequest: BLAST proxy only (needs raw HTTP pass-through) ────────────────

const ALLOWED_ORIGINS = new Set([
  'https://writpro.netlify.app',
]);

export const proxy = onRequest(async (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  // Manual auth verification
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing target URL' });

  // SSRF protection — only allow NCBI BLAST
  const allowed = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';
  if (!targetUrl.startsWith(allowed)) {
    return res.status(403).json({ error: 'Target URL not allowed' });
  }

  try {
    const method = req.method.toLowerCase();
    const params = method === 'get' ? { ...req.query } : undefined;
    if (params) delete params.url;
    const response = await axios({
      method, url: targetUrl, params,
      data: method === 'post' ? req.body : undefined,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://blast.ncbi.nlm.nih.gov',
        'Referer': 'https://blast.ncbi.nlm.nih.gov/'
      }
    });
    if (response.headers['set-cookie']) res.setHeader('Set-Cookie', response.headers['set-cookie']);
    res.status(response.status).send(response.data);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});
