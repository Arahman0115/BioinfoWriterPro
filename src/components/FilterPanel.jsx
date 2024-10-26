// src/components/FilterPanel.jsx
import React from 'react';
import '../styles/FilterPanel.css';
const FilterPanel = ({ filters, setFilters }) => {
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="filter-panel">
            <h3>Filters</h3>
            <label>
                Sequence Type:
                <select name="sequenceType" onChange={handleFilterChange}>
                    <option value="">All</option>
                    <option value="genomic">Genomic</option>
                    <option value="mRNA">mRNA</option>
                    <option value="protein">Protein</option>
                </select>
            </label>
            <label>
                Organism:
                <input type="text" name="organism" onChange={handleFilterChange} />
            </label>
            <label>
                Min Length:
                <input type="number" name="minLength" onChange={handleFilterChange} />
            </label>
            <label>
                Max Length:
                <input type="number" name="maxLength" onChange={handleFilterChange} />
            </label>
        </div>
    );
};

export default FilterPanel;

