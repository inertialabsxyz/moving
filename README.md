# Moving

## Overview

**Moving** is a Move-based smart contract designed for **continuous token streaming** on the Movement blockchain. This contract enables users to create, manage, and interact with **streaming payment vaults** in a decentralized manner.

## Features

- **Token Streaming**: Users can create token streams to continuously transfer assets over time.
- **Vault System**: Supports multiple streams from a single vault.
- **Automatic Balancing**: Ensures token availability in the vault for active streams.
- **Debt Management**: Tracks outstanding payments when the vault is underfunded.
- **Withdrawal and Closure**: Users can withdraw streamed tokens or close streams at any time.

## Installation

### **Prerequisites**
- Install the **Movement CLI** https://docs.movementnetwork.xyz/devs/movementcli
- Ensure you have access to the **Movement testnet or mainnet**.
- Set up your wallet and fund your test account if using the testnet.

## Contract Structure

### **Core Data Structures**
- `Vault<T>`: A vault supporting multiple token streams. Fields:
  - `name`: Identifier for the vault.
  - `created`: Timestamp of vault creation.
  - `owner`: Owner's address.
  - `total_secs`: Total duration in seconds of all active streams.
  - `committed`: Tokens already committed to streams.
  - `available`: Tokens available for new streams.
  - `streams`: Map of stream IDs to `Stream` objects.
  - `token`: The token type managed by the vault.
  - `balance_updated`: Timestamp of the last balance update.
  - `debts`: List of outstanding debts due to underfunding.
- `Stream`: Represents an individual streaming payment with a rate per second.
- `Store`: Contains the token store and reference extension for the underlying asset.
- `Debt`: Records the destination and amount owed for an underfunded stream.

### **Key Functions**

#### **Stream Management**
- `start_stream<T>(signer, destination, per_second)`: Creates a new token stream.
- `create_stream<T>(signer, destination, per_second)`: Internal function to initialize a stream.
- `close_stream<T>(signer, stream_id)`: Closes an active stream and settles outstanding payments.

#### **Vault Management**
- `create_vault<T>(signer, token, amount)`: Initializes a new token vault with a specified deposit.
- `drain_vault<T>(signer, token, amount)`: Withdraws excess tokens from the vault.
- `view_vault<T>(owner)`: Views available and committed token balances in the vault.

#### **Token Transfers & Balancing**
- `balance_vault<T>(vault, fail)`: Ensures that the pool remains solvent and tokens are properly allocated.
- `withdraw_from_stream<T>(vault, stream_id)`: Withdraws accumulated tokens for a stream recipient.

### **Events**
- `StreamCreatedEvent`: Emitted when a new stream is created.
- `WithdrawalEvent`: Emitted when funds are withdrawn from a stream.
- `CloseStreamEvent`: Emitted when a stream is closed.
- `DebtEvent`: Emitted when a stream generates outstanding debt due to insufficient funds.

## Deployment

### **Deploying the Contract**
1. **Compile the contract**:
   ```sh
   movement move compile --named-addresses moving=<ADDRESS>
   ```
2. **Publish to the blockchain**:
   ```sh
   movement move publish --named-addresses moving=<ADDRESS>
   ```
3. **Interact with the contract** via the Movement CLI or a frontend.

## Testing
This contract includes extensive test cases that validate:
- Vault creation, funding, and withdrawal.
- Stream creation, token distribution, and vault balance management.
- Handling of insufficient funds and debt tracking.

Run tests with:
```sh
movement move test
```

## Contributing
We welcome contributions! To get started:
1. Fork the repository.
2. Create a new branch:
   ```sh
   git checkout -b feature-branch
   ```
3. Submit a pull request with a clear description of your changes.

## License
This project is licensed under the **MIT License**.