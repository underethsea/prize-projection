import fetch from "node-fetch"
import 'dotenv/config'
let tierNumPrizes = [1, 3, 12, 48, 192, 768]; // Bitrange 2
let tierPrizes = [5000, 1000, 500, 50, 50, 10]; //  Bitrange 2
// let tierNumPrizes = [1, 4, 64, 128, 256, 1024]; // Bitrange 1
// let tierPrizes = [5000, 1000, 20, 20, 10, 5]; //  Bitrange 1
let tvl = 30000000
const maxPrizes = 1;

let totalPrizes = 0;
let totalPrizeValue = 0;
for (let x = 0; x < tierNumPrizes.length; x++) {
    totalPrizeValue += tierNumPrizes[x] * tierPrizes[x];
    if (tierNumPrizes[x] * tierPrizes[x] > 0) {
        totalPrizes += tierNumPrizes[x];
    }
}
const dailyProbWin = 1 / (tvl / totalPrizes)

function simulate(deposit) {
    let prizes = [];
    for (let draw = 0; draw < Math.trunc(deposit); draw++) {
        for (let tier in tierNumPrizes) {
            if (Math.random() < (tierNumPrizes[tier] / totalPrizes) * dailyProbWin) {
                prizes.push(tierPrizes[tier]);
            }
        }
    }
    return prizes.sort(function (a, b) {
        return b - a;
    });
}

function simulatePooler(deposit) {
    let dayResult = simulate(deposit)
    // console.log(dayResult)

    let totalPrizeAwarded = dayResult.reduce((partial_sum, a) => partial_sum + a, 0);

    let droppedPrizes = dayResult.slice(maxPrizes, dayResult.length);
    let droppedValue = droppedPrizes
        .reduce((partial_sum, a) => partial_sum + a, 0);

    let claimablePrizes = dayResult.slice(0, maxPrizes)
    let claimableValue = claimablePrizes
        .reduce((partial_sum, a) => partial_sum + a, 0);

    let numberDropped = droppedPrizes.length;

    // console.log("total prize awarded ", totalPrizeAwarded)
    // console.log("claimable prizes ", claimablePrizes)
    // console.log("claimable value ", claimableValue)
    // console.log("dropped prizes ", droppedPrizes)
    // console.log("dropped value", droppedValue)
    // console.log("number of prizes dropped", numberDropped)

    const returnData = {
        totalPrizeAwarded: totalPrizeAwarded,
        claimablePrizes: claimablePrizes,
        claimableValue: claimableValue,
        droppedPrizes: droppedPrizes,
        droppedValue: droppedValue,
        numberDropped: numberDropped
    }
    return returnData;
}

async function runDepositors(runs) {
    // split personalities, use 5 for 10m tvl to become 50m
    let scaleResults = 1
    let chain = 137
    let ticket = ""
    if (chain === 137) { ticket = "0x6a304dfdb9f808741244b6bfee65ca7b3b3a6076" }
    else if (chain === 10) { ticket = "0x62BB4fc73094c83B5e952C2180B23fA7054954c4" }
    else if (chain === 1) { ticket = "0xdd4d117723c257cee402285d3acf218e9a8236e1" }
    else if (chain === 43114) { ticket = "0xb27f379c050f6ed0973a01667458af6ecebc1d90" }
    else {chain =  137; ticket = "0x6a304dfdb9f808741244b6bfee65ca7b3b3a6076" }


    let api = await fetch(
        "https://api.covalenthq.com/v1/" + chain + "/tokens/" + ticket + "/token_holders/?page-size=15000&key=" + process.env.COVALENT_KEY
    );

    let result = await api.json();
    let events = result.data.items;
    for(let x=1;x<scaleResults;x++){
        events = events.concat(events)
    }
    let totalClaimable = 0
    let totalDropped = 0
    let prizesClaimable = 0
    let prizesDropped = 0
    let wins = []
    let drops = []
    let totalBalance = 0

    for(let runner = 1;runner <= runs;runner++){

    events.forEach(pooler => {
        let poolerResult = simulatePooler(pooler.balance / 1e6)
        totalBalance += pooler.balance / 1e6
        totalClaimable += poolerResult.claimableValue
        totalDropped += poolerResult.droppedValue
        prizesClaimable += poolerResult.claimablePrizes.length
        prizesDropped += poolerResult.droppedPrizes.length
        wins = wins.concat(poolerResult.claimablePrizes)
        drops = drops.concat(poolerResult.droppedPrizes)
    })
}

    console.log("TVL: ",tvl," Chain TVL: ",parseInt(totalBalance / runs))
    console.log("Total prize vale: ",totalPrizeValue)
    console.log("Number of claimable prizes: ",parseInt(wins.length / runs)," value: ", parseInt(totalClaimable / runs))
    console.log("Number of dropped prizes: ",parseInt(drops.length / runs),"Total dropped value: ", parseInt(totalDropped / runs))
    // console.log("Wins: ", wins.sort(function(a, b) {
    //     return b - a;
    //   }))
    // console.log("Drops: ", drops.sort(function(a, b) {
    //     return b - a;
    //   }))
      console.log("Simulated ",runs," times.")
}
runDepositors(3) // simulate x times