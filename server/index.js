const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');
const jStat = require('jstat');
const ss = require('simple-statistics');

const app = express();
const upload = multer({dest: 'uploads/'});
const numOfPoints = 500;
const confidenceLevel = 0.95;
let ranges = [];
let numbers = [];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error processing file');
        }
        fs.unlinkSync(filePath);
        numbers = data.split(/\s+/).map(Number);
        ranges = [];
        let anomaliesX = [];
        let anomaliesY = [];

        const numClasses = parseInt(req.body.numClasses) || calculateNumClasses(numbers);
        const bandwidth = parseFloat(req.body.bandwidth) || calculateBandwidth(numbers);

        const statistics = calculateStatistics(numbers, numClasses);
        const estimatedStatistic = estimateStatistics(numbers);
        const kdeData = calculateKDE(numbers, bandwidth, numClasses);
        const ecdfData = calculateECDF(statistics.frequenciesArray);

        numbers.forEach((num, index) => {
            anomaliesX.push(index);
            anomaliesY.push(num);
        });
        const bounds = findBounds(numbers);
        const anomalies = findAnomalies(numbers, bounds.lowerBound, bounds.upperBound);
        const estimatingSkewnessAndKurtosis = identifyingNormDistributionSkewnessKurtosis(estimatedStatistic.semSkewness, estimatedStatistic.semKurtosis, estimatedStatistic.skewness, estimatedStatistic.kurtosis);
        const paramsAndEvaluationOfDistribution = estimateParamsAndEvaluationOfDistribution(numbers, estimatedStatistic.mean, estimatedStatistic.zValue)
        const estimatingProbPlot = identifyingNormDistributionProbPlot(numbers, estimatedStatistic.mean, estimatedStatistic.stdDev1, statistics.empiricalDistributionsForValue, paramsAndEvaluationOfDistribution.lambda);
        const estimatingExpProbPlot = identifyingExrProbPlot(numbers, statistics.empiricalDistributionsForValue);
        const densityData = calculateDensity(numbers, numClasses, paramsAndEvaluationOfDistribution.lambda);
        const distributionData = calculateDistribution(statistics.frequenciesArray, paramsAndEvaluationOfDistribution.lambda);
        const theoreticalFrequencies = calculateTheoreticalFrequencies(statistics.clearBoundaries, numbers.length, paramsAndEvaluationOfDistribution.lambda);
        const pearson = pearsonChiSquareTest(statistics.frequencies, theoreticalFrequencies);
        return res.json({
            numbers: numbers,
            boundaries: statistics.boundaries,
            clearBoundaries: statistics.clearBoundaries,
            frequencies: statistics.frequencies,
            relativeFrequencies: statistics.relativeFrequencies,
            empiricalDistributions: statistics.empiricalDistributions,
            x: statistics.ranges,
            y: statistics.relativeFrequencies,
            kdeX: kdeData.x_values,
            kdeY: kdeData.y,
            densityX: densityData.x,
            densityY: densityData.y,
            distributionX: distributionData.x,
            distributionY: distributionData.y,
            ecdfX: ecdfData.x,
            ecdfY: ecdfData.y,
            expX: estimatingExpProbPlot.x,
            expY: estimatingExpProbPlot.y,
            linearizedDistributionLineX: estimatingExpProbPlot.lineX,
            linearizedDistributionLineY: estimatingExpProbPlot.lineY,
            typicalValues: estimatedStatistic,
            boundariesAnomalies: bounds,
            anomaliesX: anomaliesX,
            anomaliesY: anomaliesY,
            anomalies: anomalies,
            estimatingSkewnessAndKurtosis: estimatingSkewnessAndKurtosis,
            estimatingProbPlot: estimatingProbPlot,
            paramsAndEvaluationOfDistribution: paramsAndEvaluationOfDistribution,
            pearson: pearson
        });
    });
});

