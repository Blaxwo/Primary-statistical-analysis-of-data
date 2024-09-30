const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

const app = express();
const upload = multer({dest: 'uploads/'});
const numOfPoints = 500;
let ranges = [];

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
        const numbers = data.split(/\s+/).map(Number);
        ranges = [];
        const numClasses = parseInt(req.body.numClasses) || calculateNumClasses(numbers);
        const bandwidth = parseFloat(req.body.bandwidth) || calculateBandwidth(numbers);

        const statistics = calculateStatistics(numbers, numClasses);
        const kdeData = calculateKDE(numbers, bandwidth, numClasses);
        const ecdfData = calculateECDF(statistics.frequenciesArray);

        res.json({
            boundaries: statistics.boundaries,
            frequencies: statistics.frequencies,
            relativeFrequencies: statistics.relativeFrequencies,
            empiricalDistributions: statistics.empiricalDistributions,
            x: statistics.ranges,
            y: statistics.relativeFrequencies,
            kdeX: kdeData.x_values,
            kdeY: kdeData.y,
            ecdfX: ecdfData.x,
            ecdfY: ecdfData.y
        });
    });
});

function calculateKDE(data, bandwidth, numClasses) {
    const n = data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;
    const widthBetweenPoints = (max - min) / numOfPoints;
    const x_values = Array.from({ length: numOfPoints }, (_, i) => min + i * widthBetweenPoints);
    const y = x_values.map(xi => {
        const kernelSum = data.reduce((sum, i) => {
            return sum + (Math.exp(-(Math.pow((xi - i) / bandwidth, 2)) / 2) / Math.sqrt(2 * Math.PI));
        }, 0);
        return (kernelSum * classWidth / (n * bandwidth));
    });


    return {x_values, y};
}

//    const kde = data.reduce((a, b) => a + Math.exp((-Math.pow(((x-b)/bandwidth), 2)/2))/(Math.sqrt(2 * Math.PI)), 0) / (n * bandwidth)
function calculateECDF(frequenciesArray) {
    const x = frequenciesArray.map((el) => el.value);
    const y = frequenciesArray.map((el) => el.empiricalDistributions)
    console.log('x for ecdf: ' + x)
    console.log('y for ecdf: ' + y)
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
    console.log('bandwidth:', math.std(data) * Math.pow(n, -0.2))
    return  stdDev * Math.pow(n, -0.2);
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

        return {
            value: Number(value),
            frequency,
            relativeFrequency,
            empiricalDistributions: cumulativeRelativeFrequency
        };
    });

    console.log(frequenciesArray);

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
        relativeFrequencies.push(relFreq);
        empiricalDistributions.push(cumulativeFrequency);
    });

    return {
        boundaries: boundaries.map(b => `${b.lowerBound.toFixed(2)} to ${b.upperBound.toFixed(2)}`),
        frequencies,
        relativeFrequencies,
        empiricalDistributions,
        ranges,
        frequenciesArray
    };
}

app.listen(3001, () => {
    console.log('Server started on port 3001');
});
