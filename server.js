import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());  // Add this line to parse JSON bodies

app.get('/api/proxy', async (req, res) => {
    console.log('Received request:', req.query.url);
    try {
        let url = new URL(req.query.url);
        console.log('URL parameters:', Array.from(url.searchParams.entries()));

        if (!url.searchParams.has('id')) {
            throw new Error('GenBank ID is missing from the request');
        }

        if (!url.searchParams.has('tool')) {
            url.searchParams.append('tool', 'your_tool_name');
        }
        if (!url.searchParams.has('email')) {
            url.searchParams.append('email', 'your_email@example.com');
        }
        console.log('Modified URL:', url.toString());

        const response = await axios.get(url.toString());
        res.send(response.data);
    } catch (error) {
        console.error('Proxy server error:', error.message);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error request:', error.request);
        }
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

app.get('/api/genbank/:id', async (req, res) => {
    const id = req.params.id;
    const rettype = req.query.rettype || 'gb';
    const retmode = req.query.retmode || 'text';
    console.log('Received request for GenBank ID:', id);
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
    const params = new URLSearchParams({
        db: 'nucleotide',
        id: id,
        rettype: rettype,
        retmode: retmode,
        tool: 'your_tool_name',
        email: 'your_email@example.com'
    });

    const url = `${baseUrl}?${params}`;
    console.log('Fetching from NCBI URL:', url);

    try {
        const response = await axios.get(url);
        console.log('Received response from NCBI:', response.data.substring(0, 200) + '...'); // Log first 200 characters
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching from NCBI:', error.message);
        if (error.response) {
            console.error('NCBI error response:', error.response.data);
        }
        res.status(500).send(`Error fetching data from NCBI: ${error.message}`);
    }
});

app.post('/api/mafft', async (req, res) => {
    const { sequences } = req.body;
    try {
        // Submit job to Clustal Omega
        const submitResponse = await axios.post('https://www.ebi.ac.uk/Tools/services/rest/clustalo/run',
            new URLSearchParams({
                email: 'your_email@example.com',  // Replace with your email
                sequence: sequences,
                stype: 'protein',  // or 'dna' if you're aligning DNA sequences
                outfmt: 'clustal_num',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const jobId = submitResponse.data;

        // Poll for results
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5 seconds

            const statusResponse = await axios.get(`https://www.ebi.ac.uk/Tools/services/rest/clustalo/status/${jobId}`);
            const status = statusResponse.data;

            if (status === 'FINISHED') {
                // Get results
                const resultResponse = await axios.get(`https://www.ebi.ac.uk/Tools/services/rest/clustalo/result/${jobId}/aln-clustal_num`);
                res.send(resultResponse.data);
                break;
            } else if (status === 'FAILED') {
                throw new Error('Sequence alignment failed');
            }
        }
    } catch (error) {
        console.error('Alignment error:', error);
        res.status(500).send('Error running sequence alignment: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
