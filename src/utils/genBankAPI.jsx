// src/utils/genBankAPI.js

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

// Helper function to build the query string
const buildQueryString = (params) => {
    return Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
};

// Function to search GenBank
export const searchGenBank = async (searchTerm) => {
    console.log('Searching GenBank for:', searchTerm);
    const maxResults = 50; // Set maximum results to 50
    const params = {
        db: 'nucleotide',
        term: searchTerm,
        retmode: 'json',
        retmax: maxResults,
        sort: 'relevance'
    };

    const url = `${BASE_URL}esearch.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Fetch summary for each ID
        const summaries = await fetchSummaries(data.esearchresult.idlist);

        return {
            results: summaries,
            totalResults: Math.min(parseInt(data.esearchresult.count), maxResults)
        };
    } catch (error) {
        console.error('Error searching GenBank:', error);
        throw error;
    }
};

const fetchSummaries = async (idList) => {
    const params = {
        db: 'nucleotide',
        id: idList.join(','),
        retmode: 'json'
    };

    const url = `${BASE_URL}esummary.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return Object.values(data.result).filter(item => item.uid);
    } catch (error) {
        console.error('Error fetching summaries:', error);
        throw error;
    }
};

// Function to fetch details for a specific GenBank entry
export const fetchGenBankEntry = async (id) => {
    console.log('Fetching GenBank entry for ID:', id);
    const params = {
        db: 'nucleotide',
        id: id,
        rettype: 'gb',
        retmode: 'text'
    };

    const url = `${BASE_URL}efetch.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.text();
        console.log('Fetched GenBank entry:', data);

        return data; // Return the raw text data
    } catch (error) {
        console.error('Error fetching GenBank entry:', error);
        throw error;
    }
};

function parseGenBankFlatFile(flatFile) {
    if (typeof flatFile !== 'string') {
        console.error('Invalid flatFile type:', typeof flatFile);
        return null;
    }

    const entry = {
        locus: '',
        definition: '',
        accession: '',
        version: '',
        keywords: '',
        source: '',
        organism: '',
        references: [],
        features: [],
        sequence: ''
    };

    const lines = flatFile.split('\n');
    let currentSection = '';
    let currentFeature = null;

    for (let line of lines) {
        if (line.startsWith('LOCUS')) {
            entry.locus = line.substring(12).trim();
        } else if (line.startsWith('DEFINITION')) {
            entry.definition = (entry.definition + ' ' + line.substring(12)).trim();
        } else if (line.startsWith('ACCESSION')) {
            entry.accession = line.substring(12).trim();
        } else if (line.startsWith('VERSION')) {
            entry.version = line.substring(12).trim();
        } else if (line.startsWith('KEYWORDS')) {
            entry.keywords = line.substring(12).trim();
        } else if (line.startsWith('SOURCE')) {
            entry.source = line.substring(12).trim();
        } else if (line.startsWith('  ORGANISM')) {
            entry.organism = line.substring(12).trim();
        } else if (line.startsWith('REFERENCE')) {
            currentSection = 'reference';
            entry.references.push({ title: '', authors: '', journal: '' });
        } else if (line.startsWith('FEATURES')) {
            currentSection = 'features';
        } else if (line.startsWith('ORIGIN')) {
            currentSection = 'sequence';
        } else if (currentSection === 'reference' && line.trim() !== '') {
            const lastRef = entry.references[entry.references.length - 1];
            if (line.startsWith('  AUTHORS')) {
                lastRef.authors = (lastRef.authors + ' ' + line.substring(12)).trim();
            } else if (line.startsWith('  TITLE')) {
                lastRef.title = (lastRef.title + ' ' + line.substring(12)).trim();
            } else if (line.startsWith('  JOURNAL')) {
                lastRef.journal = (lastRef.journal + ' ' + line.substring(12)).trim();
            }
        } else if (currentSection === 'features') {
            if (line.startsWith('     ')) {
                if (currentFeature) {
                    currentFeature.qualifiers.push(line.trim());
                }
            } else {
                if (currentFeature) {
                    entry.features.push(currentFeature);
                }
                const [type, location] = line.trim().split(/\s+/);
                currentFeature = { type, location, qualifiers: [] };
            }
        } else if (currentSection === 'sequence' && line.trim() !== '') {
            entry.sequence += line.replace(/\d+|\s+/g, '');
        }
    }

    if (currentFeature) {
        entry.features.push(currentFeature);
    }

    return entry;
}

// Function to fetch multiple GenBank entries
export const fetchMultipleGenBankEntries = async (results) => {
    const validIds = results
        .map(result => typeof result === 'string' ? result : result.id || result.accession)
        .filter(id => id && typeof id === 'string' && id.trim() !== '')
        .slice(0, 1);

    if (validIds.length === 0) {
        throw new Error('No valid IDs provided for fetching GenBank entries');
    }

    const params = {
        db: 'nucleotide',
        id: validIds.join(','),
        rettype: 'gb',
        retmode: 'text'
    };

    const apiUrl = `${BASE_URL}efetch.fcgi?${buildQueryString(params)}`;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.text();
        console.log('Fetched multiple GenBank entries:', data);
        return data.split('//\n').filter(entry => entry.trim() !== '');
    } catch (error) {
        console.error('Error fetching multiple GenBank entries:', error);
        throw error;
    }
};

// Function to parse GenBank entry
export const parseGenBankEntry = (entryText) => {
    console.log("Raw entry text:", entryText.substring(0, 500) + "..."); // Log the first 500 characters of the raw entry

    const lines = entryText.split('\n');
    const entry = {};
    let currentField = '';
    let inOrigin = false;
    let sequence = '';

    for (let line of lines) {
        if (line.startsWith('ORIGIN')) {
            inOrigin = true;
            console.log("Found ORIGIN section");
            continue;
        }

        if (inOrigin) {
            // Extract only the sequence data, removing numbers and spaces
            sequence += line.replace(/[^a-zA-Z]/g, '');
        } else if (line.match(/^[A-Z]+/)) {
            currentField = line.split(/\s+/)[0].toLowerCase();
            entry[currentField] = line.substring(line.indexOf(' ')).trim();
        } else if (line.startsWith(' ')) {
            entry[currentField] += ' ' + line.trim();
        }
    }

    // Extract specific fields
    entry.id = entry.locus ? entry.locus.split(/\s+/)[0] : '';
    entry.title = entry.definition || '';
    entry.accession = entry.accession ? entry.accession.split(/\s+/)[0] : '';
    entry.organism = entry.source ? entry.source.split('(')[0].trim() : '';
    entry.length = entry.locus ? entry.locus.match(/\d+/)[0] : '';
    entry.sequence = sequence.toUpperCase(); // Add the extracted sequence to the entry object

    console.log("Parsed entry:", {
        id: entry.id,
        title: entry.title,
        accession: entry.accession,
        organism: entry.organism,
        length: entry.length,
        sequenceLength: entry.sequence.length
    });
    console.log("First 50 bases of sequence:", entry.sequence.substring(0, 50));

    return entry;
};

export function parseFeatures(featuresString) {
    const features = [];
    const featureRegex = /(\w+)\s+(.+?)\s+\/(\w+)="(.+?)"/g;
    let match;

    while ((match = featureRegex.exec(featuresString)) !== null) {
        const [, type, location, qualifier, value] = match;

        if (!features.some(f => f.type === type && f.location === location)) {
            features.push({ type, location, qualifiers: [] });
        }

        const feature = features.find(f => f.type === type && f.location === location);
        feature.qualifiers.push({ [qualifier]: value });
    }

    return features;
}

export const fetchFastaSequence = async (id) => {
    console.log('Fetching FASTA sequence for ID:', id);
    const params = {
        db: 'nucleotide',
        id: id,
        rettype: 'fasta',
        retmode: 'text'
    };

    const url = `${BASE_URL}efetch.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error('Error fetching FASTA sequence:', error);
        throw error;
    }
};

