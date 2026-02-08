import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import axios from 'axios';
import ProjectPopup from '../components/ProjectPopup';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingLines } from '../components/common/LoadingState';
import { Loader2, ExternalLink, Plus } from 'lucide-react';

const API_BASE_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';
const RESULTS_PER_PAGE = 10;

const SemanticSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [userProjects, setUserProjects] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [savingArticle, setSavingArticle] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveMessageType, setSaveMessageType] = useState('success');
    const { currentUser } = useAuth();
    const userUid = currentUser?.uid;

    useEffect(() => {
        const fetchUserProjects = async () => {
            if (userUid) {
                try {
                    const projectsSnapshot = await getDocs(collection(db, 'users', userUid, 'projects'));
                    setUserProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
            const response = await axios.get(API_BASE_URL, {
                params: { query: searchTerm, limit: RESULTS_PER_PAGE, offset: (page - 1) * RESULTS_PER_PAGE, fields: 'title,authors,abstract,url,year' }
            });
            const { data } = response;
            if (data.total > 0) {
                setTotalResults(data.total);
                setResults(data.data);
                setCurrentPage(page);
            } else {
                setError('No articles found for your search.');
                setResults([]);
            }
        } catch (error) {
            console.error("Error fetching data from Semantic Scholar API:", error);
            setError('Failed to fetch articles. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addToProject = (article) => {
        if (userProjects.length === 0) {
            setSaveMessageType('error');
            setSaveMessage('Please create a project first to save articles.');
            setTimeout(() => setSaveMessage(''), 4000);
            return;
        }
        setSelectedArticle(article);
        setShowPopup(true);
    };

    const handleSelectProject = async (project) => {
        if (!selectedArticle || !userUid) {
            setSaveMessageType('error');
            setSaveMessage('Failed to save article. Please try again.');
            setTimeout(() => setSaveMessage(''), 4000);
            return;
        }

        setSavingArticle(true);
        try {
            await addDoc(collection(db, 'users', userUid, 'projects', project.id, 'researcharticles'), {
                title: selectedArticle.title,
                author: selectedArticle.authors.map(author => author.name).join(', '),
                abstract: selectedArticle.abstract || 'No abstract available',
                url: selectedArticle.url,
                year: selectedArticle.year,
                createdAt: new Date()
            });

            setSaveMessageType('success');
            setSaveMessage(`Article saved to "${project.title}"`);
            setTimeout(() => setSaveMessage(''), 4000);
        } catch (error) {
            console.error("Error adding article to project:", error);
            setSaveMessageType('error');
            setSaveMessage('Failed to save article. Please check your connection and try again.');
            setTimeout(() => setSaveMessage(''), 4000);
        } finally {
            setSavingArticle(false);
            setShowPopup(false);
        }
    };

    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

    return (
        <div>
            <PageHeader title="Semantic Scholar Search" subtitle="Search academic papers with AI-powered relevance" />

            <div className="flex gap-3 mb-6">
                <Input
                    placeholder="Search for research articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                />
                <Button onClick={() => handleSearch()} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Search
                </Button>
            </div>

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {saveMessage && (
                <div className={`rounded-md p-3 mb-4 ${
                    saveMessageType === 'success'
                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        : 'bg-destructive/10 border border-destructive/20'
                }`}>
                    <p className={`text-sm ${
                        saveMessageType === 'success'
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-destructive'
                    }`}>
                        {saveMessage}
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {loading && <LoadingLines count={3} />}
                {!loading && results.map((article, index) => (
                    <Card key={index}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-sm text-foreground">{article.title}</h3>
                                {article.year && <Badge variant="outline" className="shrink-0">{article.year}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {article.authors?.map(author => author.name).join(', ')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                {article.abstract || 'No abstract available'}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                {article.url && (
                                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <ExternalLink className="h-3.5 w-3.5" /> Read
                                        </Button>
                                    </a>
                                )}
                                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => addToProject(article)}>
                                    <Plus className="h-3.5 w-3.5" /> Add to Project
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {totalResults > RESULTS_PER_PAGE && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <Button variant="outline" size="sm" onClick={() => handleSearch(currentPage - 1)} disabled={currentPage === 1 || loading}>
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handleSearch(currentPage + 1)} disabled={currentPage >= totalPages || loading}>
                        Next
                    </Button>
                </div>
            )}

            {showPopup && (
                <ProjectPopup
                    projects={userProjects}
                    onSelectProject={handleSelectProject}
                    onClose={() => setShowPopup(false)}
                    isLoading={savingArticle}
                />
            )}
        </div>
    );
};

export default SemanticSearch;
