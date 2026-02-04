# Post-Hackathon Traction Tracking - Technical Design Spec

## Overview

Design document for tracking post-hackathon traction metrics for submissions. This enables SWA to measure the real-world impact and growth of projects after the hackathon ends.

**Status**: Research/Design Phase (not ready for implementation)

---

## Metrics to Track

### 1. Usage Metrics (Self-Reported + Verified)
- **Active Users**: DAU/MAU as reported by teams
- **Transaction Volume**: For Story Protocol dApps
- **Milestones**: Key achievements (launched mainnet, first 100 users, etc.)

### 2. Blockchain Metrics (Automated - Story Protocol)
- **Contract Addresses**: Testnet + Mainnet deployments
- **Transaction Count**: Number of on-chain transactions
- **Unique Addresses**: Wallets interacting with the contract
- **TVL/Volume**: If applicable to the project type

### 3. Social Metrics (Automated - Twitter API)
- **Follower Count Growth**: Track changes over time
- **Post Impressions/Reach**: Visibility of project posts
- **Engagement**: Likes, retweets, replies on project posts

### 4. Website Traffic (Self-Reported)
- **Monthly Visits**: As reported by teams
- **Traffic Source**: Optional breakdown

---

## Data Model Design

### New Table: `submission_traction`
```sql
CREATE TABLE submission_traction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

  -- Contract addresses
  testnet_contract_address TEXT,
  mainnet_contract_address TEXT,
  contract_deployed_at TIMESTAMPTZ,

  -- Twitter integration
  twitter_handle TEXT,
  twitter_user_id TEXT,  -- For API lookups

  -- Website
  website_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id)
);
```

### New Table: `traction_snapshots`
Periodic snapshots of metrics for historical tracking.

```sql
CREATE TABLE traction_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Usage (self-reported)
  reported_dau INTEGER,
  reported_mau INTEGER,
  reported_monthly_visits INTEGER,

  -- On-chain (automated)
  onchain_tx_count INTEGER,
  onchain_unique_addresses INTEGER,
  onchain_tvl_usd NUMERIC(20,2),

  -- Twitter (automated)
  twitter_followers INTEGER,
  twitter_impressions_7d INTEGER,
  twitter_engagement_7d INTEGER,  -- likes + retweets + replies

  -- Metadata
  data_source TEXT,  -- 'manual', 'api', 'both'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, snapshot_date)
);
```

### New Table: `traction_milestones`
Key achievements tracked over time.

```sql
CREATE TABLE traction_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

  milestone_type TEXT NOT NULL,  -- 'mainnet_launch', 'user_milestone', 'funding', 'partnership', etc.
  title TEXT NOT NULL,
  description TEXT,
  achieved_at DATE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  proof_url TEXT,  -- Link to announcement, tx, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone types enum for validation
CREATE TYPE milestone_type AS ENUM (
  'testnet_launch',
  'mainnet_launch',
  'first_100_users',
  'first_1000_users',
  'first_10000_users',
  'funding_raised',
  'partnership',
  'media_feature',
  'award',
  'other'
);
```

---

## Twitter API Integration

### API Tier Required
**Twitter API Pro** ($5,000/month) or **Basic** ($100/month) with limitations:

| Metric | Basic ($100/mo) | Pro ($5,000/mo) |
|--------|-----------------|-----------------|
| Follower count | ✅ Yes | ✅ Yes |
| User lookup | ✅ 10K/month | ✅ 1M/month |
| Tweet metrics | ❌ No | ✅ Yes |
| Impressions | ❌ No | ✅ Yes |

**Recommendation**: Start with Basic tier for follower tracking. Evaluate Pro tier ROI based on cohort size.

### Implementation Approach
1. **Teams link Twitter account** during submission or post-hackathon
2. **Daily cron job** fetches follower counts via `GET /2/users/:id`
3. **Weekly aggregation** computes growth rates
4. For impressions (Pro tier): Use `GET /2/tweets/:id` with `tweet.fields=public_metrics`

### Alternative: OAuth-based Access
Teams could authorize SWA to read their Twitter Analytics:
- Grants access to organic impressions
- More accurate engagement data
- Requires user action (OAuth flow)

---

## Story Protocol On-Chain Metrics

