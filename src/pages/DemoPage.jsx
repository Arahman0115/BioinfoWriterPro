import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { User, Bot, Zap, ChevronDown, ChevronRight } from 'lucide-react';

const DemoPage = () => {
    const [activePanel, setActivePanel] = useState(null);

    const togglePanel = (panel) => {
        setActivePanel(activePanel === panel ? null : panel);
    };

    const panels = [
        {
            id: 'about',
            icon: User,
            title: 'About BioScribe',
            content: (
                <>
                    <p className="text-sm text-foreground mb-3">
                        BioScribe harnesses the power of Artificial Intelligence to revolutionize scientific writing. Our AI assistant provides contextual text completions, customized templates, and intelligent suggestions to elevate your research communication.
                    </p>
                    <ul className="space-y-2 text-sm text-foreground">
                        <li className="flex gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span>AI-powered writing assistance</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span>Contextual suggestions</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span>Custom templates for papers and grants</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span>Intelligent text completion</span>
                        </li>
                    </ul>
                </>
            )
        },
        {
            id: 'howToUse',
            icon: Bot,
            title: 'How to Use',
            content: (
                <>
                    <p className="text-sm text-foreground mb-3">
                        Unlock BioScribe's features with simple commands:
                    </p>
                    <ul className="space-y-2 text-sm text-foreground mb-3">
                        <li className="flex gap-2">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">@template</code>
                            <span>Generate a custom template</span>
                        </li>
                        <li className="flex gap-2">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">@improve</code>
                            <span>Improve your text</span>
                        </li>
                        <li className="flex gap-2">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">@summarize</code>
                            <span>Summarize your content</span>
                        </li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                        The AI will process your request and display the result in the Assistant panel. To insert the output into your document, simply press Tab.
                    </p>
                </>
            )
        },
        {
            id: 'features',
            icon: Zap,
            title: 'Key Features',
            content: (
                <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">•</span>
                        <span>AI-powered writing assistance</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">•</span>
                        <span>Custom template generation</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">•</span>
                        <span>Bioinformatics tools (BLAST, MAFFT, Protein structure prediction)</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">•</span>
                        <span>Research article search (PubMed, Semantic Scholar)</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">•</span>
                        <span>Figure explanation with AI</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400">•</span>
                        <span>Real-time writing suggestions</span>
                    </li>
                </ul>
            )
        }
    ];

    return (
        <div>
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-foreground mb-2">BioScribe Documentation</h1>
                <p className="text-lg text-muted-foreground">
                    Discover the power of AI-assisted writing with integrated bioinformatics tools. Explore our features below.
                </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
                {panels.map(({ id, icon: Icon, title, content }) => (
                    <Card key={id}>
                        <CardContent className="p-0">
                            <button
                                onClick={() => togglePanel(id)}
                                className="w-full flex items-center justify-between px-4 py-3 text-foreground hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <span className="font-medium">{title}</span>
                                </div>
                                {activePanel === id ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                            {activePanel === id && (
                                <div className="px-4 py-3 border-t border-border bg-muted/30">
                                    {content}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default DemoPage;
