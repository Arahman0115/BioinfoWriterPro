import 'global';
import React, { useState, useRef, useEffect } from 'react';
import '../styles/Writer.css';
import Toolbar from '../components/Toolbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveContent } from '../utils/contentManager';
import { Editor, EditorState, ContentState, Modifier, CompositeDecorator, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import Spinner from '../components/Spinner';
import GoogleDocsWriter from './GoogleDocsWriter';

// Helper function for MLA citation format
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

const Writer = () => {
  // --- CORRECTED HOOK ORDER ---
  // 1. Hooks that provide values (navigation, location)
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  // 2. State Hooks (`useState`). `currentProject` can now safely use `location`.
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

  // 3. Ref Hooks
  const suggestionTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  // --- END OF HOOKS ---

  // Decorator setup for Draft.js
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
    <span className="styled-block">{props.children}</span>
  );

  const decorator = new CompositeDecorator([
    { strategy: triggerWordStrategy, component: TriggerWordSpan },
  ]);

  // Effect for fetching initial project data from location state
  useEffect(() => {
    const projectFromLocation = location.state?.project;
    if (projectFromLocation) {
      const { title = '', sections = {}, sectionOrder, articles = [] } = projectFromLocation;
      setTitle(title);
      // Ensure sections are populated correctly, even if empty
      const initialSections = Object.keys(sections).length > 0 ? sections : { Template: { content: '' } };
      setSections(
        Object.entries(initialSections).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            content: EditorState.createWithContent(
              ContentState.createFromText(value.content || ''),
              decorator
            ),
          };
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

  // Effect for fetching associated research articles
  useEffect(() => {
    const fetchArticles = async () => {
      if (user && currentProject?.id) {
        try {
          const articlesCollection = collection(db, `users/${user.uid}/projects/${currentProject.id}/researcharticles`);
          const articlesSnapshot = await getDocs(articlesCollection);
          const articlesList = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setArticles(articlesList);
        } catch (error) {
          console.error("Error fetching articles: ", error);
        }
      }
    };
    fetchArticles();
  }, [user, currentProject?.id]);

  const handleChange = (editorState) => {
    const updatedSections = {
      ...sections,
      [activeSection]: { ...sections[activeSection], content: editorState },
    };
    setSections(updatedSections);
    setIsEditing(true);
    setFeedbackMessage('Editing...');

    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Suggestion logic
    suggestionTimeoutRef.current = setTimeout(async () => {
      const currentContent = editorState.getCurrentContent().getPlainText();
      if (currentContent.trim() && user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ text: currentContent.trim() }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Server error');
          if (data.suggestion) {
            setSuggestion(data.suggestion);
            setPreviousSuggestions(prev => [...prev, data.suggestion]);
          }
        } catch (error) {
          console.error('Error getting suggestion:', error);
          setFeedbackMessage('Suggestion error');
        } finally {
          setIsEditing(false);
        }
      } else {
        setIsEditing(false);
      }
    }, 2000);

    // Corrected save logic
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const contentToSave = Object.entries(updatedSections).reduce((acc, [key, value]) => {
          acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
          return acc;
        }, {});

        const result = await saveContent(user, currentProject, contentToSave, sectionOrder, title, articles);

        if (result?.isNew) {
          const newProjectData = { id: result.id, title, sections: contentToSave, sectionOrder, articles };
          setCurrentProject(newProjectData);
          window.history.replaceState({ ...window.history.state, usr: { ...(window.history.state.usr || {}), project: newProjectData }}, '');
        }
        setFeedbackMessage('Saving...');
        setTimeout(() => setFeedbackMessage('Saved'), 2000);
      } catch (error) {
        console.error('Error saving content:', error);
        setFeedbackMessage('Error saving content');
      }
    }, 4000);
  };

  const getContentToSave = () => {
    return Object.entries(sections).reduce((acc, [key, value]) => {
        acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
        return acc;
    }, {});
  };

  const handleSave = () => {
    saveContent(user, currentProject, getContentToSave(), sectionOrder, title, articles);
    setFeedbackMessage('Saved!');
    setTimeout(() => setFeedbackMessage(''), 2000);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      saveContent(user, currentProject, getContentToSave(), sectionOrder, title, articles);
    }
  };

  const handleDeleteSection = (sectionName) => {
    if (sectionName === 'Template' || Object.keys(sections).length <= 1) return;
    const newSections = { ...sections };
    delete newSections[sectionName];
    setSections(newSections);
    const newSectionOrder = sectionOrder.filter(name => name !== sectionName);
    setSectionOrder(newSectionOrder);
    if (activeSection === sectionName) {
      setActiveSection(newSectionOrder[0] || '');
    }
    const contentToSave = Object.entries(newSections).reduce((acc, [key, value]) => {
      acc[key] = { ...value, content: value.content.getCurrentContent().getPlainText() };
      return acc;
    }, {});
    saveContent(user, currentProject, contentToSave, newSectionOrder, title, articles);
  };

  const handleKeyCommand = (command, editorState) => {
    if (command === 'insert-suggestion' && suggestion) {
      const newState = Modifier.insertText(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        suggestion
      );
      handleChange(EditorState.push(editorState, newState, 'insert-characters'));
      setSuggestion('');
      return 'handled';
    }
    return 'not-handled';
  };

  const keyBindingFn = (e) => {
    if (e.keyCode === 9 && !e.shiftKey && suggestion) {
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
    const newSectionContent = content instanceof EditorState
        ? content : EditorState.createEmpty(decorator);
    setSections(prev => ({ ...prev, [sectionTitle]: { id: `section-${Date.now()}`, content: newSectionContent }}));
    setSectionOrder(prev => [...prev, sectionTitle]);
    setNewSection('');
    setActiveSection(sectionTitle);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSectionOrder(items);
  };

  const combineSections = () => {
    return sectionOrder
      .map(name => sections[name]?.content.getCurrentContent().getPlainText())
      .filter(Boolean)
      .join('\n\n');
  };

  const handleDownload = () => {
    const content = combineSections();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
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
    const templateContent = sections['Template'].content.getCurrentContent().getPlainText();
    const sectionRegex = /([IVX]+)\.\s+([^\r\n]+)((?:\r?\n(?![IVX]+\.))*)*/g;
    let match;
    while ((match = sectionRegex.exec(templateContent)) !== null) {
      const sectionTitle = match[2].trim();
      const sectionContent = (match[3] || '').trim();
      const formattedContent = sectionContent.split('\n').filter(line => line.trim()).map(line => `• ${line.trim()}`).join('\n');
      const contentState = ContentState.createFromText(formattedContent);
      const editorState = EditorState.createWithContent(contentState, decorator);
      handleAddSection(sectionTitle, editorState);
    }
  };

  return (
    <div className="writer-container">
      <Toolbar
        onNewClick={() => navigate('/writer')}
        onSaveClick={handleSave}
        onDownloadClick={handleDownload}
        onExportWordClick={handleExportAsMicrosoftWord}
        onShowArticlesClick={toggleArticlesVisibility}
        onCitationMangerClick={handleCitationManagerClick}
      />
      <div className='writer-main'>
        <div className="outline-box">
          <div className='feedback-container'>
            {feedbackMessage && <div className="feedback-message">{feedbackMessage}</div>}
          </div>
          <h2>Outline</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="outline">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef}>
                  {sectionOrder.map((name, index) => (
                    <Draggable key={name} draggableId={name} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`section-item ${activeSection === name ? 'active' : ''}`}
                        >
                          <span onClick={() => switchSection(name)}>{name}</span>
                          {name !== 'Template' && (
                            <button
                              className="delete-section-btn"
                              onClick={(e) => { e.stopPropagation(); handleDeleteSection(name); }}
                            >
                              ×
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
          <div className="new-section">
            <input
              type="text"
              placeholder="Add new section..."
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection(newSection)}
            />
            <button onClick={() => handleAddSection(newSection)}>Add</button>
          </div>
          <button className="add-from-template" onClick={addSectionsFromTemplate}>
            Add Sections from Template
          </button>
        </div>

        <div className="writer">
          <div className="title-section">
            {isTitleEditing ? (
              <input
                type="text"
                className="title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                placeholder="Enter a title to start writing"
              />
            ) : (
              <h2
                className={`project-title ${!isTitleSet ? 'untitled' : ''}`}
                onClick={() => setIsTitleEditing(true)}
              >
                {isTitleSet ? title : 'Click to set title'}
              </h2>
            )}
          </div>
          {sections[activeSection] ? (
            <GoogleDocsWriter
              editorState={sections[activeSection].content}
              onChange={handleChange}
              handleKeyCommand={handleKeyCommand}
              keyBindingFn={keyBindingFn}
              title={title}
              activeSection={activeSection}
            />
          ) : (
            <p>Select a section to start writing, or add a new one.</p>
          )}
        </div>

        <div className="suggestion-overlay">
            <div className='sugtitle'>{showSuggestionHistory ? 'History' : 'WriterPro Assistant'}</div>
            <button className="history-button" onClick={toggleSuggestionHistory}>
              {showSuggestionHistory ? 'Current' : 'History'}
            </button>
            {!isEditing && !showSuggestionHistory && suggestion && (
              <span className="suggestion">{suggestion}</span>
            )}
            {!isEditing && showSuggestionHistory && (
              <div className="suggestion-history">
                <ul>
                  {previousSuggestions.slice(-5).reverse().map((prevSuggestion, index) => (
                    <li key={index} className="history-item">
                      {prevSuggestion}
                      <button
                        className="insert-suggestion-button"
                        onClick={() => handleSuggestionClick(prevSuggestion)}
                      >
                        Insert
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className='spinnerbox'>
              {isEditing && <Spinner />}
            </div>
        </div>

        <div className={`side-panel ${isArticlesVisible ? 'visible' : ''}`}>
          <h2>Research Articles</h2>
          {articles.length > 0 ? (
            <ul>
              {articles.map((article) => (
                <li key={article.id} className='articlebox'>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                    <p>{article.author}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No articles found for this project.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Writer;