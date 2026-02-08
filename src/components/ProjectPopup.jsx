import React from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { X } from 'lucide-react';

const ProjectPopup = ({ projects, onSelectProject, onClose, isLoading }) => {
    if (projects.length === 0) {
        return (
            <Dialog open={true} onClose={onClose}>
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">No Projects Found</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create a project first to save articles.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Select a Project</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Choose which project to save this article to.
                    </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            disabled={isLoading}
                            className="w-full text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <p className="font-medium text-sm text-foreground">{project.title}</p>
                            {project.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                            )}
                        </button>
                    ))}
                </div>

                <Button onClick={onClose} variant="outline" className="w-full">
                    Cancel
                </Button>
            </div>
        </Dialog>
    );
};

export default ProjectPopup;