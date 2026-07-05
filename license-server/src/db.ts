import fs from 'fs';
import path from 'path';

export interface License {
  id: number;
  license_key: string;
  customer_email: string;
  license_type: 'regular' | 'extended' | 'unlimited';
  max_activations: number;
  status: 'active' | 'suspended' | 'revoked';
  source: string;
  expires_at: string | null;
  created_at: string;
}

export interface Activation {
  id: number;
  license_id: number;
  domain: string;
  fingerprint: string;
  activated_at: string;
  last_heartbeat: string;
}

interface DatabaseState {
  licenses: License[];
  activations: Activation[];
}

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, 'licensing.json');

function readDb(): DatabaseState {
  if (!fs.existsSync(dbPath)) {
    // Seed default licenses
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const initialLicenses: License[] = [
      {
        id: 1,
        license_key: 'TELE-11111-22222-33333-44444',
        customer_email: 'regular@example.com',
        license_type: 'regular',
        max_activations: 1,
        status: 'active',
        source: 'CodeCanyon',
        expires_at: futureDate,
        created_at: now
      },
      {
        id: 2,
        license_key: 'TELE-55555-66666-77777-88888',
        customer_email: 'extended@example.com',
        license_type: 'extended',
        max_activations: 5,
        status: 'active',
        source: 'CodeCanyon',
        expires_at: futureDate,
        created_at: now
      },
      {
        id: 3,
        license_key: 'TELE-99999-99999-99999-99999',
        customer_email: 'suspended@example.com',
        license_type: 'regular',
        max_activations: 1,
        status: 'suspended',
        source: 'CodeCanyon',
        expires_at: futureDate,
        created_at: now
      },
      {
        id: 4,
        license_key: 'TELE-00000-00000-00000-00000',
        customer_email: 'expired@example.com',
        license_type: 'regular',
        max_activations: 1,
        status: 'active',
        source: 'CodeCanyon',
        expires_at: pastDate,
        created_at: now
      },
      {
        id: 5,
        license_key: 'TRIAL',
        customer_email: 'trial@telenova.com',
        license_type: 'regular',
        max_activations: 999999, // Allow unlimited activations on the trial key
        status: 'active',
        source: 'System',
        expires_at: null,
        created_at: now
      }
    ];

    const state: DatabaseState = {
      licenses: initialLicenses,
      activations: []
    };

    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf8');
    return state;
  }

  const content = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(content);
}

function writeDb(state: DatabaseState) {
  const tempPath = `${dbPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempPath, dbPath);
}

export const db = {
  getLicenses(): License[] {
    return readDb().licenses;
  },

  getLicenseByKey(key: string): License | undefined {
    return this.getLicenses().find(l => l.license_key === key);
  },

  getActivations(): Activation[] {
    return readDb().activations;
  },

  getActivationsForLicense(licenseId: number): Activation[] {
    return this.getActivations().filter(a => a.license_id === licenseId);
  },

  addActivation(licenseId: number, domain: string, fingerprint: string): Activation {
    const state = readDb();
    const newActivation: Activation = {
      id: state.activations.length > 0 ? Math.max(...state.activations.map(a => a.id)) + 1 : 1,
      license_id: licenseId,
      domain,
      fingerprint,
      activated_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString()
    };
    state.activations.push(newActivation);
    writeDb(state);
    return newActivation;
  },

  updateHeartbeat(activationId: number) {
    const state = readDb();
    const activation = state.activations.find(a => a.id === activationId);
    if (activation) {
      activation.last_heartbeat = new Date().toISOString();
      writeDb(state);
    }
  },

  deleteActivation(licenseId: number, domain: string, fingerprint: string): boolean {
    const state = readDb();
    const initialLength = state.activations.length;
    state.activations = state.activations.filter(
      a => !(a.license_id === licenseId && a.domain === domain && a.fingerprint === fingerprint)
    );
    writeDb(state);
    return state.activations.length < initialLength;
  },

  addLicense(
    licenseKey: string, 
    customerEmail: string, 
    licenseType: 'regular' | 'extended' | 'unlimited', 
    maxActivations: number, 
    expiresAt: string | null = null, 
    source: string = 'API'
  ): License {
    const state = readDb();
    const existing = state.licenses.find(l => l.license_key === licenseKey);
    if (existing) {
      throw new Error('License key already exists');
    }

    const newLicense: License = {
      id: state.licenses.length > 0 ? Math.max(...state.licenses.map(l => l.id)) + 1 : 1,
      license_key: licenseKey,
      customer_email: customerEmail,
      license_type: licenseType,
      max_activations: maxActivations,
      status: 'active',
      source,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };
    
    state.licenses.push(newLicense);
    writeDb(state);
    return newLicense;
  }
};
