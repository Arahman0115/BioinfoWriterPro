import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import SwaggerClient from 'swagger-client';
import axios from 'axios';
import '../styles/SciteAI.css';

const SciteAI = () => {
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const initClient = async () => {
            try {
                const client = await SwaggerClient({
                    url: 'https://api.scite.ai/openapi.json',
                    requestInterceptor: (req) => {
                        req.headers['Authorization'] = `Bearer ${import.meta.env.VITE_SCITE_API_KEY}`;
                        return req;
                    }
                });
                setClient(client);
            } catch (error) {
                console.error('Error initializing Swagger client:', error);
                setError('Failed to initialize API client. Please try again later.');
            }
        };

        initClient();
    }, []);

    const handleSearch = async () => {
        if (!client) {
            setError('API client is not initialized. Please try again later.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await client.apis.default.get_search({
                term: query,
                mode: 'all',
                limit: 10
            });

            setResults(response.body.results);
        } catch (error) {
            console.error('Error searching articles:', error);
            setError('An error occurred while searching. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="scite-ai-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                <ChevronLeft size={24} />
                Back
            </button>
            <h1>Scite AI Article Search</h1>
            <div className="search-section">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter search terms"
                />
                <button onClick={handleSearch} disabled={loading}>
                    {loading ? 'Searching...' : <Search size={24} />}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="results-section">
                {results.map((result) => (
                    <div key={result.id} className="article-item">
                        <h3>{result.title}</h3>
                        <p>Authors: {result.authors.map(author => author.name).join(', ')}</p>
                        <p>Year: {result.year}</p>
                        <p>Journal: {result.journal}</p>
                        <p>DOI: {result.doi}</p>
                        <p>Citations:
                            Supporting: {result.tally.supporting},
                            Mentioning: {result.tally.mentioning},
                            Contrasting: {result.tally.contradicting}
                        </p>
                        <a href={`https://scite.ai/reports/${result.doi}`} target="_blank" rel="noopener noreferrer">
                            View on Scite.ai
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SciteAI;