import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import styled from 'styled-components';
import '../styles/Blast.css';
import { getUserSequences } from '../utils/firebaseSequences';
import { useAuth } from '../context/AuthContext';

// Styled components for the accordion
const AccordionButton = styled.button`
  background-color: #1e1e1e;
  color: #4CAF50;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  text-align: left;
  border: none;
  outline: none;
  transition: 0.4s;
  border-bottom: 1px solid #4CAF50;

  &:hover, &.active {
    background-color: #2e2e2e;
  }
`;

const Panel = styled.div`
  padding: 0 18px;
  background-color: #121212;
  color: #e0e0e0;
  display: ${props => props.isOpen ? 'block' : 'none'};
  overflow: hidden;
`;

const ResultsContainer = styled.div`
  background-color: #121212;
  padding: 20px;
  border-radius: 5px;
  margin-top: 20px;
`;

const Pre = styled.pre`
  background-color: #1e1e1e;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  font-family: monospace;
  white-space: pre;
`;

const Code = styled.code`
  color: #4CAF50;
  display: block;
`;

const ProgressContainer = styled.div`
  margin: 20px 0;
  width: 100%;
`;

const ProgressBar = styled.div`
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  height: 20px;
`;

const ProgressFill = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: #4CAF50;
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
`;

const ProgressText = styled.div`
  color: #4CAF50;
  font-weight: bold;
  margin-top: 10px;
  text-align: center;
