import React, { useState, useMemo } from 'react';
import { searchGenBank, downloadFile, searchGene, fetchFastaSequence, getFastaForRegion } from '../utils/genBankAPI';
import { useNavigate } from 'react-router-dom';
import { saveSequence } from '../utils/firebaseSequences';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, Download, ExternalLink, Dna, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

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
    const { currentUser } = useAuth();
    const [savedMessage, setSavedMessage] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    const handleGeneralSearch = async () => {
        try { setError(''); setLoading(true);
            const results = await searchGenBank(searchTerm);
            setSearchResults(results); setCurrentPage(1);
        } catch (error) { setError('Failed to search. ' + error.message);
        } finally { setLoading(false); }
    };

    const handleGeneSearch = async () => {
        try { setError(''); setLoading(true);
            const results = await searchGene(geneSearchTerm);
            setSearchResults(results); setCurrentPage(1);
        } catch (error) { setError('Failed to search gene. ' + error.message);
        } finally { setLoading(false); }
    };

    const handleViewFasta = async (accession, from, to) => {
        try {
            const fastaData = await getFastaForRegion(accession, from, to);
            console.log(fastaData);
        } catch (error) { setError('Failed to retrieve FASTA. ' + error.message); }
    };

    const paginatedResults = useMemo(() => {
        if (!searchResults) return [];
        const startIndex = (currentPage - 1) * resultsPerPage;
        return searchResults.results.slice(startIndex, startIndex + resultsPerPage);
    }, [searchResults, currentPage]);

    const handleDownload = async (id, fileType) => {
        try { setError(''); setLoading(true); await downloadFile(id, fileType);
        } catch (error) { setError(`Failed to download ${fileType} file. ` + error.message);
        } finally { setLoading(false); }
    };

    const handleViewOnNCBI = (accession) => {
        window.open(`https://www.ncbi.nlm.nih.gov/nuccore/${accession}`, '_blank');
    };

    const handleSaveSequence = async (accession, name) => {
        try { setLoading(true);
            const fastaData = await fetchFastaSequence(accession);
            await saveSequence(currentUser.uid, name, accession, fastaData);
            setSavedMessage(`Sequence ${accession} saved!`);
            setTimeout(() => setSavedMessage(''), 3000);
        } catch (error) { setError('Failed to save sequence. ' + error.message);
        } finally { setLoading(false); }
    };

    const handleRunBlast = (accession) => {
        navigate('/blast', { state: { accession } });
    };

    const totalPages = searchResults ? Math.ceil(searchResults.totalResults / resultsPerPage) : 0;

    return (
        <div>
            <PageHeader title="GenBank Retrieval" subtitle="Search and download sequences from NCBI GenBank" />

            {/* Tab selector */}
            <div className="flex gap-1 mb-6 border-b border-border">
                {[
                    { id: 'general', label: 'General Search' },
                    { id: 'accession', label: 'Accession Download' },
                    { id: 'gene', label: 'Gene Search' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                            activeTab === tab.id
                                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search inputs based on active tab */}
            {activeTab === 'general' && (
                <div className="flex gap-3 mb-6">
                    <Input placeholder="Search term or accession number" value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGeneralSearch()} className="flex-1" />
                    <Button onClick={handleGeneralSearch} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Search
                    </Button>
                </div>
            )}

            {activeTab === 'accession' && (
                <div className="flex gap-3 mb-6">
                    <Input placeholder="Accession number" value={accessionNumber}
                        onChange={(e) => setAccessionNumber(e.target.value)} className="flex-1" />
                    <Button variant="outline" onClick={() => handleDownload(accessionNumber, 'genbank')} disabled={!accessionNumber || loading}>
                        <Download className="h-4 w-4 mr-1.5" /> GenBank
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload(accessionNumber, 'fasta')} disabled={!accessionNumber || loading}>
                        <Download className="h-4 w-4 mr-1.5" /> FASTA
                    </Button>
                </div>
            )}

            {activeTab === 'gene' && (
                <div className="flex gap-3 mb-6">
                    <Input placeholder="Search for a gene" value={geneSearchTerm}
                        onChange={(e) => setGeneSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGeneSearch()} className="flex-1" />
                    <Button onClick={handleGeneSearch} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Search Gene
                    </Button>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}
            {savedMessage && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 mb-4">
                    <p className="text-sm text-green-700 dark:text-green-300">{savedMessage}</p>
                </div>
            )}

            {searchResults && (
                <div>
                    <p className="text-sm text-muted-foreground mb-3">
                        Showing {searchResults.totalResults} results
                    </p>
                    <div className="space-y-3">
                        {paginatedResults.map((result) => (
                            <Card key={result.uid}>
                                <CardContent className="p-4">
                                    <h3 className="font-medium text-sm text-foreground">{result.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Accession: {result.caption}</p>
                                    {result.from && result.to && (
                                        <p className="text-xs text-muted-foreground">Region: {result.from} - {result.to}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(result.uid, 'genbank')}>GenBank</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(result.uid, 'fasta')}>FASTA</Button>
                                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleViewOnNCBI(result.uid)}>
                                            <ExternalLink className="h-3.5 w-3.5" /> NCBI
                                        </Button>
                                        {result.from && result.to && (
                                            <Button variant="outline" size="sm" onClick={() => handleViewFasta(result.caption, result.from, result.to)}>View FASTA</Button>
                                        )}
                                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleSaveSequence(result.caption, result.title)}>
                                            <Save className="h-3.5 w-3.5" /> Save
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleRunBlast(result.caption)}>
                                            <Dna className="h-3.5 w-3.5" /> BLAST
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm"
                                        onClick={() => setCurrentPage(page)} className="w-8">
                                        {page}
                                    </Button>
                                );
                            })}
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GenBank;
