import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ToolsPage.css';
import { FaDna, FaSearch, FaRuler, FaTree, FaCube, FaProjectDiagram } from 'react-icons/fa';

const ToolsPage = () => {
    const navigate = useNavigate();

    const tools = [
        {
            name: "MAFFT",
            description: "Multiple sequence alignment program",
            onClick: () => navigate('/mafft'),
            icon: <FaDna />
        },
        {
            name: "BLAST",
            description: "Basic Local Alignment Search Tool",
            onClick: () => navigate('/blast'),
            icon: <FaSearch />
        },
        {
            name: "Primer Design",
            description: "Design PCR primers",
            onClick: () => navigate('/primer-design'),
            icon: <FaRuler />
        },
        {
            name: "Phylogenetic Analysis",
            description: "Construct phylogenetic trees",
            onClick: () => navigate('/phylo'),
            icon: <FaTree />
        },
        {
            name: "Protein Structure Prediction",
            description: "Predict 3D structure of proteins",
            onClick: () => navigate('/protein'),
            icon: <FaCube />
        },
        {
            name: "Gene Ontology Analysis",
            description: "Analyze gene ontology terms",
            onClick: () => navigate('/gene-ontology'),
            icon: <FaProjectDiagram />
        }
    ];

    return (
        <div className="tools-page-container">
            <header className="tools-header">
                <h1>Bioinformatics Tools</h1>
                <button onClick={() => navigate('/homepage')} className="back-to-home">
                    Back to Home
                </button>
            </header>
            <div className="tools-grid">
                {tools.map((tool, index) => (
                    <div key={index} className="tool-card" onClick={tool.onClick}>
                        <div className="tool-icon">{tool.icon}</div>
                        <h2>{tool.name}</h2>
                        <p>{tool.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ToolsPage;