`;

const Blast = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sequence, setSequence] = useState('');
    const [database, setDatabase] = useState('nt');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [savedSequences, setSavedSequences] = useState([]);
    const { currentUser } = useAuth();
    const [openPanels, setOpenPanels] = useState({});
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        const fetchSavedSequences = async () => {
            if (currentUser) {
                try {
                    const sequences = await getUserSequences(currentUser.uid);
                    setSavedSequences(sequences);
                } catch (error) {
                    console.error('Error fetching saved sequences:', error);
                }
            }
        };

        fetchSavedSequences();

        // Check if there's an accession number from GenBank
        if (location.state && location.state.accession) {
            fetchSequenceAndRunBlast(location.state.accession);
        }
    }, [currentUser, location.state]);

    const fetchSequenceAndRunBlast = async (accession) => {
        try {
            setLoading(true);
            setError('');
            // Fetch the sequence using the accession number
            const response = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`, {
                params: {
                    db: 'nucleotide',
                    id: accession,
                    rettype: 'fasta',
                    retmode: 'text'
                }
            });
            const fastaSequence = response.data;
            setSequence(fastaSequence);
            // Automatically run BLAST with the fetched sequence
            await handleSubmit(null, fastaSequence);
        } catch (error) {
            console.error('Error fetching sequence:', error);
            setError('Failed to fetch sequence: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSavedSequenceSelect = (event) => {
        const selectedSequence = savedSequences.find(seq => seq.id === event.target.value);
        if (selectedSequence) {
            setSequence(selectedSequence.sequence);
        }
    };

    const submitBlastJob = async (sequence, database) => {
        console.log('Submitting BLAST job...');
        const proxyUrl = `${import.meta.env.VITE_API_URL}/api/proxy`;
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

        const params = new URLSearchParams({
            CMD: 'Put',
            PROGRAM: 'blastn',
            DATABASE: database,
            QUERY: sequence
        });

        try {
            const response = await axios.post(proxyUrl, params, {
                params: { url: targetUrl },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log('BLAST job submission response:', response);

            if (typeof response.data === 'string') {
                const ridMatch = response.data.match(/RID\s*=\s*([\w\d-]+)/);
                if (ridMatch && ridMatch[1]) {
                    const rid = ridMatch[1].trim();
                    console.log('Extracted RID:', rid);
                    return rid;
                }
            }

            console.error('No RID found in response. Full response:', response.data);
            throw new Error('No RID received from BLAST server. Check server logs for full response.');
        } catch (error) {
            console.error('Error submitting BLAST job:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            throw error;
        }
    };

    const checkBlastStatus = async (rid) => {
        console.log('Checking BLAST status...');
        const proxyUrl = `${import.meta.env.VITE_API_URL}/api/proxy`;
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

        const params = new URLSearchParams({
            CMD: 'Get',
            FORMAT_OBJECT: 'SearchInfo',
            RID: rid
        });

        try {
            const response = await axios.get(proxyUrl, {
                params: {
                    url: targetUrl,
                    ...Object.fromEntries(params)
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log('BLAST status response:', response);

            if (typeof response.data === 'string') {
                if (response.data.includes('Status=WAITING')) {
                    return 'WAITING';
                } else if (response.data.includes('Status=READY')) {
                    return 'READY';
                } else if (response.data.includes('Status=FAILED')) {
                    throw new Error('BLAST job failed');
                } else {
                    console.error('Unexpected status in response:', response.data);
                    throw new Error('Unexpected BLAST status');
                }
            } else {
                console.error('Unexpected response type:', typeof response.data);
                console.log('Raw response data:', response.data);
                throw new Error('Unexpected response format from BLAST server');
            }
        } catch (error) {
            console.error('Error checking BLAST status:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            throw new Error(`Failed to check BLAST status: ${error.message}`);
        }
    };

    const getBlastResults = async (rid) => {
        console.log('Fetching BLAST results...');
        const proxyUrl = `${import.meta.env.VITE_API_URL}/api/proxy`;
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

        const params = new URLSearchParams({
            CMD: 'Get',
            FORMAT_TYPE: 'JSON2_S',
            RID: rid
        });

        try {
            const response = await axios.get(proxyUrl, {
                params: {
                    url: targetUrl,
                    ...Object.fromEntries(params)
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log('BLAST results response type:', typeof response.data);
            console.log('BLAST results response preview:',
                typeof response.data === 'string'
                    ? response.data.substring(0, 500)
                    : JSON.stringify(response.data).substring(0, 500)
            );

            if (typeof response.data === 'string') {
                try {
                    return JSON.parse(response.data);
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    console.log('Raw response data:', response.data);
                    throw new Error('Failed to parse BLAST results');
                }
            } else if (typeof response.data === 'object') {
                return response.data;
            } else {
                console.error('Unexpected response type:', typeof response.data);
                console.log('Raw response data:', response.data);
                throw new Error('Unexpected response format from BLAST server');
            }
        } catch (error) {
            console.error('Error fetching BLAST results:', error);
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
            }
            throw new Error(`Failed to fetch BLAST results: ${error.message}`);
        }
    };

    const handleSubmit = async (e, fastaSequence = null) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setProgress(0);
        setStatusMessage('Submitting BLAST job...');

        try {
            const sequenceToUse = fastaSequence || sequence;
            const rid = await submitBlastJob(sequenceToUse, database);
            console.log('Received RID:', rid);

            setProgress(10);
            setStatusMessage('Job submitted. Waiting for results...');

            let status;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes maximum wait time

            const incrementProgress = () => {
                setProgress(prevProgress => {
                    if (prevProgress < 90) {
                        return prevProgress + (90 - prevProgress) / 10;
                    }
                    return prevProgress;
                });
            };

            do {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                status = await checkBlastStatus(rid);
                console.log('Current status:', status);
                attempts++;
                incrementProgress();

                if (attempts >= maxAttempts) {
                    throw new Error('BLAST job timed out');
                }
            } while (status === 'WAITING');

            if (status === 'READY') {
                setStatusMessage('Fetching results...');
                const results = await getBlastResults(rid);
                setResults(results);
                setProgress(100);
                setStatusMessage('BLAST search complete!');
            } else {
                throw new Error(`Unexpected BLAST status: ${status}`);
            }
        } catch (error) {
            console.error('BLAST error:', error);
            setError('Failed to run BLAST: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePanel = (panelId) => {
        setOpenPanels(prevState => ({
            ...prevState,
            [panelId]: !prevState[panelId]
        }));
    };

    const renderAccordion = (data) => {
        if (!data || !data.BlastOutput2) return null;

        return data.BlastOutput2.map((result, index) => (
            <div key={index}>
                <AccordionButton
                    onClick={() => togglePanel(`main-${index}`)}
                    className={openPanels[`main-${index}`] ? 'active' : ''}
                >
                    Result {index + 1}
                </AccordionButton>
                <Panel isOpen={openPanels[`main-${index}`]}>
                    {result.report.results.search.hits.map((hit, hitIndex) => (
                        <div key={hitIndex}>
                            <AccordionButton
                                onClick={() => togglePanel(`hit-${index}-${hitIndex}`)}
                                className={openPanels[`hit-${index}-${hitIndex}`] ? 'active' : ''}
                            >
                                Hit {hitIndex + 1}: {hit.description[0].title}
                            </AccordionButton>
                            <Panel isOpen={openPanels[`hit-${index}-${hitIndex}`]}>
                                <p>
                                    <strong>ID:</strong> {hit.description[0].id}<br />
                                    <strong>Accession:</strong> {hit.description[0].accession}<br />
                                    <strong>Length:</strong> {hit.len}
                                </p>
                                {hit.hsps.map((hsp, hspIndex) => (
                                    <div key={hspIndex}>
                                        <AccordionButton
                                            onClick={() => togglePanel(`hsp-${index}-${hitIndex}-${hspIndex}`)}
                                            className={openPanels[`hsp-${index}-${hitIndex}-${hspIndex}`] ? 'active' : ''}
                                        >
                                            HSP {hspIndex + 1}
                                        </AccordionButton>
                                        <Panel isOpen={openPanels[`hsp-${index}-${hitIndex}-${hspIndex}`]}>
                                            <p>
                                                <strong>Bit Score:</strong> {hsp.bit_score}<br />
                                                <strong>E-value:</strong> {hsp.evalue}<br />
                                                <strong>Identity:</strong> {hsp.identity} / {hsp.align_len} ({((hsp.identity / hsp.align_len) * 100).toFixed(2)}%)<br />
                                                <strong>Query Range:</strong> {hsp.query_from} - {hsp.query_to}<br />
                                                <strong>Hit Range:</strong> {hsp.hit_from} - {hsp.hit_to}
                                            </p>
                                            <Pre>
                                                <Code>Query: {hsp.qseq}</Code>
                                                <Code>       {hsp.midline}</Code>
                                                <Code>Sbjct: {hsp.hseq}</Code>
                                            </Pre>
                                        </Panel>
                                    </div>
                                ))}
                            </Panel>
                        </div>
                    ))}
                </Panel>
            </div>
        ));
    };

    return (
        <div className="blast-container">
            <button onClick={() => navigate('/tools')} className="blast-home-button">
                <ChevronLeft size={20} />
            </button>
            <h1>BLAST Search</h1>
            <form onSubmit={handleSubmit}>
                <select onChange={handleSavedSequenceSelect} defaultValue="">
                    <option value="" disabled>Select a saved sequence</option>
                    {savedSequences.map(seq => (
                        <option key={seq.id} value={seq.id}>{seq.name} ({seq.accession})</option>
                    ))}
                </select>
                <textarea
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    placeholder="Enter your sequence here or select from saved sequences..."
                    rows="10"
                    required
                />
                <select value={database} onChange={(e) => setDatabase(e.target.value)}>
                    <option value="nt">Nucleotide collection (nt)</option>
                    <option value="nr">Non-redundant protein sequences (nr)</option>
                    {/* Add more database options as needed */}
                </select>
                <button type="submit" disabled={loading}>
                    {loading ? 'Running BLAST...' : 'Run BLAST'}
                </button>
            </form>
            {loading && (
                <ProgressContainer>
                    <ProgressBar>
                        <ProgressFill progress={progress} />
                    </ProgressBar>
                    <ProgressText>{Math.round(progress)}% Complete</ProgressText>
                </ProgressContainer>
            )}
            {error && <p className="error">{error}</p>}
            {results && (
                <ResultsContainer>
                    <h2>BLAST Results</h2>
                    {renderAccordion(results)}
                </ResultsContainer>
            )}
        </div>
    );
}

export default Blast;
