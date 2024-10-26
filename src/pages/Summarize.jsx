import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import axios from 'axios';
import '../styles/Summarize.css';
import { ChevronLeft, ExternalLink } from 'lucide-react';

const Summarize = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articleContent, setArticleContent] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            const user = auth.currentUser;
            if (user) {
                const projectsCollection = collection(db, `users/${user.uid}/projects`);
                const projectsSnapshot = await getDocs(projectsCollection);
                const projectsList = await Promise.all(projectsSnapshot.docs.map(async (doc) => {
                    const project = { id: doc.id, ...doc.data() };
                    const articlesCollection = collection(db, `users/${user.uid}/projects/${doc.id}/researcharticles`);
                    const articlesSnapshot = await getDocs(articlesCollection);
                    project.articles = articlesSnapshot.docs.map(articleDoc => ({
                        id: articleDoc.id,
                        ...articleDoc.data()
                    }));
                    return project;
                }));
                setProjects(projectsList);
            }
        };

        fetchProjects();
    }, []);

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setSelectedArticle(null);
    };

    const handleArticleClick = (article) => {
        setSelectedArticle(article);
        setArticleContent(article.content || ''); // Set content if available
    };

    const handleContentChange = (e) => {
        setArticleContent(e.target.value);
    };

    const handleSummarize = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/api/summarize', { content: articleContent });
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Error summarizing article:', error);
            setError('Error generating summary. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="summarize-container">
            <button className="back-button" onClick={() => navigate('/tools')}>
                <ChevronLeft size={20} />
            </button>
            <h1>Summarize Article</h1>
            <div className="summarize-layout">
                <div className="file-hierarchy">
                    <h2>Projects</h2>
                    <ul>
                        {projects.map((project) => (
                            <li key={project.id}>
                                <span onClick={() => handleProjectClick(project)}>{project.title}</span>
                                {selectedProject && selectedProject.id === project.id && (
                                    <ul>
                                        {project.articles.map((article) => (
                                            <li key={article.id} className="article-item">
                                                <span onClick={() => handleArticleClick(article)}>
                                                    {article.title}
                                                </span>
                                                {article.url && (
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="article-link"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="content-area">
                    <textarea
                        value={articleContent}
                        onChange={handleContentChange}
                        placeholder="Paste your article content here..."
                    />
                    <button onClick={handleSummarize} disabled={isLoading || !articleContent.trim()}>
                        {isLoading ? 'Summarizing...' : 'Summarize'}
                    </button>
                    {error && <p className="error-message">{error}</p>}
                    {summary && (
                        <div className="summary-result">
                            <h3>Summary:</h3>
                            <p>{summary}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Summarize;
