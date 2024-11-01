import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import axios from 'axios';
import ProjectPopup from '../components/ProjectPopup';
import '../styles/Research.css';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft } from 'lucide-react';

const API_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const RESULTS_PER_PAGE = 5;
const MAX_RESULTS = 500;

const Research = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [userProjects, setUserProjects] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const userUid = currentUser?.uid;

    useEffect(() => {
        const fetchUserProjects = async () => {
            if (userUid) {
                try {
                    const projectsSnapshot = await getDocs(collection(db, 'users', userUid, 'projects'));
                    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setUserProjects(projects);
                } catch (error) {
                    console.error("Error fetching user projects:", error);
                }
            }
        };
        fetchUserProjects();
    }, [userUid]);

    const handleSearch = async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const searchResponse = await axios.get(`${API_BASE_URL}esearch.fcgi`, {
                params: {
                    db: 'pubmed',
                    term: searchTerm,
                    retmode: 'json',
                    retmax: Math.min(RESULTS_PER_PAGE, MAX_RESULTS),
                    retstart: (page - 1) * RESULTS_PER_PAGE,
                }
            });

            const { esearchresult } = searchResponse.data;
            if (esearchresult?.idlist?.length) {
                const totalCount = Math.min(parseInt(esearchresult.count, 10), MAX_RESULTS);
                setTotalResults(totalCount);
                const ids = esearchresult.idlist.join(',');

                const detailsResponse = await axios.get(`${API_BASE_URL}efetch.fcgi`, {
                    params: {
                        db: 'pubmed',
                        id: ids,
                        retmode: 'xml'
                    }
                });

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(detailsResponse.data, "text/xml");
                const articlesArray = xmlDoc.getElementsByTagName('PubmedArticle');

                const articles = Array.from(articlesArray).map(article => {
                    const title = article.querySelector('ArticleTitle')?.textContent || 'No title available';
                    const pmid = article.querySelector('PMID')?.textContent;
                    const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
                    const abstract = article.querySelector('AbstractText')?.textContent || 'No abstract available';
                    const authorList = article.querySelectorAll('AuthorList > Author');
                    const authors = Array.from(authorList).map(author => {
                        const lastName = author.querySelector('LastName')?.textContent || 'Unknown';
                        const foreName = author.querySelector('ForeName')?.textContent || 'Unknown';
                        return `${foreName} ${lastName}`; // Combine first and last names
                    });
                    return { title, url, abstract, pmid, author: authors.join(', ') };
                });

                setResults(articles);
                setCurrentPage(page);
            } else {
                setError('No articles found for your search.');
                setResults([]);
            }
        } catch (error) {
            console.error("Error fetching data from PubMed API:", error);
            setError('Failed to fetch articles. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const handleHomePress = () => {
        navigate('/Homepage');
    };

    const addToProject = (article) => {
        setSelectedArticle(article);
        setShowPopup(true);
    };

    const handleSelectProject = async (project) => {
        if (selectedArticle) {
            try {
                await addDoc(collection(db, 'users', userUid, 'projects', project.id, 'researcharticles'), {
                    title: selectedArticle.title,
                    author: selectedArticle.author,
                    abstract: selectedArticle.abstract,
                    url: selectedArticle.url,
                    pmid: selectedArticle.pmid,
                    createdAt: new Date()
                });
                console.log('Article added to project successfully!');
            } catch (error) {
                console.error("Error adding article to project:", error);
                alert('Failed to add article to project. Please try again.');
            }
            setShowPopup(false);
        }
    };

    return (
        <div className="research-container">
            <button onClick={handleHomePress} className="research-home-button">
                <ChevronLeft size={20} />
            </button>
            <h1 className='research-header'>PubMed Article Search</h1>

            <div className="research-search-bar">
                <input
                    type="text"
                    placeholder="Search for research articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="research-search-input"
                />
                <button onClick={() => handleSearch()} disabled={loading} className="research-search-button">
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div className="research-error">
                    <p>{error}</p>
                </div>
            )}

            <div className="research-results-container">
                {loading && <div className="research-loading">Loading...</div>}
                {results.map((article, index) => (
                    <div key={index} className="research-article-box">
                        <h3>{article.title}</h3>
                        <p>Author(s): {article.author}</p>
                        <p>{article.abstract}</p>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="research-article-link">
                            Read Article
                        </a>
                        <button className='research-add-project-button' onClick={() => addToProject(article)}>
                            Add to Project
                        </button>
                    </div>
                ))}
            </div>

            {totalResults > RESULTS_PER_PAGE && (
                <div className="research-pagination">
                    <button
                        onClick={() => handleSearch(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="research-pagination-button"
                    >
                        Previous
                    </button>
                    <span className="research-pagination-info">Page {currentPage} of {Math.ceil(totalResults / RESULTS_PER_PAGE)}</span>
                    <button
                        onClick={() => handleSearch(currentPage + 1)}
                        disabled={currentPage * RESULTS_PER_PAGE >= totalResults || loading}
                        className="research-pagination-button"
                    >
                        Next
                    </button>
                </div>
            )}

            {showPopup && (
                <ProjectPopup
                    projects={userProjects}
                    onSelectProject={handleSelectProject}
                    onClose={() => setShowPopup(false)}
                />
            )}
        </div>
    );
};

export default Research;
