import type { LogTable } from '../../types/db.js';
import logRepository from './log.repository.js';

interface ActivityLogInput {
  chatId: string | number;
  chatTitle?: string | null;
  userId?: string | number | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  eventType: string;
  messageSent?: boolean;
  messageText?: string | null;
}

class LogService {
  async getAllLogs(limit = 100): Promise<LogTable[]> {
    return logRepository.getAllLogs(limit);
  }

  async createActivityLog(data: ActivityLogInput) {
    return logRepository.createLog(data);
  }

  async cleanupOldLogs(olderThanDays: number) {
    return logRepository.deleteOldLogs(olderThanDays);
  }
}

export default new LogService();
