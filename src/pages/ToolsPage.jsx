import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ToolsPage.css';
import {
    FaCog, FaDna, FaSearch, FaRulerHorizontal, FaTree, FaCube,
    FaProjectDiagram, FaCut, FaCalculator, FaDatabase, FaChartBar,
    FaMicroscope, FaCode, FaAtom, FaFingerprint, FaFlask,
    FaChartLine, FaTable
} from 'react-icons/fa';  // Import all necessary Font Awesome icons
import {
    GiDna1, GiMolecule, GiMicroscope, GiTestTubes
} from 'react-icons/gi';  // Import necessary Game icons
import { MdScience } from 'react-icons/md';  // Import Material Design icons

// Create an object to map icon names to their components
const iconComponents = {
    FaSearch,
    FaRulerHorizontal,
    FaTree,
    FaCube,
    FaProjectDiagram,
    FaCut,
    FaCalculator,
    FaDatabase,
    FaChartBar,
    FaMicroscope,
    FaCog,
    FaCode,
    FaAtom,
    FaFingerprint,
    FaFlask,
    FaChartLine,
    FaTable,
    FaDna,
    GiDna1,
    GiMolecule,
    GiMicroscope,
    GiTestTubes,
    MdScience
};

// Helper function to safely render an icon
const SafeIcon = ({ iconName }) => {
    const IconComponent = iconComponents[iconName];
    return IconComponent ? <IconComponent /> : <FaCog />;  // Using imported FaCog as fallback
};

const ToolsPage = () => {
    const navigate = useNavigate();

    const tools = [
        {
            name: "MAFFT",
            description: "Multiple sequence alignment program",
            onClick: () => navigate('/mafft'),
            iconName: 'FaDna'
        },
        {
            name: "BLAST",
            description: "Basic Local Alignment Search Tool",
            onClick: () => navigate('/blast'),
            iconName: 'FaSearch'
        },
        {
            name: "Primer Design",
            description: "Design PCR primers",
            onClick: () => window.open('https://www.ncbi.nlm.nih.gov/tools/primer-blast/', '_blank'),
            iconName: 'FaRulerHorizontal'
        },
        {
            name: "Phylogenetic Analysis",
            description: "Construct phylogenetic trees",
            onClick: () => navigate('/phylo'),
            iconName: 'FaTree'
        },
        {
            name: "Protein Structure",
            description: "Predict 3D structure of proteins",
            onClick: () => navigate('/protein'),
            iconName: 'FaCube'
        },
        {
            name: "Gene Ontology",
            description: "Analyze gene ontology terms",
            onClick: () => window.open('http://geneontology.org/', '_blank'),
            iconName: 'FaProjectDiagram'
        },
        {
            name: "Restriction Analysis",
            description: "Simulate restriction enzyme digestion",
            onClick: () => window.open('https://www.restrictionmapper.org/', '_blank'),
            iconName: 'FaCut'
        },
        {
            name: "Protein Properties",
            description: "Calculate protein properties",
            onClick: () => window.open('https://web.expasy.org/protparam/', '_blank'),
            iconName: 'GiMolecule'
        },

        {
            name: "RNA Structure",
            description: "Predict RNA secondary structures",
            onClick: () => window.open('http://rna.tbi.univie.ac.at/cgi-bin/RNAWebSuite/RNAfold.cgi', '_blank'),
            iconName: 'FaDna'
        },
        {
            name: "Microscopy Analysis",
            description: "Analyze microscopy images",
            onClick: () => window.open('https://imagej.net/', '_blank'),
            iconName: 'GiMicroscope'
        },
        {
            name: "Sequence Tools",
            description: "DNA/RNA/Protein sequence tools",
            onClick: () => window.open('https://www.ebi.ac.uk/Tools/sss/', '_blank'),
            iconName: 'FaDna'
        },
        {
            name: "Codon Analysis",
            description: "Analyze codon usage in sequences",
            onClick: () => window.open('https://www.kazusa.or.jp/codon/', '_blank'),
            iconName: 'FaCode'
        },
        {
            name: "Molecular Weight",
            description: "Calculate molecular weights",
            onClick: () => window.open('https://web.expasy.org/compute_pi/', '_blank'),
            iconName: 'FaCalculator'
        },
        {
            name: "Motif Search",
            description: "Find sequence patterns and motifs",
            onClick: () => window.open('https://meme-suite.org/meme/tools/meme', '_blank'),
            iconName: 'FaFingerprint'
        },
        {
            name: "PCR Simulator",
            description: "Simulate PCR experiments",
            onClick: () => window.open('https://www.bioinformatics.org/sms2/pcr_products.html', '_blank'),
            iconName: 'GiTestTubes'
        },
        {
            name: "Expression Analysis",
            description: "Analyze gene expression data",
            onClick: () => window.open('https://www.ncbi.nlm.nih.gov/geo/', '_blank'),
            iconName: 'FaChartLine'
        },
        {
            name: "Format Converter",
            description: "Convert between sequence formats",
            onClick: () => window.open('https://www.ebi.ac.uk/Tools/sfc/', '_blank'),
            iconName: 'FaTable'
        }
    ];

    return (
        <div className="tools-page-container">
            <header className="tools-header">
                <h1 className='tools-header-text'>Bioinformatics Tools</h1>
                <button onClick={() => navigate('/homepage')} className="back-to-home">
                    Back to Home
                </button>
            </header>
            <div className="tools-grid">
                {tools.map((tool, index) => (
                    <div key={index} className="tool-card" onClick={tool.onClick}>
                        <div className="tool-icon">
                            <SafeIcon iconName={tool.iconName} />
                        </div>
                        <h2>{tool.name}</h2>
                        <p>{tool.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ToolsPage;
