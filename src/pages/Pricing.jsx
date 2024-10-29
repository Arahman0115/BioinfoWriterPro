import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Pricing.css';

const Pricing = () => {
    const plans = [
        {
            name: 'Free',
            price: '$0',
            features: [
                'AI-powered writing assistance (10 requests/day)',
                'Text summarization (5 requests/day)',
                'Figure explanation (1 request/day)',
                'Basic data visualization tools',
                'Limited BLAST searches (5/day)',
                'Limited protein structure predictions (1/day)',
                'Limited multiple sequence alignments (3/day)',
            ],
            buttonText: 'Sign Up Free',
        },
        {
            name: 'Basic',
            price: '$10',
            features: [
                'AI-powered writing assistance (100 requests/day)',
                'Text summarization (50 requests/day)',
                'Figure explanation (5 requests/day)',
                'Advanced data visualization tools',
                'Unlimited BLAST searches',
                'Unlimited protein structure predictions',
                'Unlimited multiple sequence alignments',
            ],
            buttonText: 'Choose Basic',
        },
        {
            name: 'Pro',
            price: '$25',
            features: [
                'AI-powered writing assistance (300 requests/day)',
                'Text summarization (150 requests/day)',
                'Figure explanation (20 requests/day)',
                'Advanced data visualization tools',
                'Unlimited BLAST searches',
                'Unlimited protein structure predictions',
                'Unlimited multiple sequence alignments',
                'Priority support',
            ],
            buttonText: 'Choose Pro',
        },
    ];

    return (
        <div className="pricing-container">
            <h1>Choose Your Plan</h1>
            <div className="pricing-grid">
                {plans.map((plan, index) => (
                    <div key={index} className={`pricing-card ${plan.name.toLowerCase()}`}>
                        <h2>{plan.name}</h2>
                        <p className="price">{plan.price}<span>{plan.price !== '$0' ? '/month' : ''}</span></p>
                        <ul>
                            {plan.features.map((feature, featureIndex) => (
                                <li key={featureIndex}>{feature}</li>
                            ))}
                        </ul>
                        <Link to={plan.name === 'Free' ? "/signup" : "/signup?plan=" + plan.name.toLowerCase()} className="ccta-button">
                            {plan.buttonText}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Pricing;