export const downloadFile = async (id, fileType) => {
    console.log(`Downloading ${fileType} file for ID:`, id);
    const params = {
        db: 'nucleotide',
        id: id,
        rettype: fileType === 'genbank' ? 'gbwithparts' : 'fasta',
        retmode: 'text'
    };

    const url = `${BASE_URL}efetch.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = `${id}.${fileType === 'genbank' ? 'gb' : 'fasta'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error(`Error downloading ${fileType} file:`, error);
        throw error;
    }
};

export const searchGene = async (geneName) => {
    console.log('Searching for gene:', geneName);
    const params = {
        db: 'gene',
        term: `${geneName}[Gene Name]`,
        retmode: 'json',
        retmax: 50
    };

    const url = `${BASE_URL}esearch.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Fetch summary for each ID
        const summaries = await fetchGeneSummaries(data.esearchresult.idlist);

        return {
            results: summaries,
            totalResults: Math.min(parseInt(data.esearchresult.count), 50)
        };
    } catch (error) {
        console.error('Error searching gene:', error);
        throw error;
    }
};

const fetchGeneSummaries = async (idList) => {
    const params = {
        db: 'gene',
        id: idList.join(','),
        retmode: 'json'
    };

    const url = `${BASE_URL}esummary.fcgi?${buildQueryString(params)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return Object.values(data.result).filter(item => item.uid).map(item => ({
            uid: item.uid,
            title: item.name,
            caption: item.symbol,
            from: item.genomicinfo[0]?.chrstart,
            to: item.genomicinfo[0]?.chrstop
        }));
    } catch (error) {
        console.error('Error fetching gene summaries:', error);
        throw error;
    }
};

export const getFastaForRegion = async (accession, from, to) => {
    const url = `https://www.ncbi.nlm.nih.gov/nuccore/${accession}?report=fasta&from=${from}&to=${to}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error('Error fetching FASTA for region:', error);
        throw error;
    }
};
