import React, { useEffect, useRef } from 'react';
import * as NGL from 'ngl';

const ProteinViewer = ({ pdbData }) => {
    const viewerRef = useRef(null);

    useEffect(() => {
        if (pdbData && viewerRef.current) {
            const stage = new NGL.Stage(viewerRef.current);

            // Use a Blob to create a URL for the PDB data
            const blob = new Blob([pdbData], { type: 'text/plain' });
            const objectUrl = URL.createObjectURL(blob);

            stage.loadFile(objectUrl, { ext: 'pdb' }).then(component => {
                component.addRepresentation('cartoon');
                stage.autoView();
            }).catch(error => {
                console.error('Error loading PDB data:', error);
            });

            // Clean up function
            return () => {
                URL.revokeObjectURL(objectUrl);
                stage.dispose();
            };
        }
    }, [pdbData]);

    return <div ref={viewerRef} style={{ width: '100%', height: '400px' }} />;
};

export default ProteinViewer;