app.post('/update-numbers', (req, res) => {
    const {numbers: updatedNumbers} = req.body;

    if (!Array.isArray(updatedNumbers)) {
        return res.status(400).send('Invalid data format. Expected an array.');
    }

    numbers = updatedNumbers;

    ranges = [];
    let anomaliesX = [];
    let anomaliesY = [];

    const numClasses = parseInt(req.body.numClasses) || calculateNumClasses(numbers);
    const bandwidth = parseFloat(req.body.bandwidth) || calculateBandwidth(numbers);

    const statistics = calculateStatistics(numbers, numClasses);
    const estimatedStatistic = estimateStatistics(numbers);
    const kdeData = calculateKDE(numbers, bandwidth, numClasses);
    const ecdfData = calculateECDF(statistics.frequenciesArray);

    numbers.forEach((num, index) => {
        anomaliesX.push(index);
        anomaliesY.push(num);
    });
    const estimatingSkewnessAndKurtosis = identifyingNormDistributionSkewnessKurtosis(estimatedStatistic.semSkewness, estimatedStatistic.semKurtosis, estimatedStatistic.skewness, estimatedStatistic.kurtosis);
    const estimatingProbPlot = identifyingNormDistributionProbPlot(numbers, estimatedStatistic.mean, estimatedStatistic.stdDev1, statistics.empiricalDistributionsForValue);

    return res.json({
        numbers: numbers,
        boundaries: statistics.boundaries,
        frequencies: statistics.frequencies,
        relativeFrequencies: statistics.relativeFrequencies,
        empiricalDistributions: statistics.empiricalDistributions,
        x: statistics.ranges,
        y: statistics.relativeFrequencies,
        kdeX: kdeData.x_values,
        kdeY: kdeData.y,
        ecdfX: ecdfData.x,
        ecdfY: ecdfData.y,
        anomaliesX: anomaliesX,
        anomaliesY: anomaliesY,
        estimatingSkewnessAndKurtosis: estimatingSkewnessAndKurtosis,
        estimatingProbPlot: estimatingProbPlot,
        typicalValues: estimatedStatistic,
    });
});

function calculateKDE(data, bandwidth, numClasses) {
    const n = data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;
    const widthBetweenPoints = (max - min) / numOfPoints;
    const x_values = Array.from({length: numOfPoints}, (_, i) => min + i * widthBetweenPoints);
    const y = x_values.map(xi => {
        const kernelSum = data.reduce((sum, i) => {
            return sum + (Math.exp(-(Math.pow((xi - i) / bandwidth, 2)) / 2) / Math.sqrt(2 * Math.PI));
        }, 0);
        return (kernelSum * classWidth / (n * bandwidth));
    });


    return {x_values, y};
}

function calculateDensity(data, numClasses, lambda) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;
    const widthBetweenPoints = (max - min) / numOfPoints;
    const x = Array.from({length: numOfPoints}, (_, i) => min + i * widthBetweenPoints);
    const y = x.map(xi => {
        return (lambda * Math.exp(lambda * xi * -1) * classWidth);
    });
    return {x, y};
}

//    const kde = data.reduce((a, b) => a + Math.exp((-Math.pow(((x-b)/bandwidth), 2)/2))/(Math.sqrt(2 * Math.PI)), 0) / (n * bandwidth)
function calculateECDF(frequenciesArray) {
    const x = frequenciesArray.map((el) => el.value);
    const y = frequenciesArray.map((el) => el.empiricalDistributions);
    return {x, y};
}

function calculateDistribution(data, lambda) {
    const x = data.map((el) => el.value);
    const y = data.map((el) => 1 - Math.exp(el.value * lambda * -1));
    return {x, y};
}

function calculateNumClasses(data) {
    const n = data.length;
    return Math.round(1 + 1.44 * Math.log(n));
}

function calculateBandwidth(data) {
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n);
    return stdDev * Math.pow(n, -0.2);
}

function calcMedian(data, n) {
    if (n % 2 === 0) {
        return 0.5 * (data[n / 2] + data[1 + n / 2]);
    } else {
        return data[(n + 1) / 2];
    }
}

function calcVariance0(data, mean, n) {
    return data.reduce((sum, x) => sum + Math.pow((x - mean), 2), 0) / n;
}

function calcVariance1(data, mean, n) {
    return data.reduce((sum, x) => sum + Math.pow((x - mean), 2), 0) / (n - 1);
}

function calcSkewness(data, mean, n, stdDev0) {
    return (Math.sqrt(n * (n - 1)) / (n - 2)) * (data.reduce((sum, x) => sum + (Math.pow((x - mean), 3)), 0) / (Math.pow(stdDev0, 3) * n));
}

