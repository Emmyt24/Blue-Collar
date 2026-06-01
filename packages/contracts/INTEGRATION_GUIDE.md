# Registry and Market Integration Guide

This guide is for developers integrating with BlueCollar Soroban contracts from backend services, workers, or indexers.

## Scope

- Registry contract: worker identity and curation
- Market contract: tips and escrow payments
- Hashing strategy for location/contact privacy
- Event listening and filtering patterns
- Troubleshooting common integration failures

## 1. Contract Initialization Process

Initialize contracts exactly once per deployment.

## 1.1 Registry Initialization

1. Deploy `bluecollar_registry.wasm`.
2. Invoke `initialize(admin)`.
3. Add one or more curators via `add_curator(admin, curator)`.
4. Verify setup with `is_initialized`, `get_admin`, and `is_curator`.

Example:

```bash
stellar contract invoke \
  --id <REGISTRY_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS>

stellar contract invoke \
  --id <REGISTRY_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network testnet \
  -- add_curator \
  --admin <ADMIN_ADDRESS> \
  --curator <CURATOR_ADDRESS>
```

## 1.2 Market Initialization

1. Deploy `bluecollar_market.wasm`.
2. Invoke `initialize(admin, fee_bps, fee_recipient)`.
3. Verify config and bounds.

Rules:

- `fee_bps` is in basis points.
- Max fee is `500` (5%).
- `initialize` panics if called twice.

Example:

```bash
stellar contract invoke \
  --id <MARKET_CONTRACT_ID> \
  --source <ADMIN_KEY> \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --fee_bps 100 \
  --fee_recipient <FEE_RECIPIENT_ADDRESS>
```

## 1.3 Recommended Bootstrapping Order

1. Deploy Registry and Market WASM.
2. Initialize Registry and Market.
3. Add curator addresses in Registry.
4. Persist contract IDs and network passphrase in app config.
5. Run a smoke flow: `register` -> `tip` -> `create_escrow` -> `release_escrow`.

## 2. Hash Computation for Location and Contact

Registry stores only SHA-256 digests for sensitive metadata.

- `location_hash = SHA-256(lowercase(city) + ":" + lowercase(iso2_country_code))`
- `contact_hash = SHA-256(lowercase(email))` or `SHA-256(e164_phone)`

Normalization rules:

- Trim leading/trailing whitespace.
- Convert city and email to lowercase.
- Use ISO-3166 alpha-2 country code (`ng`, `gb`, `us`, ...).
- Use E.164 format for phones (`+2348012345678`).

## 2.1 JavaScript Hash Example

```js
import { createHash } from 'crypto';

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function buildLocationHash(city, iso2) {
  const normalized = `${city.trim().toLowerCase()}:${iso2.trim().toLowerCase()}`;
  return sha256Hex(normalized);
}

function buildContactHash({ email, phoneE164 }) {
  if (email) {
    return sha256Hex(email.trim().toLowerCase());
  }
  if (phoneE164) {
    return sha256Hex(phoneE164.trim());
  }
  throw new Error('Either email or phoneE164 is required');
}

const locationHash = buildLocationHash('Lagos', 'NG');
const contactHash = buildContactHash({ email: 'Worker@Example.com' });
console.log({ locationHash, contactHash });
```

## 2.2 Rust Hash Example

```rust
use sha2::{Digest, Sha256};

fn sha256_hex(input: &str) -> String {
    let digest = Sha256::digest(input.as_bytes());
    hex::encode(digest)
}

fn location_hash(city: &str, iso2: &str) -> String {
    let normalized = format!("{}:{}", city.trim().to_lowercase(), iso2.trim().to_lowercase());
    sha256_hex(&normalized)
}

fn contact_hash_email(email: &str) -> String {
    sha256_hex(&email.trim().to_lowercase())
}

fn contact_hash_phone(phone_e164: &str) -> String {
    sha256_hex(phone_e164.trim())
}
```

## 3. Integration Code Examples

## 3.1 JavaScript: Register Worker and Tip

