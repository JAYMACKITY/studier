# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for Studier.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Backend API endpoint (Node.js, Python, etc.) to handle Stripe webhooks and checkout sessions

## Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API keys**
3. Copy your **Publishable key** (starts with `pk_`)
4. Copy your **Secret key** (starts with `sk_`) - Keep this secret!

## Step 2: Update stripe.js

Open `stripe.js` and update:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Qv9sIIzIFcUn6eSX044qCfKCxVnOxFTi0VV3fKn0qjDE5QhsnUtMOjZJEpQ0FsQR0FeItmezRjHLfLf7R8cugHM00sr3zG9fK'; // Your publishable key
const API_BASE_URL = 'https://api.studier.me'; // Your backend API URL
```

## Step 3: Set Up Backend API

You need to create three API endpoints:

### 1. Create Checkout Session (`POST /api/create-checkout-session`)

```javascript
// Example Node.js/Express endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  const { email, userId, productId, price, successUrl, cancelUrl } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product: productId, // prod_TdO6xr6OLrGCau
        recurring: {
          interval: 'month',
        },
        unit_amount: price, // 450 = $4.50
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
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  
  res.json({ id: session.id });
});
```

### 2. Verify Session (`POST /api/verify-session`)

```javascript
app.post('/api/verify-session', async (req, res) => {
  const { sessionId } = req.body;
  
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
    // Update user subscription in your database
    // session.customer contains the Stripe customer ID
    // session.subscription contains the subscription ID
    
    res.json({
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
  } else {
    res.status(400).json({ error: 'Payment not completed' });
  }
});
```

### 3. Cancel Subscription (`POST /api/cancel-subscription`)

```javascript
app.post('/api/cancel-subscription', async (req, res) => {
  const { userId } = req.body;
  
  // Get user's subscription ID from your database
  const user = await getUserById(userId);
  
  if (user.stripeSubscriptionId) {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'No active subscription' });
  }
});
```

## Step 4: Set Up Webhooks (Recommended)

Set up webhooks to handle subscription events:

1. Go to **Developers** > **Webhooks** in Stripe Dashboard
2. Add endpoint: `https://your-api-domain.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Webhook Handler Example

```javascript
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user subscription status
      updateUserSubscription(session.metadata.userId, 'premium');
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Cancel user subscription
      cancelUserSubscription(subscription.metadata.userId);
      break;
    // Handle other event types
  }

  res.json({received: true});
});
```

## Step 5: Test the Integration

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

2. Test the flow:
   - Sign up with premium plan
   - Complete checkout
   - Verify subscription in Stripe Dashboard
   - Test cancellation

## Product Configuration

Your Stripe product is already configured:
- **Product ID**: `prod_TdO6xr6OLrGCau`
- **Price**: $4.50/month
- **Trial**: 7 days

## Security Notes

- Never expose your Stripe secret key in frontend code
- Always verify webhook signatures
- Use HTTPS for all API endpoints
- Store subscription data securely in your database

## Support

If you need help, contact: hello@studier.me

