import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent } from '../components/ui/Card';
import { ExternalLink, ChevronRight, ChevronDown } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';

const Summarize = () => {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articleContent, setArticleContent] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedProjectId, setExpandedProjectId] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!currentUser?.uid) return;
            const projectsCollection = collection(db, `users/${currentUser.uid}/projects`);
            const projectsSnapshot = await getDocs(projectsCollection);
            const projectsList = await Promise.all(projectsSnapshot.docs.map(async (doc) => {
                const project = { id: doc.id, ...doc.data() };
                const articlesCollection = collection(db, `users/${currentUser.uid}/projects/${doc.id}/researcharticles`);
                const articlesSnapshot = await getDocs(articlesCollection);
                project.articles = articlesSnapshot.docs.map(articleDoc => ({
                    id: articleDoc.id,
                    ...articleDoc.data()
                }));
                return project;
            }));
            setProjects(projectsList);
        };

        fetchProjects();
    }, [currentUser?.uid]);

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
            const { data } = await httpsCallable(functions, 'summarize', { timeout: 120000 })({ content: articleContent });
            setSummary(data.summary);
        } catch (error) {
            console.error('Error summarizing article:', error);
            setError(error.message || 'Failed to summarize. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div>
            <PageHeader
                title="Summarize Article"
                subtitle="Extract key insights from research articles"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Projects sidebar */}
                <Card className="lg:col-span-1 h-fit">
                    <CardContent className="p-4">
                        <h2 className="text-sm font-medium text-foreground mb-3">Projects</h2>
                        <div className="space-y-1">
                            {projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No projects yet</p>
                            ) : (
                                projects.map((project) => (
                                    <div key={project.id}>
                                        <button
                                            onClick={() => {
                                                handleProjectClick(project);
                                                setExpandedProjectId(expandedProjectId === project.id ? null : project.id);
                                            }}
                                            className={`w-full text-left px-2 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                                                selectedProject?.id === project.id
                                                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100'
                                                    : 'hover:bg-muted text-foreground'
                                            }`}
                                        >
                                            {expandedProjectId === project.id ? (
                                                <ChevronDown className="h-4 w-4 shrink-0" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 shrink-0" />
                                            )}
                                            <span className="truncate">{project.title}</span>
                                        </button>
                                        {expandedProjectId === project.id && project.articles && (
                                            <div className="ml-2 mt-1 space-y-1 border-l border-border pl-2">
                                                {project.articles.map((article) => (
                                                    <button
                                                        key={article.id}
                                                        onClick={() => handleArticleClick(article)}
                                                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-2 ${
                                                            selectedArticle?.id === article.id
                                                                ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100'
                                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <span className="truncate flex-1">{article.title}</span>
                                                        {article.url && (
                                                            <a
                                                                href={article.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Content area */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <Textarea
                                value={articleContent}
                                onChange={handleContentChange}
                                placeholder="Paste your article content here..."
                                className="min-h-[200px] font-mono text-sm"
                            />
                            <Button
                                onClick={handleSummarize}
                                disabled={isLoading || !articleContent.trim()}
                                className="w-full"
                            >
                                {isLoading ? 'Summarizing...' : 'Summarize'}
                            </Button>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {summary && (
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-sm font-medium text-foreground mb-3">Summary</h3>
                                <p className="text-sm text-foreground leading-relaxed">{summary}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Summarize;
