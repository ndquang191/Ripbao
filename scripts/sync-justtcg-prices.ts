import { syncActiveListingPrices } from "../lib/justtcg-prices";

const result = await syncActiveListingPrices();
console.log(
  `Synced ${result.prices} prices for ${result.cards} active cards ` +
    `across ${result.batches} batch(es); ${result.missingCards} card(s) had no matching price`,
);
