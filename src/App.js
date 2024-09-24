import "./App.css";
import axios from 'axios';
import Plot from "react-plotly.js";
import {useState} from "react";

function App() {
    const [file, setFile] = useState(null);
    const [image, setImage] = useState('');

    const onFileChange = event => {
        setFile(event.target.files[0]);
    };

    const onFileUpload = () => {
        const formData = new FormData();
        formData.append('file', file);

        axios.post('http://localhost:3000/upload', formData, { responseType: 'blob' })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                setImage(url);
            })
            .catch(err => console.error(err));
    };
  return (
      <div
          className="App"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
      >
        <Plot
            data={[
              {
                x: [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18],
                y: [32, 37, 40.5, 43, 49, 54, 59, 63.5, 69.5, 73, 74],
                mode: "markers",
                type: "scatter",
              },
            ]}
            layout={{
              title: "Growth Rate in Boys",
              xaxis: {
                title: "Age (years)",
              },
              yaxis: {
                title: "Height (inches)",
              },
            }}
        />
      </div>
  );
}

export default App;