### Data Sources
1. **Story Protocol Block Explorer API** (if available)
2. **Direct RPC queries** to Story Protocol nodes
3. **Indexer service** (The Graph or custom)

### Metrics to Track
```typescript
interface OnChainMetrics {
  contractAddress: string;
  network: 'testnet' | 'mainnet';
  transactionCount: number;
  uniqueAddresses: number;
  firstTxAt: Date;
  lastTxAt: Date;
  // Story-specific
  ipAssetsCreated?: number;
  licensesIssued?: number;
  royaltiesEarned?: string;  // In protocol token
}
```

### Implementation
1. Teams submit contract address via dashboard
2. Backend validates contract exists on Story Protocol
3. Cron job fetches metrics daily
4. Store snapshots in `traction_snapshots`

---

## UI Components

### Team Dashboard (`/dashboard/traction` or `/submissions/[id]/traction`)
- **Connect accounts**: Link Twitter, add contract addresses
- **Report metrics**: Submit self-reported DAU/MAU, milestones
- **View history**: Charts showing metric trends over time

### Admin Dashboard (`/admin/traction`)
- **Cohort overview**: Aggregate traction across all submissions in a cohort
- **Top performers**: Leaderboard by various metrics
- **Verification queue**: Review reported milestones
- **Export**: CSV/JSON export for reporting

### Public Project Page (optional)
- **Traction badge**: Show verified metrics on project cards
- **Growth indicators**: Follower growth, user growth arrows

---

## Visibility & Permissions

| Role | Can View | Can Edit |
|------|----------|----------|
| Team member | Own submission metrics | Report own metrics |
| Admin | All submissions | Verify milestones, edit any |
| Sponsor | Submissions in their tracks | None |
| Public | Optional badges only | None |

---

## Implementation Phases

### Phase 1: Data Model & Manual Entry
**Complexity**: Low | **Effort**: 1-2 weeks | **Dependencies**: None

| Task | Complexity | Notes |
|------|------------|-------|
| Database migration (3 tables) | Low | Standard SQL, follows existing patterns |
| TypeScript types | Low | Add interfaces to `types/index.ts` |
| Traction service layer | Low | CRUD operations, follows service pattern |
| Team traction form | Medium | Form with validation for manual entry |
| Team traction dashboard | Medium | Display metrics, basic charts |
| Admin traction list view | Low | Table view of all submissions |
| Milestone CRUD | Low | Add/edit/delete milestones |

**Deliverables**:
- Teams can manually report: DAU/MAU, website traffic, contract addresses
- Teams can log milestones with proof URLs
- Admins can view all submissions' traction data
- Admins can verify/reject milestones

---

### Phase 2: Twitter Integration
**Complexity**: Medium | **Effort**: 2-3 weeks | **Dependencies**: Twitter API access, budget approval

#### Phase 2a: Team-Initiated (No API Cost)
**Complexity**: Low | **Effort**: 3-5 days

| Task | Complexity | Notes |
|------|------------|-------|
| Add Twitter handle field | Low | Text input in traction form |
| Manual follower entry | Low | Teams enter their own follower count |
| Twitter profile link display | Low | Link to twitter.com/handle |

**Rollout strategy**: Teams self-report Twitter metrics initially. This validates demand before API investment.

#### Phase 2b: Automated Follower Tracking (Basic API - $100/mo)
**Complexity**: Medium | **Effort**: 1 week

| Task | Complexity | Notes |
|------|------------|-------|
| Twitter API integration | Medium | Set up API client, handle rate limits |
| User ID lookup by handle | Low | `GET /2/users/by/username/:username` |
| Daily follower sync cron | Medium | Scheduled job, error handling, retries |
| Follower growth chart | Medium | Time-series visualization |

**API Limits (Basic tier)**:
- 10,000 requests/month for user lookups
- Sufficient for ~300 projects with daily syncs

#### Phase 2c: Full Twitter Analytics (Pro API - $5,000/mo)
**Complexity**: High | **Effort**: 2 weeks

| Task | Complexity | Notes |
|------|------------|-------|
| Tweet metrics fetching | Medium | Impressions, engagement per tweet |
| Engagement aggregation | Medium | Sum likes, retweets, replies over time |
| OAuth for team analytics | High | Twitter OAuth 2.0 flow for deeper access |
| Engagement charts | Medium | Multi-metric visualization |

