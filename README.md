# CollabHub - Brand & Influencer Collaboration Platform

## Overview

CollabHub is a subscription-based platform connecting brands and influencers for collaboration opportunities.

**Features:**
- Real-time messaging between brands and influencers
- Campaign management and discovery
- Subscription tiers (Free, Basic $9.99/mo, Pro $29.99/mo)
- Stripe payment integration
- Social authentication (Google OAuth)
- Web and mobile apps

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL
- Socket.IO (real-time messaging)
- Stripe API
- JWT authentication

**Frontend:**
- Next.js (Web)
- React Native + Expo (Mobile)
- TypeScript

## Project Structure

```
collabhub/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── sql/
│   │   └── schema.sql
│   ├── package.json
│   └── .env.example
├── web/
│   ├── pages/
│   ├── components/
│   └── package.json
├── mobile/
│   ├── src/
│   ├── app.json
│   └── package.json
└── README.md
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install

# Create PostgreSQL database
createcreatedb collabhub

# Run migrations
psql collabhub < sql/schema.sql

# Set environment variables
cp .env.example .env
# Edit .env with your config

# Start development server
npm run dev
```

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

**Campaigns:**
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign (brand only)
- `PUT /api/campaigns/:id` - Update campaign

**Applications:**
- `POST /api/applications` - Apply to campaign
- `GET /api/applications/campaign/:id` - Get applications for campaign
- `PUT /api/applications/:id` - Accept/reject application

**Messaging:**
- `GET /api/messages/conversations` - Get user conversations
- `POST /api/messages/conversations` - Get or create conversation
- `GET /api/messages/conversations/:id` - Get conversation messages
- `POST /api/messages/send` - Send message

**Subscriptions:**
- `GET /api/subscriptions/info` - Get subscription info
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

**Profiles:**
- `GET /api/profiles/:userId` - Get user profile
- `PUT /api/profiles/update` - Update profile
- `GET /api/profiles/search/influencers` - Search influencers

## Environment Variables

See `.env.example` for all required variables:

```bash
DATABASE_URL
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
GOOGLE_CLIENT_ID
```

## Development

```bash
# Run tests
npm test

# Run with hot reload
npm run dev

# Check logs
logs/
```

## Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## Roadmap

- [ ] Web app (Next.js)
- [ ] Mobile app (React Native)
- [ ] Enhanced analytics dashboard
- [ ] Advanced search filters
- [ ] Contract/agreement management
- [ ] Escrow payments
- [ ] Performance badges/ratings

## License

MIT