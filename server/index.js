const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error processing file');
        }
        fs.unlinkSync(filePath);
        const numbers = data.split(/\s+/).map(Number);
        const histogramData = calculateHistogram(numbers, 6);
        res.json({ x: histogramData.ranges, y: histogramData.frequencies });
    });
});

function calculateHistogram(data, numClasses) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const classWidth = (max - min) / numClasses;
    let ranges = [];
    let frequencies = Array(numClasses).fill(0);

    for (let i = 0; i < numClasses; i++) {
        ranges.push(`${(min + i * classWidth).toFixed(2)} to ${(min + (i + 1) * classWidth).toFixed(2)}`);
    }

    data.forEach(value => {
        const index = Math.min(Math.floor((value - min) / classWidth), numClasses - 1);
        frequencies[index]++;
    });

    console.log(frequencies)

    frequencies = frequencies.map(freq => freq / data.length);

    return { ranges, frequencies };
}

app.listen(3001, () => {
    console.log('Server started on port 3001');
});
