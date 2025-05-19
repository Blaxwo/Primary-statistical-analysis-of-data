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
const a = 0.05;
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
        numbers = data.split('\n').map(line => line.split(/\s+/).map(Number));
        //const numbersX = numbers.map(row => row[0]);
        //const numbersY = numbers.map(row => row[1]);
        //const numbersX = [2675.7, 2437.1, 1938.3, 2149.2, 2254.5, 1964.0, 1911.4, 1888.3, 1637.4, 1666.2, 1618.4, 2361.4, 1983.8, 1917.1, 1758.3]
        //const numbersY = [190.4, 156.4, 170.3, 174.5, 191.3, 188.5, 167.0, 191.6, 145.3, 138.2, 151.8, 222.6, 172.0, 138.2, 173.6]

        const numbersY = [19, 47, 49, 50, 56, 58, 61, 62, 66, 67, 68, 68, 69, 70, 71, 71, 73, 74, 74, 75, 76, 82, 82, 83, 88];
        const numbersX = [9.75, 11.25, 9.45, 11.25, 7.95, 8.55, 7.2, 8.85, 10.2, 9.15, 9.75, 8.85, 7.8, 10.5, 9.45, 9.45, 8.1, 8.85, 9.6, 9.75, 6, 9.75, 13.2, 7.95, 9.75];

        console.log('numbersX: ', numbersX);
        console.log('numbersY: ', numbersY);

        const numClasses = calculateNumClasses(numbersX);
        const bandwidth = calculateBandwidth(numbersX, numClasses);
        console.log('numClasses: ', numClasses);
        console.log('bandwidth: ', bandwidth);

        const statistics = calculateStatistics(numbersX, numClasses);
        const estimatedStatistic = estimateStatistics(numbersX);

        const estimatedStatisticX = estimateStatistics(numbersX);
        const estimatedStatisticY = estimateStatistics(numbersY);

        const estimatingSkewnessAndKurtosis = identifyingNormDistributionSkewnessKurtosis(estimatedStatistic.semSkewness, estimatedStatistic.semKurtosis, estimatedStatistic.skewness, estimatedStatistic.kurtosis);
        const paramsAndEvaluationOfDistribution = estimateParamsAndEvaluationOfDistribution(numbers, estimatedStatistic.mean, estimatedStatistic.zValue)
        const estimatingProbPlot = identifyingNormDistributionProbPlot(numbers, estimatedStatistic.mean, estimatedStatistic.stdDev1, statistics.empiricalDistributionsForValue, paramsAndEvaluationOfDistribution.lambda);
        const theoreticalFrequencies = calculateTheoreticalFrequencies(statistics.clearBoundaries, numbers.length, paramsAndEvaluationOfDistribution.lambda);
        const pearson = pearsonChiSquareTest(statistics.frequencies, theoreticalFrequencies);
        /////////////////////
        const pearsonCorCoeff = calculatePearsonCorrelationCoefficient(numbersX, numbersY);
        const correlationRatio = calculateCorrelationRatio(numbersX, numbersY, numClasses, bandwidth);//
        let pearsonCorRatio;
        if(correlationRatio.conclusionIm === 'significant') {
            console.log('Correlation ratio is significant');
            pearsonCorRatio = calculatePearsonCorrelationRatio(numbersX, numbersY, numClasses, bandwidth, correlationRatio.corRatio);//
        }
        else{
            console.log('Correlation ratio is not significant');
            pearsonCorRatio = {corRatio: 0, corPearson: 0, stat: 0, student: 0, conclusionEq: 'equal', conclusionLinear: 'linear'};
        }
        const rankX = calculateRank(numbersX);
        const rankY = calculateRank(numbersY);
        const rankSpearman = calculateRankSpearman(rankX, rankY);
        const rankKendall = calculateRankKendall(rankX, rankY);
        //// lab 2
        const valuesA1 = calculateParamValuesA1(estimatedStatisticX.stdDev1, estimatedStatisticY.stdDev1, pearsonCorCoeff.correlation);
        //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
        console.log("valuesA1: ", valuesA1);
        const valuesA0 = calculateParamValuesA0(numbersX, numbersY, valuesA1);
        console.log("valuesA0: ", valuesA0);
        const regressionParams = calculateStdA0AndA1(numbersX, numbersY, valuesA0, valuesA1, estimatedStatisticX.stdDev1);
        const std_a0 = regressionParams.std_a0;
        const std_a1 = regressionParams.std_a1;
        const x = 11;
        const xRegression = calculatePointRegressionInterval(x, regressionParams, numbersX);


        return res.json({
            numbersX: numbersX,
            numbersY: numbersY,
            coefPearson: pearsonCorCoeff,
            coefSpearman: rankSpearman,
            coefKendall: rankKendall,
            coefCorRatio: correlationRatio,
            coefPearsonCorRatio: pearsonCorRatio,
            // lab 2
            regressionParams: regressionParams,
            xRegression: xRegression,

            typicalValues: estimatedStatistic,
            estimatingSkewnessAndKurtosis: estimatingSkewnessAndKurtosis,
            estimatingProbPlot: estimatingProbPlot,
            pearson: pearson
        });
    });
});

