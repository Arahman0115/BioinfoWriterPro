import React, { useState } from 'react';
import { Upload, Download, Search } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import ProteinViewer from '../components/ProteinViewer';
import { apiClient, getErrorMessage } from '../utils/apiClient';

const Protein = () => {
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
        <div>
            <PageHeader
                title="Protein Structure Prediction"
                subtitle="Predict 3D protein structures from amino acid sequences"
            />

            <Card className="mb-6">
                <CardContent className="p-4 space-y-4">
                    <Textarea
                        value={sequence}
                        onChange={handleSequenceInput}
                        placeholder="Enter protein sequence here"
                        className="min-h-[150px] font-mono text-sm"
                    />

                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/50">
                        <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Upload Sequence File</span>
                            <span className="text-xs text-muted-foreground">.txt or .fasta</span>
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            accept=".txt,.fasta"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>

                    <Button onClick={handlePrediction} disabled={!sequence || loading} className="w-full">
                        {loading ? <Search className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        {loading ? 'Predicting Structure...' : 'Predict Structure'}
                    </Button>
                </CardContent>
            </Card>

            {status && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">{status}</p>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {predictionResult && (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <h2 className="text-sm font-medium text-foreground mb-3">Prediction Result</h2>
                            <div className="border border-border rounded-lg bg-background p-4" style={{ minHeight: '400px' }}>
                                <ProteinViewer pdbData={predictionResult.pdbStructure} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-medium text-sm text-foreground mb-2">About this prediction</h3>
                            <p className="text-sm text-muted-foreground">
                                This prediction is based on homology modeling using SWISS-MODEL. The 3D structure is predicted from your amino acid sequence by comparing it with known protein structures.
                            </p>
                        </CardContent>
                    </Card>

                    <Button onClick={handleDownload} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDB File
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Protein;
