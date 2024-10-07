import "./App.css";
import axios from 'axios';
import Plot from "react-plotly.js";
import {useState} from "react";

function App() {
    const [file, setFile] = useState(null);
    const [plotData, setPlotData] = useState({x: [], y: []});
    const [classData, setClassData] = useState({
        boundaries: [],
        frequencies: [],
        relativeFrequencies: [],
        empiricalDistributions: []
    });
    const [numbers, setNumbers] = useState([])
    const [kdeData, setKdeData] = useState({x: [], y: []});
    const [ecdfData, setEcdfData] = useState({x: [], y: []});
    const [anomaliesData, setAnomaliesfData] = useState({x: [], y: []});
    const [numClasses, setNumClasses] = useState(0);
    const [bandwidth, setBandwidth] = useState(null);
    const [showEcdf, setShowEcdf] = useState(false);
    const [showAnomalies, setShowAnomalies] = useState(false);
    const [boundaries, setBoundaries] = useState({lowerBound: 0, upperBound: 0});
    const [anomalies, setAnomalies] = useState({anomalies: []});
    const [normalDistribution, setNormalDistribution] = useState('');
    const [normalDistributionProbPlot, setNormalDistributionProbPlot] = useState({
        theoreticalQuantiles: [],
        sortedData: [],
        lineX: [],
        lineY: []
    });
    const [showNormalDistribution, setShowNormalDistribution] = useState(false);
    const [showTypicalValuesChars, setShowTypicalValuesChars] = useState(false);
    const [typicalValuesChars, setTypicalValuesChars] = useState({
        mean: 0,
        median: 0,
        stdDev1: 0,
        skewness: 0,
        kurtosis: 0,
        min: 0,
        max: 0,
        semMean: 0,
        semStd1: 0,
        semSkewness: 0,
        semKurtosis: 0,
        meanCI: {},
        medianCI: {},
        stdDevCI: {},
        skewnessCI: {},
        kurtosisCI: {}
    })

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
                setPlotData({x: response.data.x, y: response.data.y});
                setKdeData({x: response.data.kdeX, y: response.data.kdeY});
                setEcdfData({x: response.data.ecdfX, y: response.data.ecdfY});
                setAnomaliesfData({x: response.data.anomaliesX, y: response.data.anomaliesY});
                setAnomalies({anomalies: response.data.anomalies})
                setBoundaries({
                    lowerBound: response.data.boundariesAnomalies.lowerBound,
                    upperBound: response.data.boundariesAnomalies.upperBound
                });
                setNormalDistributionProbPlot({
                    theoreticalQuantiles: response.data.estimatingProbPlot.theoreticalQuantiles,
                    sortedData: response.data.estimatingProbPlot.sortedData,
                    lineX: response.data.estimatingProbPlot.lineX,
                    lineY: response.data.estimatingProbPlot.lineY
                })
                setNormalDistribution(response.data.estimatingSkewnessAndKurtosis)
                setTypicalValuesChars(response.data.typicalValues)
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                setNumbers([]);
                setClassData({boundaries: [], frequencies: [], relativeFrequencies: [], empiricalDistributions: []});
                setPlotData({x: [], y: []});
                setKdeData({x: [], y: []});
                setEcdfData({x: [], y: []});
                setAnomaliesfData({x: [], y: []});
                setBoundaries({upperBound: 0, lowerBound: 0});
                setAnomalies({anomalies: []});
                setNormalDistributionProbPlot({theoreticalQuantiles: [], sortedData: [], lineX: [], lineY: []})
                setNormalDistribution('Data is not loaded yet');
                setTypicalValuesChars({
                    mean: 0,
                    median: 0,
                    stdDev1: 0,
                    skewness: 0,
                    kurtosis: 0,
                    min: 0,
                    max: 0,
                    semMean: 0,
                    semStd1: 0,
                    semSkewness: 0,
                    semKurtosis: 0,
                    meanCI: {},
                    medianCI: {},
                    stdDevCI: {},
                    skewnessCI: {},
                    kurtosisCI: {}
                })
            });
    };

    const removeAnomalies = () => {
        const updatedNumbers = numbers.filter(num => !anomalies.anomalies.includes(num));

        setNumbers(updatedNumbers);

        axios.post('http://localhost:3001/update-numbers', {numbers: updatedNumbers})
            .then(response => {
                setNumbers(response.data.numbers);
                setClassData({
                    boundaries: response.data.boundaries,
                    frequencies: response.data.frequencies,
                    relativeFrequencies: response.data.relativeFrequencies,
                    empiricalDistributions: response.data.empiricalDistributions
                });
                setPlotData({x: response.data.x, y: response.data.y});
                setKdeData({x: response.data.kdeX, y: response.data.kdeY});
                setEcdfData({x: response.data.ecdfX, y: response.data.ecdfY});
                setAnomaliesfData({x: response.data.anomaliesX, y: response.data.anomaliesY});
                setNormalDistributionProbPlot({
                    theoreticalQuantiles: response.data.estimatingProbPlot.theoreticalQuantiles,
                    sortedData: response.data.estimatingProbPlot.sortedData,
                    lineX: response.data.estimatingProbPlot.lineX,
                    lineY: response.data.estimatingProbPlot.lineY
                })
                setNormalDistribution(response.data.estimatingSkewnessAndKurtosis)
                setTypicalValuesChars(response.data.typicalValues)
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                setNumbers([]);
                setClassData({boundaries: [], frequencies: [], relativeFrequencies: [], empiricalDistributions: []});
                setPlotData({x: [], y: []});
                setKdeData({x: [], y: []});
                setEcdfData({x: [], y: []});
                setAnomaliesfData({x: [], y: []});
                setNormalDistributionProbPlot({theoreticalQuantiles: [], sortedData: [], lineX: [], lineY: []})
                setNormalDistribution('Data is not loaded yet');
                setTypicalValuesChars({
                    mean: 0,
                    median: 0,
                    stdDev1: 0,
                    skewness: 0,
                    kurtosis: 0,
                    min: 0,
                    max: 0,
                    semMean: 0,
                    semStd1: 0,
                    semSkewness: 0,
                    semKurtosis: 0,
                    meanCI: {},
                    medianCI: {},
                    stdDevCI: {},
                    skewnessCI: {},
                    kurtosisCI: {}
                })
            });
    };

    return (
        <div className="App" style={{display: "flex", justifyContent: "space-between", height: "100vh"}}>
            <div style={{width: "50%", padding: "20px"}}>
                <div style={{margin: "30px 0 30px 0"}}>
                    <input type="file" onChange={onFileChange}/>
                    <div>Num of classes:</div>
                    <input type="number" value={numClasses} onChange={e => setNumClasses(e.target.value)}/>
                    <div>Bandwidth:</div>
                    <input type="number" placeholder="Bandwidth" value={bandwidth}
                           onChange={e => setBandwidth(e.target.value)}/>
                    <button onClick={onFileUpload}>Upload and Calculate</button>
                </div>

                <div style={{maxHeight: "300px", overflowX: "auto"}}>
                    <table>
                        <thead>
                        <tr>
                            <th style={{width: "80px", borderRight: "1px solid blue"}}>Class No.</th>
                            <th style={{width: "200px", borderRight: "1px solid blue"}}>Boundaries</th>
                            <th style={{width: "100px", borderRight: "1px solid blue"}}>Frequency</th>
                            <th style={{width: "225px", borderRight: "1px solid blue"}}>Relative Frequency</th>
                            <th style={{width: "225px"}}>Empirical Distribution</th>
                        </tr>
                        </thead>
                        <tbody>
                        {classData.boundaries.length > 0 ? classData.boundaries.map((boundary, index) => (
                            <tr key={index}>
                                <td style={{borderRight: "1px solid blue"}}>{index + 1}</td>
                                <td style={{borderRight: "1px solid blue"}}>{boundary}</td>
                                <td style={{borderRight: "1px solid blue"}}>{classData.frequencies[index]}</td>
                                <td style={{borderRight: "1px solid blue"}}>{classData.relativeFrequencies[index]}</td>
                                <td>{classData.empiricalDistributions[index]}</td>
                            </tr>
                        )) : <tr>
                            <td colSpan="5">Loading data or no data available...</td>
                        </tr>}
                        </tbody>
                    </table>
                </div>

                <Plot
                    data={[
                        {
                            x: plotData.x,
                            y: plotData.y,
                            type: 'bar',
                            marker: {color: 'blue'},
                            offset: 0,
                        },
                        {
                            x: kdeData.x,
                            y: kdeData.y,
                            type: 'scatter',
                            mode: 'lines',
                            line: {color: 'red'},
                            name: 'KDE'
                        }
                    ]}
                    layout={{
                        title: "Histogram and KDE",
                        xaxis: {title: "Boundaries"},
                        yaxis: {title: "Relative Frequencies"},
                        autosize: true,
                        responsive: true,
                        bargap: 0,
                    }}
                />
            </div>

            <div style={{width: "50%", padding: "20px", textAlign: "center"}}>
                <button onClick={() => setShowEcdf(!showEcdf)}>
                    {showEcdf ? "Hide ECDF" : "Show ECDF"}
                </button>
                <button onClick={() => setShowAnomalies(!showAnomalies)}>
                    {showAnomalies ? "Hide Anomalies" : "Show Anomalies"}
                </button>
                <button onClick={() => setShowTypicalValuesChars(!showTypicalValuesChars)}>
                    {showTypicalValuesChars ? "Hide Typical Values" : "Show Typical Values"}
                </button>
                <button onClick={removeAnomalies}>Remove Anomalous Values</button>
                <button onClick={() => setShowNormalDistribution(!showNormalDistribution)}>
                    {showNormalDistribution ? "Hide Normal Distribution" : "Show Normal Distribution"}
                </button>
                {showNormalDistribution && (
                    <div>
                        <div style={{
                            letterSpacing: "2px",
                            lineHeight: "1.6",
                            padding: "20px",
                            margin: "10px 0",
                            fontSize: "18px",
                            textAlign: "center",
                        }}>
                            {normalDistribution}</div>
                        <Plot
                            data={[
                                {
                                    x: normalDistributionProbPlot.theoreticalQuantiles,
                                    y: normalDistributionProbPlot.sortedData,
                                    type: 'scatter',
                                    mode: 'markers',
                                    marker: {color: 'blue'},
                                    name: 'Observed Data'
                                },
                                {
                                    x: normalDistributionProbPlot.lineX,
                                    y: normalDistributionProbPlot.lineY,
                                    type: 'scatter',
                                    mode: 'lines',
                                    line: {color: 'red'},
                                    name: 'Theoretical Line'
                                }
                            ]}
                            layout={{
                                title: "Normal Probability Plot (Q-Q Plot)",
                                xaxis: {title: "Theoretical Quantiles"},
                                yaxis: {title: "Observed Data"},
                                autosize: true,
                                responsive: true,
                                showlegend: true,
                            }}
                        />

                    </div>
                )}
                {showTypicalValuesChars && (
                    <div style={{marginTop: "20px"}}>
                        <table style={{width: "100%", border: "1px solid blue", margin: "20px 0"}}>
                            <thead>
                            <tr>
                                <th>Characteristic</th>
                                <th>Value</th>
                                <th>Sem</th>
                                <th>Confidence Interval</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Mean</td>
                                <td>{typicalValuesChars.mean.toFixed(4)}</td>
                                <td>{typicalValuesChars.semMean.toFixed(4)}</td>
                                <td>[{typicalValuesChars.meanCI.x.toFixed(4)}, {typicalValuesChars.meanCI.y.toFixed(4)}]</td>
                            </tr>
                            <tr>
                                <td>Median</td>
                                <td>{typicalValuesChars.median.toFixed(4)}</td>
                                <td>-</td>
                                <td>[{typicalValuesChars.medianCI.x.toFixed(4)}, {typicalValuesChars.medianCI.y.toFixed(4)}]</td>
                            </tr>
                            <tr>
                                <td>Standard Deviation</td>
                                <td>{typicalValuesChars.stdDev1.toFixed(4)}</td>
                                <td>{typicalValuesChars.semStd1.toFixed(4)}</td>
                                <td>[{typicalValuesChars.stdDevCI.x.toFixed(4)}, {typicalValuesChars.stdDevCI.y.toFixed(4)}]</td>
                            </tr>
                            <tr>
                                <td>Skewness</td>
                                <td>{typicalValuesChars.skewness.toFixed(4)}</td>
                                <td>{typicalValuesChars.semSkewness.toFixed(4)}</td>
                                <td>[{typicalValuesChars.skewnessCI.x.toFixed(4)}, {typicalValuesChars.skewnessCI.y.toFixed(4)}]</td>
                            </tr>
                            <tr>
                                <td>Kurtosis</td>
                                <td>{typicalValuesChars.kurtosis.toFixed(4)}</td>
                                <td>{typicalValuesChars.semKurtosis.toFixed(4)}</td>
                                <td>[{typicalValuesChars.kurtosisCI.x.toFixed(4)}, {typicalValuesChars.kurtosisCI.y.toFixed(4)}]</td>
                            </tr>
                            <tr>
                                <td>Minimum</td>
                                <td>{typicalValuesChars.min.toFixed(4)}</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td>Maximum</td>
                                <td>{typicalValuesChars.max.toFixed(4)}</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            </tbody>
                        </table>
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
                                line: {color: 'green', shape: 'hv'},
                            }
                        ]}
                        layout={{
                            title: "Empirical Distribution Function (ECDF)",
                            xaxis: {title: "Data"},
                            yaxis: {title: "FN(x)"},
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
                                marker: {color: 'blue'},
                                name: 'Normal Data'
                            },
                            {
                                x: anomaliesData.x.filter((_, i) => anomaliesData.y[i] < boundaries.lowerBound || anomaliesData.y[i] > boundaries.upperBound),
                                y: anomaliesData.y.filter(y => y < boundaries.lowerBound || y > boundaries.upperBound),
                                type: 'scatter',
                                mode: 'markers',
                                marker: {color: 'red'},
                                name: 'Anomalies'
                            },
                            {
                                x: [Math.min(...anomaliesData.x), Math.max(...anomaliesData.x)],
                                y: [boundaries.upperBound, boundaries.upperBound],
                                type: 'scatter',
                                mode: 'lines',
                                line: {color: 'red'},
                                name: 'Upper Bound'
                            },
                            {
                                x: [Math.min(...anomaliesData.x), Math.max(...anomaliesData.x)],
                                y: [boundaries.lowerBound, boundaries.lowerBound],
                                type: 'scatter',
                                mode: 'lines',
                                line: {color: 'red'},
                                name: 'Lower Bound'
                            }
                        ]}
                        layout={{
                            title: "Data with Anomalies",
                            xaxis: {title: "Index"},
                            yaxis: {title: "Values"},
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