//    const kde = data.reduce((a, b) => a + Math.exp((-Math.pow(((x-b)/bandwidth), 2)/2))/(Math.sqrt(2 * Math.PI)), 0) / (n * bandwidth)

// function calculateConfidenceInterval(correlation, n) {
//     const zValue = jStat.normal.inv(1 - confidenceLevel / 2, 0, 1);
//     const interval = zValue * Math.sqrt((1 - Math.pow(correlation, 2)) / (n - 2));
//     return interval;
// }

function calculatePearsonCorrelationCoefficient(numbersX, numbersY) {
    const n = numbersX.length;
    const meanX = numbersX.reduce((a, b) => a + b, 0) / n;
    const meanY = numbersY.reduce((a, b) => a + b, 0) / n;
    const meanXY = numbersX.reduce((sum, x, index) => sum + (x * numbersY[index]), 0) / n;

    //mean square deviation (shifted)
    const stdDevX = Math.sqrt(numbersX.reduce((sum, x) => sum + Math.pow((x - meanX), 2), 0) / n);
    const stdDevY = Math.sqrt(numbersY.reduce((sum, y) => sum + Math.pow((y - meanY), 2), 0) / n);

    const correlation = (meanXY - (meanX * meanY)) / (stdDevX * stdDevY);

    const stat = (correlation * Math.sqrt(n - 2)) / Math.sqrt(1 - Math.pow(correlation, 2));
    const student = jStat.studentt.inv(1 - a / 2, n - 2);
    const u = jStat.normal.inv(1 - a / 2, 0, 1);
    const correlation_lower = correlation + ((correlation * (1 - Math.pow(correlation, 2))) / (2 * n)) - (u * ((1 - Math.pow(correlation, 2)) / Math.sqrt(n - 1)));
    const correlation_upper = correlation + ((correlation * (1 - Math.pow(correlation, 2))) / (2 * n)) + (u * ((1 - Math.pow(correlation, 2)) / Math.sqrt(n - 1)));

    let conclusionIm;
    let conclusionCon;
    if(Math.abs(stat) > student) {
        conclusionIm = 'significant';
        conclusionCon = 'exist'
    }
    else{
        conclusionIm = 'not significant';
        conclusionCon = 'not exist'
    }

    return {correlation, correlation_lower, correlation_upper, stat, student, conclusionIm, conclusionCon};
}

//// lab 2

