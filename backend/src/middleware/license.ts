import { FastifyReply, FastifyRequest } from 'fastify';
import licenseService from '../services/license.service.js';

export async function validateLicense(request: FastifyRequest, reply: FastifyReply) {
  // Public setup, health, and pages bypass the licensing filter
  const bypassPaths = ['/api/health', '/api/setup', '/p/'];
  if (bypassPaths.some(p => request.url.startsWith(p))) {
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    const status = licenseService.getStatus();

    if (licenseService.isRestricted()) {
      return reply.code(403).send({
        error: 'License Blocked',
        message: status.isGraceExpired
          ? 'Your connection grace period to the licensing server has expired. Please verify your network settings.'
          : 'This installation is blocked. The license key is invalid, suspended, or its activation limit has been exceeded.',
        needs_setup: !status.hasToken
      });
    }
  }
}
