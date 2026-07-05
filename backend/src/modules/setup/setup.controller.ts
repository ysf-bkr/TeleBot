import { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getDb, initializeDatabase } from '../../db/index.js';
import botService from '../../services/bot.service.js';
import authRepository from '../auth/auth.repository.js';
import licenseService from '../../services/license.service.js';

const KEY_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

function updateEnvFile(updates: Record<string, string>) {
  // backend/.env is located in the process working directory when running the backend
  const envPath = path.resolve(process.cwd(), '.env');
  let content = '';
  
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const lines = content.split('\n');
  for (const [key, val] of Object.entries(updates)) {
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      // Handle lines like KEY=value or #KEY=value
      if (lines[i].startsWith(`${key}=`) || lines[i].startsWith(`# ${key}=`) || lines[i].startsWith(`#${key}=`)) {
        lines[i] = `${key}="${val.replace(/"/g, '\\"')}"`;
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${key}="${val.replace(/"/g, '\\"')}"`);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
  
  // Apply changes to the running process
  for (const [key, val] of Object.entries(updates)) {
    process.env[key] = val;
  }
}

async function isSystemSetup(): Promise<boolean> {
  const db = getDb();
  try {
    // Check if an admin user exists
    const adminUser = await db.selectFrom('panel_users')
      .select('id')
      .where('role', '=', 'admin')
      .executeTakeFirst();
      
    return !!adminUser;
  } catch (e) {
    return false;
  }
}

export async function checkSetupStatus(request: FastifyRequest, reply: FastifyReply) {
  const setup = await isSystemSetup();
  return { configured: setup };
}

export async function configureSystem(request: FastifyRequest, reply: FastifyReply) {
  const alreadySetup = await isSystemSetup();
  if (alreadySetup) {
    return reply.code(400).send({ 
      error: 'Already Configured', 
      message: 'The system has already been configured and initialized. You cannot re-run the setup wizard.' 
    });
  }

  const { licenseKey, jwtSecret, adminEmail, adminPassword, botToken, botUsername } = request.body as any;

  const isTrialRequest = licenseKey === 'TRIAL' || !licenseKey;

  if (!isTrialRequest && !KEY_REGEX.test(licenseKey)) {
    return reply.code(400).send({ error: 'Validation Failed', message: 'A valid License Key is required or type TRIAL to start a 7-day demo.' });
  }
  if (!jwtSecret || jwtSecret.length < 8) {
    return reply.code(400).send({ error: 'Validation Failed', message: 'JWT Secret must be at least 8 characters long.' });
  }
  if (!adminEmail || !adminEmail.includes('@')) {
    return reply.code(400).send({ error: 'Validation Failed', message: 'A valid Admin Email is required.' });
  }
  if (!adminPassword || adminPassword.length < 6) {
    return reply.code(400).send({ error: 'Validation Failed', message: 'Admin Password must be at least 6 characters long.' });
  }
  if (!botToken || !botToken.includes(':')) {
    return reply.code(400).send({ error: 'Validation Failed', message: 'A valid Telegram Bot Token is required.' });
  }

  try {
    if (!isTrialRequest) {
      // Validate and Activate License remotely
      const activation = await licenseService.activate(licenseKey);
      if (!activation.success) {
        return reply.code(400).send({ 
          error: 'Activation Failed', 
          message: activation.message 
        });
      }
    }

    // 2. Write environment variables to .env
    updateEnvFile({
      LICENSE_KEY: isTrialRequest ? '' : licenseKey,
      JWT_SECRET: jwtSecret,
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      TELEGRAM_BOT_TOKEN: botToken,
      TELEGRAM_BOT_USERNAME: botUsername || '',
      IS_CONFIGURED: 'true',
      NODE_ENV: 'production',
      ACTIVATION_TOKEN: isTrialRequest ? '' : (process.env.ACTIVATION_TOKEN || '')
    });

    // 2. Initialize Database & Run Migrations
    const db = await initializeDatabase();

    // 3. Create Admin User
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const existingAdmin = await db.selectFrom('panel_users')
      .selectAll()
      .where('username', '=', adminEmail.trim().toLowerCase())
      .executeTakeFirst();

    if (!existingAdmin) {
      const newUser = await authRepository.createUser({
        username: adminEmail.trim().toLowerCase(),
        passwordHash
      });
      if (newUser) {
        await db.updateTable('panel_users')
          .set({ role: 'admin' })
          .where('id', '=', newUser.id)
          .execute();
      }
      console.log(`[SETUP] Admin user created during setup: ${adminEmail}`);
    } else {
      // Update password of existing admin
      await db.updateTable('panel_users')
        .set({ password_hash: passwordHash, role: 'admin' })
        .where('username', '=', adminEmail.trim().toLowerCase())
        .execute();
    }

    // 4. Start Telegram Bot dynamically
    const io = (request as any).io;
    try {
      await botService.stopAllBots();
      await botService.startAllBots(io);
      console.log('[SETUP] Telegram bot started successfully with new token');
    } catch (botErr: any) {
      console.warn('[SETUP] Bot failed to start, but configuration was saved:', botErr.message);
    }

    return { success: true, message: 'System setup completed successfully. You can now login.' };
  } catch (err: any) {
    console.error('[SETUP] Error during system configuration:', err);
    return reply.code(500).send({ 
      error: 'Setup Failed', 
      message: err.message || 'An error occurred during system configuration.' 
    });
  }
}
