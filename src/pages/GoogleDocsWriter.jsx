import React, { useState } from 'react';
import { Editor } from 'draft-js';

export default function GoogleDocsWriter({ 
  editorState, 
  onChange, 
  handleKeyCommand, 
  keyBindingFn,
  title,
  activeSection
}) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (e) => {
    setScrollPosition(e.target.scrollTop);
  };

  return (
    <div className="google-docs-container" onScroll={handleScroll}>
      <div className="paper-container">
        <div className={`paper ${scrollPosition > 0 ? 'paper-shadow-both' : 'paper-shadow'}`}>
          <div className="section-indicator">
            {activeSection}
          </div>
          <div className="editor-container">
            <Editor
              editorState={editorState}
              onChange={onChange}
              handleKeyCommand={handleKeyCommand}
              keyBindingFn={keyBindingFn}
              placeholder="Start typing..."
            />
          </div>
        </div>
      </div>
   
    </div>
  );
}