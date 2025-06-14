// Simple calculation test for expected max send amounts
console.log('Testing dynamic max send calculations:');

// Current values from API
const maxReceiveZAAD = 109960;
const currentRate = 0.95;
const newTestRate = 0.93;

console.log(`\nCurrent Rate (0.95):`);
console.log(`Max Send = ${maxReceiveZAAD} ÷ ${currentRate} = ${(maxReceiveZAAD / currentRate).toFixed(2)}`);

console.log(`\nNew Test Rate (0.93):`);
console.log(`Max Send = ${maxReceiveZAAD} ÷ ${newTestRate} = ${(maxReceiveZAAD / newTestRate).toFixed(2)}`);

console.log(`\nUser Example (Rate 0.93, Max Receive 33,455):`);
const userMaxReceive = 33455;
console.log(`Max Send = ${userMaxReceive} ÷ ${newTestRate} = ${(userMaxReceive / newTestRate).toFixed(2)}`);

process.exit(0);