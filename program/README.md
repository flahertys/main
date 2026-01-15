# Solana Counter Program

A beginner-friendly Anchor program demonstrating essential Solana development concepts.

## 🎓 Educational Purpose

This program demonstrates:
- **Program Derived Addresses (PDAs)** for state management
- **Cross-Program Invocations (CPIs)** for SOL transfers
- **Account initialization** with `init_if_needed`
- **PDA signing** for program-controlled transfers

## 📝 Program Overview

### Instructions

1. **increment**: Increases counter value by 1 and transfers 0.001 SOL from user to vault
2. **decrement**: Decreases counter value by 1 and transfers 0.001 SOL from vault back to user

### Program Derived Addresses

1. **Counter PDA** (seed: `"counter"`)
   - Stores global counter state
   - Accessible to all users
   - Auto-initialized on first increment

2. **Vault PDA** (seeds: `"vault"`, `user.key()`)
   - User-specific vault for SOL storage
   - Used for CPI signing in decrement
   - One vault per user

## 🚀 Getting Started

### Prerequisites

- Rust 1.75+
- Solana CLI 1.18+
- Anchor Framework 0.31+

### Build

```bash
anchor build
```

### Test

```bash
anchor test
```

### Deploy

```bash
# Sync program ID
anchor keys sync

# Rebuild with synced ID
anchor build

# Deploy to devnet
anchor deploy
```

If deployment times out, use a custom RPC:
```bash
anchor deploy --provider.cluster <your-custom-rpc>
```

## 📁 Project Structure

```
program/
├── programs/
│   └── counter/
│       ├── src/
│       │   └── lib.rs        # Program logic
│       ├── Cargo.toml
│       └── Xargo.toml
├── tests/
│   └── counter.ts            # Integration tests
├── Anchor.toml               # Anchor configuration
├── Cargo.toml
└── package.json
```

## 🔍 Key Concepts

### PDA Derivation

```rust
// Counter PDA
let (counter, _bump) = Pubkey::find_program_address(
    &[b"counter"],
    &program_id
);

// Vault PDA (user-specific)
let (vault, _bump) = Pubkey::find_program_address(
    &[b"vault", user.key().as_ref()],
    &program_id
);
```

### Cross-Program Invocations

**User to Vault (basic CPI):**
```rust
system_program::transfer(
    CpiContext::new(system_program, transfer_accounts),
    1_000_000 // 0.001 SOL
)?;
```

**Vault to User (CPI with PDA signing):**
```rust
system_program::transfer(
    CpiContext::new_with_signer(
        system_program,
        transfer_accounts,
        &[&vault_seeds[..]]  // PDA signer
    ),
    1_000_000
)?;
```

## 📚 Learning Resources

- [Anchor Framework Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Program Library](https://spl.solana.com/)

## 🙏 Credits

This program is based on the [solana-developers/anchor-web3js-nextjs](https://github.com/solana-developers/anchor-web3js-nextjs) educational template created by the Solana Foundation.

## 📝 License

This project is for educational purposes and set up for Solana devnet use only.
