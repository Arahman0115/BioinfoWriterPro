import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react';
import styled from 'styled-components';
import '../styles/Blast.css';
import { getUserSequences } from '../utils/firebaseSequences';
import { useAuth } from '../context/AuthContext';
import { apiClient, getErrorMessage } from '../utils/apiClient';

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
    const [program, setProgram] = useState('blastn');
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

        if (location.state && location.state.accession) {
            fetchSequenceAndRunBlast(location.state.accession);
        }
    }, [currentUser, location.state]);

    const fetchSequenceAndRunBlast = async (accession) => {
        try {
            setLoading(true);
            setError('');
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

    const detectSequenceType = (seq) => {
        const cleanedSeq = seq.replace(/[^A-Za-z]/g, '').toUpperCase();
        const nucleotideOnly = /^[ACGTURYKMSWBDHVN]+$/i.test(cleanedSeq);
        return nucleotideOnly ? 'blastn' : 'blastp';
    };

    const submitBlastJob = async (sequence, program, database) => {
        const proxyUrl = '/api/proxy';
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

        const params = new URLSearchParams({
            CMD: 'Put',
            PROGRAM: program,
            DATABASE: database,
            QUERY: sequence
        });

        const data = await apiClient.longRunningRequest(proxyUrl, {
            method: 'POST',
            body: params.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            // Pass URL as query param
            url: targetUrl
        });

        const responseText = typeof data === 'string' ? data : JSON.stringify(data);
        const ridMatch = responseText.match(/RID\s*=\s*([\w\d-]+)/);
        if (ridMatch && ridMatch[1]) {
            return ridMatch[1].trim();
        }
        throw new Error('No RID received from BLAST server');
    };

    const checkBlastStatus = async (rid) => {
        const proxyUrl = '/api/proxy';
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

        const params = new URLSearchParams({
            CMD: 'Get',
            FORMAT_OBJECT: 'SearchInfo',
            RID: rid
        });

        const data = await apiClient.longRunningRequest(proxyUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            url: `${targetUrl}?${params.toString()}`
        });

        const responseText = typeof data === 'string' ? data : JSON.stringify(data);
        if (responseText.includes('Status=WAITING')) return 'WAITING';
        if (responseText.includes('Status=READY')) return 'READY';
        if (responseText.includes('Status=FAILED')) throw new Error('BLAST job failed');
        throw new Error('Unexpected BLAST status');
    };

    const getBlastResults = async (rid) => {
        const proxyUrl = '/api/proxy';
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

        const params = new URLSearchParams({
            CMD: 'Get',
            FORMAT_TYPE: 'JSON2_S',
            RID: rid
        });

        const data = await apiClient.longRunningRequest(proxyUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            url: `${targetUrl}?${params.toString()}`
        });

        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        return data;
    };

    const handleSubmit = async (e, fastaSequence = null) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setProgress(0);
        setStatusMessage('Submitting BLAST job...');

        try {
            const sequenceToUse = fastaSequence || sequence;
            const detectedProgram = detectSequenceType(sequenceToUse);
            const selectedDatabase = detectedProgram === 'blastn' ? 'nt' : 'swissprot';
            setProgram(detectedProgram);
            setDatabase(selectedDatabase);

            const rid = await submitBlastJob(sequenceToUse, detectedProgram, selectedDatabase);
            setProgress(10);
            setStatusMessage('Job submitted. Waiting for results...');

            let status, attempts = 0;
            const maxAttempts = 60;

            const incrementProgress = () => {
                setProgress(prev => (prev < 90 ? prev + (90 - prev) / 10 : prev));
            };

            do {
                await new Promise(resolve => setTimeout(resolve, 5000));
                status = await checkBlastStatus(rid);
                attempts++;
                incrementProgress();
                if (attempts >= maxAttempts) throw new Error('BLAST job timed out');
            } while (status === 'WAITING');

            if (status === 'READY') {
                setStatusMessage('Fetching results...');
                const blastResults = await getBlastResults(rid);
                setResults(blastResults);
                setProgress(100);
                setStatusMessage('BLAST search complete!');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to run BLAST: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePanel = (panelId) => {
        setOpenPanels(prev => ({ ...prev, [panelId]: !prev[panelId] }));
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
                                <p><strong>ID:</strong> {hit.description[0].id}</p>
                                <p><strong>Accession:</strong> {hit.description[0].accession}</p>
                                <p><strong>Length:</strong> {hit.len}</p>
                                {hit.hsps.map((hsp, hspIndex) => (
                                    <div key={hspIndex}>
                                        <AccordionButton
                                            onClick={() => togglePanel(`hsp-${index}-${hitIndex}-${hspIndex}`)}
                                            className={openPanels[`hsp-${index}-${hitIndex}-${hspIndex}`] ? 'active' : ''}
                                        >
                                            HSP {hspIndex + 1}
                                        </AccordionButton>
                                        <Panel isOpen={openPanels[`hsp-${index}-${hitIndex}-${hspIndex}`]}>
                                            <p><strong>Bit Score:</strong> {hsp.bit_score}</p>
                                            <p><strong>E-value:</strong> {hsp.evalue}</p>
                                            <p><strong>Identity:</strong> {hsp.identity} / {hsp.align_len} ({((hsp.identity / hsp.align_len) * 100).toFixed(2)}%)</p>
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
