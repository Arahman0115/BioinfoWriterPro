import 'global';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db, auth } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';
import { saveContent } from '../utils/contentManager';
import { Editor, EditorState, ContentState, Modifier, CompositeDecorator, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import GoogleDocsWriter from './GoogleDocsWriter';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  Save, Download, FileDown, BookOpen, Quote, Plus, X,
  GripVertical, Loader2, History, Sparkles, SparkleIcon,
  PanelRightOpen, PanelRightClose
} from 'lucide-react';

const formatCitation = (article) => {
  let citation = '';
  if (article.author) citation += `${article.author}. `;
  if (article.title) citation += `"${article.title}." `;
  if (article.journal) citation += `${article.journal}, `;
  if (article.publicationDate) citation += `${article.publicationDate}, `;
  if (article.url) citation += `${article.url}. `;
  citation += `Accessed ${new Date().toLocaleDateString()}.`;
  return citation;
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Writer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user } = useAuth();

  const [currentProject, setCurrentProject] = useState(location.state?.project);
  const [title, setTitle] = useState('');
  const [isTitleSet, setIsTitleSet] = useState(false);
  const [sections, setSections] = useState({
    Template: { id: 'section-1', content: EditorState.createEmpty() },
  });
  const [sectionOrder, setSectionOrder] = useState([]);
  const [activeSection, setActiveSection] = useState('Template');
  const [newSection, setNewSection] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [previousSuggestions, setPreviousSuggestions] = useState([]);
  const [showSuggestionHistory, setShowSuggestionHistory] = useState(false);
  const [isArticlesVisible, setIsArticlesVisible] = useState(false);
  const [articles, setArticles] = useState([]);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [userWantsTextPrediction, setUserWantsTextPrediction] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);

  const suggestionTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSaveContentRef = useRef(null);

  const triggerWordStrategy = (contentBlock, callback) => {
    const text = contentBlock.getText();
    const regex = /@(template|summarize)\b/gi;
    let matchArr;
    while ((matchArr = regex.exec(text)) !== null) {
      const start = matchArr.index;
      callback(start, start + matchArr[0].length);
    }
  };
  const TriggerWordSpan = (props) => (
    <span className="bg-indigo-100 dark:bg-indigo-900 rounded px-0.5">{props.children}</span>
  );
  const decorator = new CompositeDecorator([{ strategy: triggerWordStrategy, component: TriggerWordSpan }]);

  const debouncedSaveContent = useCallback(debounce(async (contentToSave, currentSectionOrder, currentTitle, currentArticles) => {
    if (isSaving) return;
    const contentHash = JSON.stringify({ content: contentToSave, sectionOrder: currentSectionOrder, title: currentTitle, articles: currentArticles });
    if (lastSaveContentRef.current === contentHash) return;

    setIsSaving(true);
    setFeedbackMessage('Saving...');
    try {
      const result = await saveContent(user, currentProject, contentToSave, currentSectionOrder, currentTitle, currentArticles);
      if (result?.isNew) {
        const newProjectData = { id: result.id, title: currentTitle, sections: contentToSave, sectionOrder: currentSectionOrder, articles: currentArticles };
        setCurrentProject(newProjectData);
        window.history.replaceState({ ...window.history.state, usr: { ...(window.history.state.usr || {}), project: newProjectData }}, '');
      }
      lastSaveContentRef.current = contentHash;
      setFeedbackMessage('Saved');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } catch (error) {
      console.error('Error saving content:', error);
      setFeedbackMessage('Error saving');
      setTimeout(() => setFeedbackMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  }, 3000), [user, currentProject, isSaving]);

  useEffect(() => {
    const projectFromLocation = location.state?.project;
    if (projectFromLocation) {
      const { title = '', sections = {}, sectionOrder, articles = [] } = projectFromLocation;
      setTitle(title);
      const initialSections = Object.keys(sections).length > 0 ? sections : { Template: { content: '' } };
      setSections(
        Object.entries(initialSections).reduce((acc, [key, value]) => {
          acc[key] = { ...value, content: EditorState.createWithContent(ContentState.createFromText(value.content || ''), decorator) };
          return acc;
        }, {})
      );
      const initialSectionOrder = sectionOrder || Object.keys(initialSections);
      setSectionOrder(initialSectionOrder);
      setActiveSection(initialSectionOrder[0] || 'Template');
      setIsTitleSet(!!title);
      setArticles(articles);
    } else {
      setSectionOrder(['Template']);
      setActiveSection('Template');
    }
  }, [location.state?.project]);

  useEffect(() => {
    const fetchArticles = async () => {
      if (user && currentProject?.id) {
        try {
          const articlesCollection = collection(db, `users/${user.uid}/projects/${currentProject.id}/researcharticles`);
          const articlesSnapshot = await getDocs(articlesCollection);
          setArticles(articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error("Error fetching articles: ", error); }
      }
    };
    fetchArticles();
  }, [user, currentProject?.id]);

  useEffect(() => {
    return () => {
      clearTimeout(suggestionTimeoutRef.current);
      clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const getSelectedText = (editorState) => {
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) return '';
    const content = editorState.getCurrentContent();
    const startKey = selection.getStartKey();
    const endKey = selection.getEndKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();
    if (startKey === endKey) {
      return content.getBlockForKey(startKey).getText().slice(startOffset, endOffset);
    }
    let text = content.getBlockForKey(startKey).getText().slice(startOffset) + '\n';
    let block = content.getBlockAfter(startKey);
    while (block && block.getKey() !== endKey) {
      text += block.getText() + '\n';
      block = content.getBlockAfter(block.getKey());
    }
    return text + content.getBlockForKey(endKey).getText().slice(0, endOffset);
  };

  const handleRequestSuggestion = async () => {
    const contextText = selectedText ||
      sections[activeSection]?.content.getCurrentContent().getPlainText().slice(-1500);
    if (!contextText?.trim() || !user) return;
    setIsFetchingSuggestion(true);
    try {
      const { data } = await httpsCallable(functions, 'predict')({ text: contextText.trim() });
      if (data.suggestion) {
        setSuggestion(data.suggestion);
        setPreviousSuggestions(prev => [...prev, data.suggestion]);
      }
    } catch (error) {
      console.error('Error getting suggestion:', error);
    } finally {
      setIsFetchingSuggestion(false);
    }
  };

  const handleChange = useCallback((editorState) => {
    const updatedSections = { ...sections, [activeSection]: { ...sections[activeSection], content: editorState } };
    setSections(updatedSections);
    setIsEditing(true);
    setFeedbackMessage('Editing...');

    // Track selection for on-demand suggestions
    setSelectedText(getSelectedText(editorState));

    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    suggestionTimeoutRef.current = setTimeout(() => { setIsEditing(false); }, 500);

    const contentToSave = Object.entries(updatedSections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});
    debouncedSaveContent(contentToSave, sectionOrder, title, articles);
  }, [sections, activeSection, sectionOrder, title, articles, userWantsTextPrediction, user, debouncedSaveContent]);

  const handleSave = async () => {
    const contentToSave = Object.entries(sections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});

    console.log('📝 SAVE BUTTON PRESSED', {
      user: user ? { uid: user.uid, email: user.email } : 'NULL - NOT AUTHENTICATED',
      currentProject: currentProject ? { id: currentProject.id, title: currentProject.title } : 'NULL - NEW PROJECT',
      title,
      contentToSave,
      sectionOrder,
      articles,
    });

    if (!user) {
      console.error('❌ SAVE FAILED: user is null');
      setFeedbackMessage('Error: not signed in');
      return;
    }

    setIsSaving(true);
    setFeedbackMessage('Saving...');
    try {
      const result = await saveContent(user, currentProject, contentToSave, sectionOrder, title, articles);
      console.log('✅ SAVE SUCCESS', result);
      if (result?.isNew) {
        const newProjectData = { id: result.id, title, sections: contentToSave, sectionOrder, articles };
        setCurrentProject(newProjectData);
        window.history.replaceState({ ...window.history.state, usr: { ...(window.history.state.usr || {}), project: newProjectData } }, '');
      }
      setFeedbackMessage('Saved');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } catch (error) {
      console.error('❌ SAVE ERROR', error);
      setFeedbackMessage('Error saving');
      setTimeout(() => setFeedbackMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      const contentToSave = Object.entries(sections).reduce((acc, [key, value]) => {
        acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
        return acc;
      }, {});
      debouncedSaveContent(contentToSave, sectionOrder, title, articles);
    }
  };

  const handleDeleteSection = (sectionName) => {
    if (sectionName === 'Template' || Object.keys(sections).length <= 1) return;
    const newSections = { ...sections };
    delete newSections[sectionName];
    setSections(newSections);
    const newSectionOrder = sectionOrder.filter(name => name !== sectionName);
    setSectionOrder(newSectionOrder);
    if (activeSection === sectionName) setActiveSection(newSectionOrder[0] || '');
    const contentToSave = Object.entries(newSections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});
    debouncedSaveContent(contentToSave, newSectionOrder, title, articles);
  };

  const handleKeyCommand = (command, editorState) => {
    if (command === 'insert-suggestion' && suggestion && userWantsTextPrediction) {
      const newState = Modifier.insertText(editorState.getCurrentContent(), editorState.getSelection(), suggestion);
      handleChange(EditorState.push(editorState, newState, 'insert-characters'));
      setSuggestion('');
      return 'handled';
    }
    return 'not-handled';
  };

  const keyBindingFn = (e) => {
    if (e.keyCode === 9 && !e.shiftKey && suggestion && userWantsTextPrediction) {
      e.preventDefault();
      return 'insert-suggestion';
    }
    return getDefaultKeyBinding(e);
  };

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    if (title.trim() !== '') setIsTitleSet(true);
  };

  const switchSection = (sectionName) => {
    if (sections[sectionName]) setActiveSection(sectionName);
  };

  const handleAddSection = (sectionTitle, content = null) => {
    if (!sectionTitle || sections[sectionTitle]) return;
    const newSectionContent = content instanceof EditorState ? content : EditorState.createEmpty(decorator);
    const updatedSections = { ...sections, [sectionTitle]: { id: `section-${Date.now()}`, content: newSectionContent }};
    const updatedSectionOrder = [...sectionOrder, sectionTitle];
    setSections(updatedSections);
    setSectionOrder(updatedSectionOrder);
    setNewSection('');
    setActiveSection(sectionTitle);
    const contentToSave = Object.entries(updatedSections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});
    debouncedSaveContent(contentToSave, updatedSectionOrder, title, articles);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSectionOrder(items);
    const contentToSave = Object.entries(sections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});
    debouncedSaveContent(contentToSave, items, title, articles);
  };

  const combineSections = () => {
    return sectionOrder.map(name => sections[name]?.content.getCurrentContent().getPlainText()).filter(Boolean).join('\n\n');
  };

  const handleDownload = () => {
    const blob = new Blob([combineSections()], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title || 'Untitled'}.txt`);
  };

  const handleExportAsMicrosoftWord = () => {
    const doc = new Document({
      sections: sectionOrder.map(name => ({
        properties: {},
        children: [new Paragraph(sections[name]?.content.getCurrentContent().getPlainText())],
      })),
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, `${title || 'Untitled'}.docx`));
  };

  const toggleArticlesVisibility = () => setIsArticlesVisible(prev => !prev);

  const handleCitationManagerClick = () => {
    if (articles.length > 0) {
      const citationsContent = articles.map(formatCitation).join('\n\n');
      const contentState = ContentState.createFromText(citationsContent);
      const editorState = EditorState.createWithContent(contentState, decorator);
      handleAddSection('Citations', editorState);
      switchSection('Citations');
    }
  };

  const toggleSuggestionHistory = () => setShowSuggestionHistory(prev => !prev);

  const handleSuggestionClick = (suggestionText) => {
    const content = sections[activeSection].content;
    const newContent = Modifier.insertText(content.getCurrentContent(), content.getSelection(), suggestionText);
    handleChange(EditorState.push(content, newContent, 'insert-characters'));
    setSuggestion('');
    setShowSuggestionHistory(false);
  };

  const addSectionsFromTemplate = () => {
    const templateContent = sections['Template']?.content.getCurrentContent().getPlainText();
    if (!templateContent) return;

    const sectionRegex = /^(\d+)\.\s+(.+)$/gm;
    const matches = [...templateContent.matchAll(sectionRegex)];
    if (matches.length === 0) return;

    // Build all new sections in one pass to avoid stale closure overwrites
    const newSections = { ...sections };
    const newSectionOrder = [...sectionOrder];

    matches.forEach((match, i) => {
      const sectionTitle = match[2].trim();
      const start = match.index + match[0].length;
      const end = matches[i + 1]?.index ?? templateContent.length;
      const content = templateContent.slice(start, end).trim();
      if (sectionTitle && !newSections[sectionTitle]) {
        newSections[sectionTitle] = {
          id: `section-${Date.now()}-${i}`,
          content: EditorState.createWithContent(ContentState.createFromText(content), decorator),
        };
        newSectionOrder.push(sectionTitle);
      }
    });

    setSections(newSections);
    setSectionOrder(newSectionOrder);
    setActiveSection(newSectionOrder[newSectionOrder.length - 1]);

    const contentToSave = Object.entries(newSections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});
    debouncedSaveContent(contentToSave, newSectionOrder, title, articles);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" onClick={handleSave} className="gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Export TXT
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportAsMicrosoftWord} className="gap-1.5 text-xs">
          <FileDown className="h-3.5 w-3.5" /> Export Word
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCitationManagerClick} className="gap-1.5 text-xs">
          <Quote className="h-3.5 w-3.5" /> Citations
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleArticlesVisibility} className="gap-1.5 text-xs">
          {isArticlesVisible ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          Articles
        </Button>

        {/* Save status */}
        <div className="ml-auto">
          {feedbackMessage && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              feedbackMessage === 'Saved' || feedbackMessage === 'Saved!'
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : feedbackMessage.includes('Error')
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-muted text-muted-foreground"
            )}>
              {feedbackMessage}
            </span>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Outline panel */}
        <div className="w-52 shrink-0 border-r border-border bg-muted/30 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outline</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="outline">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5">
                    {sectionOrder.map((name, index) => (
                      <Draggable key={name} draggableId={name} index={index}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center group rounded-md text-sm transition-colors",
                              activeSection === name
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                : "text-muted-foreground hover:bg-accent",
                              snapshot.isDragging && "shadow-md"
                            )}
                          >
                            <span {...provided.dragHandleProps} className="p-1 opacity-0 group-hover:opacity-50 cursor-grab">
                              <GripVertical className="h-3 w-3" />
                            </span>
                            <button
                              className="flex-1 text-left py-1.5 pr-1 text-xs truncate"
                              onClick={() => switchSection(name)}
                            >
                              {name}
                            </button>
                            {name !== 'Template' && (
                              <button
                                className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDeleteSection(name); }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div className="p-2 border-t border-border space-y-1.5">
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="New section..."
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection(newSection)}
                className="flex-1 min-w-0 text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleAddSection(newSection)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={addSectionsFromTemplate}>
              Add from Template
            </Button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Title */}
          <div className="px-8 pt-6 pb-2">
            {isTitleEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                placeholder="Enter a title..."
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            ) : (
              <h2
                className={cn(
                  "text-2xl font-semibold cursor-pointer",
                  isTitleSet ? "text-foreground" : "text-muted-foreground"
                )}
                onClick={() => setIsTitleEditing(true)}
              >
                {isTitleSet ? title : 'Click to set title'}
              </h2>
            )}
          </div>

          {/* Draft.js editor */}
          <div className="flex-1 px-8 pb-8 overflow-y-auto">
            {sections[activeSection] ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <GoogleDocsWriter
                  editorState={sections[activeSection].content}
                  onChange={handleChange}
                  handleKeyCommand={handleKeyCommand}
                  keyBindingFn={keyBindingFn}
                  title={title}
                  activeSection={activeSection}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a section to start writing, or add a new one.</p>
            )}
          </div>
        </div>

        {/* AI Suggestions panel */}
        <div className="w-72 shrink-0 border-l border-border bg-muted/30 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {showSuggestionHistory ? 'History' : 'AI Assistant'}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSuggestionHistory}
                className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                title={showSuggestionHistory ? 'Current' : 'History'}
              >
                <History className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setUserWantsTextPrediction(prev => !prev)}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  userWantsTextPrediction
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950"
                    : "text-muted-foreground hover:bg-accent"
                )}
                title={userWantsTextPrediction ? "Turn off AI" : "Turn on AI"}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {userWantsTextPrediction && !showSuggestionHistory && (
              <div className="mb-3">
                <Button
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={handleRequestSuggestion}
                  disabled={isFetchingSuggestion}
                >
                  {isFetchingSuggestion
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...</>
                    : <><Sparkles className="h-3.5 w-3.5" /> {selectedText ? 'Suggest for selection' : 'Suggest continuation'}</>
                  }
                </Button>
                {selectedText && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
                    Selected: "{selectedText.slice(0, 40)}{selectedText.length > 40 ? '…' : ''}"
                  </p>
                )}
              </div>
            )}

            {!showSuggestionHistory && suggestion && userWantsTextPrediction && (
              <div className="space-y-2">
                <p className="text-sm text-foreground leading-relaxed">{suggestion}</p>
                <p className="text-[10px] text-muted-foreground">Press Tab to insert</p>
              </div>
            )}

            {showSuggestionHistory && (
              <div className="space-y-2">
                {previousSuggestions.slice(-5).reverse().map((prevSuggestion, index) => (
                  <div key={index} className="rounded-md border border-border p-2 text-xs">
                    <p className="text-foreground line-clamp-3">{prevSuggestion}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 text-[10px]"
                      onClick={() => handleSuggestionClick(prevSuggestion)}
                    >
                      Insert
                    </Button>
                  </div>
                ))}
                {previousSuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No suggestion history yet.</p>
                )}
              </div>
            )}


            {!userWantsTextPrediction && (
              <p className="text-xs text-muted-foreground">AI text completion is disabled.</p>
            )}
          </div>
        </div>

        {/* Articles side panel */}
        {isArticlesVisible && (
          <div className="w-72 shrink-0 border-l border-border bg-muted/30 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Research Articles</h2>
              <button onClick={toggleArticlesVisibility} className="p-1 rounded-md text-muted-foreground hover:bg-accent">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {articles.length > 0 ? (
                <div className="space-y-2">
                  {articles.map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md border border-border p-2 hover:border-indigo-300 transition-colors"
                    >
                      <p className="text-xs font-medium text-foreground line-clamp-2">{article.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{article.author}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No articles found for this project.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Writer;