function calculatePointRegressionInterval(x, regressionParams, numbersX) {
    const n = numbersX.length;
    const meanX = numbersX.reduce((sum, val) => sum + val, 0) / n;

    const {
        a0,
        a1,
        sResSquared,
        std_a1,
        t_critical
    } = regressionParams;

    const tCrit = t_critical;
    const yPred = a0 + (a1 * x);

    // Довірчий інтервал на середнє значення (регресія)
    const d_ci_reg = (sResSquared / n) + (std_a1 ** 2) * Math.pow(x - meanX, 2);
    const ciRegUpper = yPred + (tCrit * Math.sqrt(d_ci_reg));
    const ciRegLower = yPred - (tCrit * Math.sqrt(d_ci_reg));

    // Довірчий інтервал на прогнозне значення
    const d_ci_pred = d_ci_reg + sResSquared;
    const ciPredUpper = yPred + (tCrit * Math.sqrt(d_ci_pred));
    const ciPredLower = yPred - (tCrit * Math.sqrt(d_ci_pred));

    return {
        x,
        yPred,
        ciReg: [ciRegLower, ciRegUpper],
        ciPred: [ciPredLower, ciPredUpper]
    };
}

function calculateParamValuesA1(stdDevX, stdDevY, correlation) {
    console.log("correlation: ", correlation)
    console.log("stdDevY: ", stdDevY)
    console.log("stdDevX: ", stdDevX)
    return correlation * ( stdDevY / stdDevX );
}

function calculateParamValuesA0( numbersX, numbersY, a1 ) {
    const meanNumberX = numbersX.reduce((sum, val) => sum + val, 0) / numbersX.length;
    const meanNumberY = numbersY.reduce((sum, val) => sum + val, 0) / numbersY.length;

    return meanNumberY - ( a1 * meanNumberX );
}

function calculateStdA0AndA1(numbersX, numbersY, a0, a1, stdDevX) {
    const n = numbersX.length;
    const s = 2;
    const meanNumberX = numbersX.reduce((sum, val) => sum + val, 0) / n;
    const meanNumberY = numbersY.reduce((sum, val) => sum + val, 0) / n;

    const sResSquared = numbersX.reduce((sum, x, i) => {
        const y = numbersY[i];
        const predictedY = a0 + a1 * x;
        return sum + Math.pow(y - predictedY, 2);
    }, 0) / (n - 2);

    const sXSquared = Math.pow(stdDevX, 2);

    const D_a1 = sResSquared / (n * sXSquared);
    const D_a0 = sResSquared * ((1 / n) + (Math.pow(meanNumberX, 2) / (n * sXSquared)));

    const std_a0 = Math.sqrt(D_a0);
    const std_a1 = Math.sqrt(D_a1);

    const t_critical = jStat.studentt.inv(1 - a / 2, n - 2);

    const a0_lower = a0 - t_critical * std_a0;
    const a0_upper = a0 + t_critical * std_a0;
    const a1_lower = a1 - t_critical * std_a1;
    const a1_upper = a1 + t_critical * std_a1;

    const t_a0 = a0 / std_a0;
    const t_a1 = a1 / std_a1;

    const t_a0_not_equal_0 = Math.abs(t_a0) > t_critical;
    const t_a1_not_equal_0 = Math.abs(t_a1) > t_critical;
    let conclusionA0;
    let conclusionA1;
    if(t_a0_not_equal_0) {
        conclusionA0 = 'significant';
    }
    else {
        conclusionA0 = 'not significant';
    }
    if(t_a1_not_equal_0) {
        conclusionA1 = 'significant';
    }
    else {
        conclusionA1 = 'not significant';
    }

    const regressionLine = [];
    const ciRegLower = [];
    const ciRegUpper = [];
    const ciPredLower = [];
    const ciPredUpper = [];

    for (let i = 0; i < numbersX.length; i++) {
        const x = numbersX[i];
        const yPred = a0 + a1 * x;
        regressionLine.push(yPred);

        const d_ci_reg = (sResSquared / n) + (D_a1 * Math.pow(x - meanNumberX, 2));
        const margin_reg = t_critical * Math.sqrt(d_ci_reg);
        ciRegUpper.push(yPred + margin_reg);
        ciRegLower.push(yPred - margin_reg);

        const d_ci_pred = d_ci_reg + sResSquared;
        const margin_pred = t_critical * Math.sqrt(d_ci_pred);
        ciPredUpper.push(yPred + margin_pred);
        ciPredLower.push(yPred - margin_pred);
    }

    // R^2 (коэффициент детерминации)
    const stdDevYBiased = Math.sqrt(numbersY.reduce((sum, y) => sum + Math.pow(y - meanNumberY, 2), 0) / n);
    const r_squared = 1 - (((n - s) * sResSquared) / ((n - 1) * Math.pow(stdDevYBiased, 2)));

    // F-test
    const y_pred = numbersX.map(x => a0 + a1 * x);
    const sse_res = numbersY.reduce((sum, y, i) => sum + Math.pow(y - y_pred[i], 2), 0);
    const ssr = y_pred.reduce((sum, y_hat) => sum + Math.pow(y_hat - meanNumberY, 2), 0);
    const fStat = (ssr / 1) / (sse_res / (n - 2));
    const f_critical = jStat.centralF.inv(1 - a, s - 1, n - s);
    const isSignificant = fStat > f_critical;
    let conclusionF;
    if(isSignificant) {
        conclusionF = 'significant';
    }
    else{
        conclusionF = 'not significant';
    }

    return {r_squared, fStat, f_critical, conclusionF, a0, a1, sResSquared, std_a0, std_a1, a0_lower, a1_lower, a0_upper, a1_upper, t_critical, t_a0, t_a1, conclusionA0, conclusionA1, regressionLine, ciRegLower, ciRegUpper, ciPredLower, ciPredUpper};
}

