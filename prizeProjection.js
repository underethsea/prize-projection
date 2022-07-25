// fork of script from @KingXKok of PT Discord

// const util = require('util')
// import chalk from 'chalk'
// const chalk = require('chalk')

// =========== CHANGE THESE CONSTANTS TO SIMULATE ===============
const depositAmount = 5000;
const tvl = 31000000;

// const totalPrizes = 4096; removed to be calculated dependent on prize tier

const simulationDays = 52; // 52 for weekly, 365 for daily
const simulationRuns = 300;

const maxPrizes = 1;

const gasToClaim = .15
// const tierNumPrizes = [1, 3, 12, 48, 192, 768];
// const tierNumPrizes = [1, 12, 48, 3072]; // newly proposed

// const tierPrizes = [1000, 100, 50, 10, 5, 5];
// const tierPrizes = [2000, 100, 10, 1]; //newly proposed

// let tierNumPrizes = [1, 3, 12, 48, 192, 768]; // option A
// let tierPrizes = [1000, 100, 50, 10, 5, 5]; // option A

let tierNumPrizes = [1, 3, 12, 48, 192, 768, 3072]; // Bitrange 2
let tierPrizes = [5000, 1000, 5, 5, 5, 10,  5]; //  Bitrange 2


// =============================================================

let scalingVariable = 1; // used to make calculating prizes faster as deposit grows
if (depositAmount > 50) {
  scalingVariable = depositAmount / 50;
}
if (depositAmount > 4999) {
  scalingVariable = depositAmount / 100;
}
if (depositAmount > 49999) {
  scalingVariable = depositAmount / 500;
}

// charts if you wanna get cray cray
// var asciichart = require ('asciichart')
let totalPrizeValue = 0;
let totalPrizes = 0;
let gasCost = 0;
for (let x = 0; x < tierNumPrizes.length; x++) {
  totalPrizeValue += tierNumPrizes[x] * tierPrizes[x];
  if (tierNumPrizes[x] * tierPrizes[x] > 0) {
    totalPrizes += tierNumPrizes[x];
  }
}
console.log("total prize value: ", totalPrizeValue);
console.log("total number of prizes: ", totalPrizes);

const dailyProbWin = 1 / (tvl / totalPrizes / scalingVariable); // daily dollar probability of winning
let tierPrizesAfterGas = [];
for (let x in tierPrizes) {
  let prizeVal = Math.max(0, tierPrizes[x] - gasToClaim);

  tierPrizesAfterGas.push(prizeVal);
}

function simulate(deposit = depositAmount) {
  let prizes = [];
  for (let draw = 0; draw < Math.trunc(deposit / scalingVariable); draw++) {
    for (let tier in tierNumPrizes) {
      if (Math.random() < (tierNumPrizes[tier] / totalPrizes) * dailyProbWin) {
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
  simulateDays = simulationDays
) {
  let claimableWinnings = 0;
  let totalWinnings = 0;
  let firstPrizeDay = 0;
  let droppedPrizes = 0;

  for (let days = 0; days < simulateDays; days++) {
    let dayResult = simulate(deposit);
    if (dayResult[0] > 0 && firstPrizeDay === 0) {
      firstPrizeDay = days;
    }
    totalWinnings += dayResult.reduce((partial_sum, a) => partial_sum + a, 0);
    claimableWinnings += dayResult
      .slice(0, maxPrizes)
      .reduce((partial_sum, a) => partial_sum + a, 0);
    let dropped = dayResult.slice(maxPrizes, dayResult.length);
    droppedPrizes += dropped.length;
    // if (dropped[0] > 0) {
    // console.log(dayResult, " ", droppedPrizes); dropped info
    // }
  }
  prizeResults.push(parseInt(claimableWinnings.toFixed()));
  //  TODO need to better address not winning - maybe change to odds calculation for first prize - or count players winning zero
  if (firstPrizeDay === 0) {
    firstPrizeDay = simulateDays;
  }
  return [
    claimableWinnings,
    totalWinnings,
    claimableWinnings / totalWinnings,
    droppedPrizes,
    firstPrizeDay,
  ];
}

let claimable = 0;
let winnings = 0;
let min = depositAmount;
let max = 0;
let claimableAmount = 0;
let droppedTotal = 0;
let firstPrizeDayTotal = 0;
for (let x = 0; x < simulationRuns; x++) {
  winnings = calculateWinnings();
  // log each simulation
  // console.log(winnings);
  let droppedNumber = winnings[3];
  droppedTotal += droppedNumber;
  claimableAmount = winnings[0];
  claimable += claimableAmount;
  firstPrizeDayTotal += winnings[4];
  if (claimableAmount < min) {
    min = claimableAmount;
  }
  if (claimableAmount > max) {
    max = claimableAmount;
  }
}
let tierString = "";
for (let x in tierNumPrizes) {
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

let annualized = (52 / simulationDays) * 100;
let averageClaimable = claimable / simulationRuns;
let averageApr = annualized * (claimable / simulationRuns / depositAmount);
console.log(
  "average claimable: ",
  averageClaimable.toFixed(),
  " ",
  averageApr.toFixed(2),
  "% APR"
);
console.log("prizes dropped per player", droppedTotal / simulationRuns);
console.log("average claimable first prize day: ", firstPrizeDayTotal / simulationRuns);
console.log("simulated ", simulationRuns, " times with a TVL of ", tvl);
// console.dir(prizeResults, { depth: null });

// more than 100 items
// console.log(util.inspect(prizeResults, { maxArrayLength: null }))

// example ascii chart
// console.log (asciichart.plot (prizeResults,{height:30}))
