import 'global';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/Writer.css';
import Toolbar from '../components/Toolbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';
import { debounce } from 'lodash';
import Spinner from '../components/Spinner';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveContent } from '../utils/contentManager';
import { Editor, EditorState, ContentState, Modifier, CompositeDecorator, getDefaultKeyBinding } from 'draft-js';
import 'draft-js/dist/Draft.css';
import deoxy from '../assets/deoxy.png';
import GoogleDocsWriter from './GoogleDocsWriter';

const formatCitation = (article) => {
  // Basic MLA format: Author(s). "Title of Source." Title of Container, Other contributors, Version, Number, Publisher, Publication Date, Location.
  let citation = '';

  // Author
  if (article.author) {
    citation += `${article.author}. `;
  }

  // Title
  if (article.title) {
    citation += `"${article.title}." `;
  }

  // We don't have all MLA fields, so we'll add what we have
  if (article.journal) {
    citation += `${article.journal}, `;
  }

  // Publication date (assuming it's available)
  if (article.publicationDate) {
    citation += `${article.publicationDate}, `;
  }

  // URL
  if (article.url) {
    citation += `${article.url}. `;
  }

  // Access date (current date)
  citation += `Accessed ${new Date().toLocaleDateString()}.`;

  return citation;
};

const Writer = () => {
  const [title, setTitle] = useState('');
  const [isTitleSet, setIsTitleSet] = useState(false);
  const [sectionOrder, setSectionOrder] = useState([]);
  const [suggestion, setSuggestion] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('Template');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isArticlesVisible, setIsArticlesVisible] = useState(false);
  const [articles, setArticles] = useState([]);
  const [previousSuggestions, setPreviousSuggestions] = useState([]);
  const [showSuggestionHistory, setShowSuggestionHistory] = useState(false);

  const navigate = useNavigate();
  const [sections, setSections] = useState({
    Template: { id: 'section-1', content: EditorState.createEmpty() },
    Body: { id: 'section-2', content: EditorState.createEmpty() },
    Conclusion: { id: 'section-3', content: EditorState.createEmpty() }
  });
  const [newSection, setNewSection] = useState('');
  const location = useLocation();
  const user = auth.currentUser;
  const suggestionTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const triggerWordStrategy = (contentBlock, callback, contentState) => {
    const text = contentBlock.getText();
    const regex = /@(template|summarize)\b/gi;
    let matchArr, start;
    while ((matchArr = regex.exec(text)) !== null) {
      start = matchArr.index;
      callback(start, start + matchArr[0].length);
    }
  };

  const TriggerWordSpan = (props) => {
    return <span className="styled-block">{props.children}</span>;
  };

  const decorator = new CompositeDecorator([
    {
      strategy: triggerWordStrategy,
      component: TriggerWordSpan,
    },
  ]);

  useEffect(() => {
    const fetchArticles = async () => {
      const project = location.state?.project;
      if (user && project) {
        try {
          const articlesCollection = collection(db, `users/${user.uid}/projects/${project.id}/researcharticles`);
          const articlesSnapshot = await getDocs(articlesCollection);
          const articlesList = articlesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setArticles(articlesList);
        } catch (error) {
          console.error("Error fetching articles: ", error);
        }
      }
    };

    fetchArticles();
  }, [user, location.state?.project]);

  useEffect(() => {
    const fetchSectionOrder = async () => {
      const project = location.state?.project;
      if (project) {
        const { title, sections, sectionOrder, articles } = project;
        setTitle(title);
        setSections(Object.entries(sections).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            content: EditorState.createWithContent(
              ContentState.createFromText(value.content || ''),
              decorator
            )
          };
          return acc;
        }, {}));
        setSectionOrder(sectionOrder || Object.keys(sections));
        setActiveSection(sectionOrder?.[0] || 'Template');  // Set a default active section
        setIsTitleSet(!!title);
        setArticles(articles || []);
      } else {
        setSectionOrder(['Template', 'Body', 'Conclusion']);
        setActiveSection('Template');  // Set a default active section
      }
    };

    fetchSectionOrder();
  }, [location]);

  const handleExportAsMicrosoftWord = () => {
    const content = combineSections(); // Combine all section contents

    // Create a new document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun(content),
              ],
            }),
          ],
        },
      ],
    });

    // Generate the Word document and save it
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${title || 'Untitled'}.docx`);
    });
  };

  const handleChange = async (editorState) => {
    const updatedSections = {
      ...sections,
      [activeSection]: { ...sections[activeSection], content: editorState },
    };
    setSections(updatedSections);
    setIsEditing(true);
    setFeedbackMessage('Editing...');

    // Clear existing timeouts
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Handle text completion suggestion
    suggestionTimeoutRef.current = setTimeout(async () => {
      const currentContent = editorState.getCurrentContent().getPlainText();
      if (currentContent.trim()) {
        try {
          const payload = {
            text: currentContent.trim()
          };
    
          console.log('Sending request payload:', payload);
    
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload)
          });
    
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Server error details:', data);
            throw new Error(data.error || 'Server error');
          }
    
          if (!data.suggestion) {
            throw new Error('No suggestion received from server');
          }
    
          setSuggestion(data.suggestion);
          setPreviousSuggestions(prev => [...prev, data.suggestion]);
          setIsEditing(false);
        } catch (error) {
          console.error('Error getting suggestion:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
          setIsEditing(false);
          setFeedbackMessage('Failed to get suggestion');
        }
      }
    }, 2000);
    // Handle saving with proper project ID management
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const contentToSave = Object.entries(updatedSections).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            content: value.content.getCurrentContent().getPlainText()
          };
          return acc;
        }, {});

        const result = await saveContent(
          user,
          location.state?.project,
          contentToSave,
          sectionOrder,
          title,
          articles
        );

        // If this is a new document, update the location state without navigation
        if (result?.isNew) {
          // Update the location state without triggering a re-render
          window.history.replaceState(
            {
              ...window.history.state,
              usr: {
                ...window.history.state.usr,
                project: {
                  ...location.state?.project,
                  id: result.id,
                  sections: contentToSave,
                  title: title
                }
              }
            },
            ''
          );
        }

        setFeedbackMessage('Saving...');
        setTimeout(() => {
          setFeedbackMessage('Saved');
        }, 2000);
      } catch (error) {
        console.error('Error saving content:', error);
        setFeedbackMessage('Error saving content');
      }
    }, 4000);
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
    if (e.keyCode === 9 && !e.shiftKey && suggestion) { // 9 is the keyCode for Tab
      e.preventDefault();
      return 'insert-suggestion';
    }
    return getDefaultKeyBinding(e);
  };

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
    if (title.trim() !== '') {
      setIsTitleSet(true);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      saveContent(user, location.state?.project, updatedSections, updatedSectionOrder, title, articles);
    }
  };

  const switchSection = (sectionName) => {
    if (sections[sectionName]) {
      setActiveSection(sectionName);
    } else {
      console.error(`Section ${sectionName} does not exist`);
      // Optionally, set a default section or show an error message
    }
  };

  const handleAddSection = (sectionTitle, content = null) => {
    if (!sectionTitle) return;

    // Create new section with content if provided
    const newSectionContent = content instanceof EditorState 
        ? content  // Use provided EditorState directly
        : EditorState.createEmpty(decorator);  // Create empty EditorState if none provided

    setSections(prevSections => ({
        ...prevSections,
        [sectionTitle]: {
            id: `section-${Date.now()}`,
            content: newSectionContent
        }
    }));

    setSectionOrder(prevOrder => [...prevOrder, sectionTitle]);
    setNewSection(''); // Clear the input field
    setActiveSection(sectionTitle); // Switch to the newly created section
};

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSectionOrder(items);
  };

  const handleDownload = () => {
    const content = combineSections(); // Combine all section contents
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'Untitled'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);  // Clean up
    URL.revokeObjectURL(url);  // Free up memory
  };

  const toggleArticlesVisibility = () => {
    setIsArticlesVisible(prevState => !prevState);
  };

  const handleCitationManagerClick = () => {
    if (articles.length > 0) {
      const mlaCitations = articles.map(formatCitation);
      const citationsContent = mlaCitations.join('\n\n');

      // Use handleAddSection to add or update the "Citations" section
      handleAddSection('Citations', citationsContent);

      // Switch to the newly created or updated Citations section
      switchSection('Citations');

      setFeedbackMessage('Citations added successfully!');
      setTimeout(() => setFeedbackMessage(''), 3000);
    } else {
      setFeedbackMessage('No articles available for citation.');
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };
  const handleSave = () => {
    saveContent(user, location.state?.project, updatedSections, updatedSectionOrder, title, articles);

  };

  const toggleSuggestionHistory = () => {
    setShowSuggestionHistory(!showSuggestionHistory);
  };

  const handleSuggestionClick = (suggestionText) => {
    const currentContent = sections[activeSection].content.getCurrentContent();
    const selection = sections[activeSection].content.getSelection();

    const newContent = Modifier.insertText(
      currentContent,
      selection,
      suggestionText
    );

    const newEditorState = EditorState.push(
      sections[activeSection].content,
      newContent,
      'insert-characters'
    );

    handleChange(newEditorState);
    setSuggestion('');
    setShowSuggestionHistory(false);
  };

  const addSectionsFromTemplate = () => {
    const templateContent = sections['Template'].content.getCurrentContent().getPlainText();
    
    // Regex to match main sections with Roman numerals and their content
    const mainSectionRegex = /([IVX]+)\.\s+([^\r\n]+)(?:\r?\n|\r)+((?:(?:[A-Z]\.\s+)?[^IVX\r\n][^\r\n]*\r?\n?)*)/g;
    
    // Regex to match subsections starting with letters (A., B., etc.)
    const subSectionRegex = /([A-Z])\.\s+([^\r\n]+)(?:\r?\n|\r)+((?:[^A-Z\r\n][^\r\n]*\r?\n?)*)/g;
    
    let match;
    while ((match = mainSectionRegex.exec(templateContent)) !== null) {
        const sectionNumber = match[1];
        const sectionTitle = match[2].trim();
        const sectionContent = match[3];
        
        // Check if the section has letter-based subsections
        const hasSubsections = sectionContent.match(/[A-Z]\.\s+/);
        
        if (hasSubsections) {
            // Process content with subsections
            let formattedContent = '';
            let subMatch;
            
            while ((subMatch = subSectionRegex.exec(sectionContent)) !== null) {
                const subSectionLetter = subMatch[1];
                const subSectionTitle = subMatch[2];
                const subSectionContent = subMatch[3];
                
                // Add subsection title
                formattedContent += `• ${subSectionTitle}\n`;
                
                // Process bullet points within subsection
                const bulletPoints = subSectionContent
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => `  • ${line.trim()}`)
                    .join('\n');
                
                formattedContent += bulletPoints + '\n';
            }
            
            const contentState = ContentState.createFromText(formattedContent.trim());
            const editorState = EditorState.createWithContent(contentState, decorator);
            handleAddSection(sectionTitle, editorState);
            
        } else {
            // Process content without subsections (simple bullet points)
            const formattedContent = sectionContent
                .split('\n')
                .filter(line => line.trim())
                .map(line => `• ${line.trim().replace(/^-\s*/, '')}`)
                .join('\n');
            
            const contentState = ContentState.createFromText(formattedContent.trim());
            const editorState = EditorState.createWithContent(contentState, decorator);
            handleAddSection(sectionTitle, editorState);
        }
    }
};

  const handleDeleteSection = (sectionName) => {
    if (sectionName === 'Template') {
      // Optionally, show an alert or message that the Template section can't be deleted
      return;
    }

    // Update local state
    setSections(prevSections => {
      const newSections = { ...prevSections };
      delete newSections[sectionName];
      return newSections;
    });

    setSectionOrder(prevOrder => prevOrder.filter(name => name !== sectionName));

    if (activeSection === sectionName) {
      setActiveSection(sectionOrder[0] || 'Template');
    }

    // Trigger save content to update Firebase
    const updatedSections = { ...sections };
    delete updatedSections[sectionName];
    const updatedSectionOrder = sectionOrder.filter(name => name !== sectionName);
    saveContent(user, location.state?.project, updatedSections, updatedSectionOrder, title, articles);

    console.log(`Section "${sectionName}" deleted successfully`);
  };

  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      // Cancel any pending save operations
      saveContent.cancel();

      // Clear the state
      setSections({});
      setTitle('');
      setSectionOrder([]);
      // ... clear other relevant state
    };
  }, []);

  // Add a useEffect to handle project updates
  useEffect(() => {
    const project = location.state?.project;
    if (project?.id && project?.sections) {
      // Only update if we have actual content
      setSections(prevSections => {
        const newSections = { ...prevSections };
        Object.entries(project.sections).forEach(([key, value]) => {
          if (value.content) {
            newSections[key] = {
              ...value,
              content: EditorState.createWithContent(
                ContentState.createFromText(value.content),
                decorator
              )
            };
          }
        });
        return newSections;
      });

      if (project.title) {
        setTitle(project.title);
        setIsTitleSet(true);
      }
    }
  }, [location.state?.project?.id]);

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
                          className="section-item"
                        >
                          <span onClick={() => switchSection(name)}>{name}</span>
                          {name !== 'Template' && (
                            <button
                              className="delete-section-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(name);
                              }}
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
            <p>No content available for this section.</p>
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
                  {previousSuggestions.map((prevSuggestion, index) => (
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
                <div key={article.id} className='articlebox'>
                  <li>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.url}
                    </a>
                    <a href={article.author} target="_blank" rel="noopener noreferrer">
                      {article.author}
                    </a>
                  </li>
                </div>
              ))}
            </ul>
          ) : (
            <p>No articles found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Writer;
