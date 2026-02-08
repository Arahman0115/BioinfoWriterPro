import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logFirebaseOperation, logFirebaseError, getFirebaseErrorMessage } from '../utils/firebaseDebug';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import {
  PenLine, Search, Database, BookOpen, Image, FileText,
  MoreVertical, Trash2, FileIcon
} from 'lucide-react';

const quickActions = [
  { name: 'New Document', icon: PenLine, path: '/writer', state: { project: { title: '', sections: { Template: { content: '' } } } } },
  { name: 'PubMed Search', icon: Search, path: '/research' },
  { name: 'GenBank', icon: Database, path: '/genbank-search' },
  { name: 'Semantic Search', icon: BookOpen, path: '/semantic-search' },
  { name: 'Figure Explanation', icon: Image, path: '/figure-explanation' },
  { name: 'Summarize', icon: FileText, path: '/summarize' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (!currentUser?.uid) {
          logFirebaseOperation('loadProjects', { status: 'skipped', reason: 'no user' });
          setProjects([]);
          return;
        }

        const projectsCollection = collection(db, `users/${currentUser.uid}/projects`);
        logFirebaseOperation('loadProjects', {
          userId: currentUser.uid,
          collectionPath: `users/${currentUser.uid}/projects`
        });

        const snapshot = await getDocs(projectsCollection);
        const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        logFirebaseOperation('loadProjects-success', {
          count: fetchedProjects.length,
          projects: fetchedProjects.map(p => ({ id: p.id, title: p.title }))
        });

        setProjects(fetchedProjects);
      } catch (error) {
        logFirebaseError('loadProjects', error);
        console.error('❌ FIREBASE ERROR:', {
          code: error.code,
          message: error.message,
          friendlyMessage: getFirebaseErrorMessage(error)
        });
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [currentUser?.uid]);

  const handleProjectClick = (project) => {
    navigate('/writer', { state: { project } });
  };

  const handleConfirmDelete = async () => {
    const projectToDelete = projects[deleteIndex];
    if (currentUser?.uid) {
      await deleteDoc(doc(db, `users/${currentUser.uid}/projects`, projectToDelete.id));
      setProjects(projects.filter((_, index) => index !== deleteIndex));
      setIsModalOpen(false);
    }
  };

  const handleEllipsisClick = (e, index) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleDeleteOption = (e, index) => {
    e.stopPropagation();
    setDeleteIndex(index);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayName = currentUser?.displayName || currentUser?.email || 'User';

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle={`Welcome back, ${displayName}`}
        actions={
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        }
      />

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.name}
                onClick={() => navigate(action.path, action.state ? { state: action.state } : undefined)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 cursor-pointer"
              >
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-2">
                  <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Documents */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Documents</h2>
        {loading ? (
          <LoadingState count={6} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={FileIcon}
            title="No projects found"
            description="Create a new document to get started"
            actionLabel="New Document"
            onAction={() => navigate('/writer', { state: { project: { title: '', sections: { Template: { content: '' } } } } })}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-colors hover:border-indigo-300"
                onClick={() => handleProjectClick(project)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate text-foreground">
                        {project.title || 'Untitled Project'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.lastEdited
                          ? new Date(project.lastEdited).toLocaleDateString()
                          : 'No date'}
                      </p>
                    </div>
                    <div className="relative shrink-0 ml-2">
                      <button
                        onClick={(e) => handleEllipsisClick(e, index)}
                        className="p-1 rounded-md hover:bg-accent text-muted-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeDropdown === index && (
                        <div className="absolute right-0 top-8 z-10 w-32 rounded-md border border-border bg-popover shadow-md py-1">
                          <button
                            onClick={(e) => handleDeleteOption(e, index)}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-accent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                    {project.sections?.Template?.content
                      ? project.sections.Template.content.slice(0, 200)
                      : 'No content available'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Delete"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this project? This action cannot be undone.</p>
      </Dialog>
    </div>
  );
};

export default HomePage;
