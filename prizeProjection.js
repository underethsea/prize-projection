// fork of script from @KingXKok of PT Discord

// print longer than 100 item array
// const util = require('util') 

// =========== CHANGE THESE CONSTANTS TO SIMULATE ===============
const depositAmount = 100000;
const tvl = 30000000;

const totalPrizes = 4096;

const simulationDays = 7;
const simulationRuns = 500;

const gasToClaim = 0.04;
const tierNumPrizes = [1, 3, 12, 48, 192, 768, 3072];
const tierPrizes = [2500, 500, 200, 50, 10, 5, 1];
// =============================================================

// charts if you wanna get cray cray
var asciichart = require ('asciichart')

const daily100DPWin = 1 / (tvl / totalPrizes / 100); // daily 100 dollar probability of winning

let tierPrizesAfterGas = [];
for (x in tierPrizes) {
  let prizeVal = Math.max(0, tierPrizes[x] - gasToClaim);
  tierPrizesAfterGas.push(prizeVal);
}

function simulate(deposit = depositAmount) {
  let prizes = [];
  for (let draw = 0; draw < Math.trunc(deposit / 100); draw++) {
    for (let tier in tierNumPrizes) {
      if (Math.random() < (tierNumPrizes[tier] / totalPrizes) * daily100DPWin) {
        prizes.push(tierPrizesAfterGas[tier]);
      }
    }
  }
  return prizes.sort(function (a, b) {
    return b - a;
  });
}
let prizeResults = [];
function calculateWinnings(
  deposit = depositAmount,
  simulateDays = simulationDays,
  maxPrizes = 2
) {
  let claimableWinnings = 0;
  let totalWinnings = 0;
  for (let days = 0; days < simulateDays; days++) {
    let dayResult = simulate(deposit);
    totalWinnings += dayResult.reduce((partial_sum, a) => partial_sum + a, 0);
    claimableWinnings += dayResult
      .slice(0, maxPrizes)
      .reduce((partial_sum, a) => partial_sum + a, 0);
  }
  prizeResults.push(parseInt(claimableWinnings.toFixed()));

  return [claimableWinnings, totalWinnings, claimableWinnings / totalWinnings];
}

let claimable = 0;
let winnings = 0;
let min = depositAmount;
let max = 0;
let claimableAmount = 0;
for (x = 0; x < simulationRuns; x++) {
  winnings = calculateWinnings();
  // log each simulation
  // console.log(winnings);
  claimableAmount = winnings[0];
  claimable += claimableAmount;
  if (claimableAmount < min) {
    min = claimableAmount;
  }
  if (claimableAmount > max) {
    max = claimableAmount;
  }
}
tierString = "";
for (x in tierNumPrizes) {
  tierString += tierNumPrizes[x] + ": " + tierPrizes[x] + " ";
}
console.log("prize tiering: ", tierString);
console.log(
  depositAmount,
  " deposited for ",
  simulationDays,
  " days with gas cost to claim of ",
  gasToClaim
);
console.log("unluckiest player claimable: ", min.toFixed());
console.log("luckiest player claimable: ", max.toFixed());

let annualized = (365 / simulationDays) * 100;
let averageClaimable = claimable / simulationRuns;
let averageApr = annualized * (claimable / simulationRuns / depositAmount)
console.log(
  "average claimable: ",
  averageClaimable.toFixed(),
  " ",
  averageApr.toFixed(
    2
  ),
  "% APR"
);
console.log("simulated ", simulationRuns, " times with a TVL of ", tvl);

// console.dir(prizeResults, { depth: null });

// more than 100 items
// console.log(util.inspect(prizeResults, { maxArrayLength: null }))  

// example ascii chart
// console.log (asciichart.plot (prizeResults,{height:30}))
