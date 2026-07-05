import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const fastify = Fastify({ logger: true });

const SIGNING_SECRET = 'licensing_server_super_secret_signing_key_2026';

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
    // Already activated, update heartbeat and return new token
    db.updateHeartbeat(existingActivation.id);
    
    const token = jwt.sign(
      { licenseKey, domain, fingerprint, licenseType: license.license_type, graceExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
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
  try {
    db.addActivation(license.id, domain, fingerprint);
  } catch (err: any) {
    return reply.code(500).send({ error: 'Database Error', message: 'Could not write activation record.' });
  }

  // Sign Activation Token (valid for 7 days)
  const token = jwt.sign(
    { licenseKey, domain, fingerprint, licenseType: license.license_type, graceExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
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

    // Find activation record to update
    const activation = db.getActivations().find(
      a => a.license_id === license.id && a.fingerprint === fingerprint
    );
    if (activation) {
      db.updateHeartbeat(activation.id);
    }

    // Issue refreshed token
    const refreshedToken = jwt.sign(
      { licenseKey: decoded.licenseKey, domain: decoded.domain, fingerprint, licenseType: license.license_type, graceExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
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

  const success = db.deleteActivation(license.id, domain, fingerprint);

  if (!success) {
    return reply.code(404).send({ error: 'Record Not Found', message: 'No activation found matching these details.' });
  }

  return { success: true, message: 'Domain deactivated successfully. You can now use this activation license slot elsewhere.' };
});

// 4. Admin API List All
fastify.get('/api/admin/licenses', async () => {
  const licenses = db.getLicenses();
  const activations = db.getActivations();
  
  return {
    licenses: licenses.map(l => ({
      ...l,
      activations: activations.filter(a => a.license_id === l.id)
    }))
  };
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
