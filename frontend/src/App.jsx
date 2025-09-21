import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [features, setFeatures] = useState({
    mean: '', std: '', min: '', max: '', median: '',
    skewness: '', kurtosis: '', power_vlf: '', power_lf: '',
    power_hf: '', app_entropy: '', sample_entropy: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState(null);

  const sampleFeatures = {
    mean: -0.0254,
    std: 0.4431,
    min: -0.515,
    max: 3.41,
    median: -0.115,
    skewness: 5.44,
    kurtosis: 31.48,
    power_vlf: 0.0,
    power_lf: 0.0,
    power_hf: 0.00166,
    app_entropy: 0.2448,
    sample_entropy: 0.1327,
  };

  useEffect(() => {
    fetch('http://localhost:8000/alerts?limit=10')
      .then(response => response.json())
      .then(data => setAlerts(data))
      .catch(e => console.error('Failed to load alerts', e));
  }, []);

  const handleChange = (e) => {
    setFeatures({ ...features, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const featureNumbers = {};
    for (const key in features) {
      featureNumbers[key] = parseFloat(features[key]);
    }

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: featureNumbers }),
      });
      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      setPrediction({ error: 'Prediction failed' });
    }
    setLoading(false);
  };

  const autofill = () => {
    setFeatures(Object.fromEntries(
      Object.entries(sampleFeatures).map(([k, v]) => [k, v.toString()])
    ));
    setJsonInput(JSON.stringify({ features: sampleFeatures }, null, 2));
    setJsonError(null);
  };

  const handleJsonInputChange = (e) => {
    setJsonInput(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed.features) {
        const newFeatures = {};
        for (const key of Object.keys(features)) {
          newFeatures[key] = parsed.features[key]?.toString() || '';
        }
        setFeatures(newFeatures);
        setJsonError(null);
      } else {
        setJsonError('JSON must contain a "features" object.');
      }
    } catch (_) {
      setJsonError('Invalid JSON format.');
    }
  };

  // Prepare data for waterfall bar chart
  const chartData = alerts.map(alert => ({
    startEpoch: alert.start_epoch,
    duration: alert.duration_epochs,
  }));

  return (
    <div style={{ margin: '20px' }}>
      <h1>Apnea Alerts Dashboard</h1>

      <h2>Recent Apnea Events</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="startEpoch" label={{ value: 'Start Epoch', position: 'insideBottomRight', offset: 0 }} />
          <YAxis label={{ value: 'Duration (epochs)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="duration" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Make a Prediction</h2>
      <button onClick={autofill} style={{ marginBottom: 10 }}>
        Auto-Fill Sample Features
      </button>

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="jsonInput">Paste Feature JSON to Fill Form:</label><br />
        <textarea
          id="jsonInput"
          rows={10}
          cols={50}
          value={jsonInput}
          onChange={handleJsonInputChange}
          placeholder='{"features": {"mean": ..., ...}}'
          style={{ fontFamily: 'monospace' }}
        />
        {jsonError && <p style={{ color: 'red' }}>{jsonError}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        {Object.keys(features).map((key) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <label>{key}:</label>
            <input
              type="number"
              step="any"
              name={key}
              value={features[key]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <button type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </form>

      {prediction && (
        <div style={{ marginTop: 20 }}>
          {prediction.error ? (
            <p style={{ color: 'red' }}>{prediction.error}</p>
          ) : (
            <>
              <p><b>Prediction:</b> {prediction.prediction}</p>
              <p><b>Confidence:</b> {(prediction.confidence * 100).toFixed(2)}%</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
