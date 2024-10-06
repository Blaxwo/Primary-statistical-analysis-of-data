import "./App.css";
import axios from 'axios';
import Plot from "react-plotly.js";
import { useState } from "react";

function App() {
    const [file, setFile] = useState(null);
    const [plotData, setPlotData] = useState({ x: [], y: [] });
    const [classData, setClassData] = useState({
        boundaries: [],
        frequencies: [],
        relativeFrequencies: [],
        empiricalDistributions: []
    });
    const [numbers, setNumbers] = useState([])
    const [kdeData, setKdeData] = useState({ x: [], y: [] });
    const [ecdfData, setEcdfData] = useState({ x: [], y: [] });
    const [anomaliesData, setAnomaliesfData] = useState({ x: [], y: [] });
    const [numClasses, setNumClasses] = useState(0);
    const [bandwidth, setBandwidth] = useState(null);
    const [showEcdf, setShowEcdf] = useState(false);
    const [showAnomalies, setShowAnomalies] = useState(false);
    const [boundaries, setBoundaries] = useState({ lowerBound: 0, upperBound: 0 });
    const [anomalies, setAnomalies] = useState({anomalies: []});
    const [normalDistribution, setNormalDistribution] = useState('');
    const [showNormalDistribution, setShowNormalDistribution] = useState(false);

    const onFileChange = event => {
        setFile(event.target.files[0]);
    };

    const onFileUpload = () => {
        if (!file) {
            console.log("No file selected!");
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('numClasses', numClasses);
        formData.append('bandwidth', bandwidth);

        axios.post('http://localhost:3001/upload', formData)
            .then(response => {
                setNumbers(response.data.numbers);
                setClassData({
                    boundaries: response.data.boundaries,
                    frequencies: response.data.frequencies,
                    relativeFrequencies: response.data.relativeFrequencies,
                    empiricalDistributions: response.data.empiricalDistributions
                });
                setPlotData({ x: response.data.x, y: response.data.y });
                setKdeData({ x: response.data.kdeX, y: response.data.kdeY });
                setEcdfData({ x: response.data.ecdfX, y: response.data.ecdfY });
                setAnomaliesfData({ x: response.data.anomaliesX, y: response.data.anomaliesY });
                setAnomalies({anomalies: response.data.anomalies})
                setBoundaries({ lowerBound: response.data.boundariesAnomalies.lowerBound, upperBound: response.data.boundariesAnomalies.upperBound });
                setNormalDistribution(response.data.estimatingSkewnessAndKurtosis)
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                setNumbers([]);
                setClassData({ boundaries: [], frequencies: [], relativeFrequencies: [], empiricalDistributions: [] });
                setPlotData({ x: [], y: [] });
                setKdeData({ x: [], y: [] });
                setEcdfData({ x: [], y: [] });
                setAnomaliesfData({ x: [], y: [] });
                setBoundaries({upperBound: 0, lowerBound: 0});
                setAnomalies({anomalies: []});
                setNormalDistribution('Data is not loaded yet');
            });
    };

    const removeAnomalies = () => {
        const updatedNumbers = numbers.filter(num => !anomalies.anomalies.includes(num));

        setNumbers(updatedNumbers);

        axios.post('http://localhost:3001/update-numbers', { numbers: updatedNumbers })
            .then(response => {
                setNumbers(response.data.numbers);
                setClassData({
                    boundaries: response.data.boundaries,
                    frequencies: response.data.frequencies,
                    relativeFrequencies: response.data.relativeFrequencies,
                    empiricalDistributions: response.data.empiricalDistributions
                });
                setPlotData({ x: response.data.x, y: response.data.y });
                setKdeData({ x: response.data.kdeX, y: response.data.kdeY });
                setEcdfData({ x: response.data.ecdfX, y: response.data.ecdfY });
                setAnomaliesfData({ x: response.data.anomaliesX, y: response.data.anomaliesY });
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                setNumbers([]);
                setClassData({ boundaries: [], frequencies: [], relativeFrequencies: [], empiricalDistributions: [] });
                setPlotData({ x: [], y: [] });
                setKdeData({ x: [], y: [] });
                setEcdfData({ x: [], y: [] });
                setAnomaliesfData({ x: [], y: [] });
            });
    };

    return (
        <div className="App" style={{ display: "flex", justifyContent: "space-between", height: "100vh" }}>
            <div style={{ width: "50%", padding: "20px" }}>
                <div style={{ margin: "30px 0 30px 0"}}>
                    <input type="file" onChange={onFileChange} />
                    <div>Num of classes:</div>
                    <input type="number" value={numClasses} onChange={e => setNumClasses(e.target.value)} />
                    <div>Bandwidth:</div>
                    <input type="number" placeholder="Bandwidth" value={bandwidth} onChange={e => setBandwidth(e.target.value)} />
                    <button onClick={onFileUpload}>Upload and Calculate</button>
                </div>

                <div style={{ maxHeight: "300px", overflowX: "auto" }}>
                    <table>
                        <thead>
                        <tr>
                            <th style={{ width: "80px", borderRight: "1px solid blue" }}>Class No.</th>
                            <th style={{ width: "200px", borderRight: "1px solid blue" }}>Boundaries</th>
                            <th style={{ width: "100px", borderRight: "1px solid blue" }}>Frequency</th>
                            <th style={{ width: "225px", borderRight: "1px solid blue" }}>Relative Frequency</th>
                            <th style={{ width: "225px" }}>Empirical Distribution</th>
                        </tr>
                        </thead>
                        <tbody>
                        {classData.boundaries.length > 0 ? classData.boundaries.map((boundary, index) => (
                            <tr key={index}>
                                <td style={{ borderRight: "1px solid blue" }}>{index + 1}</td>
                                <td style={{ borderRight: "1px solid blue" }}>{boundary}</td>
                                <td style={{ borderRight: "1px solid blue" }}>{classData.frequencies[index]}</td>
                                <td style={{ borderRight: "1px solid blue" }}>{classData.relativeFrequencies[index]}</td>
                                <td>{classData.empiricalDistributions[index]}</td>
                            </tr>
                        )) : <tr><td colSpan="5">Loading data or no data available...</td></tr>}
                        </tbody>
                    </table>
                </div>

                <Plot
                    data={[
                        {
                            x: plotData.x,
                            y: plotData.y,
                            type: 'bar',
                            marker: { color: 'blue' },
                            offset: 0,
                        },
                        {
                            x: kdeData.x,
                            y: kdeData.y,
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: 'red' },
                            name: 'KDE'
                        }
                    ]}
                    layout={{
                        title: "Histogram and KDE",
                        xaxis: { title: "Boundaries" },
                        yaxis: { title: "Relative Frequencies" },
                        autosize: true,
                        responsive: true,
                        bargap: 0,
                    }}
                />
            </div>

            <div style={{ width: "50%", padding: "20px", textAlign: "center" }}>
                <button onClick={() => setShowEcdf(!showEcdf)}>
                    {showEcdf ? "Hide ECDF" : "Show ECDF"}
                </button>
                <button onClick={() => setShowAnomalies(!showAnomalies)}>
                    {showAnomalies ? "Hide Anomalies" : "Show Anomalies"}
                </button>
                <button onClick={removeAnomalies}>Remove Anomalous Values</button>
                <button onClick={() => setShowNormalDistribution(!showNormalDistribution)}>
                    {showNormalDistribution ? "Hide Normal Distribution" : "Show Normal Distribution"}
                </button>
                {showNormalDistribution && (
                    <div style={{ letterSpacing: "2px", lineHeight: "1.6", padding: "20px", margin: "10px 0",fontSize: "18px",textAlign: "center",}}>
                        {normalDistribution}

                    </div>
                )}
                {showEcdf && (
                    <Plot
                        data={[
                            {
                                x: ecdfData.x,
                                y: ecdfData.y,
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: 'green', shape: 'hv' },
                            }
                        ]}
                        layout={{
                            title: "Empirical Distribution Function (ECDF)",
                            xaxis: { title: "Data" },
                            yaxis: { title: "FN(x)" },
                            autosize: true,
                            responsive: true
                        }}
                    />
                )}
                {showAnomalies && (
                    <Plot
                        data={[
                            {
                                x: anomaliesData.x.filter((_, i) => anomaliesData.y[i] >= boundaries.lowerBound && anomaliesData.y[i] <= boundaries.upperBound),
                                y: anomaliesData.y.filter(y => y >= boundaries.lowerBound && y <= boundaries.upperBound),
                                type: 'scatter',
                                mode: 'markers',
                                marker: { color: 'blue' },
                                name: 'Normal Data'
                            },
                            {
                                x: anomaliesData.x.filter((_, i) => anomaliesData.y[i] < boundaries.lowerBound || anomaliesData.y[i] > boundaries.upperBound),
                                y: anomaliesData.y.filter(y => y < boundaries.lowerBound || y > boundaries.upperBound),
                                type: 'scatter',
                                mode: 'markers',
                                marker: { color: 'red' },
                                name: 'Anomalies'
                            },
                            {
                                x: [Math.min(...anomaliesData.x), Math.max(...anomaliesData.x)],
                                y: [boundaries.upperBound, boundaries.upperBound],
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: 'red' },
                                name: 'Upper Bound'
                            },
                            {
                                x: [Math.min(...anomaliesData.x), Math.max(...anomaliesData.x)],
                                y: [boundaries.lowerBound, boundaries.lowerBound],
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: 'red' },
                                name: 'Lower Bound'
                            }
                        ]}
                        layout={{
                            title: "Data with Anomalies",
                            xaxis: { title: "Index" },
                            yaxis: { title: "Values" },
                            autosize: true,
                            responsive: true,
                            showlegend: true
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
