import subscriptionRepository from '../../repositories/subscription.repository.js';

interface SubscriptionInput {
  userId: string;
  chatId?: string;
  plan?: string;
  expiresAt?: string;
}

class PaymentsService {
  async listSubscriptions() {
    return subscriptionRepository.getAll();
  }

  async createSubscription(data: SubscriptionInput) {
    await subscriptionRepository.upsert({
      user_id: String(data.userId),
      chat_id: data.chatId ? String(data.chatId) : null,
      plan: data.plan || 'monthly',
      expires_at: data.expiresAt || null,
      status: 'active',
    });
    return { success: true };
  }

  async deleteSubscription(id: number) {
    return subscriptionRepository.deleteById(id);
  }
}

export default new PaymentsService();
