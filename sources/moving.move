module moving::streams {

    use std::bcs;
    use std::error;
    use std::signer;
    use std::vector;
    use aptos_std::aptos_hash::keccak256;
    use aptos_std::simple_map;
    use aptos_std::simple_map::SimpleMap;
    use aptos_framework::fungible_asset;
    use aptos_framework::fungible_asset::FungibleStore;
    use aptos_framework::object;
    use aptos_framework::object::{Object, ExtendRef};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::timestamp;
    #[test_only]
    use aptos_framework::fungible_asset::{create_test_token, TestToken};
    #[test_only]
    use aptos_framework::primary_fungible_store::{
        init_test_metadata_with_primary_store_enabled,
        mint
    };
    #[test_only]
    use moving::stream_token;

    const EAMOUNT: u64 = 0x1;
    const EOWNER: u64 = 0x2;

    struct Store has store {
        store: Object<FungibleStore>,
        extend_ref: ExtendRef
    }

    struct Debt has store {
        destination: address,
        amount: u64
    }

    // A pool for any number of streams
    struct Pool<T> has key {
        total_secs: u64,
        committed: Store,
        available: Store,
        streams: SimpleMap<vector<u8>, Stream>,
        token: T,
        last_balance: u64,
        debts: vector<Debt>
    }

    struct Stream has key, store, drop {
        pool: address,
        destination: address,
        per_second: u64,
        last_update: u64
    }

    #[event]
    struct StreamCreatedEvent has drop, store {
        stream_id: vector<u8>
    }

    #[view]
    public fun get_stream_id<T: key>(
        pool: address,
        destination: address,
        per_second: u64,
        token: Object<T>
    ): vector<u8> {
        let bytes = bcs::to_bytes(&pool);
        vector::append(&mut bytes, bcs::to_bytes(&destination));
        vector::append(&mut bytes, bcs::to_bytes(&per_second));
        vector::append(&mut bytes, bcs::to_bytes(&token));

        keccak256(bytes)
    }

    public entry fun start_stream<T: key>(
        signer: &signer, destination: address, per_second: u64
    ) acquires Pool {
        let stream_id = create_stream<T>(signer, destination, per_second);
        0x1::event::emit(StreamCreatedEvent { stream_id });
    }

    public fun create_stream<T: key>(
        signer: &signer, destination: address, per_second: u64
    ): vector<u8> acquires Pool {
        let pool_addr = signer::address_of(signer);
        let pool = borrow_global_mut<Pool<Object<T>>>(pool_addr);
        let stream_id = get_stream_id(pool_addr, destination, per_second, pool.token);

        simple_map::add(
            &mut pool.streams,
            stream_id,
            Stream {
                pool: pool_addr,
                destination,
                per_second,
                last_update: timestamp::now_seconds()
            }
        );

        // A pool can't be in debt so must fail if pool can't be balanced
        balance_pool(pool, true);
        pool.total_secs = pool.total_secs + per_second;

        stream_id
    }

    public fun balance_pool<T: key>(pool: &mut Pool<Object<T>>, fail: bool) {
        let now = timestamp::now_seconds();
        // Get last time we updated and the delta from now
        let delta = now - pool.last_balance;
        // Move from available to committed
        let to_move = pool.total_secs * delta;
        // Get signer for available store
        let store_signer =
            &object::generate_signer_for_extending(&pool.available.extend_ref);

        // If we don't want to fail we will need to commit all that is available
        if (!fail) {
            let available = fungible_asset::balance(pool.available.store);
            if (available < to_move) {
                to_move = available;
            }
        };
        // Move to committed
        fungible_asset::transfer(
            store_signer,
            pool.available.store,
            pool.committed.store,
            to_move
        );
        // Update pool timestamps
        pool.last_balance = now;
    }

    // Withdraws all owed to this point in time and returns outstanding if there is a deficit in the pool
    public fun withdraw_from_stream<T: key>(
        pool: &mut Pool<Object<T>>, stream_id: vector<u8>
    ): u64 {
        // Balance pool without failing
        balance_pool(pool, false);
        // Pay amount due, if lacking funds set last paid timestamp to proportion paid
        let committed_balance = fungible_asset::balance(pool.committed.store);
        // Get signer for committed store
        let store_signer =
            &object::generate_signer_for_extending(&pool.committed.extend_ref);

        let stream = simple_map::borrow_mut(&mut pool.streams, &stream_id);
        let now = timestamp::now_seconds();
        let delta = now - stream.last_update;
        let amount_due = delta * stream.per_second;
        let update = now;
        let wallet = primary_fungible_store::primary_store(
            stream.destination, pool.token
        );

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
            pool.committed.store,
            wallet,
            amount_due
        );

        outstanding
    }

    // Balance pool and pay amount due
    public fun cancel_stream<T: key>(
        pool: &mut Pool<Object<T>>, stream_id: vector<u8>
    ): u64 {
        let outstanding = withdraw_from_stream<T>(pool, stream_id);
        let stream = simple_map::borrow(&pool.streams, &stream_id);

        if (outstanding > 0) {
            // Capture debt only at the moment
            vector::push_back(
                &mut pool.debts,
                Debt { destination: stream.destination, amount: outstanding }
            );
        };

        // Remove stream
        pool.total_secs = pool.total_secs - stream.per_second;
        simple_map::remove(&mut pool.streams, &stream_id);

        outstanding
    }

    fun create_store<T: key>(owner: address, token: Object<T>): Store {
        let cntr_ref = &object::create_object(owner);
        Store {
            store: fungible_asset::create_store(cntr_ref, token),
            extend_ref: object::generate_extend_ref(cntr_ref)
        }
    }

    // Create pool controlled by owner with initial amount
    public entry fun create_pool<T: key>(
        signer: &signer, token: Object<T>, amount: u64
    ) {
        assert!(amount > 0, error::invalid_argument(EAMOUNT));

        let pool = Pool<Object<T>> {
            total_secs: 0,
            available: create_store(@moving, token),
            committed: create_store(@moving, token),
            streams: simple_map::new(),
            token,
            last_balance: timestamp::now_seconds(),
            debts: vector::empty<Debt>()
        };

        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);

        fungible_asset::transfer(signer, wallet, pool.available.store, amount);

        move_to(signer, pool);
    }

    // Drain pool of amount to signing owner of pool
    public entry fun drain_pool<T: key>(
        signer: &signer, token: Object<T>, amount: u64
    ) acquires Pool {
        let pool = borrow_global_mut<Pool<Object<T>>>(signer::address_of(signer));
        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);
        let store_signer =
            &object::generate_signer_for_extending(&pool.available.extend_ref);

        fungible_asset::transfer(
            store_signer,
            pool.available.store,
            wallet,
            amount
        );
    }

    // Credit pool with amount, anyone can do this
    public entry fun credit_pool<T: key>(
        pool: address,
        signer: &signer,
        token: Object<T>,
        amount: u64
    ) acquires Pool {
        let pool = borrow_global_mut<Pool<Object<T>>>(pool);
        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);

        fungible_asset::transfer(signer, wallet, pool.available.store, amount);
    }

    #[view]
    public fun view_pool<T: key>(owner: address): (u64, u64) acquires Pool {
        let pool = borrow_global<Pool<Object<T>>>(owner);
        (
            fungible_asset::balance(pool.available.store),
            fungible_asset::balance(pool.committed.store)
        )
    }

    #[test(signer = @0xcafe)]
    #[expected_failure(abort_code = 0x50008, location = aptos_framework::fungible_asset)]
    fun test_create_pool(signer: &signer) acquires Pool {
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;

        mint(&mint_ref, signer_addr, mint_amount);
        assert!(primary_fungible_store::balance(signer_addr, metadata) == mint_amount, 1);
        create_pool(signer, metadata, pool_amount);

        // Verify we have moved the assets
        assert!(
            primary_fungible_store::balance(signer_addr, metadata)
                == mint_amount - pool_amount,
            1
        );

        // Verify we have a pool created with FA included and that as signer we can't now manipulate these funds
        let pool = borrow_global<Pool<Object<TestToken>>>(signer_addr);
        assert!(fungible_asset::balance(pool.available.store) == pool_amount, 1);

        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), metadata);
        // expected failure
        fungible_asset::transfer(
            signer,
            pool.available.store,
            wallet,
            pool_amount
        );
    }

    #[test(signer = @0xcafe)]
    fun test_drain_pool(signer: &signer) acquires Pool {
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;
        let drain_amount = 5;
        mint(&mint_ref, signer_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        drain_pool(signer, metadata, drain_amount);
        assert!(
            primary_fungible_store::balance(signer::address_of(signer), metadata)
                == (mint_amount - pool_amount + drain_amount)
        );
    }

    #[test(signer = @0xcafe)]
    #[expected_failure(abort_code = 0x10004, location = aptos_framework::fungible_asset)]
    fun test_excess_drain_pool(signer: &signer) acquires Pool {
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;
        let drain_amount = pool_amount + 1;
        mint(&mint_ref, signer_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        // expected failure
        drain_pool(signer, metadata, drain_amount);
    }

    #[test(signer = @0xcafe, stranger = @0xface)]
    fun test_credit_pool(signer: &signer, stranger: &signer) acquires Pool {
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let stranger_addr = signer::address_of(stranger);
        let mint_amount = 50;
        let pool_amount = 10;
        let credit_amount = 5;
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, stranger_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        credit_pool(signer_addr, signer, metadata, credit_amount);
        assert!(
            primary_fungible_store::balance(signer_addr, metadata)
                == (mint_amount - pool_amount - credit_amount)
        );
        credit_pool(signer_addr, stranger, metadata, credit_amount);
        assert!(
            primary_fungible_store::balance(stranger_addr, metadata)
                == (mint_amount - credit_amount)
        );
        let (balance, _) = view_pool<TestToken>(signer_addr);
        assert!(balance == pool_amount + credit_amount * 2);
    }

    #[test(signer = @0xcafe)]
    fun test_view_pool(signer: &signer) acquires Pool {
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;
        mint(&mint_ref, signer_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        let (balance, committed) = view_pool<TestToken>(signer_addr);
        assert!(balance == pool_amount && committed == 0);
    }

    #[test(signer = @0xcafe)]
    fun test_multiple_create_pool(signer: &signer) {
        // Create a pool with the `TestToken`
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;

        mint(&mint_ref, signer_addr, mint_amount);
        assert!(primary_fungible_store::balance(signer_addr, metadata) == mint_amount, 1);
        create_pool(signer, metadata, pool_amount);

        // Create a pool with the `StreamToken`
        let (creator_ref, metadata) = stream_token::create_test_token(signer);
        let (mint_ref, _, _) =
            stream_token::init_test_metadata_with_primary_store_enabled(&creator_ref);
        mint(&mint_ref, signer_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
    }

    // Create a stream, jump some time and just balance pool to confirm we have the correct committed amount
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_and_balance_pool(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Pool {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;
        let per_second = 1;
        let time_jump = 5;
        mint(&mint_ref, signer_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        create_stream<TestToken>(signer, signer::address_of(destination), per_second);
        timestamp::update_global_time_for_test_secs(time_jump);
        let pool = borrow_global_mut<Pool<Object<TestToken>>>(signer_addr);
        balance_pool(pool, true);
        assert!(
            fungible_asset::balance(pool.committed.store) == per_second * time_jump
        );
    }

    // Create stream, jump in time and withdraw amount.  Confirm we have paid the amount due.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_and_withdraw(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Pool {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let pool_amount = 10;
        let per_second = 1;
        let time_jump = 5;
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        let stream_id = create_stream<TestToken>(signer, destination_addr, per_second);
        timestamp::update_global_time_for_test_secs(time_jump);
        let pool = borrow_global_mut<Pool<Object<TestToken>>>(signer_addr);
        let outstanding = withdraw_from_stream(pool, stream_id);

        assert!(outstanding == 0);
        assert!(
            primary_fungible_store::balance(destination_addr, pool.token)
                == mint_amount + per_second * time_jump
        );
    }

    // Create a stream, jump in time, cancel stream.  Confirm we have paid the amount due and that the stream is removed.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_and_cancel(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Pool {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let pool_amount = 10;
        let per_second = 1;
        let time_jump = 5;
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        let stream_id = create_stream<TestToken>(signer, destination_addr, per_second);
        timestamp::update_global_time_for_test_secs(time_jump);
        let pool = borrow_global_mut<Pool<Object<TestToken>>>(signer_addr);
        assert!(pool.total_secs == per_second);
        cancel_stream(pool, stream_id);
        assert!(!simple_map::contains_key(&pool.streams, &stream_id));
        assert!(pool.total_secs == 0);
        assert!(
            primary_fungible_store::balance(destination_addr, pool.token)
                == mint_amount + per_second * time_jump
        );
    }

    // Create a stream, jump in time past solvency of pool and withdraw.  Confirm we draw what is available.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_with_debt(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Pool {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let pool_amount = 10;
        let per_second = 1;
        let debt = 1;
        let time_jump = pool_amount * per_second + debt;
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        let stream_id = create_stream<TestToken>(signer, destination_addr, per_second);
        timestamp::update_global_time_for_test_secs(time_jump);
        let pool = borrow_global_mut<Pool<Object<TestToken>>>(signer_addr);
        let outstanding = withdraw_from_stream(pool, stream_id);
        assert!(outstanding == debt);
        assert!(
            primary_fungible_store::balance(destination_addr, pool.token)
                == mint_amount + per_second * time_jump - debt
        );
    }

    // Create a stream, jump in time past solvency of pool and cancel.  Confirm we draw what is available and the outstanding is stored as a debt.
    #[test(aptos_framework = @aptos_framework, signer = @0xcafe, destination = @0xface)]
    fun test_create_stream_with_debt_and_cancel(
        signer: &signer, destination: &signer, aptos_framework: &signer
    ) acquires Pool {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let destination_addr = signer::address_of(destination);
        let mint_amount = 50;
        let pool_amount = 10;
        let per_second = 1;
        let debt = 1;
        let time_jump = pool_amount * per_second + debt;
        mint(&mint_ref, signer_addr, mint_amount);
        mint(&mint_ref, destination_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        let stream_id = create_stream<TestToken>(signer, destination_addr, per_second);
        timestamp::update_global_time_for_test_secs(time_jump);
        let pool = borrow_global_mut<Pool<Object<TestToken>>>(signer_addr);
        let outstanding = cancel_stream(pool, stream_id);
        assert!(!simple_map::contains_key(&pool.streams, &stream_id));
        assert!(pool.total_secs == 0);
        assert!(outstanding == debt);
        assert!(
            primary_fungible_store::balance(destination_addr, pool.token)
                == mint_amount + per_second * time_jump - debt
        );
    }
}

#[test_only]
module moving::stream_token {
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