//// lab 2

function calculateClassValues(numbersX, numbersY, numClasses, bandwidth) {
    const xMin = Math.min(...numbersX);
    const N = numbersX.length;

    let classBoundaries = [];
    for (let l = 1; l <= numClasses + 1; l++) {
        classBoundaries.push(xMin + (l - 1) * bandwidth);
    }

    let classCenters = [];
    for (let l = 0; l < numClasses; l++) {
        classCenters.push(0.5 * (classBoundaries[l] + classBoundaries[l + 1]));
    }

    console.log("classBoundaries:", classBoundaries);
    console.log("classCenters:", classCenters);

    let classValues = Array.from({ length: numClasses }, () => []);

    numbersX.forEach((xi, index) => {
        let yi = numbersY[index];
        for (let l = 0; l < numClasses; l++) {
            if(l === numClasses - 1){
                if(xi >= classBoundaries[l] && xi <= classBoundaries[l + 1]){
                    classValues[l].push(yi);
                    break;
                }
            }
            else{
                if (xi >= classBoundaries[l] && xi < classBoundaries[l + 1]) {
                    classValues[l].push(yi);
                    break;
                }
            }
        }
    });

    console.log("classValues:", classValues);

    return {classValues, classCenters};
}

function calculateClassValuesFor(numbersX, numbersY, numClasses, bandwidth) {
    const xMin = Math.min(...numbersX);
    const N = numbersX.length;

    let classBoundaries = [];
    for (let l = 1; l <= numClasses + 1; l++) {
        classBoundaries.push(xMin + (l - 1) * bandwidth);
    }

    let classCenters = [];
    for (let l = 0; l < numClasses; l++) {
        classCenters.push(0.5 * (classBoundaries[l] + classBoundaries[l + 1]));
    }

    console.log("classBoundaries:", classBoundaries);
    console.log("classCenters:", classCenters);

    let classValues = Array.from({ length: numClasses }, () => []);

    numbersX.forEach((xi, index) => {
        let yi = numbersY[index];
        for (let l = 0; l < numClasses; l++) {
            if (l === numClasses - 1) {
                if (xi >= classBoundaries[l] && xi <= classBoundaries[l + 1]) {
                    classValues[l].push(yi);
                    break;
                }
            } else {
                if (xi >= classBoundaries[l] && xi < classBoundaries[l + 1]) {
                    classValues[l].push(yi);
                    break;
                }
            }
        }
    });

    console.log("classValues:", classValues);

    let classCentersExpanded = classValues.flatMap((values, i) => Array(values.length).fill(classCenters[i]));

    console.log("classCentersExpanded:", classCentersExpanded);

    return { classValues, classCenters: classCentersExpanded };
}