```js
import { Keypair, Networks, rpc, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';

const server = new rpc.Server('https://soroban-testnet.stellar.org');
const source = Keypair.fromSecret(process.env.SOURCE_SECRET);

async function invokeRegister({
  contractId,
  owner,
  workerId,
  name,
  category,
  locationHashHex,
  contactHashHex,
  curator,
}) {
  const account = await server.getAccount(source.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      rpc.Operation.invokeContractFunction({
        contract: contractId,
        function: 'register',
        args: [workerId, owner, name, category, locationHashHex, contactHashHex, curator],
      }),
    )
    .setTimeout(30)
    .build();

  // Sign + send omitted for brevity. Use your existing Soroban invocation wrapper.
  return tx;
}

async function invokeTip({ contractId, from, to, token, amount }) {
  const account = await server.getAccount(source.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      rpc.Operation.invokeContractFunction({
        contract: contractId,
        function: 'tip',
        args: [from, to, token, amount],
      }),
    )
    .setTimeout(30)
    .build();

  return tx;
}
```

## 3.2 Rust: Create and Release Escrow

```rust
use soroban_sdk::{Address, Env, Symbol};

pub fn create_and_release_example(
    env: Env,
    market: Address,
    escrow_id: Symbol,
    from: Address,
    to: Address,
    token: Address,
) {
    let client = crate::market::MarketContractClient::new(&env, &market);

    client.create_escrow(&escrow_id, &from, &to, &token, &1_000_i128, &1_900_000_000_u64);
    client.release_escrow(&escrow_id, &from);
}
```

## 4. Event Listening and Filtering

Use RPC/Horizon event APIs to subscribe to indexed Soroban events.

## 4.1 Registry Events

- `CurAdd`: curator added
- `CurRem`: curator removed
- `WrkReg`: worker registered
- `WrkTgl`: worker active state changed
- `WrkUpd`: worker profile updated
- `WrkDrg`: worker deregistered

Filter examples:

- All registration events: topic starts with `WrkReg`
- Updates for a worker: topic contains `(WrkUpd, <worker_id>)`
- Curator management activity: topics `CurAdd` or `CurRem`

## 4.2 Market Events

- `TipSent`: direct payment/tip
- `EscCrt`: escrow created
- `EscRel`: escrow released
- `EscCnl`: escrow cancelled

Filter examples:

- Escrow lifecycle for one ID: topics containing escrow symbol
- Fee analytics: aggregate `TipSent` amounts and subtract recipient transfers

## 4.3 JavaScript Event Polling Skeleton

```js
async function fetchContractEvents({ rpcUrl, contractId, startLedger }) {
  const response = await fetch(`${rpcUrl}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      startLedger,
      filters: [{ contractIds: [contractId] }],
      pagination: { limit: 100 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const payload = await response.json();
  return payload.events ?? [];
}
```

## 5. Troubleshooting

## 5.1 "Already initialized"

Cause:

- `initialize` called again on an already initialized contract.

Fix:

- Remove repeated init steps from deployment scripts.
- Gate init with your deployment-state store.

## 5.2 "Caller is not a curator" (Registry `register`)

Cause:

- Caller address was not added with `add_curator`.

Fix:

- Verify with `is_curator` before invoking `register`.
- Ensure transaction is signed by the same curator address passed as argument.

## 5.3 "Not authorized"

Cause:

- Caller is not allowed for owner/admin restricted actions.

Fix:

- Use the correct signer for owner/admin functions.
- Confirm parameter address matches signer key.

## 5.4 "fee_bps exceeds maximum (500)"

Cause:

- Market init or fee update used value > 500.

Fix:

- Keep fee in range `0..=500`.

## 5.5 "Escrow not yet expired"

Cause:

- `cancel_escrow` called before expiry timestamp.

Fix:

- Use ledger timestamp >= escrow expiry.
- For deterministic tests, control mocked ledger time.

## 5.6 Hash mismatch during verification

Cause:

- Inconsistent normalization (case, spacing, phone format).

Fix:

- Centralize normalization helpers and reuse in API, indexer, and client apps.
- Add test vectors for city/country/email/phone hashing.

## 6. Integration Checklist

- Contract IDs loaded from env/config by network
- Registry and Market initialized once
- Curators set and verified
- Hash helpers covered by tests
- Event indexer catches all Registry/Market topics
- Retry and idempotency around tx submission
- Error mapping from panics to user-facing messages
