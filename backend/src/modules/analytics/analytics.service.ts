import analyticsRepository from './analytics.repository.js';

class AnalyticsService {
  async getMetrics(chatId: string | number, days = 7): Promise<{ event_type: string; count: number }[]> {
    return analyticsRepository.getMetrics(chatId, days);
  }
}

export default new AnalyticsService();