function calculateCorrelationRatio(numbersX, numbersY, numClasses, bandwidth) {
    const {classValues, classCenters} = calculateClassValues(numbersX, numbersY, numClasses, bandwidth);
    const N = numbersX.length;
    console.log("classValues: ", classValues)

    const meanYs = [];
    for (let l = 0; l < numClasses; l++) {
        meanYs.push(classValues[l].reduce((a, b) => a + b, 0) / classValues[l].length);
    }

    console.log("meanYs:", meanYs);

    const meanY = meanYs.reduce((sum, y, index) => sum + (y * classValues[index].length), 0) / N;

    console.log("meanY:", meanY);

    const corRatio = Math.sqrt((meanYs.reduce((sum, y, index) => sum + ( classValues[index].length * Math.pow((y - meanY), 2)), 0)) / (meanYs.reduce((sum, y, index) => sum + (classValues[index].reduce((sumi, yi) => sumi + ( Math.pow((yi - meanY), 2) ), 0)), 0)))
    const corRatioPow = Math.pow(corRatio, 2);

    const stat = ( corRatioPow / (numClasses - 1)) / (Math.sqrt(1 - Math.pow(corRatio, 2)) / (N - numClasses));

    const student = jStat.centralF.inv(1 - a, numClasses - 1, N - numClasses);

    let conclusionIm;
    let conclusionCon;
    if(stat > student) {
        conclusionIm = 'significant';
        conclusionCon = 'exist'
    }
    else{
        conclusionIm = 'not significant';
        conclusionCon = 'not exist'
    }

    return{corRatio, stat, student, conclusionIm, conclusionCon};
}

function calculatePearsonCorrelationRatio(numbersX, numbersY, numClasses, bandwidth, corRatio) {
    const N = numbersX.length;
    const {classValues, classCenters} = calculateClassValuesFor(numbersX, numbersY, numClasses, bandwidth);

    const meanX = classCenters.reduce((a, b) => a + b, 0) / N;
    const meanY = classValues.flat().reduce((a, b) => a + b, 0) / N;
    const meanXY = classValues.flat().reduce((acc, y, i) => {
        return acc + (y * classCenters[i])}, 0) / N;
    console.log("meanX:", meanX);
    console.log("meanY:", meanY);
    console.log("meanXY:", meanXY);

    //mean square deviation (shifted)
    const stdDevX = Math.sqrt(classCenters.reduce((sum, x) => sum + Math.pow((x - meanX), 2), 0) / N);
    const stdDevY = Math.sqrt(classValues.flat().reduce((sum, y) => sum + Math.pow((y - meanY), 2), 0) / N);
    console.log("stdDevX:", stdDevX);
    console.log("stdDevY:", stdDevY);

    const corPearson = (meanXY - (meanX * meanY)) / (stdDevX * stdDevY);
    console.log("corPearson:", corPearson);

    const stat = ((Math.pow(corRatio, 2) - Math.pow(corPearson, 2)) / (numClasses - 2)) / ((1 - Math.pow(corPearson, 2)) / (N - numClasses));

    const student = jStat.centralF.inv(1 - a, numClasses - 2, N - numClasses);

    let conclusionEq;
    let conclusionLinear;
    if(stat > student) {
        conclusionEq = 'not equal';
        conclusionLinear = 'non-linear';
    }
    else{
        conclusionEq = 'equal';
        conclusionLinear = 'linear'
    }

    return{corRatio, corPearson, stat, student, conclusionEq, conclusionLinear};

}