function calcKurtosis(data, mean, n, stdDev0) {
    return (((Math.pow(n, 2) - 1) / ((n - 2) * (n - 3))) * (((6 / (n + 1)) + ((data.reduce((sum, x) => sum + Math.pow((x - mean), 4), 0) / (n * Math.pow(stdDev0, 4))) - 3))));
}

function estimateStatistics(data) {
    const n = data.length;
    const sortedData = [...data].sort((a, b) => a - b);

    const mean = data.reduce((a, b) => a + b, 0) / n;
    const median = calcMedian(sortedData, n);
    const variance0 = calcVariance0(data, mean, n);
    const variance1 = calcVariance1(data, mean, n);
    const stdDev0 = Math.sqrt(variance0);
    const stdDev1 = Math.sqrt(variance1);
    //console.log('stdDev0: ' + stdDev0)
    const skewness = calcSkewness(data, mean, n, stdDev0);
    const kurtosis = calcKurtosis(data, mean, n, stdDev0);

    const semMean = stdDev1 / Math.sqrt(n);
    const semStd1 = stdDev1 / Math.sqrt(2 * n);
    const semSkewness = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
    const semKurtosis = Math.sqrt((24 * n * Math.pow((n - 1), 2)) / ((n - 2) * (n - 3) * (n + 3) * (n + 5)));

    const alfa = 1 - confidenceLevel;
    const zValue = jStat.normal.inv(1 - alfa / 2, 0, 1); //квантиль стандартного нормального розподілу (1.96)
    //console.log(zValue)
    const meanCI = {x: (mean - (zValue * semMean)), y: (mean + (zValue * semMean))};
    const medianCI = {
        x: sortedData[(Math.ceil((n / 2) - (zValue * (Math.sqrt(n) / 2))) - 1)],
        y: sortedData[(Math.ceil((n / 2) + 1 + (zValue * (Math.sqrt(n) / 2))) - 1)]
    };
    const stdDevCI = {x: (stdDev1 - (zValue * semStd1)), y: (stdDev1 + (zValue * semStd1))};
    const skewnessCI = {x: (skewness - (zValue * semSkewness)), y: (skewness + (zValue * semSkewness))};
    const kurtosisCI = {x: (kurtosis - (zValue * semKurtosis)), y: (kurtosis + (zValue * semKurtosis))};

    return {
        mean,
        median,
        stdDev1,
        skewness,
        kurtosis,
        min: Math.min(...data),
        max: Math.max(...data),
        semMean,
        semStd1,
        semSkewness,
        semKurtosis,
        meanCI,
        medianCI,
        stdDevCI,
        skewnessCI,
        kurtosisCI,
        zValue
    }
}

function findBounds(data) {
    const sortedData = [...data].sort((a, b) => a - b);
    const k = 1.5;

    const q1 = ss.quantile(sortedData, 0.25);
    const q3 = ss.quantile(sortedData, 0.75);

    const iqr = q3 - q1;

    const lowerBound = q1 - k * iqr;
    const upperBound = q3 + k * iqr;

    return {lowerBound, upperBound};
}

function findAnomalies(data, lowerBound, upperBound) {
    return [...data].filter(x => x < lowerBound || x > upperBound);
}

function identifyingNormDistributionSkewnessKurtosis(semSkewness, semKurtosis, skewness, kurtosis) {
    const alfa = 1 - confidenceLevel;
    const zValue = jStat.normal.inv(1 - alfa / 2, 0, 1);

    const u_a = skewness / semSkewness;
    const u_e = kurtosis / semKurtosis;

    const skewNormal = Math.abs(u_a) <= zValue;
    const kurtNormal = Math.abs(u_e) <= zValue;

    if (skewNormal && kurtNormal) {
        return `Normal distribution is identified by the coefficient of skewness and kurtosis\n
 ${(Math.abs(u_a).toFixed(2))} <= ${zValue.toFixed(2)} and ${Math.abs(u_e).toFixed(2)} <= ${zValue.toFixed(2)}`
    } else {
        const skewSign = Math.abs(u_a) > zValue ? '>' : '<=';
        const kurtSign = Math.abs(u_e) > zValue ? '>' : '<=';

        return `Normal distribution is NOT identified by the coefficient of skewness and kurtosis\n\n
${Math.abs(u_a).toFixed(2)} ${skewSign} ${zValue.toFixed(2)} and ${Math.abs(u_e).toFixed(2)} ${kurtSign} ${zValue.toFixed(2)}`;
    }
}

