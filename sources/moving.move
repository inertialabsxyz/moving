module moving::streams {

    use std::signer;
    #[test_only]
    use aptos_framework::aptos_coin::AptosCoin;

    const EINVALID_AMOUNT : u64 = 0x1;

    // A pool for any number of streams
    struct Pool<phantom Asset> has key, store {
        coin: u64,
        committed: u64,
    }

    // Create pool controlled by owner with initial amount
    public fun create_pool<Asset>(signer: &signer, amount: u64) {
        assert!(amount > 0, EINVALID_AMOUNT);
        move_to(signer, Pool<Asset> {
            coin: amount,
            committed: 0,
        });
    }

    // Drain pool of amount to owner
    public fun drain_pool<Asset>(owner: &signer, amount: u64) acquires Pool {
        let pool = borrow_global_mut<Pool<Asset>>(signer::address_of(owner));
        pool.coin = pool.coin - amount;
    }

    // Credit pool with amount
    public fun credit_pool<Asset>(owner: &signer, amount: u64) acquires Pool {
        let pool = borrow_global_mut<Pool<Asset>>(signer::address_of(owner));
        pool.coin = pool.coin + amount;
    }

    #[view]
    public fun view_pool<Asset>(owner: address) : (u64, u64) acquires Pool {
        let pool = borrow_global<Pool<Asset>>(owner);
        (pool.coin, pool.committed)
    }

    #[test(signer = @0xcafe)]
    fun test_create_pool(signer: &signer) {
        create_pool<AptosCoin>(signer,100);
    }
}