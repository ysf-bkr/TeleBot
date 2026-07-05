import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import 'dotenv/config';
import crypto from 'crypto';

const fastify = Fastify({ logger: true });

// Strict startup environment checks
const SIGNING_SECRET = process.env.JWT_SECRET;
if (!SIGNING_SECRET || SIGNING_SECRET === 'licensing_server_super_secret_signing_key_2026') {
  console.error('FATAL: JWT_SECRET environment variable is missing, empty, or set to a default value in license-server!');
  process.exit(1);
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
if (!ADMIN_API_KEY) {
  console.error('FATAL: ADMIN_API_KEY environment variable is missing or empty in license-server!');
  process.exit(1);
}

// Register CORS
await fastify.register(cors, {
  origin: '*',
});

// 1. Activate License
fastify.post('/api/license/activate', async (request, reply) => {
  const { licenseKey, domain, fingerprint } = request.body as { licenseKey: string; domain: string; fingerprint: string };

  if (!licenseKey || !domain || !fingerprint) {
    return reply.code(400).send({ error: 'Missing parameters', message: 'licenseKey, domain, and fingerprint are required.' });
  }

  // Find license
  const license = db.getLicenseByKey(licenseKey);
  if (!license) {
    return reply.code(404).send({ error: 'License Not Found', message: 'The license key provided is invalid.' });
  }

  // Check status
  if (license.status !== 'active') {
    return reply.code(403).send({ error: 'License Suspended', message: `This license is currently ${license.status}.` });
  }

  // Check expiration
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return reply.code(403).send({ error: 'License Expired', message: 'The license has expired. Please renew.' });
  }

  // Check existing activations
  const existingActivation = db.getActivations().find(
    a => a.license_id === license.id && a.domain === domain && a.fingerprint === fingerprint
  );

  if (existingActivation) {
    await db.updateHeartbeat(existingActivation.id);
    
    // Calculate trial/license expiration date
    const trialDays = 7;
    const expiresDate = licenseKey === 'TRIAL'
      ? new Date(new Date(existingActivation.activated_at).getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString()
      : (license.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());

    if (licenseKey === 'TRIAL' && new Date() > new Date(expiresDate)) {
      return reply.code(403).send({ error: 'Trial Expired', message: 'The 7-day trial period has expired.' });
    }
    
    const token = jwt.sign(
      { licenseKey, domain, fingerprint, licenseType: license.license_type, graceExpires: expiresDate },
      SIGNING_SECRET,
      { expiresIn: '7d' }
    );
    return { success: true, token, message: 'Re-activated existing domain.' };
  }

  // Check total activations
  const currentActivations = db.getActivationsForLicense(license.id);
  if (currentActivations.length >= license.max_activations) {
    return reply.code(403).send({
      error: 'Activation Limit Reached',
      message: `You have reached the maximum activation limit of ${license.max_activations} domain(s).`,
      active_installations: currentActivations.map(d => ({ domain: d.domain, fingerprint: d.fingerprint, activated_at: d.activated_at }))
    });
  }

  // Perform activation
  let newAct;
  try {
    newAct = await db.addActivation(license.id, domain, fingerprint);
  } catch (err: any) {
    return reply.code(500).send({ error: 'Database Error', message: 'Could not write activation record.' });
  }

  const trialDays = 7;
  const expiresDate = licenseKey === 'TRIAL'
    ? new Date(new Date(newAct.activated_at).getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString()
    : (license.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());

  // Sign Activation Token (valid for 7 days)
  const token = jwt.sign(
    { licenseKey, domain, fingerprint, licenseType: license.license_type, graceExpires: expiresDate },
    SIGNING_SECRET,
    { expiresIn: '7d' }
  );

  return { success: true, token, message: 'License activated successfully!' };
});

// 2. Periodic Heartbeat
fastify.post('/api/license/heartbeat', async (request, reply) => {
  const { token, fingerprint } = request.body as { token: string; fingerprint: string };

  if (!token || !fingerprint) {
    return reply.code(400).send({ error: 'Missing parameters', message: 'token and fingerprint are required.' });
  }

  try {
    const decoded = jwt.verify(token, SIGNING_SECRET) as any;

    if (decoded.fingerprint !== fingerprint) {
      return reply.code(403).send({ error: 'Fingerprint Mismatch', message: 'The hardware/domain fingerprint does not match the token.' });
    }

    // Verify key in DB
    const license = db.getLicenseByKey(decoded.licenseKey);
    if (!license || license.status !== 'active') {
      return reply.code(403).send({ error: 'License Invalid', message: 'The license is no longer active.' });
    }

    // Check trial expiration
    if (decoded.licenseKey === 'TRIAL' && new Date() > new Date(decoded.graceExpires)) {
      return reply.code(403).send({ error: 'Trial Expired', message: 'The 7-day trial period has expired.' });
    }

    // Find activation record to update
    const activation = db.getActivations().find(
      a => a.license_id === license.id && a.fingerprint === fingerprint
    );
    if (activation) {
      await db.updateHeartbeat(activation.id);
    }

    // Issue refreshed token
    const refreshedToken = jwt.sign(
      { licenseKey: decoded.licenseKey, domain: decoded.domain, fingerprint, licenseType: license.license_type, graceExpires: decoded.graceExpires },
      SIGNING_SECRET,
      { expiresIn: '7d' }
    );

    return { success: true, token: refreshedToken, message: 'Heartbeat validated successfully.' };
  } catch (err: any) {
    return reply.code(403).send({ error: 'Token Validation Failed', message: err.message || 'Invalid activation token.' });
  }
});

// 3. Deactivate License (Self-Service)
fastify.post('/api/license/deactivate', async (request, reply) => {
  const { licenseKey, domain, fingerprint } = request.body as { licenseKey: string; domain: string; fingerprint: string };

  if (!licenseKey || !domain || !fingerprint) {
    return reply.code(400).send({ error: 'Missing parameters', message: 'licenseKey, domain, and fingerprint are required.' });
  }

  const license = db.getLicenseByKey(licenseKey);
  if (!license) {
    return reply.code(404).send({ error: 'License Not Found', message: 'Invalid license key.' });
  }

  const success = await db.deleteActivation(license.id, domain, fingerprint);

  if (!success) {
    return reply.code(404).send({ error: 'Record Not Found', message: 'No activation found matching these details.' });
  }

  return { success: true, message: 'Domain deactivated successfully. You can now use this activation license slot elsewhere.' };
});

// 4. Admin API List All
fastify.get('/api/admin/licenses', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_API_KEY}`) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing Bearer token.' });
  }

  const licenses = db.getLicenses();
  const activations = db.getActivations();
  
  return {
    licenses: licenses.map(l => ({
      ...l,
      activations: activations.filter(a => a.license_id === l.id)
    }))
  };
});

// 5. Admin API Create New License (For Webhook Integrations)
fastify.post('/api/admin/licenses', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_API_KEY}`) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing Bearer token.' });
  }

  const { licenseKey, customerEmail, licenseType, expiresAt } = request.body as { 
    licenseKey?: string; 
    customerEmail: string; 
    licenseType: 'regular' | 'extended' | 'unlimited'; 
    expiresAt?: string; 
  };

  if (!customerEmail || !licenseType) {
    return reply.code(400).send({ error: 'Validation Error', message: 'customerEmail and licenseType are required.' });
  }

  if (!['regular', 'extended', 'unlimited'].includes(licenseType)) {
    return reply.code(400).send({ error: 'Validation Error', message: 'licenseType must be regular, extended, or unlimited.' });
  }

  // Generate a random high-entropy license key using CSPRNG if not provided
  const generatedKey = licenseKey || 'TELE-' + Array.from({ length: 4 }, () => 
    crypto.randomBytes(3).toString('hex').substring(0, 5).toUpperCase()
  ).join('-');

  let maxActivations = 1;
  if (licenseType === 'extended') maxActivations = 5;
  if (licenseType === 'unlimited') maxActivations = 999999;

  try {
    const newLicense = await db.addLicense(
      generatedKey,
      customerEmail,
      licenseType,
      maxActivations,
      expiresAt || null,
      'API'
    );
    return { success: true, license: newLicense, message: 'License created successfully.' };
  } catch (err: any) {
    return reply.code(400).send({ error: 'Creation Failed', message: err.message || 'Key already exists.' });
  }
});

// Start Server
const PORT = 3001;
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[LICENSE SERVER] Running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
