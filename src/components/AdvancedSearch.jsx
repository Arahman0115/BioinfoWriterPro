// src/components/AdvancedSearch.jsx
import './AdvancedSearch.css';
import React, { useState } from 'react';

const AdvancedSearch = ({ criteria, setCriteria }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (e) => {
        setCriteria({ ...criteria, [e.target.name]: e.target.value });
    };

    return (
        <div className="advanced-search">
            <button onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Hide' : 'Show'} Advanced Search
            </button>
            {isExpanded && (
                <form>
                    <label>
                        Organism:
                        <input type="text" name="organism" onChange={handleChange} />
                    </label>
                    <label>
                        Molecule Type:
                        <select name="moleculeType" onChange={handleChange}>
                            <option value="">Any</option>
                            <option value="DNA">DNA</option>
                            <option value="RNA">RNA</option>
                            <option value="protein">Protein</option>
                        </select>
                    </label>
                    <label>
                        Date Range:
                        <input type="date" name="dateFrom" onChange={handleChange} />
                        <input type="date" name="dateTo" onChange={handleChange} />
                    </label>
                </form>
            )}
        </div>
    );
};

export default AdvancedSearch;

