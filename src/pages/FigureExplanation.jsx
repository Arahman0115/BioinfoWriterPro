import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { Upload, Loader2 } from 'lucide-react';

const FigureExplanation = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExplain = async () => {
        if (!selectedImage) {
            alert('Please select an image first.');
            return;
        }

        setLoading(true);
        setExplanation('');

        try {
            // Read file as base64 for onCall (no multipart needed)
            const imageBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(selectedImage);
            });

            const { data } = await httpsCallable(functions, 'explainFigure', { timeout: 120000 })({
                imageBase64,
                mimeType: selectedImage.type
            });

            setExplanation(formatExplanation(data.explanation));
        } catch (error) {
            console.error('Error explaining figure:', error);
            setExplanation(error.message || 'Failed to explain figure. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatExplanation = (text) => {
        // Replace markdown-style headers with HTML headers
        text = text.replace(/#{1,6}\s?([^\n]+)/g, (match, p1, offset, string) => {
            const level = match.trim().split(' ')[0].length;
            return `<h${level}>${p1}</h${level}>`;
        });

        // Replace ** or __ with <strong> tags
        text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

        // Replace * or _ with <em> tags
        text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

        // Replace newlines with <br> tags
        text = text.replace(/\n/g, '<br>');

        return text;
    };

    return (
        <div>
            <PageHeader
                title="Figure Explanation"
                subtitle="Upload an image and get an AI-powered explanation"
            />

            <Card className="mb-6">
                <CardContent className="p-4 space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/50">
                        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Select Figure Image</span>
                            <span className="text-xs text-muted-foreground">PNG, JPG, or other image formats</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            id="image-upload"
                            className="hidden"
                        />
                    </div>

                    {imagePreview && (
                        <div className="border border-border rounded-lg overflow-hidden bg-background">
                            <img src={imagePreview} alt="Selected figure" className="w-full max-h-96 object-contain" />
                        </div>
                    )}

                    <Button
                        onClick={handleExplain}
                        disabled={!selectedImage || loading}
                        className="w-full"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {loading ? 'Explaining Figure...' : 'Explain Figure'}
                    </Button>
                </CardContent>
            </Card>

            {explanation && (
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-sm font-medium text-foreground mb-3">Explanation</h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                            <div dangerouslySetInnerHTML={{ __html: explanation }} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FigureExplanation;
