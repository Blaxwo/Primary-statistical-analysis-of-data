import "./App.css";
import axios from 'axios';
import Plot from "react-plotly.js";
import {useState} from "react";

function App() {
    const [file, setFile] = useState(null);
    const [plotData, setPlotData] = useState({ x: [], y: [] });

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
        console.log('Uploading file...');
        axios.post('http://localhost:3001/upload', formData)
            .then(response => {
                const { x, y } = response.data;
                console.log('Data received:', response.data);
                setPlotData({ x, y });
            })
            .catch(err => console.error('Error uploading file:', err));
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
            <button onClick={onFileUpload}>Upload and Plot</button>
            <Plot
                data={[
                    {
                        x: plotData.x,
                        y: plotData.y,
                        type: 'bar',
                        marker: {color: 'blue'},
                    },
                ]}
                layout={{
                    title: "Histogram of Uploaded Data",
                    xaxis: {
                        title: "Ranges",
                    },
                    yaxis: {
                        title: "Frequencies",
                    },
                    autosize: true,
                    responsive: true
                }}
            />
        </div>
    );
}

export default App;
