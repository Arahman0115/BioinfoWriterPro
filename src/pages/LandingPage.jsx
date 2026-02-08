import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import deoxy from '../assets/deoxy.png';
import { Dna, BarChart3, Brain, BookOpen } from 'lucide-react';

const features = [
  { icon: Dna, title: 'Genomic Data Analysis', description: 'Streamline your genomic data analysis workflow with our intelligent tools.' },
  { icon: BarChart3, title: 'Data Visualization', description: 'Create publication-ready figures and charts with ease.' },
  { icon: Brain, title: 'AI-Assisted Writing', description: 'Get smart suggestions and autocompletions tailored for bioinformatics papers.' },
  { icon: BookOpen, title: 'Literature Integration', description: 'Seamlessly integrate and cite relevant research papers.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={deoxy} alt="BioScribe" className="h-8 w-8" />
          <span className="font-semibold text-lg text-foreground">BioScribe</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Log In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-3xl mx-auto text-center px-6 pt-20 pb-16">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          BioScribe
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          Accelerate Your Bioinformatics Research with AI-Powered Writing
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/login">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Get Started
            </Button>
          </Link>
          <Link to="/demo">
            <Button variant="outline" size="lg">
              View Docs
            </Button>
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold text-center text-foreground mb-10">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border">
                <CardContent className="p-5">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 p-2.5 w-fit mb-3">
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-medium text-sm text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>


    </div>
  );
};

export default LandingPage;
