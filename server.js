import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());  // Add this line to parse JSON bodies
app.use(express.urlencoded({ extended: true }));

const SWISS_MODEL_API_KEY = process.env.VITE_SWISS_MODEL_API_KEY;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});


app.all('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    try {
        const method = req.method.toLowerCase();
        const options = {
            method: method,
            url: targetUrl,
            params: method === 'get' ? req.query : undefined,
            data: method === 'post' ? req.body : undefined,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'text'  // This ensures we get the raw response
        };
        const response = await axios(options);
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send(error.toString());
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
        email: 'rahmanahnafbio@gmail.com'
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

app.post('/api/align', async (req, res) => {
    const { sequences } = req.body;
    try {
        // Submit job to Clustal Omega
        const submitResponse = await axios.post('https://www.ebi.ac.uk/Tools/services/rest/clustalo/run',
            new URLSearchParams({
                email: 'rahmanahnafbio@gmail.com',  // Replace with your email
                sequence: sequences,
                stype: 'dna',  // or 'protein' if you're aligning protein sequences
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
                res.json({ alignedSequences: resultResponse.data });
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

app.post('/api/construct-tree', async (req, res) => {
    const { sequences } = req.body;
    try {
        // Submit job to Simple Phylogeny
        const submitResponse = await axios.post('https://www.ebi.ac.uk/Tools/services/rest/simple_phylogeny/run',
            new URLSearchParams({
                email: 'rahmanahnafbio@gmail.com',  // Replace with your email
                sequence: sequences,
                stype: 'dna',  // or 'protein' if you're using protein sequences
                treeformat: 'newick',
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

            const statusResponse = await axios.get(`https://www.ebi.ac.uk/Tools/services/rest/simple_phylogeny/status/${jobId}`);
            const status = statusResponse.data;

            if (status === 'FINISHED') {
                // Get results
                const resultResponse = await axios.get(`https://www.ebi.ac.uk/Tools/services/rest/simple_phylogeny/result/${jobId}/tree`);
                const treeData = resultResponse.data;
                console.log('Tree data:', treeData);  // Log the tree data
                res.json({
                    tree: treeData,
                    treeFormat: 'newick',
                    treeSize: treeData.length
                });
                break;
            } else if (status === 'FAILED') {
                throw new Error('Tree construction failed');
            }
        }
    } catch (error) {
        console.error('Tree construction error:', error);
        res.status(500).send('Error constructing phylogenetic tree: ' + error.message);
    }
});

app.post('/api/predict-structure', async (req, res) => {
    const { sequence } = req.body;
    console.log('Received sequence:', sequence);

    try {
        // Step 1: Submit the job
        const submitResponse = await axios.post(
            "https://swissmodel.expasy.org/automodel",
            {
                target_sequences: [sequence],
                project_title: "Protein Structure Prediction"
            },
            {
                headers: { "Authorization": `Token ${SWISS_MODEL_API_KEY}` }
            }
        );

        const projectId = submitResponse.data.project_id;

        // Step 2: Poll for results
        let status = 'PENDING';
        let statusResponse;
        while (status !== 'COMPLETED' && status !== 'FAILED') {
            await new Promise(resolve => setTimeout(resolve, 10000));  // Wait 10 seconds

            statusResponse = await axios.get(
                `https://swissmodel.expasy.org/project/${projectId}/models/summary/`,
                {
                    headers: { "Authorization": `Token ${SWISS_MODEL_API_KEY}` }
                }
            );

            status = statusResponse.data.status;
            console.log('Job status:', status);
        }

        if (status === 'FAILED') {
            throw new Error('Protein structure prediction failed');
        }

        // Step 3: Fetch the results
        if (statusResponse.data.models && statusResponse.data.models.length > 0) {
            const resultResponse = await axios.get(
                statusResponse.data.models[0].coordinates_url,
                {
                    headers: { "Authorization": `Token ${SWISS_MODEL_API_KEY}` },
                    responseType: 'text'
                }
            );

            res.json({
                pdbStructure: resultResponse.data,
                confidenceScore: statusResponse.data.models[0].qmean_global_score
            });
        } else {
            throw new Error('No models found in the response');
        }

    } catch (error) {
        console.error('Protein structure prediction error:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
        }
        res.status(500).send('Error predicting protein structure: ' + error.message);
    }
});

app.post('/api/mafft', async (req, res) => {
    const { sequences } = req.body;
    try {
        // Submit job to MAFFT
        const submitResponse = await axios.post('https://www.ebi.ac.uk/Tools/services/rest/mafft/run',
            new URLSearchParams({
                email: 'rahmanahnafbio@gmail.com',  // Replace with your email
                sequence: sequences,
                format: 'fasta',
                outfmt: 'clustal',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const jobId = submitResponse.data;
        console.log('MAFFT job submitted. Job ID:', jobId);

        // Poll for results
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5 seconds

            const statusResponse = await axios.get(`https://www.ebi.ac.uk/Tools/services/rest/mafft/status/${jobId}`);
            const status = statusResponse.data;
            console.log('MAFFT job status:', status);

            if (status === 'FINISHED') {
                // Get results
                try {
                    const resultResponse = await axios.get(`https://www.ebi.ac.uk/Tools/services/rest/mafft/result/${jobId}/out`);
                    console.log('MAFFT result received. Length:', resultResponse.data.length);
                    res.json({ alignedSequences: resultResponse.data });
                    break;
                } catch (resultError) {
                    console.error('Error fetching MAFFT results:', resultError);
                    if (resultError.response) {
                        console.error('Error response:', resultError.response.data);
                        console.error('Error status:', resultError.response.status);
                    }
                    throw new Error('Failed to fetch MAFFT results');
                }
            } else if (status === 'FAILED') {
                throw new Error('MAFFT alignment failed');
            }
        }
    } catch (error) {
        console.error('MAFFT alignment error:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        res.status(500).send('Error running MAFFT alignment: ' + error.message);
    }
});

app.post('/api/summarize', async (req, res) => {
    const { content } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { "role": "system", "content": "You are a helpful assistant that summarizes scientific articles." },
                { "role": "user", "content": `Summarize the following text in about 1000 tokens:\n\n${content}` }
            ],
            max_tokens: 1000,
            temperature: 0.5,
        });

        const summary = response.choices[0].message.content.trim();
        res.json({ summary });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).send('Error summarizing text: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
