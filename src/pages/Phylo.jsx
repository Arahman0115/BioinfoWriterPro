import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import PhyloCanvas from 'phylocanvas';
import '../styles/Phylo.css';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Phylo = () => {
    const [sequences, setSequences] = useState('');
    const [alignedSequences, setAlignedSequences] = useState(null);
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
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

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/align`, { sequences: formattedSequences });
            setAlignedSequences(response.data.alignedSequences);
            console.log('Aligned sequences:', response.data.alignedSequences);
        } catch (err) {
            setError('Error during alignment: ' + err.message);
            console.error('Alignment error:', err);
        }
        setLoading(false);
    };

    const handleTreeConstruction = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/construct-tree`, {
                sequences: alignedSequences || sequences
            });
            console.log('Received tree data:', response.data.tree);
            setTree(response.data.tree);
        } catch (err) {
            setError('Error during tree construction: ' + err.message);
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
        <div className="phylo-container">
            <button onClick={() => navigate('/tools')}><ChevronLeft size={20} /> </button>
            <h1>Phylogenetic Analysis</h1>
            <textarea
                value={sequences}
                onChange={handleSequenceInput}
                placeholder="Enter sequences here (FASTA format)"
                rows="10"
                style={{ whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
            />
            <button onClick={handleAlignment} disabled={loading || !sequences}>
                Align Sequences
            </button>
            <button onClick={handleTreeConstruction} disabled={loading || !sequences}>
                Construct Tree
            </button>
            {loading && <p>Processing...</p>}
            {error && <p className="error">{error}</p>}
            {alignedSequences && (
                <div className="aligned-sequences">
                    <h2>Aligned Sequences</h2>
                    <pre>{alignedSequences}</pre>
                </div>
            )}
            {tree && (
                <div className="phylogenetic-tree">
                    <h2>Phylogenetic Tree</h2>
                    <div id="tree-container" ref={treeContainer}></div>
                </div>
            )}
        </div>
    );
};

export default Phylo;
