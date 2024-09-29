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
    const [kdeData, setKdeData] = useState({ x: [], y: [] });
    const [ecdfData, setEcdfData] = useState({ x: [], y: [] });
    const [numClasses, setNumClasses] = useState(0);
    const [bandwidth, setBandwidth] = useState(null);
    const [showEcdf, setShowEcdf] = useState(false);

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
                setClassData({
                    boundaries: response.data.boundaries,
                    frequencies: response.data.frequencies,
                    relativeFrequencies: response.data.relativeFrequencies,
                    empiricalDistributions: response.data.empiricalDistributions
                });
                setPlotData({ x: response.data.x, y: response.data.y });
                setKdeData({ x: response.data.kdeX, y: response.data.kdeY });
                setEcdfData({ x: response.data.ecdfX, y: response.data.ecdfY });
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                setClassData({ boundaries: [], frequencies: [], relativeFrequencies: [], empiricalDistributions: [] });
                setPlotData({ x: [], y: [] });
                setKdeData({ x: [], y: [] });
                setEcdfData({ x: [], y: [] });
            });
    };

    return (
        <div className="App" style={{ display: "flex", justifyContent: "space-between", height: "100vh" }}>
            <div style={{ width: "50%", padding: "20px" }}>
                <div style={{ margin: "30px 0 30px 0"}}>
                    <input type="file" onChange={onFileChange} />
                    <input type="number" value={numClasses} onChange={e => setNumClasses(e.target.value)} />
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
                        responsive: true
                    }}
                />
            </div>

            <div style={{ width: "50%", padding: "20px", textAlign: "center" }}>
                <button onClick={() => setShowEcdf(!showEcdf)}>
                    {showEcdf ? "Hide ECDF" : "Show ECDF"}
                </button>
                {showEcdf && (
                    <Plot
                        data={[
                            {
                                x: ecdfData.x,
                                y: ecdfData.y,
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: 'green' },
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
            </div>
        </div>
    );
}

export default App;
