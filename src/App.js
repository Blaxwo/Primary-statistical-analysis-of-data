import "./App.css";
import axios from 'axios';
import Plot from "react-plotly.js";
import {useState} from "react";

function App() {
    const cellStyle = {
        border: "1px solid black",
        padding: "8px",
        textAlign: "center"
    };

    const [file, setFile] = useState(null);
    const [pearson, setPearson] = useState({
        chiSquareStatistic: 0,
        criticalValue: 0,
        pValue: 0,
        conclusion: ''
    })
    const [normalDistribution, setNormalDistribution] = useState('');
    const [normalDistributionProbPlot, setNormalDistributionProbPlot] = useState({
        theoreticalQuantiles: [],
        sortedData: [],
        lineX: [],
        lineY: []
    });
    const [showPearson, setShowPearson] = useState(false);
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
    });
    //
    const [numbers, setNumbers] = useState({ numbersX: null, numbersY: null });
    const [coefPearson, setCoefPearson] = useState(null);
    const [coefSpearman, setCoefSpearman] = useState(null);
    const [coefKendall, setCoefKendall] = useState(null);
    const [coefCorRatio, setCoefCorRatio] = useState(null);
    const [coefPearsonCorRatio, setCoefPearsonCorRatio] = useState(null);
    const [showCoef, setShowCoef] = useState(false);
    const [showCoefPearsonCorRatio, setShowCoefPearsonCorRatio] = useState(false);
    const [showField, setShowField] = useState(false);
    const [xRegression, setXRegression] = useState(false);
    // lab 2
    const [regressionParams, setRegressionParams] = useState(null);

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

        axios.post('http://localhost:3001/upload', formData)
            .then(response => {
                setNormalDistributionProbPlot({
                    theoreticalQuantiles: response.data.estimatingProbPlot.theoreticalQuantiles,
                    sortedData: response.data.estimatingProbPlot.sortedData,
                    lineX: response.data.estimatingProbPlot.lineX,
                    lineY: response.data.estimatingProbPlot.lineY
                })
                setNormalDistribution(response.data.estimatingSkewnessAndKurtosis)
                setTypicalValuesChars(response.data.typicalValues)
                setPearson({
                    conclusion: response.data.pearson.conclusion,
                    criticalValue: response.data.pearson.criticalValue,
                    pValue: response.data.pearson.pValue,
                    chiSquareStatistic: response.data.pearson.chiSquareStatistic
                })
                //
                setNumbers({ numbersX: response.data.numbersX, numbersY: response.data.numbersY });
                setCoefPearson(response.data.coefPearson)
                setCoefSpearman(response.data.coefSpearman)
                setCoefKendall(response.data.coefKendall)
                setCoefCorRatio(response.data.coefCorRatio)
                setCoefPearsonCorRatio(response.data.coefPearsonCorRatio)
                // lab2
                setRegressionParams(response.data.regressionParams)
                setXRegression(response.data.xRegression)
            })
            .catch(err => {
                console.error('Error uploading file:', err);
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
            <div style={{margin: "30px 0 30px 0"}}>
                <input type="file" onChange={onFileChange}/>
                <button onClick={onFileUpload}>Upload and Calculate</button>
            </div>

            <div style={{width: "50%", padding: "20px", textAlign: "center"}}>
                <button onClick={() => setShowCoef(!showCoef)}>
                    {showCoef ? "Hide Coefs" : "Show Coefs"}
                </button>
                <button onClick={() => setShowTypicalValuesChars(!showTypicalValuesChars)}>
                    {showTypicalValuesChars ? "Hide Typical Values" : "Show Typical Values"}
                </button>
                <button onClick={() => setShowField(!showField)}>
                    {showField ? "Hide Field" : "Show Field"}
                </button>
                {regressionParams && (
                    <div style={{ marginTop: "20px" }}>
                        <h3>Оцінки параметрів регресії</h3>
                        <table style={{ width: "100%", border: "1px solid black", borderCollapse: "collapse" }}>
                            <thead>
                            <tr>
                                <th style={cellStyle}>Значення оцінки параметра</th>
                                <th style={cellStyle}>Середньоквадратичне відхилення оцінки</th>
                                <th style={cellStyle}>95% довірчий інтервал</th>
                                <th style={cellStyle}>Статистика</th>
                                <th style={cellStyle}>Квантиль</th>
                                <th style={cellStyle}>Значущість</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={cellStyle}>a0: {regressionParams.a0?.toFixed(4)}</td>
                                <td style={cellStyle}>{regressionParams.std_a0?.toFixed(4)}</td>
                                <td style={cellStyle}>[{regressionParams.a0_lower?.toFixed(4)}, {regressionParams.a0_upper?.toFixed(4)}]</td>
                                <td style={cellStyle}>{regressionParams.t_a0?.toFixed(4)}</td>
                                <td style={cellStyle}>{regressionParams.t_critical?.toFixed(4)}</td>
                                <td style={cellStyle}>{regressionParams.conclusionA0}</td>
                            </tr>
                            <tr>
                                <td style={cellStyle}>a1: {regressionParams.a1?.toFixed(4)}</td>
                                <td style={cellStyle}>{regressionParams.std_a1?.toFixed(4)}</td>
                                <td style={cellStyle}>[{regressionParams.a1_lower?.toFixed(4)}, {regressionParams.a1_upper?.toFixed(4)}]</td>
                                <td style={cellStyle}>{regressionParams.t_a1?.toFixed(4)}</td>
                                <td style={cellStyle}>{regressionParams.t_critical?.toFixed(4)}</td>
                                <td style={cellStyle}>{regressionParams.conclusionA1}</td>
                            </tr>
                            <tr>
                                <td style={cellStyle}>Залишкова дисперсія: {regressionParams.sResSquared}</td>
                            </tr>
                            <tr>
                                <td style={cellStyle}>Коефіцієнт детермінації: {regressionParams.r_squared}</td>
                            </tr>
                            <tr>
                                <td style={cellStyle}>F-test stat:{regressionParams.fStat} critical:{regressionParams.f_critical} conclusion: {regressionParams.conclusionF}</td>
                            </tr>
                            <td style={cellStyle}>
                                x: {xRegression.x} Регресія для X: {xRegression.yPred} Довірчій інтервал:
                                [{xRegression.ciReg[0].toFixed(4)}, {xRegression.ciReg[1].toFixed(4)}]
                                [{xRegression.ciPred[0].toFixed(4)}, {xRegression.ciPred[1].toFixed(4)}]
                            </td>
                            </tbody>
                        </table>
                    </div>
                )}

                {showField && (
                    <div style={{ marginTop: "20px" }}>
                        <h3>Construction of a correlation field</h3>
                        <Plot
                            data={[
                                {
                                    x: numbers.numbersX,
                                    y: numbers.numbersY,
                                    mode: 'markers',
                                    type: 'scatter',
                                    name: 'Data',
                                    marker: { color: 'blue' }
                                },
                                {
                                    x: numbers.numbersX,
                                    y: regressionParams.regressionLine,
                                    mode: 'lines',
                                    type: 'scatter',
                                    name: 'Regression Line',
                                    line: { color: 'red' }
                                },
                                {
                                    x: numbers.numbersX,
                                    y: regressionParams.ciRegUpper,
                                    mode: 'lines',
                                    type: 'scatter',
                                    name: 'CI Regression Upper',
                                    line: { color: 'green', dash: 'dash' }
                                },
                                {
                                    x: numbers.numbersX,
                                    y: regressionParams.ciRegLower,
                                    mode: 'lines',
                                    type: 'scatter',
                                    name: 'CI Regression Lower',
                                    line: { color: 'green', dash: 'dash' }
                                },
                                {
                                    x: numbers.numbersX,
                                    y: regressionParams.ciPredUpper,
                                    mode: 'lines',
                                    type: 'scatter',
                                    name: 'Prediction Upper',
                                    line: { color: 'orange', dash: 'dot' }
                                },
                                {
                                    x: numbers.numbersX,
                                    y: regressionParams.ciPredLower,
                                    mode: 'lines',
                                    type: 'scatter',
                                    name: 'Prediction Lower',
                                    line: { color: 'orange', dash: 'dot' }
                                }
                            ]}
                            layout={{
                                title: 'Correlation Field with Regression and Confidence Intervals',
                                xaxis: { title: 'X Values' },
                                yaxis: { title: 'Y Values' }
                            }}
                            style={{ width: "100%", height: "500px" }}
                        />
                    </div>
                )}


                {showCoef && (
                    <div style={{ marginTop: "20px" }}>
                        <table style={{ width: "100%", border: "1px solid blue", borderCollapse: "collapse", margin: "20px 0" }}>
                            <thead>
                            <tr style={{ background: "#f0f0f0", borderBottom: "1px solid blue" }}>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Коефіцієнт кореляції</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Оцінка</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Довірчий інтервал</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Статистика</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Квантиль</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Висновок (значущий/незначущий)</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Висновок щодо наявності взаємозв'язку (є/немає)</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>Пірсона</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearson.correlation}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearson.correlation_lower}, {coefPearson.correlation_upper}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearson.stat}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearson.student}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearson.conclusionIm}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearson.conclusionCon}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>Спірмена</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefSpearman.spearman}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>–</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefSpearman.stat}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefSpearman.student}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefSpearman.conclusionIm}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefSpearman.conclusionCon}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>Кендалла</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefKendall.correlation}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>–</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefKendall.stat}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefKendall.student}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefKendall.conclusionIm}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefKendall.conclusionCon}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>Кореляційне відношення</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefCorRatio.corRatio}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>–</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefCorRatio.stat}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefCorRatio.student}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefCorRatio.conclusionIm}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefCorRatio.conclusionCon}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {coefCorRatio && coefCorRatio.conclusionIm === 'significant' && (
                    <div style={{ marginTop: "20px" }}>
                        <table style={{ width: "100%", border: "1px solid blue", borderCollapse: "collapse", margin: "20px 0" }}>
                            <thead>
                            <tr style={{ background: "#f0f0f0", borderBottom: "1px solid blue" }}>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>
                                    Оцінка коефіцієнта Пірсона (розрахована за переформованим масивом)
                                </th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Оцінка кореляційного відношення</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Статистика</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Квантиль</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>Висновок (рівні/нерівні)</th>
                                <th style={{ border: "1px solid blue", padding: "8px" }}>
                                    Висновок щодо виду залежності (лінійна/нелінійна)
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearsonCorRatio.corPearson}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearsonCorRatio.corRatio}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearsonCorRatio.stat}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearsonCorRatio.student}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearsonCorRatio.conclusionEq}</td>
                                <td style={{ border: "1px solid blue", padding: "8px" }}>{coefPearsonCorRatio.conclusionLinear}</td>
                            </tr>
                            </tbody>
                        </table>
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
            </div>
        </div>
    );
}

export default App;
