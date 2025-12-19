// Vercel Serverless Function for canceling Stripe subscriptions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, subscriptionId } = req.body;

    // Validate required fields
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscription ID' });
    }

    // Cancel the subscription at period end (allows user to keep access until billing period ends)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.status(200).json({ 
      success: true,
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
};

