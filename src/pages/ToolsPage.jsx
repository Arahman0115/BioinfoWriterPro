import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  AlignLeft, Search, Ruler, GitBranch, Box, Network, Scissors,
  Atom, Dna, Microscope, FileCode, Code, Calculator, Fingerprint,
  FlaskConical, LineChart, Table
} from 'lucide-react';

const tools = [
  { name: 'MAFFT', description: 'Multiple sequence alignment program', icon: AlignLeft, path: '/mafft' },
  { name: 'BLAST', description: 'Basic Local Alignment Search Tool', icon: Search, path: '/blast' },
  { name: 'Primer Design', description: 'Design PCR primers', icon: Ruler, external: 'https://www.ncbi.nlm.nih.gov/tools/primer-blast/' },
  { name: 'Phylogenetic Analysis', description: 'Construct phylogenetic trees', icon: GitBranch, external: 'https://www.ebi.ac.uk/Tools/phylogeny/' },
  { name: 'Protein Structure', description: 'Predict 3D structure of proteins', icon: Box, external: 'https://swissmodel.expasy.org/interactive' },
  { name: 'Gene Ontology', description: 'Analyze gene ontology terms', icon: Network, external: 'http://geneontology.org/' },
  { name: 'Restriction Analysis', description: 'Simulate restriction enzyme digestion', icon: Scissors, external: 'https://www.restrictionmapper.org/' },
  { name: 'Protein Properties', description: 'Calculate protein properties', icon: Atom, external: 'https://web.expasy.org/protparam/' },
  { name: 'RNA Structure', description: 'Predict RNA secondary structures', icon: Dna, external: 'http://rna.tbi.univie.ac.at/cgi-bin/RNAWebSuite/RNAfold.cgi' },
  { name: 'Microscopy Analysis', description: 'Analyze microscopy images', icon: Microscope, external: 'https://imagej.net/' },
  { name: 'Sequence Tools', description: 'DNA/RNA/Protein sequence tools', icon: FileCode, external: 'https://www.ebi.ac.uk/Tools/sss/' },
  { name: 'Codon Analysis', description: 'Analyze codon usage in sequences', icon: Code, external: 'https://www.kazusa.or.jp/codon/' },
  { name: 'Molecular Weight', description: 'Calculate molecular weights', icon: Calculator, external: 'https://web.expasy.org/compute_pi/' },
  { name: 'Motif Search', description: 'Find sequence patterns and motifs', icon: Fingerprint, external: 'https://meme-suite.org/meme/tools/meme' },
  { name: 'PCR Simulator', description: 'Simulate PCR experiments', icon: FlaskConical, external: 'https://www.bioinformatics.org/sms2/pcr_products.html' },
  { name: 'Expression Analysis', description: 'Analyze gene expression data', icon: LineChart, external: 'https://www.ncbi.nlm.nih.gov/geo/' },
  { name: 'Format Converter', description: 'Convert between sequence formats', icon: Table, external: 'https://www.ebi.ac.uk/Tools/sfc/' },
];

const ToolsPage = () => {
  const navigate = useNavigate();

  const handleClick = (tool) => {
    if (tool.path) {
      navigate(tool.path);
    } else if (tool.external) {
      window.open(tool.external, '_blank');
    }
  };

  return (
    <div>
      <PageHeader title="Analysis Tools" subtitle="Bioinformatics tools and external resources" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.name}
              className="cursor-pointer transition-colors hover:border-indigo-300"
              onClick={() => handleClick(tool)}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-2.5 shrink-0">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-foreground">{tool.name}</h3>
                    {tool.external && <Badge variant="outline" className="text-[10px] px-1.5 py-0">External</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsPage;
