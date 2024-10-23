import React, { useState, useMemo } from 'react';
import { searchGenBank, downloadFile, searchGene, getFastaForRegion } from './utils/genBankAPI';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '@mui/icons-material';
import './GenBank.css';

const GenBank = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [geneSearchTerm, setGeneSearchTerm] = useState('');
    const [accessionNumber, setAccessionNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const resultsPerPage = 20;
    const navigate = useNavigate();

    const handleGeneralSearch = async () => {
        try {
            setError('');
            setLoading(true);
            const results = await searchGenBank(searchTerm);
            setSearchResults(results);
            setCurrentPage(1);
        } catch (error) {
            console.error('Search error:', error);
            setError('Failed to search. ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneSearch = async () => {
        try {
            setError('');
            setLoading(true);
            const results = await searchGene(geneSearchTerm);
            setSearchResults(results);
            setCurrentPage(1);
        } catch (error) {
            console.error('Gene search error:', error);
            setError('Failed to search gene. ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewFasta = async (accession, from, to) => {
        try {
            const fastaData = await getFastaForRegion(accession, from, to);
            // Display or download the FASTA data
            console.log(fastaData); // Replace with actual display or download logic
        } catch (error) {
            console.error('FASTA retrieval error:', error);
            setError('Failed to retrieve FASTA. ' + error.message);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const paginatedResults = useMemo(() => {
        if (!searchResults) return [];
        const startIndex = (currentPage - 1) * resultsPerPage;
        return searchResults.results.slice(startIndex, startIndex + resultsPerPage);
    }, [searchResults, currentPage]);

    const handleDownload = async (id, fileType) => {
        try {
            setError('');
            setLoading(true);
            await downloadFile(id, fileType);
        } catch (error) {
            console.error('Download error:', error);
            setError(`Failed to download ${fileType} file. ` + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleHomeButtonClick = () => {
        navigate('/homepage');
    };

    const handleViewOnNCBI = (accession) => {
        window.open(`https://www.ncbi.nlm.nih.gov/nuccore/${accession}`, '_blank');
    };

    return (
        <div className="genbank-container">
            <button onClick={handleHomeButtonClick} className="genbank-home-button">
                <ChevronLeft size={5} />
            </button>
            <div className="genbank-header">
                <h1>GenBank Retrieval Tool</h1>
            </div>
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search Term or Accession Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="genbank-input"
                />
                <button onClick={handleGeneralSearch} disabled={loading} className="genbank-button">
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            <div className="accession-section">
                <input
                    type="text"
                    placeholder="Accession Number"
                    value={accessionNumber}
                    onChange={(e) => setAccessionNumber(e.target.value)}
                    className="genbank-input"
                />
                <button onClick={() => handleDownload(accessionNumber, 'genbank')} disabled={!accessionNumber || loading} className="genbank-button">
                    Download GenBank
                </button>
                <button onClick={() => handleDownload(accessionNumber, 'fasta')} disabled={!accessionNumber || loading} className="genbank-button">
                    Download FASTA
                </button>
            </div>
            <div className="gene-search-section">
                <input
                    type="text"
                    placeholder="Search for a gene"
                    value={geneSearchTerm}
                    onChange={(e) => setGeneSearchTerm(e.target.value)}
                    className="genbank-input"
                />
                <button onClick={handleGeneSearch} disabled={loading} className="genbank-button">
                    Search Gene
                </button>
            </div>
            {error && (
                <p className="error-message">{error}</p>
            )}
            {searchResults && (
                <div className="results-section">
                    <h2>Search Results (Showing {searchResults.totalResults} results)</h2>
                    <ul className="results-list">
                        {paginatedResults.map((result) => (
                            <li key={result.uid} className="result-item">
                                <div className="result-text">
                                    <h3>{result.title}</h3>
                                    <p>Accession: {result.caption}</p>
                                    {result.from && result.to && (
                                        <p>Region: {result.from} - {result.to}</p>
                                    )}
                                </div>
                                <div className="result-buttons">
                                    <button onClick={() => handleDownload(result.uid, 'genbank')} className="genbank-button">
                                        GenBank
                                    </button>
                                    <button onClick={() => handleDownload(result.uid, 'fasta')} className="genbank-button">
                                        FASTA
                                    </button>
                                    <button onClick={() => handleViewOnNCBI(result.caption)} className="genbank-button view-ncbi-button">
                                        View on NCBI
                                    </button>
                                    {result.from && result.to && (
                                        <button onClick={() => handleViewFasta(result.caption, result.from, result.to)} className="genbank-button">
                                            View FASTA
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="pagination1">
                        {Array.from({ length: Math.ceil(searchResults.totalResults / resultsPerPage) }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                className={`pagination-button1 ${currentPage === i + 1 ? 'active' : ''}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenBank;
