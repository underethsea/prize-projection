import fetch from "node-fetch"

const maxPrizes = 1;

let tierNumPrizes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const bitRange = 1;

tierNumPrizes = tierNumPrizes.map((eachNum, index) => {
  return 2 ** (bitRange * index) - 2 ** (bitRange * (index - 1));
});

// use lowercase addresses to match api
const blacklistAddresses = [
    "0xb9a179dca5a7bf5f8b9e088437b3a85ebb495efe", // prize distro mainnet
    "0x8141bcfbcee654c5de17c4e2b2af26b67f9b9056", // prize distro poly
    "0x83332f908f403ce795d90f677ce3f382fe73f3d1", // prize distro avax
    "0x722e9bfc008358ac2d445a8d892cf7b62b550f3f", // prize distro op
    "0x42cd8312d2bce04277dd5161832460e95b24262e", // treasury
]
const prizeTiers = [
    {
        name: "Avalanche",
        id: 43114,
        dpr: 0.0000547945,
        tierPrizes: [6000, 2, 2, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 0],
      },
    {
      name: "Optimism",
      id: 10,
      dpr:     0.0000273973,
      // tierPrizes: [328083990,0,0,0,0,0,0,0,0,0,671916010,0,0,0,0,0], // current
      tierPrizes: [6000, 2, 2, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 0],
    },
    {
        name: "Polygon",
        id: 137,
        dpr: 0.0000410959,
        tierPrizes: [6000,0,0,.5,.5,.5,0,0,.5,0,.5,0,.5,0,0,.5],
      },
    {
      name: "Ethereum",
      id: 1,
      dpr: 0.0000547945,
      tierPrizes: [6000,100,100,100,100,100,0,100,0,0,0,0,0,0,0,0],
    },
  ];

  function commaInt(num) {
    num = parseInt(num);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function simulate(deposit, dailyProbWin, tierPrizes, totalPrizes) {
    let prizes = [];
    let grandPrize = 0
    for (let draw = 0; draw < Math.trunc(deposit); draw++) {
      for (let i=0; i < tierNumPrizes.length;i++) {
        if(tierPrizes[i] > 0){
        if (Math.random() < (tierNumPrizes[i] / totalPrizes) * dailyProbWin) {
          prizes.push(tierPrizes[i]);
          // check if grandprize
          if(i===0) { grandPrize+=1}
        }}
      }
    }
    return {grandPrize: grandPrize,prizes:prizes.sort(function (a, b) {
      return b - a;
    })}
  }

async function runDepositors(runs){
    let networkClaimablePrizes = 0
    let networkClaimablePrizeValue = 0
    let networkDroppedPrizes = 0
    let networkDroppedPrizeValue = 0
    let networkExpectedPrize = 0
    let networkGrandPrizes = 0
    let networkTvl = 0
    let networkCount = 0
    let networkDpr = 0

for(let chainTier of prizeTiers){
    let api = await fetch("https://poolexplorer.xyz/players" + chainTier.id);
    let result = await api.json();
    let events = result.data.items;
    let poolers = result.data.items.length;
    let totalClaimable = 0
    let totalDropped = 0
    let prizesClaimable = 0
    let prizesDropped = 0
    let grandPrizes = 0
    let wins = []
    let drops = []
    let totalBalance = 0

    let totalPrizeValue = 0;
    let totalPrizes = 0;
    for (let x = 0; x < tierNumPrizes.length; x++) {
      totalPrizeValue += tierNumPrizes[x] * chainTier.tierPrizes[x];
      if (tierNumPrizes[x] * chainTier.tierPrizes[x] > 0) {
        totalPrizes += tierNumPrizes[x];
      }
    }

    let chainTvl = Math.round(
        events.filter(player => !blacklistAddresses.includes(player.address))
        .reduce((accumulator, player) => {
          return accumulator + player.balance / 1e6 
        }, 0)
      );
      
      const expectedReturns = chainTvl * chainTier.dpr
      const oddsAdjustment = expectedReturns / totalPrizeValue
      const dailyProbWin = oddsAdjustment * (1 / (chainTvl / totalPrizes));
      const daysToTierOnePrize = 1 / oddsAdjustment
        
      //   console.log("expected returns",expectedReturns)
      //   console.log("odds adjustment",oddsAdjustment)
    //   console.log("dpr: ",chainTier.dpr)
    //   console.log("total prizes: ",totalPrizes)
    //   console.log("total prize value: ",totalPrizeValue)
    //   console.log("daily prob win: ",dailyProbWin)
      for (let runner = 1; runner <= runs; runner++) {
        events.forEach((pooler) => {
          if (!blacklistAddresses.includes(pooler.address)) {
            let dayResult = simulate(pooler.balance/1e6, dailyProbWin, chainTier.tierPrizes, totalPrizes);
            let winTheBigOne = dayResult.grandPrize
            dayResult = dayResult.prizes
                let totalPrizeAwarded = dayResult.reduce(
                    (partial_sum, a) => partial_sum + a,
                    0
                );

                let droppedPrizes = dayResult.slice(maxPrizes, dayResult.length);
                let droppedValue = droppedPrizes.reduce(
                    (partial_sum, a) => partial_sum + a,
                    0
                );
                let claimablePrizes = dayResult.slice(0, maxPrizes);
                let claimableValue = claimablePrizes.reduce(
                    (partial_sum, a) => partial_sum + a,
                    0
                );
                // if(claimablePrizes.length > 0) {console.log("winner ",claimablePrizes)}

            totalBalance += pooler.balance / 1e6;
            totalClaimable += claimableValue;
            totalDropped += droppedValue;
            prizesClaimable += claimablePrizes.length;
            grandPrizes += winTheBigOne
            prizesDropped += droppedPrizes.length;
            wins = wins.concat(claimablePrizes);
            drops = drops.concat(droppedPrizes);
          }
        });
    }
    networkDpr += chainTier.dpr
    networkCount += 1;
    networkTvl += chainTvl
    networkClaimablePrizeValue += totalClaimable
    networkClaimablePrizes += prizesClaimable
    networkDroppedPrizes += prizesDropped
    networkDroppedPrizeValue += totalDropped
    networkExpectedPrize += expectedReturns
    networkGrandPrizes += grandPrizes
    console.log("====== ",chainTier.name," ========")
  console.log(
    "Chain TVL: ",
    commaInt(chainTvl),
    " Poolers: ",
    commaInt(poolers)
  );
  console.log(
    "Expected daily: ",
    expectedReturns.toFixed(0)," Expected Prize APY: ",((expectedReturns*365 / chainTvl)*100).toFixed(2)+"%",
    " Days to T1 prize: ",
    daysToTierOnePrize.toFixed(2)
    )
  console.log(
    "Number of claimable prizes: ",
    commaInt(wins.length / runs),
    " value: ",
    commaInt(totalClaimable / runs),
    grandPrizes > 0 ? "grand prizes: " + grandPrizes : ""
  );
  console.log(
    "Number of dropped prizes: ",
    commaInt(drops.length / runs),
    " value: ",
    commaInt(totalDropped / runs),
    " percentage: ",
    commaInt(
      100 *
        (totalDropped / runs / (totalDropped / runs + totalClaimable / runs))
    ),
    "%"
  );
  // console.log("Wins: ", wins.sort(function(a, b) {
  //     return b - a;
  //   }))
  // console.log("Drops: ", drops.sort(function(a, b) {
  //     return b - a;
  //   }))
  console.log();

}

console.log("====== NETWORK RESULTS ========")
console.log("Simulated ", commaInt(runs), " times."," Network TVL: ",commaInt(networkTvl), 

// need work
// " Expected grand prizes: ",
// ((networkTvl * networkDpr * 4 / networkExpectedPrize)*runs).toFixed(2),


 " Grand prizes: " + networkGrandPrizes );
// console.log(
//   " Chain TVL: ",
//   commaInt(chainTvl),
//   " Poolers: ",
//   commaInt(poolers)
// );
console.log(
  "Expected daily: ",
  networkExpectedPrize.toFixed(0),
  "Delivered Daily: ",
  commaInt((networkClaimablePrizeValue + networkDroppedPrizeValue) / runs)
  
  )
console.log(
  "Number of claimable prizes: ",
  commaInt(networkClaimablePrizes / runs),
  " value: ",
  commaInt(networkClaimablePrizeValue / runs)
);
console.log(
  "Number of dropped prizes: ",
  commaInt(networkDroppedPrizes / runs),
  " value: ",
  commaInt(networkDroppedPrizeValue / runs),
  " percentage: ",
  commaInt(
    100 *
      (networkDroppedPrizeValue / runs / (networkDroppedPrizeValue / runs + networkClaimablePrizeValue / runs))
  ),
  "%"
);
}

// runDepositors(number of times to simulate)
runDepositors(3)
