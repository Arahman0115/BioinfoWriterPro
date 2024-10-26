// src/components/ResultsList.jsx
import React from 'react';
import '../styles/ResultsList.css';

const ResultsList = ({ results, onSelectSequence }) => {
    return (
        <div className="results-list">
            {results.map((result, index) => (
                <div
                    key={result.id || result.accession || index}
                    className="result-item"
                    onClick={() => onSelectSequence(result.id || result.accession)}
                >
                    <h3>{result.title || result.definition || 'No Title'}</h3>
                    <p>Accession: {result.accession || 'N/A'}</p>
                    <p>Organism: {result.organism || 'N/A'}</p>
                    <p>Length: {result.length ? `${result.length} bp` : 'N/A'}</p>
                </div>
            ))}
        </div>
    );
};

export default ResultsList;