function calculateRank(sample) {
    const sorted = sample.map((value, index) => ({ value, index }))
        .sort((a, b) => a.value - b.value);

    let rank = 1;
    let ranks = new Array(sample.length).fill(0);

    for (let i = 0; i < sorted.length; i++) {
        let tieSum = rank;
        let tieCount = 1;

        while (i + 1 < sorted.length && sorted[i].value === sorted[i + 1].value) {
            tieSum += (rank + 1);
            tieCount++;
            rank++;
            i++;
        }

        const averageRank = tieSum / tieCount;
        for (let j = 0; j < tieCount; j++) {
            ranks[sorted[i - j].index] = averageRank;
        }
        rank++;
    }
    console.log("ranks: ", ranks);
    return ranks;
}

function calculateRankSpearman(rankX, rankY) {
    const N = rankX.length;
    const pearsonCorrelation = calculatePearsonCorrelationCoefficient(rankX, rankY);
    const spearman = pearsonCorrelation.correlation;

    const stat = (spearman * Math.sqrt(N - 2)) / Math.sqrt(1 - Math.pow(spearman, 2));
    const student = pearsonCorrelation.student;
    let conclusionIm;
    let conclusionCon;
    if(Math.abs(stat) > student) {
        conclusionIm = 'significant';
        conclusionCon = 'exist'
    }
    else{
        conclusionIm = 'not significant';
        conclusionCon = 'not exist'
    }

    return {spearman, stat, student, conclusionIm, conclusionCon};

}

function calculateRankKendall(rankX, rankY) {
    const n = rankX.length;
    let S = 0, C = 0, D = 0;

    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            const signX = Math.sign(rankX[i] - rankX[j]);
            const signY = Math.sign(rankY[i] - rankY[j]);

            if (signX * signY > 0) {
                S += 1;
            } else if (signX * signY < 0) {
                S -= 1;
            }

            if (signX === 0) C++;
            if (signY === 0) D++;
        }
    }

    const denominator = Math.sqrt(((0.5 * n * (n - 1) - C) * (0.5 * n * (n - 1) - D)));
    const correlation = denominator !== 0 ? S / denominator : 0;
    console.log("denominator: ", denominator);
    console.log("S: ", S)

    const stat = (correlation * Math.sqrt(9 * n * (n - 1))) / Math.sqrt(2 * (2 * n + 5));
    const student = jStat.normal.inv(1 - a / 2, 0, 1);
    let conclusionIm;
    let conclusionCon;
    if(Math.abs(stat) > student) {
        conclusionIm = 'significant';
        conclusionCon = 'exist'
    }
    else{
        conclusionIm = 'not significant';
        conclusionCon = 'not exist'
    }

    return {
        correlation,
        stat,
        student,
        conclusionIm,
        conclusionCon
    };
}


function calculateNumClasses(data) {
    const n = data.length;
    return Math.round(1 + 1.44 * Math.log(n));
}

function calculateBandwidth(data, numClasses) {
    return (Math.max(...data) - Math.min(...data)) / numClasses;
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
    const skewness = calcSkewness(data, mean, n, stdDev0);
    const kurtosis = calcKurtosis(data, mean, n, stdDev0);

    const semMean = stdDev1 / Math.sqrt(n);
    const semStd1 = stdDev1 / Math.sqrt(2 * n);
    const semSkewness = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
    const semKurtosis = Math.sqrt((24 * n * Math.pow((n - 1), 2)) / ((n - 2) * (n - 3) * (n + 3) * (n + 5)));

    const alfa = a;
    const zValue = jStat.normal.inv(1 - alfa / 2, 0, 1); //квантиль стандартного нормального розподілу (1.96)
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

function identifyingNormDistributionSkewnessKurtosis(semSkewness, semKurtosis, skewness, kurtosis) {
    const alfa = 1 - a;
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
    const pValue = 1 - jStat.chisquare.cdf(chiSquareStatistic, degreesOfFreedom);

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
