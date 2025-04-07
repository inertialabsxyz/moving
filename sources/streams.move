// SPDX-License-Identifier: MIT
module inertia::streams {

    use std::bcs;
    use std::error;
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_std::aptos_hash::keccak256;
    use aptos_std::simple_map;
    use aptos_std::simple_map::SimpleMap;
    use aptos_framework::event;
    use aptos_framework::fungible_asset;
    use aptos_framework::fungible_asset::FungibleStore;
    use aptos_framework::object;
    use aptos_framework::object::{Object, ExtendRef};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::timestamp;
    #[test_only]
    use std::string;
    #[test_only]
    use aptos_framework::fungible_asset::{create_test_token, TestToken};
    #[test_only]
    use aptos_framework::primary_fungible_store::{
        init_test_metadata_with_primary_store_enabled,
        mint
    };
    #[test_only]
    use inertia::inertia_token;

    const EAMOUNT: u64 = 0x1;
    const EOWNER: u64 = 0x2;
    const EEXISTS: u64 = 0x3;
    const ENAME: u64 = 0x4;

    struct Store has store {
        store: Object<FungibleStore>,
        extend_ref: ExtendRef
    }

    struct Debt has store {
        destination: address,
        amount: u64
    }

    // A vault for any number of streams
    struct Vault<T> has key {
        name: String,
        created: u64,
        owner: address,
        total_secs: u64,
        committed: Store,
        available: Store,
        streams: SimpleMap<vector<u8>, Stream>,
        token: T,
        balance_updated: u64,
        debts: vector<Debt>
    }

    struct Stream has key, store, drop {
        name: String,
        created: u64,
        vault: address,
        destination: address,
        per_second: u64,
        last_update: u64
    }

    #[event]
    struct VaultCreatedEvent has drop, store {
        vault_addr: address
    }

    #[event]
    struct VaultCreditedEvent has drop, store {
        vault_addr: address,
        amount: u64
    }

    #[event]
    struct VaultDrainedEvent has drop, store {
        vault_addr: address,
        amount: u64
    }

    #[event]
    struct VaultUpdatedEvent has drop, store {
        vault_addr: address,
        new_name: String
    }

    #[event]
    struct StreamCreatedEvent has drop, store {
        stream_id: vector<u8>
    }

    #[event]
    struct WithdrawalEvent has drop, store {
        stream_id: vector<u8>,
        outstanding: u64
    }

    #[event]
    struct CloseStreamEvent has drop, store {
        stream_id: vector<u8>,
        outstanding: u64
    }

    #[event]
    struct DebtEvent has drop, store {
        stream_id: vector<u8>,
        destination: address,
        amount: u64
    }

    #[view]
    public fun get_stream_id<T: key>(
        vault: address,
        destination: address,
        per_second: u64,
        token: Object<T>
    ): vector<u8> {
        let bytes = bcs::to_bytes(&vault);
        vector::append(&mut bytes, bcs::to_bytes(&destination));
        vector::append(&mut bytes, bcs::to_bytes(&per_second));
        vector::append(&mut bytes, bcs::to_bytes(&token));

        keccak256(bytes)
    }

    public entry fun start_stream<T: key>(
        signer: &signer,
        name: String,
        token: Object<T>,
        destination: address,
        per_second: u64
    ) acquires Vault {
        let stream_id = create_stream<T>(signer, name, token, destination, per_second);
        event::emit(StreamCreatedEvent { stream_id });
    }

    public fun create_stream<T: key>(
        signer: &signer,
        name: String,
        token: Object<T>,
        destination: address,
        per_second: u64
    ): vector<u8> acquires Vault {
        let vault_addr = vault_address(signer::address_of(signer), token);
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);
        let stream_id = get_stream_id(
            vault_addr,
            destination,
            per_second,
            vault.token
        );
        let now = timestamp::now_seconds();
        simple_map::add(
            &mut vault.streams,
            stream_id,
            Stream {
                name,
                created: now,
                vault: vault_addr,
                destination,
                per_second,
                last_update: now
            }
        );