function identifyingNormDistributionProbPlot(data, mean, stdDev, empiricalDistributions, lambda) {
    const sortedData = [...new Set([...data])].sort((a, b) => a - b);

    const theoreticalQuantiles = empiricalDistributions.map(p => ss.probit(p));

    const minTheoreticalQuantile = Math.min(...theoreticalQuantiles);
    const maxTheoreticalQuantile = Math.max(...theoreticalQuantiles);
    const lineX = [minTheoreticalQuantile, maxTheoreticalQuantile];
    const lineY = [mean + minTheoreticalQuantile * stdDev, mean + maxTheoreticalQuantile * stdDev];

    const linearizedDistributionLineX = [minTheoreticalQuantile, maxTheoreticalQuantile];
    console.log(lambda, minTheoreticalQuantile, maxTheoreticalQuantile);
    const zt = theoreticalQuantiles.reduce((sum, x) => sum + ((Math.log(Math.exp(lambda * x)) / Math.log(10)) * x));
    const t2 = theoreticalQuantiles.reduce((sum, x) => sum + (Math.pow(x, 2)), 0);
    const a = zt / t2;
    const linearizedDistributionLineY = [minTheoreticalQuantile * a, a * maxTheoreticalQuantile];

    return {
        theoreticalQuantiles: theoreticalQuantiles,
        sortedData: sortedData,
        lineX: lineX,
        lineY: lineY,
        linearizedDistributionLineX: linearizedDistributionLineX,
        linearizedDistributionLineY: linearizedDistributionLineY
    };
}

function identifyingExrProbPlot(data, empiricalDistributions) {
    const sortedData = [...new Set([...data])].sort((a, b) => a - b);

    let theoreticalQuantiles = empiricalDistributions.map(p => -Math.log(1 - p));
    theoreticalQuantiles.pop()
    console.log('theoreticalQuantiles: ', theoreticalQuantiles)

    const minTheoreticalQuantile = Math.min(...theoreticalQuantiles);
    console.log('minTheoreticalQuantile', minTheoreticalQuantile)
    const maxTheoreticalQuantile = Math.max(...theoreticalQuantiles);
    console.log('maxTheoreticalQuantile', maxTheoreticalQuantile)
    const lineX = [minTheoreticalQuantile, maxTheoreticalQuantile];
    console.log('lineX: ', lineX)

    const lambda = sortedData.length / sortedData.reduce((sum, x) => sum + x, 0);

    const linearizedDistributionLineY = lineX.map(x => x / lambda);
    console.log('linearizedDistributionLineY: ', linearizedDistributionLineY)
    console.log('[lineX[0], linearizedDistributionLineY[0]]: ', [lineX[0], linearizedDistributionLineY[0]])
    console.log('[lineX[1], linearizedDistributionLineY[1]]: ', [lineX[1], linearizedDistributionLineY[1]])

    return {
        x: theoreticalQuantiles,
        y: sortedData,
        lineX: [lineX[0], lineX[1]],
        lineY: [linearizedDistributionLineY[0], linearizedDistributionLineY[1]],
    };
}

function estimateParamsAndEvaluationOfDistribution(numbers, mean, zValue) {
    const lambda = 1 / mean;

    const stdErrLambda = Math.sqrt((1 / Math.pow(lambda, 2)));

    const ciLowerLambda = lambda - (zValue * stdErrLambda);
    const ciUpperLambda = lambda + (zValue * stdErrLambda);

    return {
        lambda: lambda,
        stdErr: stdErrLambda,
        ci: {x: ciLowerLambda, y: ciUpperLambda}
    };
}

