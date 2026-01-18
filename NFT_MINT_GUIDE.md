# NFT Mint System Guide - TradeHax

Complete guide to minting exclusive NFT skins in Astral Awakening: TradeHax.

## Overview

Players can mint 5 exclusive NFT skins representing Celtic/Germanic/Nordic deities. Each mint:
- **Costs**: 10 SHAMROCK tokens
- **Burns tokens** on-chain (reduces supply)
- **Uploads image + metadata** to Arweave (permanent storage)
- **Creates Metaplex NFT** on Solana (compatible with all wallets/explorers)
- **Auto-assigned**: No collection required (single NFTs)

## Available Skins

| Skin | God(dess) | Element | Rarity | Description |
|------|-----------|---------|--------|-------------|
| Odin's Raven Cape | Odin | Air | Legendary | Authority and wisdom from the AllFather |
| Brigid's Knot Cloak | Brigid | Fire | Legendary | Celtic knotwork symbolizing fire and healing |
| Freya's Ice Veil | Freya | Ice | Legendary | Crystalline veil of beauty and magic |
| Thor's Storm Mantle | Thor | Lightning | Epic | Crackling mantle of thunder and power |
| Loki's Shadow Weave | Loki | Shadow | Epic | Shifty shadows cling to you |

## How to Mint

### Step 1: Earn SHAMROCK Tokens
Complete tasks to earn SHAMROCK:
- **Tweet Quest**: Post #HyperboreaAscent → 100 SHAMROCK
- **Game Rewards**: Collect clovers (future feature)
- **Staking**: Lock SHAMROCK for rewards (future feature)

### Step 2: Connect Wallet
1. Click "Connect Phantom" in HUD
2. Approve wallet connection
3. Confirm you're on **Solana Devnet**

Ensure your wallet has a SHAMROCK token account:
```bash
spl-token accounts --owner YOUR_WALLET_ADDRESS --url devnet
```

### Step 3: Open NFT Mint Panel
1. Click **"🎨 Mint NFT Skin"** button in HUD
2. Panel opens on right side of screen
3. Browse 5 available skins

### Step 4: Select & Mint
1. Click desired skin card
2. Review name, description, attributes
3. Click **"✨ Mint for 10 SHAMROCK"**
4. Confirm transaction in wallet
5. Wait for confirmation (~10-30 seconds)

### Step 5: View Your NFT
- Success message shows Explorer link
- NFT appears in wallet immediately
- Can transfer/trade on Solana NFT marketplaces

## Technical Details

### Backend Endpoints

#### Upload Metadata
```http
POST /api/upload-nft-metadata
Content-Type: multipart/form-data

Fields:
- image: PNG/JPG file (max 5MB)
- name: NFT name (string)
- description: NFT description (string)
- attributes: Trait array (JSON string)

Response:
{
  "success": true,
  "imageUri": "https://arweave.net/...",
  "metadataUri": "https://arweave.net/...",
  "metadata": { ... }
}
```

#### Mint NFT
```http
POST /api/mint-nft
Content-Type: application/json

{
  "wallet": "USER_WALLET_ADDRESS",
  "metadataUri": "https://arweave.net/...",
  "name": "NFT Name"
}

Response:
{
  "success": true,
  "message": "NFT minted successfully!",
  "mintAddress": "...",
  "burningSignature": "...",
  "explorer": "https://explorer.solana.com/..."
}
```

#### Check NFT Balance
```http
GET /api/nft-balance/:wallet

Response:
{
  "wallet": "...",
  "nftCount": 2,
  "nfts": [
    {
      "address": "...",
      "name": "Odin's Raven Cape",
      "symbol": "TRADEHAX",
      "uri": "..."
    }
  ]
}
```

### Token Flow

1. **Burn**: 10 SHAMROCK tokens → burned from user's token account
2. **Upload**: Image + metadata → Arweave (permanent)
3. **Mint**: Metaplex Token Metadata → new NFT on-chain
4. **Store**: NFT record → MongoDB (optional)

### Metadata Structure

```json
{
  "name": "Odin's Raven Cape",
  "description": "Ethereal cape adorned with ravens...",
  "image": "https://arweave.net/abc123",
  "attributes": [
    { "trait_type": "God", "value": "Odin" },
    { "trait_type": "Rarity", "value": "Legendary" },
    { "trait_type": "Element", "value": "Air" }
  ],
  "properties": {
    "files": [
      {
        "uri": "https://arweave.net/abc123",
        "type": "image/png"
      }
    ],
    "category": "image"
  },
  "seller_fee_basis_points": 500
}
```

