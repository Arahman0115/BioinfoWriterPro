import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Mafft.css';
import { ChevronLeft } from 'lucide-react';

const Mafft = () => {
    const [sequences, setSequences] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/mafft', { sequences });
            setResult(response.data.alignedSequences);
        } catch (err) {
            setError('Failed to run sequence alignment: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mafft-container">
            <button onClick={() => navigate('/tools')} className="mafft-home-button">
                <ChevronLeft size={20} />
            </button>
            <h1>Multiple Sequence Alignment</h1>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={sequences}
                    onChange={(e) => setSequences(e.target.value)}
                    placeholder="Enter FASTA sequences here..."
                    rows="10"
                    cols="50"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Running...' : 'Run Alignment'}
                </button>
            </form>
            {error && <p className="error">{error}</p>}
            {result && (
                <div className="result">
                    <h2>Alignment Result:</h2>
                    <pre>{result}</pre>
                </div>
            )}
        </div>
    );
};

export default Mafft;