function pearsonChiSquareTest(observedFrequencies, expectedFrequencies, alpha = 0.05) {
    const degreesOfFreedom = observedFrequencies.length - 1;
    const chiSquareStatistic = observedFrequencies.reduce((sum, observed, index) => {
        const expected = expectedFrequencies[index];
        return sum + Math.pow(observed - expected, 2) / expected;
    }, 0);

    const criticalValue = jStat.chisquare.inv(1 - alpha, degreesOfFreedom);
    console.log(criticalValue)
    const pValue = 1 - jStat.chisquare.cdf(chiSquareStatistic, degreesOfFreedom);
    console.log(pValue)

    const isDistributionValid = chiSquareStatistic <= criticalValue;

    return {
        chiSquareStatistic: chiSquareStatistic.toFixed(4),
        criticalValue: criticalValue.toFixed(4),
        pValue: pValue.toFixed(4),
        conclusion: isDistributionValid
            ? 'The distribution is likely valid based on the Pearson Chi-Square test.'
            : 'The distribution is not likely valid based on the Pearson Chi-Square test.'
    };
}

function calculateTheoreticalFrequencies(bounds, totalObservations, lambda) {
    const theoreticalFrequencies = [];

    for (let i = 0; i < bounds.length; i++) {
        const lowerBound = bounds[i].lowerBound;
        const upperBound = bounds[i].upperBound;

        const probability = (1 - Math.exp(-1 * lambda * upperBound)) - (1 - Math.exp(-1 * lambda * lowerBound));

        const frequency = totalObservations * probability;
        theoreticalFrequencies.push(frequency);
    }

    return theoreticalFrequencies;
}


function calculateStatistics(data, numClasses) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;
    const totalElements = data.length;
    const sortedData = [...data].sort((a, b) => a - b);
    const epsilon = 1e-10;

    let boundaries = [];
    let frequencies = Array(numClasses).fill(0);
    let frequenciesForSingleVal = {};
    let relativeFrequencies = [];
    let empiricalDistributions = [];
    let empiricalDistributionsForValue = [];
    let cumulativeRelativeFrequency = 0;

    sortedData.forEach(value => {
        if (frequenciesForSingleVal[value]) {
            frequenciesForSingleVal[value]++;
        } else {
            frequenciesForSingleVal[value] = 1;
        }
    });

    const frequenciesArray = Object.entries(frequenciesForSingleVal).map(([value, frequency]) => {
        const relativeFrequency = frequency / totalElements;
        cumulativeRelativeFrequency += relativeFrequency;

        if (!empiricalDistributionsForValue.includes(cumulativeRelativeFrequency)) {
            empiricalDistributionsForValue.push(cumulativeRelativeFrequency);
        }

        return {
            value: Number(value),
            frequency,
            relativeFrequency,
            empiricalDistributions: cumulativeRelativeFrequency
        };
    });

    for (let i = 0; i < numClasses; i++) {
        const lowerBound = (min + i * classWidth);
        const upperBound = (min + (i + 1) * classWidth);
        ranges.push(lowerBound);
        if (i === numClasses - 1) {
            ranges.push(upperBound);
        }
        boundaries.push({lowerBound, upperBound});
    }

    data.forEach(value => {
        for (let i = 0; i < boundaries.length; i++) {
            if (i === boundaries.length - 1) {
                if (value >= boundaries[i].lowerBound && (value < boundaries[i].upperBound || Math.abs(value - boundaries[i].upperBound) <= epsilon)) {
                    frequencies[i]++;
                    break;
                }
            }
            if (value >= boundaries[i].lowerBound && value < boundaries[i].upperBound) {
                frequencies[i]++;
                break;
            }
        }
    });

    let cumulativeFrequency = 0;

    frequencies.forEach((freq, index) => {
        let relFreq = freq / totalElements;
        cumulativeFrequency += relFreq;

        if (!empiricalDistributions.includes(cumulativeFrequency)) {
            empiricalDistributions.push(cumulativeFrequency);
        }

        relativeFrequencies.push(relFreq);
    });

    return {
        boundaries: boundaries.map(b => `${b.lowerBound.toFixed(2)} to ${b.upperBound.toFixed(2)}`),
        clearBoundaries: boundaries,
        frequencies,
        relativeFrequencies,
        empiricalDistributions,
        ranges,
        frequenciesArray,
        empiricalDistributionsForValue
    };
}


app.listen(3001, () => {
    console.log('Server started on port 3001');
});
