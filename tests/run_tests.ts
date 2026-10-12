/**
 * ClimatePulse Test Runner (TypeScript/Node)
 * Executes unit tests on analytics algorithms, anomaly detection, validation, and scoring.
 */

import {
  calculateMean,
  calculateStdDev,
  calculateQuantile,
  calculateMovingAverage,
  calculatePearsonCorrelation,
  computeClimateImpactScore,
  detectAnomalies,
} from '../server/analytics.ts';
import { dataValidator } from '../server/dataValidation.ts';

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${testName}`);
}

console.log('🧪 Running ClimatePulse Analytics Unit Tests...\n');

// 1. Mean calculation
const data = [10, 20, 30, 40, 50];
const mean = calculateMean(data);
assert(mean === 30, 'calculateMean: mean of [10, 20, 30, 40, 50] should be 30');

// 2. Standard deviation
const std = calculateStdDev(data, mean);
assert(std > 15 && std < 16, 'calculateStdDev: sample std deviation is approx 15.81');

// 3. Moving Average
const ma7 = calculateMovingAverage([1, 2, 3, 4, 5, 6, 7, 8], 3);
assert(ma7[0] === null && ma7[1] === null, 'calculateMovingAverage: initial periods are null');
assert(ma7[2] === 2.0, 'calculateMovingAverage: window [1, 2, 3] mean is 2.0');
assert(ma7[7] === 7.0, 'calculateMovingAverage: window [6, 7, 8] mean is 7.0');

// 4. Pearson Correlation
const x = [1, 2, 3, 4, 5];
const y = [2, 4, 6, 8, 10]; // perfect positive
const corrPositive = calculatePearsonCorrelation(x, y);
assert(corrPositive === 1.0, 'calculatePearsonCorrelation: perfect positive linear correlation is 1.0');

const yInv = [10, 8, 6, 4, 2]; // perfect negative
const corrNegative = calculatePearsonCorrelation(x, yInv);
assert(corrNegative === -1.0, 'calculatePearsonCorrelation: perfect negative linear correlation is -1.0');

// 5. Data Validation Rules
const validCheck = dataValidator.validateCurrentData('Pune', {
  temperature: 28.5,
  humidity: 65,
  pressure: 1012,
  windSpeed: 14,
  precipitation: 0.0,
  timestamp: new Date().toISOString(),
});
assert(validCheck.valid === true, 'dataValidator: valid terrestrial atmospheric snapshot passes');

const invalidTempCheck = dataValidator.validateCurrentData('Pune', {
  temperature: 85.0, // physically impossible on Earth
  timestamp: new Date().toISOString(),
});
assert(invalidTempCheck.valid === false, 'dataValidator: temperature > 60°C is flagged and rejected');

const invalidRainCheck = dataValidator.validateCurrentData('Pune', {
  temperature: 25.0,
  precipitation: -5.0, // negative rainfall
  timestamp: new Date().toISOString(),
});
assert(invalidRainCheck.valid === false, 'dataValidator: negative precipitation is rejected');

// 6. Climate Impact Score
const favorableScore = computeClimateImpactScore(
  {
    temperature: 25.0,
    aqi: 25,
    humidity: 50,
    windSpeed: 10,
    rainfall: 0,
    uvIndex: 3,
    pressure: 1013,
  },
  25.0
);
assert(favorableScore.totalScore < 35, 'computeClimateImpactScore: pristine conditions yield Low Impact (<35)');
assert(favorableScore.status === 'Low Impact', 'computeClimateImpactScore: status matches Low Impact');

const extremeHazardScore = computeClimateImpactScore(
  {
    temperature: 46.0,
    aqi: 350,
    humidity: 15,
    windSpeed: 65,
    rainfall: 45,
    uvIndex: 12,
    pressure: 980,
  },
  28.0
);
assert(extremeHazardScore.totalScore >= 75, 'computeClimateImpactScore: multi-hazard extremes yield High/Severe Impact');

console.log('\n🎉 ALL 8 UNIT TESTS PASSED SUCCESSFULLY!\n');
