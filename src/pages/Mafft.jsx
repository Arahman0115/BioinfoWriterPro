import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { Loader2 } from 'lucide-react';

const Mafft = () => {
    const [sequences, setSequences] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await httpsCallable(functions, 'mafft', { timeout: 300000 })({ sequences });
            setResult(data.alignedSequences);
        } catch (err) {
            setError(err.message || 'Failed to run MAFFT. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title="Multiple Sequence Alignment" subtitle="Align sequences using MAFFT" />

            <Card className="mb-6">
                <CardContent className="p-4 space-y-4">
                    <Textarea
                        value={sequences}
                        onChange={(e) => setSequences(e.target.value)}
                        placeholder="Enter FASTA sequences here..."
                        className="min-h-[200px] font-mono text-sm"
                    />
                    <Button onClick={handleSubmit} disabled={loading || !sequences}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {loading ? 'Running...' : 'Run Alignment'}
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {result && (
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-sm font-medium text-foreground mb-3">Alignment Result</h2>
                        <pre className="font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto text-foreground">
                            {result}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Mafft;