        // A vault can't be in debt so must fail if vault can't be balanced
        balance_vault(vault, true);
        vault.total_secs = vault.total_secs + per_second;

        stream_id
    }

    public entry fun settle_vault<T: key>(vault_addr: address) acquires Vault {
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);
        balance_vault(vault, true);
    }

    public fun balance_vault<T: key>(
        vault: &mut Vault<Object<T>>, fail: bool
    ) {
        let now = timestamp::now_seconds();
        // Get last time we updated and the delta from now
        let delta = now - vault.balance_updated;
        // Move from available to committed
        let to_move = vault.total_secs * delta;
        // Get signer for available store
        let store_signer =
            &object::generate_signer_for_extending(&vault.available.extend_ref);

        // If we don't want to fail we will need to commit all that is available
        if (!fail) {
            let available = fungible_asset::balance(vault.available.store);
            if (available < to_move) {
                to_move = available;
            }
        };
        // Move to committed
        fungible_asset::transfer(
            store_signer,
            vault.available.store,
            vault.committed.store,
            to_move
        );
        // Update vault timestamps
        vault.balance_updated = now;
    }

    public entry fun make_withdrawal_from_stream<T: key>(
        vault_addr: address, stream_id: vector<u8>
    ) acquires Vault {
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);
        let outstanding = withdraw_from_stream(vault, stream_id);
        event::emit(WithdrawalEvent { stream_id, outstanding });
    }

    // Withdraws all owed to this point in time and returns outstanding if there is a deficit in the vault
    public fun withdraw_from_stream<T: key>(
        vault: &mut Vault<Object<T>>, stream_id: vector<u8>
    ): u64 {
        // Balance vault without failing
        balance_vault(vault, false);
        // Pay amount due, if lacking funds set last paid timestamp to proportion paid
        let committed_balance = fungible_asset::balance(vault.committed.store);
        // Get signer for committed store
        let store_signer =
            &object::generate_signer_for_extending(&vault.committed.extend_ref);

        let stream = simple_map::borrow_mut(&mut vault.streams, &stream_id);
        let now = timestamp::now_seconds();
        let delta = now - stream.last_update;
        let amount_due = delta * stream.per_second;
        let update = now;
        let wallet =
            primary_fungible_store::primary_store(stream.destination, vault.token);

        let outstanding = 0;
        if (amount_due > committed_balance) {
            // we clear all of the committed to pay the debt
            update = (delta / amount_due) * committed_balance;
            outstanding = amount_due - committed_balance;
            amount_due = committed_balance;
        };

        stream.last_update = update;
        fungible_asset::transfer(
            store_signer,
            vault.committed.store,
            wallet,
            amount_due
        );

        outstanding
    }

    public entry fun close_stream<T: key>(
        signer: &signer, vault_addr: address, stream_id: vector<u8>
    ) acquires Vault {
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);
        assert!(
            simple_map::contains_key(&vault.streams, &stream_id),
            error::invalid_argument(EEXISTS)
        );
        let stream = simple_map::borrow(&vault.streams, &stream_id);
        let signer_addr = signer::address_of(signer);
        assert!(
            stream.destination == signer_addr || vault.owner == signer_addr,
            error::invalid_argument(EOWNER)
        );

        let outstanding = cancel_stream(vault, stream_id);
        0x1::event::emit(CloseStreamEvent { stream_id, outstanding });
    }

    // Balance vault and pay amount due
    public fun cancel_stream<T: key>(
        vault: &mut Vault<Object<T>>, stream_id: vector<u8>
    ): u64 {
        let outstanding = withdraw_from_stream<T>(vault, stream_id);
        let stream = simple_map::borrow(&vault.streams, &stream_id);

        if (outstanding > 0) {
            // Capture debt only at the moment
            vector::push_back(
                &mut vault.debts,
                Debt { destination: stream.destination, amount: outstanding }
            );
            // would prefer this to be in another spot
            0x1::event::emit(
                DebtEvent {
                    stream_id,
                    destination: stream.destination,
                    amount: outstanding
                }
            )
        };

        // Remove stream
        vault.total_secs = vault.total_secs - stream.per_second;
        simple_map::remove(&mut vault.streams, &stream_id);

        outstanding
    }

    fun create_store<T: key>(owner: address, token: Object<T>): Store {
        let cntr_ref = &object::create_object(owner);
        Store {
            store: fungible_asset::create_store(cntr_ref, token),
            extend_ref: object::generate_extend_ref(cntr_ref)
        }
    }

    #[view]
    public fun vault_id<T: key>(owner: address, token: Object<T>): vector<u8> {
        let seed = vector::empty<u8>();
        vector::append(&mut seed, bcs::to_bytes(&owner));
        vector::append(&mut seed, bcs::to_bytes(&object::object_address(&token)));
        vector::append(&mut seed, bcs::to_bytes(&@inertia));

        seed
    }

    #[view]
    public fun vault_address<T: key>(
        signer_addr: address, token: Object<T>
    ): address {
        object::create_object_address(&signer_addr, vault_id(signer_addr, token))
    }

    public entry fun create_vault<T: key>(
        signer: &signer,
        name: String,
        token: Object<T>,
        amount: u64
    ) {
        assert!(amount > 0, error::invalid_argument(EAMOUNT));
        assert!(std::string::length(&name) > 2, error::invalid_argument(ENAME));

        let signer_addr = signer::address_of(signer);

        primary_fungible_store::ensure_primary_store_exists(signer_addr, token);

        let wallet = primary_fungible_store::primary_store(signer_addr, token);

        let seed = vault_id(signer_addr, token);
        let cntr_ref = object::create_named_object(signer, seed);

        let object_signer = object::generate_signer(&cntr_ref);

        let now = timestamp::now_seconds();

        let vault = Vault {
            name,
            created: now,
            owner: signer_addr,
            total_secs: 0,
            available: create_store(@inertia, token),
            committed: create_store(@inertia, token),
            streams: simple_map::new(),
            token,
            balance_updated: now,
            debts: vector::empty<Debt>()
        };

        fungible_asset::transfer(signer, wallet, vault.available.store, amount);

        move_to(&object_signer, vault);

        event::emit(VaultCreatedEvent { vault_addr: signer::address_of(&object_signer) });
    }

    public entry fun update_vault<T: key>(
        signer: &signer, new_name: String, token: Object<T>
    ) acquires Vault {
        assert!(std::string::length(&new_name) > 2, error::invalid_argument(ENAME));
        let signer_addr = signer::address_of(signer);
        let vault_addr = vault_address(signer_addr, token);
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);
        vault.name = new_name;

        event::emit(VaultUpdatedEvent { vault_addr, new_name });
    }

    // Drain vault of amount to signing owner of vault
    public entry fun drain_vault<T: key>(
        signer: &signer, token: Object<T>, amount: u64
    ) acquires Vault {
        let signer_addr = signer::address_of(signer);
        let vault_addr = vault_address(signer_addr, token);
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);

        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);
        let store_signer =
            &object::generate_signer_for_extending(&vault.available.extend_ref);

        fungible_asset::transfer(
            store_signer,
            vault.available.store,
            wallet,
            amount
        );

        event::emit(VaultDrainedEvent { vault_addr, amount });
    }

    // Credit vault with amount, anyone can do this
    public entry fun credit_vault<T: key>(
        signer: &signer,
        vault_addr: address,
        token: Object<T>,
        amount: u64
    ) acquires Vault {
        let vault = borrow_global_mut<Vault<Object<T>>>(vault_addr);
        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);

        fungible_asset::transfer(signer, wallet, vault.available.store, amount);

        event::emit(VaultCreditedEvent { vault_addr, amount });
    }

    #[view]
    public fun view_vault<T: key>(vault_addr: address): (String, u64, u64, u64) acquires Vault {
        let vault = borrow_global<Vault<Object<T>>>(vault_addr);
        (
            vault.name,
            fungible_asset::balance(vault.available.store),
            fungible_asset::balance(vault.committed.store),
            vault.balance_updated
        )
    }

    #[test(signer = @0xcafe, aptos_framework = @aptos_framework)]
    #[expected_failure(abort_code = 0x50008, location = aptos_framework::fungible_asset)]
    fun test_create_vault(signer: &signer, aptos_framework: &signer) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let vault_name = string::utf8(b"Payroll");

        mint(&mint_ref, signer_addr, mint_amount);
        assert!(primary_fungible_store::balance(signer_addr, metadata) == mint_amount, 1);
        create_vault(signer, vault_name, metadata, vault_amount);

        // Verify we have moved the assets
        assert!(
            primary_fungible_store::balance(signer_addr, metadata)
                == mint_amount - vault_amount,
            1
        );

        // Verify we have a vault created with FA included and that as signer we can't now manipulate these funds
        let vault =
            borrow_global<Vault<Object<TestToken>>>(
                vault_address(signer_addr, metadata)
            );
        assert!(fungible_asset::balance(vault.available.store) == vault_amount, 1);

        let wallet = primary_fungible_store::primary_store(signer_addr, metadata);
        // expected failure
        fungible_asset::transfer(
            signer,
            vault.available.store,
            wallet,
            vault_amount
        );
    }

    #[test(signer = @0xcafe, aptos_framework = @aptos_framework)]
    fun test_update_vault(signer: &signer, aptos_framework: &signer) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let vault_name = string::utf8(b"Payroll");
        mint(&mint_ref, signer_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        vault_name = string::utf8(b"Updated");
        update_vault(signer, vault_name, metadata);
        let (name, _, _, _) = view_vault<TestToken>(
            vault_address(signer_addr, metadata)
        );
        assert!(string::bytes(&vault_name) == string::bytes(&name));
    }

    #[test(signer = @0xcafe, aptos_framework = @aptos_framework)]
    fun test_drain_vault(signer: &signer, aptos_framework: &signer) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let drain_amount = 5;
        let vault_name = string::utf8(b"Payroll");
        mint(&mint_ref, signer_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        drain_vault(signer, metadata, drain_amount);
        assert!(
            primary_fungible_store::balance(signer::address_of(signer), metadata)
                == (mint_amount - vault_amount + drain_amount)
        );
    }

    #[test(signer = @0xcafe, aptos_framework = @aptos_framework)]
    #[expected_failure(abort_code = 0x10004, location = aptos_framework::fungible_asset)]
    fun test_excess_drain_vault(
        signer: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let drain_amount = vault_amount + 1;
        let vault_name = string::utf8(b"Payroll");
        mint(&mint_ref, signer_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        // expected failure
        drain_vault(signer, metadata, drain_amount);
    }

    #[test(signer = @0xcafe, stranger = @0xface, aptos_framework = @aptos_framework)]
    fun test_credit_vault(
        signer: &signer, stranger: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let stranger_addr = signer::address_of(stranger);
        let mint_amount = 50;
        let vault_amount = 10;
        let credit_amount = 5;
        let vault_name = string::utf8(b"Payroll");
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, stranger_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        let vault_addr = vault_address(signer_addr, metadata);
        credit_vault(signer, vault_addr, metadata, credit_amount);
        assert!(
            primary_fungible_store::balance(signer_addr, metadata)
                == (mint_amount - vault_amount - credit_amount)
        );
        credit_vault(stranger, vault_addr, metadata, credit_amount);
        assert!(
            primary_fungible_store::balance(stranger_addr, metadata)
                == (mint_amount - credit_amount)
        );
        let (_, balance, _, _) = view_vault<TestToken>(vault_addr);
        assert!(balance == vault_amount + credit_amount * 2);
    }

    #[test(signer = @0xcafe, aptos_framework = @aptos_framework)]
    fun test_view_vault(signer: &signer, aptos_framework: &signer) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let name = b"Payroll";
        mint(&mint_ref, signer_addr, mint_amount);
        create_vault(
            signer,
            string::utf8(name),
            metadata,
            vault_amount
        );
        let (vault_name, balance, committed, _) =
            view_vault<TestToken>(vault_address(signer_addr, metadata));
        assert!(balance == vault_amount && committed == 0);
        assert!(&name == string::bytes(&vault_name));
    }

    #[test(signer = @0xcafe, aptos_framework = @aptos_framework)]
    fun test_multiple_create_vault(
        signer: &signer, aptos_framework: &signer
    ) {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        // Create a vault with the `TestToken`
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let vault_name = string::utf8(b"Payroll");

        mint(&mint_ref, signer_addr, mint_amount);
        assert!(primary_fungible_store::balance(signer_addr, metadata) == mint_amount, 1);
        create_vault(signer, vault_name, metadata, vault_amount);

        // Create a vault with the `StreamToken`
        let (creator_ref, metadata) = inertia_token::create_test_token(signer);
        let (mint_ref, _, _) =
            inertia_token::init_test_metadata_with_primary_store_enabled(&creator_ref);
        mint(&mint_ref, signer_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
    }

    // Create a stream, jump some time and just balance vault to confirm we have the correct committed amount
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_and_balance_vault(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let vault_amount = 10;
        let per_second = 1;
        let time_jump = 5;
        let vault_name = string::utf8(b"Payroll");
        let stream_name = string::utf8(b"Stream");
        mint(&mint_ref, signer_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        create_stream<TestToken>(
            signer,
            stream_name,
            metadata,
            signer::address_of(destination),
            per_second
        );
        timestamp::update_global_time_for_test_secs(time_jump);
        let vault =
            borrow_global_mut<Vault<Object<TestToken>>>(
                vault_address(signer_addr, metadata)
            );
        balance_vault(vault, true);
        assert!(
            fungible_asset::balance(vault.committed.store) == per_second * time_jump
        );
    }

    // Create stream, jump in time and withdraw amount.  Confirm we have paid the amount due.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_and_withdraw(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let vault_amount = 10;
        let per_second = 1;
        let time_jump = 5;
        let vault_name = string::utf8(b"Payroll");
        let stream_name = string::utf8(b"Stream");
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        let stream_id =
            create_stream<TestToken>(
                signer,
                stream_name,
                metadata,
                destination_addr,
                per_second
            );
        timestamp::update_global_time_for_test_secs(time_jump);
        let vault =
            borrow_global_mut<Vault<Object<TestToken>>>(
                vault_address(signer_addr, metadata)
            );
        let outstanding = withdraw_from_stream(vault, stream_id);

        assert!(outstanding == 0);
        assert!(
            primary_fungible_store::balance(destination_addr, vault.token)
                == mint_amount + per_second * time_jump
        );
    }

    // Create a stream, jump in time, cancel stream.  Confirm we have paid the amount due and that the stream is removed.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_and_cancel(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let vault_amount = 10;
        let per_second = 1;
        let time_jump = 5;
        let vault_name = string::utf8(b"Payroll");
        let stream_name = string::utf8(b"Stream");
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        let stream_id =
            create_stream<TestToken>(
                signer,
                stream_name,
                metadata,
                destination_addr,
                per_second
            );
        timestamp::update_global_time_for_test_secs(time_jump);
        let vault =
            borrow_global_mut<Vault<Object<TestToken>>>(
                vault_address(signer_addr, metadata)
            );
        assert!(vault.total_secs == per_second);
        cancel_stream(vault, stream_id);
        assert!(!simple_map::contains_key(&vault.streams, &stream_id));
        assert!(vault.total_secs == 0);
        assert!(
            primary_fungible_store::balance(destination_addr, vault.token)
                == mint_amount + per_second * time_jump
        );
    }

    // Create a stream, jump in time past solvency of vault and withdraw.  Confirm we draw what is available.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_with_debt(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let vault_amount = 10;
        let per_second = 1;
        let debt = 1;
        let time_jump = vault_amount * per_second + debt;
        let vault_name = string::utf8(b"Payroll");
        let stream_name = string::utf8(b"Stream");
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        let stream_id =
            create_stream<TestToken>(
                signer,
                stream_name,
                metadata,
                destination_addr,
                per_second
            );
        timestamp::update_global_time_for_test_secs(time_jump);
        let vault =
            borrow_global_mut<Vault<Object<TestToken>>>(
                vault_address(signer_addr, metadata)
            );
        let outstanding = withdraw_from_stream(vault, stream_id);
        assert!(outstanding == debt);
        assert!(
            primary_fungible_store::balance(destination_addr, vault.token)
                == mint_amount + per_second * time_jump - debt
        );
    }

    // Create a stream, jump in time past solvency of vault and cancel.  Confirm we draw what is available and the outstanding is stored as a debt.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_with_debt_and_cancel(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Vault {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let vault_amount = 10;
        let per_second = 1;
        let debt = 1;
        let time_jump = vault_amount * per_second + debt;
        let vault_name = string::utf8(b"Payroll");
        let stream_name = string::utf8(b"Stream");
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_vault(signer, vault_name, metadata, vault_amount);
        let stream_id =
            create_stream<TestToken>(
                signer,
                stream_name,
                metadata,
                destination_addr,
                per_second
            );
        timestamp::update_global_time_for_test_secs(time_jump);
        let vault =
            borrow_global_mut<Vault<Object<TestToken>>>(
                vault_address(signer_addr, metadata)
            );
        let outstanding = cancel_stream(vault, stream_id);
        assert!(!simple_map::contains_key(&vault.streams, &stream_id));
        assert!(vault.total_secs == 0);
        assert!(outstanding == debt);
        assert!(
            primary_fungible_store::balance(destination_addr, vault.token)
                == mint_amount + per_second * time_jump - debt
        );
    }
}

