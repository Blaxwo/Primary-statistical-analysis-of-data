import "./App.css";
import axios from 'axios';
import Plot from "react-plotly.js";
import { useState } from "react";

function App() {
    const [file, setFile] = useState(null);
    const [plotData, setPlotData] = useState({ x: [], y: [] });
    // Initialize classData with empty arrays to avoid undefined errors
    const [classData, setClassData] = useState({
        boundaries: [],
        frequencies: [],
        relativeFrequencies: [],
        empiricalDistributions: []
    });
    const [numClasses, setNumClasses] = useState(10);

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
        axios.post('http://localhost:3001/upload', formData)
            .then(response => {
                console.log('Data received:', response.data);
                // Update classData based on the expected response structure
                setClassData({
                    boundaries: response.data.boundaries,
                    frequencies: response.data.frequencies,
                    relativeFrequencies: response.data.relativeFrequencies,
                    empiricalDistributions: response.data.empiricalDistributions
                });
                // Set the plot data for the histogram
                setPlotData({ x: response.data.x, y: response.data.y });
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                setClassData({ boundaries: [], frequencies: [], relativeFrequencies: [], empiricalDistributions: [] });
                setPlotData({ x: [], y: [] }); // Clear plot data on error
            });
    };



    return (
        <div className="App" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
        }}>
            <input type="file" onChange={onFileChange} />
            <input type="number" value={numClasses} onChange={e => setNumClasses(e.target.value)} />
            <button onClick={onFileUpload}>Upload and Calculate</button>
            <table style={{ width: "830px", tableLayout: "fixed" }}>
                <thead>
                <tr>
                    <th style={{ width: "80px", borderRight: "1px solid blue"}}>Class No.</th>
                    <th style={{ width: "200px", borderRight: "1px solid blue" }}>Boundaries</th>
                    <th style={{ width: "100px", borderRight: "1px solid blue" }}>Frequency</th>
                    <th style={{ width: "225px", borderRight: "1px solid blue" }}>Relative Frequency</th>
                    <th style={{ width: "225px"}}>Empirical Distribution</th>
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
            <Plot
                data={[
                    {
                        x: plotData.x,
                        y: plotData.y,
                        type: 'bar',
                        marker: { color: 'blue' },
                    },
                ]}
                layout={{
                    title: "Histogram of Uploaded Data",
                    xaxis: {
                        title: "Ranges",
                    },
                    yaxis: {
                        title: "Relative Frequencies",
                    },
                    autosize: true,
                    responsive: true
                }}
            />

        </div>
    );
}

export default App;
