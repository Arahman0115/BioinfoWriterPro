import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Download, Search, RotateCw } from 'lucide-react';
import axios from 'axios';
import '../styles/Protein.css';
import ProteinViewer from '../components/ProteinViewer';
import { apiClient, getErrorMessage } from '../utils/apiClient';

const Protein = () => {
    const navigate = useNavigate();
    const [sequence, setSequence] = useState('');
    const [predictionResult, setPredictionResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');


    const handleSequenceInput = (e) => {
        setSequence(e.target.value);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSequence(e.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handlePrediction = async () => {
        setLoading(true);
        setError('');
        setStatus('Submitting job...');
        try {
            const data = await apiClient.longRunningRequest('/api/predict-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sequence })
            });
            setPredictionResult(data);
            setStatus('');
        } catch (err) {
            setError(getErrorMessage(err));
            setStatus('');
        }
        setLoading(false);
    };

    const handleDownload = () => {
        if (predictionResult && predictionResult.pdbStructure) {
            const blob = new Blob([predictionResult.pdbStructure], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'predicted_structure.pdb';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="protein-container">
            <button className="back-button" onClick={() => navigate('/tools')}>
                <ChevronLeft size={24} />
                Back
            </button>
            <h1>Protein Structure Prediction</h1>
            <div className="input-section">
                <textarea
                    value={sequence}
                    onChange={handleSequenceInput}
                    placeholder="Enter protein sequence here"
                    rows="5"
                />
                <div className="file-upload">
                    <label htmlFor="file-input">
                        <Upload size={24} />
                        Upload Sequence File
                    </label>
                    <input
                        id="file-input"
                        type="file"
                        accept=".txt,.fasta"
                        onChange={handleFileUpload}
                    />
                </div>
            </div>
            <button className="predict-button" onClick={handlePrediction} disabled={!sequence || loading}>
                {loading ? <RotateCw size={24} className="spinning" /> : <Search size={24} />}
                Predict Structure
            </button>
            {status && <p className="status">{status}</p>}
            {error && <p className="error">{error}</p>}
            {predictionResult && (
                <div className="result-section">
                    <h2>Prediction Result</h2>
                    <div className="result-visualization">
                        <ProteinViewer pdbData={predictionResult.pdbStructure} />
                    </div>
                    <div className="result-details">
                        <h3>Note</h3>
                        <p>This prediction is based on homology modeling using SWISS-MODEL.</p>
                    </div>
                    <button className="download-button" onClick={handleDownload}>
                        <Download size={24} />
                        Download PDB
                    </button>
                </div>
            )}
        </div>
    );
};

export default Protein;
