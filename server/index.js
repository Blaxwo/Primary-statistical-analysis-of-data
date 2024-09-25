const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({dest: 'uploads/'});
const basicNumberOfClasses = 10;

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
        const numClasses = parseInt(req.body.numClasses) || basicNumberOfClasses;

        const statistics = calculateStatistics(numbers, numClasses);

        res.json({
            boundaries: statistics.boundaries,
            frequencies: statistics.frequencies,
            relativeFrequencies: statistics.relativeFrequencies,
            empiricalDistributions: statistics.empiricalDistributions,
            x: statistics.ranges,
            y: statistics.relativeFrequencies
        });
    });
});

function calculateStatistics(data, numClasses) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;

    let boundaries = [];
    let frequencies = Array(numClasses).fill(0);
    let relativeFrequencies = [];
    let empiricalDistributions = [];
    let ranges = [];

    for (let i = 0; i < numClasses; i++) {
        const lowerBound = (min + i * classWidth);
        const upperBound = (min + (i + 1) * classWidth);
        ranges.push(`${lowerBound.toFixed(2)} to ${upperBound.toFixed(2)}`);
        boundaries.push({lowerBound, upperBound});
    }

    data.forEach(value => {
        for (let i = 0; i < boundaries.length; i++) {
            if (i === boundaries.length - 1) {
                if (value >= boundaries[i].lowerBound && value <= boundaries[i].upperBound) {
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

    const totalFrequency = data.length;
    let cumulativeFrequency = 0;

    frequencies.forEach((freq, index) => {
        let relFreq = freq / totalFrequency;
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
    };
}


app.listen(3001, () => {
    console.log('Server started on port 3001');
});
