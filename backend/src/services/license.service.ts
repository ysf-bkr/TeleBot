import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const LICENSE_SERVER_URL = 'http://localhost:3001';

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
    this.initTrialStatus();
  }

  private initTrialStatus() {
    const licenseKey = process.env.LICENSE_KEY || '';
    if (!licenseKey) {
      this.isTrial = true;
      let installDate = process.env.INSTALL_DATE || '';
      
      if (!installDate) {
        // Record install date in .env on first launch
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
      const trialEndTime = installTime + 7 * 24 * 60 * 60 * 1000; // 7 days trial
      this.trialExpires = new Date(trialEndTime).toISOString();

      if (Date.now() > trialEndTime) {
        this.isValid = false;
        this.isGraceExpired = true; // Block UI
      } else {
        this.isValid = true;
        this.isGraceExpired = false;
      }
    }
  }

  getFingerprint(): string {
    const platform = os.platform();
    const hostname = os.hostname();
    const arch = os.arch();
    return `${hostname}-${platform}-${arch}`.replace(/[^A-Za-z0-9-]/g, '');
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
    // Re-check trial on every request to prevent runtime expiration bypass
    this.initTrialStatus();

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
        this.isTrial = false;
        this.trialExpires = null;
        
        process.env.ACTIVATION_TOKEN = response.data.token;
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

  async verifyHeartbeat(): Promise<void> {
    const licenseKey = process.env.LICENSE_KEY || '';
    if (!licenseKey) {
      // Running in Trial mode - heartbeat check bypassed
      this.initTrialStatus();
      return;
    }

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
        this.isTrial = false;
        this.trialExpires = null;
        process.env.ACTIVATION_TOKEN = response.data.token;
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
          process.env.GRACE_EXPIRES = grace;
          console.warn(`[LICENSE] Connection to licensing server failed. Grace period started. Expires on: ${grace}`);
        } else if (new Date(this.graceExpires) < new Date()) {
          this.isGraceExpired = true;
          console.error('[LICENSE] Grace period expired. Restricting advanced panel features.');
        }
      }
    }
  }

  isRestricted(): boolean {
    if (process.env.NODE_ENV !== 'production') return false;
    this.initTrialStatus();
    return !this.isValid || this.isGraceExpired;
  }
}

export default new LicenseService();
export { LicenseService };
