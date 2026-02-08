import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getUserSequences } from '../utils/firebaseSequences';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/firebase';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../utils/cn';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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
                } catch (error) { console.error('Error fetching saved sequences:', error); }
            }
        };
        fetchSavedSequences();
        if (location.state?.accession) {
            fetchSequenceAndRunBlast(location.state.accession);
        }
    }, [currentUser, location.state]);

    const fetchSequenceAndRunBlast = async (accession) => {
        try {
            setLoading(true); setError('');
            const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
                params: { db: 'nucleotide', id: accession, rettype: 'fasta', retmode: 'text' }
            });
            setSequence(response.data);
            await handleSubmit(null, response.data);
        } catch (error) {
            setError('Failed to fetch sequence: ' + (error.response?.data || error.message));
        } finally { setLoading(false); }
    };

    const handleSavedSequenceSelect = (event) => {
        const selectedSequence = savedSequences.find(seq => seq.id === event.target.value);
        if (selectedSequence) setSequence(selectedSequence.sequence);
    };

    const detectSequenceType = (seq) => {
        const cleanedSeq = seq.replace(/[^A-Za-z]/g, '').toUpperCase();
        return /^[ACGTURYKMSWBDHVN]+$/i.test(cleanedSeq) ? 'blastn' : 'blastp';
    };

    const PROXY_URL = `https://us-central1-bioinfowritpro.cloudfunctions.net/proxy`;

    const proxyFetch = async (targetUrl, options = {}) => {
        const token = await auth.currentUser.getIdToken();
        const url = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(url, {
            ...options,
            headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
        });
        const text = await response.text();
        try { return JSON.parse(text); } catch { return text; }
    };

    const submitBlastJob = async (sequence, program, database) => {
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';
        const params = new URLSearchParams({ CMD: 'Put', PROGRAM: program, DATABASE: database, QUERY: sequence });
        const data = await proxyFetch(targetUrl, {
            method: 'POST', body: params.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const responseText = typeof data === 'string' ? data : JSON.stringify(data);
        const ridMatch = responseText.match(/RID\s*=\s*([\w\d-]+)/);
        if (ridMatch?.[1]) return ridMatch[1].trim();
        throw new Error('No RID received from BLAST server');
    };

    const checkBlastStatus = async (rid) => {
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';
        const params = new URLSearchParams({ CMD: 'Get', FORMAT_OBJECT: 'SearchInfo', RID: rid });
        const data = await proxyFetch(`${targetUrl}?${params.toString()}`, {
            method: 'GET', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const responseText = typeof data === 'string' ? data : JSON.stringify(data);
        if (responseText.includes('Status=WAITING')) return 'WAITING';
        if (responseText.includes('Status=READY')) return 'READY';
        if (responseText.includes('Status=FAILED')) throw new Error('BLAST job failed');
        throw new Error('Unexpected BLAST status');
    };

    const getBlastResults = async (rid) => {
        const targetUrl = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';
        const params = new URLSearchParams({ CMD: 'Get', FORMAT_TYPE: 'JSON2_S', RID: rid });
        const data = await proxyFetch(`${targetUrl}?${params.toString()}`, {
            method: 'GET', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return typeof data === 'string' ? JSON.parse(data) : data;
    };

    const handleSubmit = async (e, fastaSequence = null) => {
        if (e) e.preventDefault();
        setLoading(true); setError(''); setProgress(0);
        setStatusMessage('Submitting BLAST job...');
        try {
            const sequenceToUse = fastaSequence || sequence;
            const detectedProgram = detectSequenceType(sequenceToUse);
            const selectedDatabase = detectedProgram === 'blastn' ? 'nt' : 'swissprot';
            setProgram(detectedProgram); setDatabase(selectedDatabase);
            const rid = await submitBlastJob(sequenceToUse, detectedProgram, selectedDatabase);
            setProgress(10); setStatusMessage('Job submitted. Waiting for results...');
            let status, attempts = 0;
            const maxAttempts = 60;
            do {
                await new Promise(resolve => setTimeout(resolve, 5000));
                status = await checkBlastStatus(rid);
                attempts++;
                setProgress(prev => (prev < 90 ? prev + (90 - prev) / 10 : prev));
                if (attempts >= maxAttempts) throw new Error('BLAST job timed out');
            } while (status === 'WAITING');
            if (status === 'READY') {
                setStatusMessage('Fetching results...');
                setResults(await getBlastResults(rid));
                setProgress(100); setStatusMessage('BLAST search complete!');
            }
        } catch (err) {
            console.error(err); setError('Failed to run BLAST: ' + err.message);
        } finally { setLoading(false); }
    };

    const togglePanel = (panelId) => {
        setOpenPanels(prev => ({ ...prev, [panelId]: !prev[panelId] }));
    };

    const renderAccordion = (data) => {
        if (!data?.BlastOutput2) return null;
        return data.BlastOutput2.map((result, index) => (
            <div key={index} className="border border-border rounded-lg overflow-hidden mb-3">
                <button
                    onClick={() => togglePanel(`main-${index}`)}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
                >
                    Result {index + 1}
                    {openPanels[`main-${index}`] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {openPanels[`main-${index}`] && (
                    <div className="p-4 space-y-2">
                        {result.report.results.search.hits.map((hit, hitIndex) => (
                            <div key={hitIndex} className="border border-border rounded-md overflow-hidden">
                                <button
                                    onClick={() => togglePanel(`hit-${index}-${hitIndex}`)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <span className="truncate pr-2">Hit {hitIndex + 1}: {hit.description[0].title}</span>
                                    {openPanels[`hit-${index}-${hitIndex}`] ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                                </button>
                                {openPanels[`hit-${index}-${hitIndex}`] && (
                                    <div className="p-3 text-xs space-y-1.5 bg-background">
                                        <p><span className="font-medium">ID:</span> {hit.description[0].id}</p>
                                        <p><span className="font-medium">Accession:</span> {hit.description[0].accession}</p>
                                        <p><span className="font-medium">Length:</span> {hit.len}</p>
                                        {hit.hsps.map((hsp, hspIndex) => (
                                            <div key={hspIndex} className="border border-border rounded mt-2 overflow-hidden">
                                                <button
                                                    onClick={() => togglePanel(`hsp-${index}-${hitIndex}-${hspIndex}`)}
                                                    className="flex items-center justify-between w-full px-2 py-1.5 text-xs bg-muted/30 hover:bg-muted/50"
                                                >
                                                    HSP {hspIndex + 1}
                                                    {openPanels[`hsp-${index}-${hitIndex}-${hspIndex}`] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                </button>
                                                {openPanels[`hsp-${index}-${hitIndex}-${hspIndex}`] && (
                                                    <div className="p-2 space-y-1">
                                                        <p><span className="font-medium">Bit Score:</span> {hsp.bit_score}</p>
                                                        <p><span className="font-medium">E-value:</span> {hsp.evalue}</p>
                                                        <p><span className="font-medium">Identity:</span> {hsp.identity} / {hsp.align_len} ({((hsp.identity / hsp.align_len) * 100).toFixed(2)}%)</p>
                                                        <pre className="font-mono text-[11px] bg-muted p-2 rounded overflow-x-auto mt-2">
                                                            <code className="text-indigo-600 dark:text-indigo-400 block">Query: {hsp.qseq}</code>
                                                            <code className="text-muted-foreground block">       {hsp.midline}</code>
                                                            <code className="text-indigo-600 dark:text-indigo-400 block">Sbjct: {hsp.hseq}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div>
            <PageHeader title="BLAST Search" subtitle="Basic Local Alignment Search Tool" />

            <Card className="mb-6">
                <CardContent className="p-4 space-y-4">
                    {savedSequences.length > 0 && (
                        <select
                            onChange={handleSavedSequenceSelect}
                            defaultValue=""
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="" disabled>Select a saved sequence</option>
                            {savedSequences.map(seq => (
                                <option key={seq.id} value={seq.id}>{seq.name} ({seq.accession})</option>
                            ))}
                        </select>
                    )}
                    <Textarea
                        value={sequence}
                        onChange={(e) => setSequence(e.target.value)}
                        placeholder="Enter your sequence here or select from saved sequences..."
                        className="min-h-[200px] font-mono text-sm"
                    />
                    <Button onClick={(e) => handleSubmit(e)} disabled={loading || !sequence}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {loading ? 'Running BLAST...' : 'Run BLAST'}
                    </Button>
                </CardContent>
            </Card>

            {loading && (
                <div className="mb-6">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                        {Math.round(progress)}% - {statusMessage}
                    </p>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {results && (
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">BLAST Results</h2>
                    {renderAccordion(results)}
                </div>
            )}
        </div>
    );
};

export default Blast;
