module moving::streams {

    use std::error;
    use std::signer;
    use aptos_framework::fungible_asset;
    use aptos_framework::fungible_asset::FungibleStore;
    use aptos_framework::object;
    use aptos_framework::object::{Object, ExtendRef};
    use aptos_framework::primary_fungible_store;
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

    // A pool for any number of streams
    struct Pool<phantom T> has key {
        committed: u64,
        store: Object<FungibleStore>,
        store_extend_ref: ExtendRef
    }

    // Create pool controlled by owner with initial amount
    public fun create_pool<T: key>(
        signer: &signer, token: Object<T>, amount: u64
    ) {
        assert!(amount > 0, error::invalid_argument(EAMOUNT));
        let pool_cntr_ref = &object::create_object(@moving);
        let store = fungible_asset::create_store(pool_cntr_ref, token);
        let store_extend_ref = object::generate_extend_ref(pool_cntr_ref);

        let pool = Pool<Object<T>> { committed: 0, store, store_extend_ref };

        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);
        fungible_asset::transfer(signer, wallet, store, amount);

        move_to(signer, pool);
    }

    // Drain pool of amount to signing owner of pool
    public fun drain_pool<T: key>(
        signer: &signer, token: Object<T>, amount: u64
    ) acquires Pool {
        let pool = borrow_global_mut<Pool<Object<T>>>(signer::address_of(signer));
        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);
        let store_signer = &object::generate_signer_for_extending(&pool.store_extend_ref);
        fungible_asset::transfer(store_signer, pool.store, wallet, amount);
    }

    // Credit pool with amount
    public fun credit_pool<T: key>(
        signer: &signer, token: Object<T>, amount: u64
    ) acquires Pool {
        let pool = borrow_global_mut<Pool<Object<T>>>(signer::address_of(signer));
        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), token);
        fungible_asset::transfer(signer, wallet, pool.store, amount);
    }

    #[view]
    public fun view_pool<T: key>(owner: address): (u64, u64) acquires Pool {
        let pool = borrow_global<Pool<Object<T>>>(owner);
        (fungible_asset::balance(pool.store), pool.committed)
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
        assert!(pool.committed == 0, 1);
        assert!(fungible_asset::balance(pool.store) == pool_amount, 1);

        let wallet =
            primary_fungible_store::primary_store(signer::address_of(signer), metadata);
        // expected failure
        fungible_asset::transfer(signer, pool.store, wallet, pool_amount);
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

    #[test(signer = @0xcafe)]
    fun test_credit_pool(signer: &signer) acquires Pool {
        let (creator_ref, metadata) = create_test_token(signer);
        let (mint_ref, _, _) =
            init_test_metadata_with_primary_store_enabled(&creator_ref);
        let signer_addr = signer::address_of(signer);
        let mint_amount = 100;
        let pool_amount = 10;
        let credit_amount = 5;
        mint(&mint_ref, signer_addr, mint_amount);
        create_pool(signer, metadata, pool_amount);
        credit_pool(signer, metadata, credit_amount);
        assert!(
            primary_fungible_store::balance(signer::address_of(signer), metadata)
                == (mint_amount - pool_amount - credit_amount)
        );
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
