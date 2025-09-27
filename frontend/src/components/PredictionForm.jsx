import React, { useState } from "react";

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

function PredictionForm() {
  const [features, setFeatures] = useState({
    mean: "", std: "", min: "", max: "", median: "",
    skewness: "", kurtosis: "", power_vlf: "", power_lf: "",
    power_hf: "", app_entropy: "", sample_entropy: ""
  });
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

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
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: featureNumbers }),
      });
      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      setPrediction({ error: "Prediction failed" });
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
          newFeatures[key] = parsed.features[key]?.toString() || "";
        }
        setFeatures(newFeatures);
        setJsonError(null);
      } else {
        setJsonError('JSON must contain a "features" object.');
      }
    } catch (_) {
      setJsonError("Invalid JSON format.");
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Prediction Form</h2>

          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={autofill}
              className="btn btn-primary"
            >
              Auto-Fill Sample Features
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="jsonInput" className="form-label fw-semibold mb-2">
              Paste Feature JSON:
            </label>
            <textarea
              id="jsonInput"
              rows={6}
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder='{"features": {"mean": ..., ...}}'
              className={`form-control font-monospace ${jsonError ? "is-invalid" : ""}`}
            />
            {jsonError && (
              <div className="invalid-feedback d-block">{jsonError}</div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {Object.keys(features).map((key) => (
                <div key={key} className="col-md-6">
                  <label className="form-label fw-semibold mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <input
                    type="number"
                    step="any"
                    name={key}
                    value={features[key]}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button
                type="submit"
                disabled={loading}
                className={`btn btn-success px-5 ${loading ? "disabled" : ""}`}
              >
                {loading ? "Predicting..." : "Predict"}
              </button>
            </div>
          </form>

          {prediction && (
            <div className="mt-5 alert alert-secondary">
              {prediction.error ? (
                <div className="text-danger">{prediction.error}</div>
              ) : (
                <>
                  <div><span className="fw-semibold">Prediction:</span> {prediction.prediction}</div>
                  <div><span className="fw-semibold">Confidence:</span> {(prediction.confidence * 100).toFixed(2)}%</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictionForm;