#[test_only]
module inertia::inertia_token {
    use std::option;
    use std::signer;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::fungible_asset::{
        MintRef,
        TransferRef,
        BurnRef,
        generate_mint_ref,
        generate_burn_ref,
        generate_transfer_ref
    };
    use aptos_framework::object;
    use aptos_framework::object::{Object, ConstructorRef};
    use aptos_framework::primary_fungible_store::create_primary_store_enabled_fungible_asset;

    struct StreamToken has key {}

    public fun create_test_token(creator: &signer): (ConstructorRef, Object<StreamToken>) {
        account::create_account_for_test(signer::address_of(creator));
        let creator_ref = object::create_named_object(creator, b"STREAM");
        let object_signer = object::generate_signer(&creator_ref);
        move_to(&object_signer, StreamToken {});

        let token = object::object_from_constructor_ref<StreamToken>(&creator_ref);
        (creator_ref, token)
    }

    public fun init_test_metadata_with_primary_store_enabled(
        constructor_ref: &ConstructorRef
    ): (MintRef, TransferRef, BurnRef) {
        create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::some(100), // max supply
            string::utf8(b"STREAM COIN"),
            string::utf8(b"@ST"),
            0,
            string::utf8(b"http://example.com/icon"),
            string::utf8(b"http://example.com")
        );
        let mint_ref = generate_mint_ref(constructor_ref);
        let burn_ref = generate_burn_ref(constructor_ref);
        let transfer_ref = generate_transfer_ref(constructor_ref);
        (mint_ref, transfer_ref, burn_ref)
    }
}
