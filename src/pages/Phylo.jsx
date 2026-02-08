import React, { useState, useEffect, useRef, useCallback } from 'react';
import PhyloCanvas from 'phylocanvas';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { Loader2 } from 'lucide-react';

const Phylo = () => {
    const [sequences, setSequences] = useState('');
    const [alignedSequences, setAlignedSequences] = useState(null);
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const treeContainer = useRef(null);
    const phylocanvas = useRef(null);

    // Define handleResize outside of useEffect
    const handleResize = useCallback(() => {
        if (phylocanvas.current && treeContainer.current) {
            phylocanvas.current.setSize(treeContainer.current.offsetWidth, 600);
            phylocanvas.current.fitInPanel();
        }
    }, []);

    const handleSequenceInput = (e) => {
        setSequences(e.target.value);
    };

    const handleAlignment = async () => {
        setLoading(true);
        setError('');
        try {
            // Format the sequences properly
            const formattedSequences = sequences.split('>').filter(seq => seq.trim() !== '').map(seq => {
                const lines = seq.trim().split('\n');
                const header = lines[0].trim();
                const sequence = lines.slice(1).join('').replace(/\s/g, '');
                return `>${header}\n${sequence}`;
            }).join('\n');

            console.log('Formatted sequences:', formattedSequences); // For debugging

            const { data } = await httpsCallable(functions, 'align', { timeout: 300000 })({ sequences: formattedSequences });
            setAlignedSequences(data.alignedSequences);
            console.log('Aligned sequences:', data.alignedSequences);
        } catch (err) {
            setError(err.message || 'Alignment failed. Please try again.');
            console.error('Alignment error:', err);
        }
        setLoading(false);
    };

    const handleTreeConstruction = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await httpsCallable(functions, 'constructTree', { timeout: 300000 })({ sequences: alignedSequences || sequences });
            console.log('Received tree data:', data.tree);
            setTree(data.tree);
        } catch (err) {
            setError(err.message || 'Tree construction failed. Please try again.');
            console.error('Tree construction error:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (tree && treeContainer.current) {
            console.log('Rendering tree with data:', tree);
            console.log('Container dimensions:', treeContainer.current.offsetWidth, treeContainer.current.offsetHeight);

            try {
                // Clear previous content
                if (phylocanvas.current) {
                    // Remove the old canvas element
                    while (treeContainer.current.firstChild) {
                        treeContainer.current.removeChild(treeContainer.current.firstChild);
                    }
                }

                // Create a new tree instance
                phylocanvas.current = PhyloCanvas.createTree(treeContainer.current, {
                    width: treeContainer.current.offsetWidth,
                    height: 600,
                });

                // Load the tree data
                phylocanvas.current.load(tree);

                // Set tree type to rectangular (traditional phylogenetic tree look)
                phylocanvas.current.setTreeType('rectangular');

                // Customize tree appearance
                phylocanvas.current.setNodeSize(4);
                phylocanvas.current.setTextSize(14);

                // **Removed Unsupported Methods:**
                // phylocanvas.current.setProperty('branchColour', '#0000FF');
                // phylocanvas.current.branches.forEach(branch => {
                //     branch.colour = '#0000FF'; // Blue color
                // });
                // phylocanvas.current.draw();

                // Fit the tree to the container
                phylocanvas.current.fitInPanel();

                // Make the tree responsive
                window.addEventListener('resize', handleResize);

                console.log('Tree rendered successfully');
            } catch (err) {
                console.error('Error rendering tree:', err);
                setError('Error rendering tree: ' + err.message);
            }
        }

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            if (phylocanvas.current && treeContainer.current) {
                // Remove the canvas element
                while (treeContainer.current.firstChild) {
                    treeContainer.current.removeChild(treeContainer.current.firstChild);
                }
                phylocanvas.current = null;
            }
        };
    }, [tree, handleResize]);

    return (
        <div>
            <PageHeader
                title="Phylogenetic Analysis"
                subtitle="Align sequences and construct evolutionary trees"
            />

            <Card className="mb-6">
                <CardContent className="p-4 space-y-4">
                    <Textarea
                        value={sequences}
                        onChange={handleSequenceInput}
                        placeholder="Enter sequences here (FASTA format)"
                        className="min-h-[200px] font-mono text-sm"
                    />
                    <div className="flex gap-3">
                        <Button
                            onClick={handleAlignment}
                            disabled={loading || !sequences}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Align Sequences
                        </Button>
                        <Button
                            onClick={handleTreeConstruction}
                            disabled={loading || !sequences}
                            variant="secondary"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Construct Tree
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {alignedSequences && (
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <h2 className="text-sm font-medium text-foreground mb-3">Aligned Sequences</h2>
                        <pre className="font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto text-foreground">
                            {alignedSequences}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {tree && (
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-sm font-medium text-foreground mb-3">Phylogenetic Tree</h2>
                        <div
                            ref={treeContainer}
                            className="w-full border border-border rounded-lg bg-background"
                            style={{ minHeight: '600px' }}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Phylo;
