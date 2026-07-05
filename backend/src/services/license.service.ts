import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:3001';

class LicenseService {
  private activationToken: string | null = null;
  private graceExpires: string | null = null;
  private isValid: boolean = true;
  private isGraceExpired: boolean = false;
  
  // Trial properties
  private isTrial: boolean = false;
  private trialExpires: string | null = null;

  constructor() {
    this.activationToken = process.env.ACTIVATION_TOKEN || null;
    this.graceExpires = process.env.GRACE_EXPIRES || null;
  }

  async initTrialStatus() {
    const licenseKey = process.env.LICENSE_KEY || '';
    if (!licenseKey) {
      this.isTrial = true;
      
      if (!this.activationToken) {
        try {
          const res = await this.activate('TRIAL');
          if (res.success) {
            console.log('[LICENSE] Auto-activated 7-day TRIAL mode on license server.');
            this.decodeTokenExpiry();
          }
        } catch (err: any) {
          console.warn('[LICENSE] License server unreachable for auto-trial. Falling back to local offline calculations.');
          this.fallbackLocalTrial();
        }
      } else {
        // We have a trial token, verify/heartbeat it
        await this.verifyHeartbeat();
        this.decodeTokenExpiry();
      }
    } else {
      this.isTrial = false;
      this.trialExpires = null;
    }
  }

  private decodeTokenExpiry() {
    if (this.activationToken) {
      try {
        // JWT is header.payload.signature
        const parts = this.activationToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.graceExpires) {
            this.trialExpires = payload.graceExpires;
            if (new Date() > new Date(payload.graceExpires)) {
              this.isValid = false;
              this.isGraceExpired = true;
            }
          }
        }
      } catch (_) {}
    }
  }

  private fallbackLocalTrial() {
    let installDate = process.env.INSTALL_DATE || '';
    
    if (!installDate) {
      const envPath = path.resolve(process.cwd(), '.env');
      let content = '';
      if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
      }
      
      const now = new Date().toISOString();
      if (!content.includes('INSTALL_DATE=')) {
        content += `\nINSTALL_DATE="${now}"\n`;
        fs.writeFileSync(envPath, content, 'utf8');
        process.env.INSTALL_DATE = now;
        installDate = now;
      }
    }

    const installTime = new Date(installDate).getTime();
    const trialEndTime = installTime + 7 * 24 * 60 * 60 * 1000;
    this.trialExpires = new Date(trialEndTime).toISOString();

    if (Date.now() > trialEndTime) {
      this.isValid = false;
      this.isGraceExpired = true;
    } else {
      this.isValid = true;
      this.isGraceExpired = false;
    }
  }

  getFingerprint(): string {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const fingerprintPath = path.resolve(dataDir, 'fingerprint.key');
    if (fs.existsSync(fingerprintPath)) {
      return fs.readFileSync(fingerprintPath, 'utf8').trim();
    }
    
    // Generate secure persistent fingerprint UUID
    const newFingerprint = crypto.randomUUID();
    fs.writeFileSync(fingerprintPath, newFingerprint, 'utf8');
    return newFingerprint;
  }

  getDomain(): string {
    const origin = process.env.CORS_ORIGIN || 'localhost';
    try {
      const url = new URL(origin);
      return url.hostname;
    } catch (_) {
      return origin.replace(/https?:\/\//, '').split(':')[0];
    }
  }

  getStatus() {
    return {
      isValid: this.isValid,
      isGraceExpired: this.isGraceExpired,
      graceExpires: this.graceExpires,
      hasToken: !!this.activationToken,
      isTrial: this.isTrial,
      trialExpires: this.trialExpires
    };
  }

  async activate(licenseKey: string): Promise<{ success: boolean; message: string }> {
    const domain = this.getDomain();
    const fingerprint = this.getFingerprint();

    try {
      const response = await axios.post(`${LICENSE_SERVER_URL}/api/license/activate`, {
        licenseKey,
        domain,
        fingerprint
      });

      if (response.data && response.data.success) {
        this.activationToken = response.data.token;
        this.isValid = true;
        this.isGraceExpired = false;
        this.graceExpires = null;
        
        // Write dynamic update to env file
        this.updateEnvConfig({
          ACTIVATION_TOKEN: response.data.token
        });

        if (licenseKey === 'TRIAL') {
          this.isTrial = true;
          this.decodeTokenExpiry();
        } else {
          this.isTrial = false;
          this.trialExpires = null;
        }

        return { success: true, message: 'License activated successfully!' };
      }
      return { success: false, message: 'Activation response was unsuccessful.' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Connection to license server failed.';
      const errorType = err.response?.data?.error || 'ConnectionError';
      
      if (errorType === 'Activation Limit Reached') {
        throw new Error(`Limit Reached: ${errorMsg}`);
      }
      
      throw new Error(errorMsg);
    }
  }

  private updateEnvConfig(updates: Record<string, string>) {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    const lines = content.split('\n');
    for (const [key, val] of Object.entries(updates)) {
      let found = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${key}=`) || lines[i].startsWith(`# ${key}=`)) {
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
    for (const [key, val] of Object.entries(updates)) {
      process.env[key] = val;
    }
  }

  async verifyHeartbeat(): Promise<void> {
    if (!this.activationToken) {
      if (process.env.NODE_ENV === 'production') {
        this.isValid = false;
      }
      return;
    }

    const fingerprint = this.getFingerprint();

    try {
      const response = await axios.post(`${LICENSE_SERVER_URL}/api/license/heartbeat`, {
        token: this.activationToken,
        fingerprint
      });

      if (response.data && response.data.success) {
        this.activationToken = response.data.token;
        this.isValid = true;
        this.isGraceExpired = false;
        this.graceExpires = null;
        
        this.updateEnvConfig({
          ACTIVATION_TOKEN: response.data.token
        });

        this.decodeTokenExpiry();
      }
    } catch (err: any) {
      const status = err.response?.status;
      const errorType = err.response?.data?.error;

      if (status === 403 && errorType !== 'ConnectionError') {
        this.isValid = false;
        this.isGraceExpired = true;
        console.error(`[LICENSE] Critical: license rejected by licensing server. Reason: ${err.response?.data?.message}`);
      } else {
        if (!this.graceExpires) {
          const grace = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
          this.graceExpires = grace;
          this.updateEnvConfig({
            GRACE_EXPIRES: grace
          });
          console.warn(`[LICENSE] Connection to licensing server failed. Grace period started. Expires on: ${grace}`);
        } else if (new Date(this.graceExpires) < new Date()) {
          this.isGraceExpired = true;
          console.error('[LICENSE] Grace period expired. Restricting advanced panel features.');
        }
      }
    }
  }

  isRestricted(): boolean {
    // licensing restrictions apply globally
    return !this.isValid || this.isGraceExpired;
  }
}

export default new LicenseService();
export { LicenseService };
