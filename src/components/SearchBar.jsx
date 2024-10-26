// src/components/SearchBar.jsx
import '../styles/SearchBar.css';
import React from 'react';

const SearchBar = ({ searchTerm, setSearchTerm, onSearch }) => {
    return (
        <div className="search-bar4">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter gene name, accession number, or keyword"
            />
            <button onClick={onSearch}>Search</button>
        </div>
    );
};

export default SearchBar;

