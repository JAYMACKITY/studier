// Vercel Serverless Function for verifying Stripe checkout sessions

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe secret key is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is not set');
    return res.status(500).json({ 
      error: 'Payment server configuration error. Please contact support at hello@studier.me' 
    });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  try {
    const { sessionId } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if payment was successful
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      res.status(200).json({
        customerId: session.customer,
        subscriptionId: session.subscription,
        sessionId: session.id,
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: error.message || 'Failed to verify session' });
  }
};

