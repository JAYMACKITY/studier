// Vercel Serverless Function for creating Stripe checkout sessions

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
    const { email, userId, productId, price, successUrl, cancelUrl } = req.body;

    // Validate required fields
    if (!email || !userId || !productId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product: productId, // prod_TdO6xr6OLrGCau
          recurring: {
            interval: 'month',
          },
          unit_amount: price || 450, // $4.50 in cents
        },
        quantity: 1,
      }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
      },
      customer_email: email,
      metadata: {
        userId: userId,
      },
      success_url: successUrl || `${req.headers.origin || 'https://studier.vercel.app'}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://studier.vercel.app'}/pricing.html`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
};

