import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import wbg from './wbg.png'; // Assume you have a logo file

const LandingPage = () => {
    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <img src={wbg} alt="BioinfoWriterPro Logo" className="logo" />
                <div className="nav-links">
                    <Link to="/features">Features</Link>
                    <Link to="/pricing">Pricing</Link>
                    <Link to="/about">About</Link>
                    <Link to="/login" className="login-btn">Log In</Link>
                    <Link to="/signup" className="signup-btn">Sign Up</Link>
                </div>
            </nav>
            <header className="hero">
                <h1>BioScribe</h1>
                <p className="tagline">Accelerate Your Bioinformatics Research with AI-Powered Writing</p>
                <div className="cta-buttons">
                    <Link to="/signup" className="cta-button primary">Start Free Trial</Link>
                    <Link to="/demo" className="cta-button secondary">Watch Demo</Link>
                </div>
            </header>
            <section className="features-section">
                <h2>Key Features</h2>
                <div className="feature-grid">
                    <div className="feature-item">
                        <i className="feature-icon">🧬</i>
                        <h3>Genomic Data Analysis</h3>
                        <p>Streamline your genomic data analysis workflow with our intelligent tools.</p>
                    </div>
                    <div className="feature-item">
                        <i className="feature-icon">📊</i>
                        <h3>Data Visualization</h3>
                        <p>Create publication-ready figures and charts with ease.</p>
                    </div>
                    <div className="feature-item">
                        <i className="feature-icon">🤖</i>
                        <h3>AI-Assisted Writing</h3>
                        <p>Get smart suggestions and autocompletions tailored for bioinformatics papers.</p>
                    </div>
                    <div className="feature-item">
                        <i className="feature-icon">📚</i>
                        <h3>Literature Integration</h3>
                        <p>Seamlessly integrate and cite relevant research papers.</p>
                    </div>
                </div>
            </section>
            <section className="testimonial-section">
                <h2>What Our Users Say</h2>
                <div className="testimonial">
                    <p>"BioinfoWriterPro has revolutionized how I write research papers. It's an indispensable tool for any bioinformatician."</p>
                    <cite>- Dr. Jane Doe, Lead Researcher at Genomics Institute</cite>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
