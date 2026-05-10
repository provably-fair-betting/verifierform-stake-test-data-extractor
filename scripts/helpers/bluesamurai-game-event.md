Blue Samurai slots has 3 different types of spins. Regular, bonus and special.

For regular and bonus spins, 18 floats from 0 to 1 are generated from your hash. Unlike Scarab Spin slots, which has fixed reels, Samurai slots has dynamic reels, meaning each symbol is generated from the corresponding float that was assigned to it.

We use weighted random sampling to assign each float to its corresponding tile, in the same order, moving down the reels, from left to right. Each symbol has its own fixed probability / chance of appearing in any one tile, with the outer 2 reels having a different set of probabilities to the inner 3 reels. For a bit more information on how symbols are selected, see
fitness proportionate selection algorithm to learn more.

Special spins are slightly different. For a start only 12 floats are taken from your hash, as the outer reels are disabled. Between each special spin, any samurai symbols stay in place for the remainder of the game, with the payout being the final count of samurais. This means that if you were to have for example 1 samurai stick in the first spin - we'd technically only need 11 floats for the subsequent spin. For the sake of simplicity in the probably fair model, we just generate 12 floats every time, and if the float that was allocated for a tile has a stuck samurai from a previous spin, then that float is not used at all.