**Decision point**: Evaluate ROI after Phase 2b. Pro tier only worthwhile if 50+ active projects.

---

### Phase 3: On-Chain Integration (Dune Analytics)
**Complexity**: Medium | **Effort**: 2 weeks | **Dependencies**: Dune Enterprise API access (available)

| Task | Complexity | Notes |
|------|------------|-------|
| Dune API client setup | Low | Enterprise plan available |
| Create Dune query for Story Protocol | Medium | SQL query for contract metrics |
| Contract address validation | Low | Check address format, query existence |
| Transaction count fetching | Low | Dune query: count txs by contract |
| Unique address tracking | Low | Dune query: count distinct addresses |
| Daily on-chain sync cron | Medium | Schedule query execution, store results |
| On-chain metrics dashboard | Medium | Display tx counts, addresses, etc. |

**Dune API endpoints**:
- `POST /api/v1/query/{query_id}/execute` - Run a saved query
- `GET /api/v1/execution/{execution_id}/results` - Get query results
- Rate limits: Enterprise tier has generous limits

**Dune queries to create**:
1. Transaction count by contract address (Story Protocol)
2. Unique interacting addresses by contract
3. Daily transaction volume over time
4. (Story-specific) IP asset creation events

---

### Phase 4: Advanced Analytics & Public Features
**Complexity**: Medium-High | **Effort**: 2-3 weeks | **Dependencies**: Phases 1-3

| Task | Complexity | Notes |
|------|------------|-------|
| Cohort-level aggregations | Medium | Sum/avg metrics across cohort |
| Traction leaderboard | Medium | Rank by composite score |
| Trending score algorithm | High | Weighted formula for growth |
| Automated milestone detection | High | Detect threshold crossings |
| Public traction badges | Low | Display verified metrics on cards |
| Export to CSV/JSON | Low | Admin reporting feature |
| Sponsor track analytics | Medium | Filter by sponsor's tracks |

---

## Rollout Strategy

```
Week 1-2:   Phase 1 (Manual Entry)
            └── Teams can start reporting immediately

Week 3:     Phase 2a (Twitter handles, self-reported)
            └── Validate demand, gather Twitter handles

Week 4-5:   Phase 2b (Automated followers)
            └── Requires $100/mo API budget approval

Week 6-8:   Phase 3 (On-Chain)
            └── Requires Story Protocol API research complete

Week 9+:    Phase 4 (Advanced)
            └── Based on learnings from earlier phases
```

**Key principle**: Start with team self-reporting to validate the feature, then automate incrementally.

---

## Open Questions

1. **Twitter API budget**: Is $100/month (Basic) or $5,000/month (Pro) approved?
2. **Story Protocol APIs**: What APIs are available for on-chain data? Need to research.
3. **Data retention**: How long to keep historical snapshots?
4. **Verification process**: Who verifies milestones? Automated or manual?
5. **Public visibility**: Should traction metrics be shown publicly on project pages?

---

## Files to Create (When Ready)

### Database
- `supabase/migrations/00X_traction_tracking.sql`

### Types
- Update `src/types/index.ts` with Traction interfaces

### Services
- `src/services/traction.service.ts`

### API Routes
- `src/app/api/traction/[submissionId]/route.ts` - CRUD for traction data
- `src/app/api/traction/twitter/route.ts` - Twitter OAuth callback
- `src/app/api/cron/traction-sync/route.ts` - Daily sync job

### Pages
- `src/app/(dashboard)/submissions/[id]/traction/page.tsx` - Team traction view
- `src/app/(dashboard)/admin/traction/page.tsx` - Admin overview

### Components
- `src/components/traction/traction-form.tsx` - Manual entry form
- `src/components/traction/traction-chart.tsx` - Metrics visualization
- `src/components/traction/milestone-card.tsx` - Milestone display

---

## Next Steps

1. ✅ Technical design complete
2. ⬜ Research Story Protocol APIs for on-chain data
3. ⬜ Confirm Twitter API budget/tier
4. ⬜ Get stakeholder approval on scope
5. ⬜ Prioritize implementation phases
