# Moving

## Overview

**Moving** is a Move-based smart contract designed for **continuous token streaming** on the Movement blockchain. This contract enables users to create, manage, and interact with **streaming payment pools** in a decentralized manner.

## Features

- **Token Streaming**: Users can create token streams to continuously transfer assets over time.
- **Pool System**: Supports multiple streams from a single liquidity pool.
- **Automatic Balancing**: Ensures token availability in the pool for active streams.
- **Debt Management**: Tracks outstanding payments when the pool is underfunded.
- **Withdrawal and Closure**: Users can withdraw streamed tokens or close streams at any time.

## Installation

### **Prerequisites**
- Install the **Movement CLI** https://docs.movementnetwork.xyz/devs/movementcli
- Ensure you have access to the **Movement testnet or mainnet**.
- Set up your wallet and fund your test account if using the testnet.

## Contract Structure

### **Core Data Structures**
- `Pool<T>`: Stores stream configurations and token balances.
- `Stream`: Represents an individual streaming payment with a rate per second.
- `Store`: Manages token balances within the pool.
- `Debt`: Keeps track of outstanding payments.

### **Key Functions**

#### **Stream Management**
- `start_stream<T>(signer, destination, per_second)`: Creates a new token stream.
- `create_stream<T>(signer, destination, per_second)`: Internal function to initialize a stream.
- `close_stream<T>(signer, stream_id)`: Closes an active stream and settles outstanding payments.

#### **Pool Management**
- `create_pool<T>(signer, token, amount)`: Initializes a new token pool with a specified deposit.
- `drain_pool<T>(signer, token, amount)`: Withdraws excess tokens from the pool.
- `credit_pool<T>(pool, signer, token, amount)`: Allows users to fund the pool.
- `view_pool<T>(owner)`: Views available and committed token balances in the pool.

#### **Token Transfers & Balancing**
- `balance_pool<T>(pool, fail)`: Ensures that the pool remains solvent and tokens are properly allocated.
- `withdraw_from_stream<T>(pool, stream_id)`: Withdraws accumulated tokens for a stream recipient.

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
- Pool creation, funding, and withdrawal.
- Stream creation, token distribution, and pool balance management.
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