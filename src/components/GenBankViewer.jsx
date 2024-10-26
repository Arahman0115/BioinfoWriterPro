// src/components/GenBankViewer.jsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import '../styles/GenBankViewer.css';

const GenBankViewer = ({ entry }) => {
    if (!entry || typeof entry !== 'string') {
        return <Typography>No valid GenBank entry data available.</Typography>;
    }

    const lines = entry.split('\n');

    return (
        <Paper className="genbank-viewer" elevation={3}>
            <Box component="pre" className="genbank-content">
                {lines.map((line, index) => {
                    if (line.match(/^[A-Z]+/)) {
                        // Main sections (e.g., LOCUS, DEFINITION, etc.)
                        return (
                            <Typography key={index} className="section-header">
                                {line}
                            </Typography>
                        );
                    } else if (line.startsWith('     ')) {
                        // Feature qualifiers
                        return (
                            <Typography key={index} className="feature-qualifier">
                                {line}
                            </Typography>
                        );
                    } else if (line.match(/^\s+\d+/)) {
                        // Sequence lines
                        return (
                            <Typography key={index} className="sequence-line">
                                {line}
                            </Typography>
                        );
                    } else {
                        // Other lines
                        return (
                            <Typography key={index} className="regular-line">
                                {line}
                            </Typography>
                        );
                    }
                })}
            </Box>
        </Paper>
    );
};

export default GenBankViewer;