## Environment Variables (Backend)

Required for NFT minting:

```env
SHAMROCK_MINT=<token-mint-address>
AUTHORITY_SECRET=<keypair-array>
SOLANA_RPC=https://api.devnet.solana.com
```

Optional:
```env
MONGODB_URI=<atlas-uri>  # For storing NFT records
```

## Troubleshooting

### Error: "Insufficient SHAMROCK balance"
**Problem**: User doesn't have 10 SHAMROCK
**Solution**: 
- Complete tweet quests to earn more
- Check balance: `spl-token accounts --owner YOUR_WALLET`

### Error: "User does not have a SHAMROCK token account"
**Problem**: No associated token account for SHAMROCK
**Solution**:
- Mint system creates it automatically (if exists)
- Manually create: `spl-token create-account MINT_ADDRESS`

### Error: "Failed to upload NFT metadata"
**Problem**: Image too large or invalid format
**Solution**:
- Max file size: 5MB
- Supported: PNG, JPG, GIF
- Resize image if needed

### NFT not appearing in wallet
**Problem**: Transaction may not be finalized
**Solution**:
- Wait 10-30 seconds
- Refresh wallet
- Check transaction on Solana Explorer

### Arweave upload slow
**Problem**: Network congestion
**Solution**:
- Wait and retry
- Arweave eventually processes (permanent)

## Advanced: Custom Skins

To add new NFT skin options:

### 1. Update NFT_SKINS in Frontend
Edit `tradehax-frontend/src/NFTMint.jsx`:

```javascript
{
  id: 'custom-id',
  name: 'Skin Name',
  description: 'Skin description',
  icon: '🎨',  // Emoji for UI
  attributes: [
    { trait_type: 'Category', value: 'Value' },
  ]
}
```

### 2. Create Art Assets
- Recommended: 512x512 PNG
- Include deity symbol/theme
- Follow ethereal/Escher aesthetic

### 3. Deploy Updates
- Commit frontend changes
- Deploy to GitHub Pages or Vercel
- No backend changes needed

## Future Enhancements

- [ ] NFT collections (group skins)
- [ ] Royalties (2-5% on resales)
- [ ] Mutable metadata (update NFT after mint)
- [ ] Soulbound tokens (non-transferable skins)
- [ ] Cosmetics store (premium skins for sale)
- [ ] Skin gallery (showcase owned NFTs)
- [ ] Cosmetic application to player in-game
- [ ] Trading between players
- [ ] Seasonal limited-edition drops
- [ ] Level-based unlocks (mint after 5 game sessions)

## Performance Notes

- **Upload time**: 5-15 seconds (Arweave)
- **Mint time**: 10-30 seconds (Solana finality)
- **Storage cost**: ~0.002 SOL (Arweave fee)
- **Mint cost**: 0.00333 SOL (Solana tx fee) + 10 SHAMROCK burn

Total cost per mint: ~0.005 SOL + 10 SHAMROCK

## Security Considerations

✅ **Secure**:
- Authority keypair never exposed to frontend
- Backend controls token burning
- No private key in environment
- Metaplex standard is battle-tested

⚠️ **Monitor**:
- Rate limit API (prevent abuse)
- Verify image legitimacy
- Monitor token supply
- Track unique minters

## Integration with Game

Future feature: Apply minted skin to player avatar in-game.

```javascript
// Example (not yet implemented)
const applyNFTSkin = (skinId, player) => {
  const skinTextures = {
    'odin-raven': loadTexture('/skins/odin.png'),
    'brigid-knot': loadTexture('/skins/brigid.png'),
    // ... etc
  };
  
  player.material.map = skinTextures[skinId];
};
```

## Resources

- [Metaplex Foundation](https://www.metaplex.com/)
- [Token Metadata Standard](https://github.com/metaplex-foundation/mpl-token-metadata)
- [Arweave Docs](https://docs.arweave.org/)
- [Solana NFT Guide](https://docs.solana.com/developers/nfts)

## Support

Issues or questions?
1. Check this guide's troubleshooting section
2. View transaction on Solana Explorer
3. Check backend logs: `vercel logs`
4. Ask in community Discord

---

**NFT minting is live on Devnet! Mint your first skin today! 🍀✨**
