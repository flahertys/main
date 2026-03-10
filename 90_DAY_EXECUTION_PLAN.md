# TradeHax Digital Empire: 90-Day Execution Plan

## 🎯 North Star Metric
**Viral Coefficient: 0.3 → 1.5** (compound network growth)

---

## 📅 Phase 1: Foundation (Weeks 1-4) - "Make It Clear"

### Week 1: Hero + Clarity ✅ COMPLETE
- [x] Hero: "Multiply Your Edge" tagline
- [x] Value props: "For traders/creators/builders"
- [x] 60-second onboarding promise
- **Expected impact**: +30% CTA click-through rate

### Week 2: Gamified Onboarding ✅ COMPLETE
- [x] 4-step achievement system
- [x] Progress bars + badges
- [x] Reward messaging ($100 credits)
- **Expected impact**: 5x onboarding completion rate

### Week 3: Leaderboards (HIGH PRIORITY - START NOW)
**Why**: Drives daily return visits & competition

```tsx
// /leaderboards route structure
- /leaderboards/trading (Real P&L, profit charts)
- /leaderboards/music (Listens, popularity)  
- /leaderboards/services (Completed projects, ratings)
```

**Components needed**:
- `LeaderboardCard` (user rank, stats, position)
- `RealTimeLeaderboard` (WebSocket for live updates)
- `PremiumBadge` (featured rank = $9/mo)

**Metrics to track**:
- Daily visits to leaderboard
- % of users checking rank
- Premium badge conversion

### Week 4: Marketplace Skeleton (HIGH PRIORITY)
**Why**: Unlocks creator economy

```tsx
// /agents/marketplace structure
- Browse trading strategies
- Browse music templates  
- Browse service blueprints
```

**MVP components**:
- `AgentCard` (name, creator, rating, price)
- `SearchFilter` (category, rating, price range)
- `PreviewModal` (quick description, try demo)

**Revenue model**:
- TradeHax: 30% commission
- Creator: 70% revenue share
- Marketing: Free featured spot for 7 days

---

## 📅 Phase 2: Network Effects (Weeks 5-8) - "Make It Stick"

### Week 5: Discord Bot Integration
**Distribution channel**: Deploy bot to Discord app directory

```
Commands available:
@tradehax scan AAPL          (stock signal)
@tradehax signal ETH         (crypto)
@tradehax generate "upbeat"  (music idea)
@tradehax help               (guide)
```

**Expected impact**:
- Bot installs: 50 → 10,000 guilds
- Free users from Discord: 1,000/week
- Premium conversions: 5% of new users = 50/week

### Week 6: Referral Flywheel
**Mechanism**: "Invite 3 friends, unlock Pro for free"

```
User A signs up
├─ Gets unique referral link
│
User B joins via link
├─ Gets 1,000 free credits
├─ User A gets 1,000 credits (toward subscription)
│
When User B upgrades to Pro:
├─ User A automatically unlocked Pro (3 invites)
└─ TradeHax: +1 upgraded user (net 70% LTV gain)
```

**Metrics**:
- Referral rate: 10% → 25%
- Viral coefficient: K = (1 invite/user) × (25% conversion) = 0.25 → 0.5+

### Week 7: Learning Center Framework
**Model**: Free → Freemium → Premium

```
Tier 1: Free (YouTube-style)
├─ "Trading 101: Signals Basics" (5 videos)
├─ "Music 101: Composition Tips" (5 videos)
└─ "Services 101: Delivery Models" (5 videos)

Tier 2: Intermediate (Optional)
├─ "Advanced Strategies" (locked, email)
└─ "Creator Growth" (locked, email)

Tier 3: Premium Certificate ($49)
├─ "Mastery: Build Your Signal"
├─ PDF + code templates
├─ Slack community access
└─ % revenue share in marketplace
```

**Why**: Drives premium conversions + engagement

### Week 8: Community Discord
**Goal**: 500+ active members in community Discord

```
Channels:
#leaderboard-updates    (daily top traders)
#strategy-showcase      (creators share wins)
#general-chat           (community)
#Premium tier upgrades = admin + role
```

---

## 📅 Phase 3: Monetization Clarity (Weeks 9-12) - "Make It Pay"

### Week 9: Pricing Page Redesign

```
┌─────────────┐──────────────┐──────────────┐──────────────┐
│   Free      │    Pro       │   Builder    │   Council    │
├─────────────┼──────────────┼──────────────┼──────────────┤
│   $0        │   $9/mo      │  $29/mo      │  $99/mo      │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ 1 scan/day  │ Unlimited    │ API access   │ 1:1 consult  │
│ Paper mode  │ Live trading │ Agent build  │ Custom model │
│ 1 gen/day   │ Premium sigs │ Revenue %    │ White-label  │
│ Free learn  │ Learn access │ Learn access │ Learn access │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

**Design**: Radiant gradient, clear unlock paths, social proof

### Week 10-11: Conversion Optimization
- A/B test pricing (current vs. "$49 instead of $99")
- Landing page tests (value hierarchy)
- Email sequences (cart abandonment style)
- Premium feature teasers

### Week 12: Metrics Review + Roadmap Q2
**Check these numbers:**
- MAU growth: baseline → target
- Referral coefficient
- Premium conversion rate
- Marketplace revenue
- Discord bot invites
- NPS score

---

## 🎨 Quick Wins Summary (Easy Wins, Big Impact)

| Priority | Feature | Effort | Impact | Owner |
|----------|---------|--------|--------|-------|
| 1 | Leaderboards | 3 days | +40% DAU | Frontend |
| 2 | Marketplace MVP | 5 days | +30% engagement | Full-stack |
| 3 | Discord bot commands | 2 days | +1K users/week | Backend |
| 4 | Referral tracking | 2 days | +K coefficient | Backend |
| 5 | Learning center | 5 days | +8% conversion | Content |
| 6 | Pricing page update | 1 day | +5% LTV | Design |

---

## 📊 Success Metrics (Track Weekly)

```
Week 1-4:   Clear messaging → +30% CTA, 5x onboarding
Week 5-8:   Network effects → Viral K = 0.5+, 10K Discord
Week 9-12:  Monetization → 8% premium conversion, $50K/m revenue
```

---

## 🚀 Why This Wins

1. **Clarity first**: Users understand *exactly* what they're getting
2. **Progress visible**: Achievements + leaderboards show results
3. **Community**: Server + Discord = network effects
4. **Creator economy**: Marketplace = compounding value as users create
5. **Mobile-ready**: Discord bot = accessible everywhere
6. **Revenue transparent**: Clear pricing = no surprises = higher LTV

---

## 📝 Resource Checklist

- [ ] Designer: Leaderboard UI + pricing page
- [ ] Backend: Leaderboard API + marketplace + Discord bot
- [ ] Frontend: Leaderboard components + marketplace UI
- [ ] Content: 15 learning videos + marketing copy
- [ ] Marketing: Discord bot listing page + referral landing page
- [ ] Analytics: Cohort analysis + funnel tracking

---

## 🎯 Month 3 Vision

**TradeHax becomes the network where:**
- 50K users check their trading rank daily
- 5K creators earn $1K+/month from marketplace
- 1M Discord messages/month about strategies
- Premium tier is "obvious must-have" at $9/mo
- 1.5+ viral coefficient (compounding growth)

**That's a digital empire.** 🚀

---

*Next: Execute Week 1 ✅ then sync on Week 3 leaderboards*
