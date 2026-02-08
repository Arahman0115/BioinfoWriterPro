import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Check } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <h1 className="text-4xl font-bold text-foreground mb-2">Choose Your Plan</h1>
                <p className="text-lg text-muted-foreground">Access powerful bioinformatics tools with flexible pricing</p>
            </div>

            {/* Pricing cards */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <Card
                            key={index}
                            className={`relative transition-all ${
                                plan.name === 'Pro'
                                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-600 dark:ring-indigo-400'
                                    : ''
                            }`}
                        >
                            {plan.name === 'Pro' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-indigo-600 text-white">Recommended</Badge>
                                </div>
                            )}

                            <CardContent className="p-6 space-y-6">
                                {/* Plan name and price */}
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
                                    <div className="mt-2">
                                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                        {plan.price !== '$0' && <span className="text-muted-foreground">/month</span>}
                                    </div>
                                </div>

                                {/* Features list */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex gap-3">
                                            <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                            <span className="text-sm text-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA button */}
                                <Link
                                    to={plan.name === 'Free' ? "/signup" : `/signup?plan=${plan.name.toLowerCase()}`}
                                    className="block"
                                >
                                    <Button
                                        className="w-full"
                                        variant={plan.name === 'Pro' ? 'default' : 'outline'}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pricing;
