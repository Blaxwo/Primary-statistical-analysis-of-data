const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { plot } = require('nodeplotlib');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, '..', 'public', 'server')));

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error processing file');
        }

        const numbers = data.split(/\s+/).map(Number);
        const histogramData = calculateHistogram(numbers, 5);
        const plotData = [{x: histogramData.ranges, y: histogramData.frequencies, type: 'bar'}];

        plot(plotData);
        res.sendFile(path.join(__dirname, '..', 'plot.html'));
    });
});

function calculateHistogram(data, numClasses) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;
    let ranges = [];
    let frequencies = Array(numClasses).fill(0);

    for (let i = 0; i < numClasses; i++) {
        ranges.push(`${min + i * classWidth} - ${min + (i + 1) * classWidth}`);
    }

    data.forEach(value => {
        const index = Math.min(Math.floor((value - min) / classWidth), numClasses - 1);
        frequencies[index]++;
    });

    return { ranges, frequencies };
}

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
