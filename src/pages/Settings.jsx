import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent } from '../components/ui/Card';
import { Upload, User, Bot } from 'lucide-react';

const Settings = () => {
    const { currentUser } = useAuth();
    const [name, setName] = useState(currentUser?.displayName || '');
    const [profilePic, setProfilePic] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(currentUser?.photoURL || '');
    const [tone, setTone] = useState('neutral');
    const [language, setLanguage] = useState('English');
    const [suggestions, setSuggestions] = useState(true);
    const [updateMessage, setUpdateMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.displayName || '');
            setProfilePicPreview(currentUser.photoURL || '');
        }
    }, [currentUser]);

    const uploadProfilePicture = async (file, userId) => {
        const storage = getStorage();
        const storageRef = ref(storage, `profilePictures/${userId}`);

        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, {
                profilePictureUrl: downloadURL
            }, { merge: true });

            return downloadURL;
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            throw error;
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            let photoURL = currentUser.photoURL;

            if (profilePic) {
                photoURL = await uploadProfilePicture(profilePic, currentUser.uid);
            }

            await updateProfile(currentUser, {
                displayName: name,
                photoURL: photoURL
            });

            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                displayName: name,
                profilePictureUrl: photoURL
            }, { merge: true });

            setProfilePicPreview(photoURL);
            setMessageType('success');
            setUpdateMessage("Profile updated successfully!");
            setTimeout(() => setUpdateMessage(''), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessageType('error');
            setUpdateMessage("Error updating profile. Please try again.");
            setTimeout(() => setUpdateMessage(''), 3000);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePic(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBotSettingsUpdate = (e) => {
        e.preventDefault();
        console.log('Updated Bot Settings:', { tone, language, suggestions });
        setMessageType('success');
        setUpdateMessage("Bot settings updated successfully!");
        setTimeout(() => setUpdateMessage(''), 3000);
    };

    return (
        <div>
            <PageHeader
                title="Settings"
                subtitle="Manage your profile and preferences"
            />

            <div className="max-w-4xl space-y-6">
                {/* User Profile Section */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
                        </div>

                        {updateMessage && (
                            <div
                                className={`rounded-md p-3 mb-4 ${
                                    messageType === 'success'
                                        ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                                        : 'bg-destructive/10 border border-destructive/20'
                                }`}
                            >
                                <p
                                    className={`text-sm ${
                                        messageType === 'success'
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-destructive'
                                    }`}
                                >
                                    {updateMessage}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Profile Picture</Label>
                                <div className="mt-2 flex flex-col gap-4">
                                    {profilePicPreview && (
                                        <img
                                            src={profilePicPreview}
                                            alt="Profile Preview"
                                            className="h-32 w-32 rounded-lg object-cover border border-border"
                                            crossOrigin="anonymous"
                                        />
                                    )}
                                    <div className="flex items-center gap-3">
                                        <label
                                            htmlFor="profile-pic"
                                            className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-muted cursor-pointer transition-colors"
                                        >
                                            <Upload className="h-4 w-4" />
                                            <span className="text-sm font-medium">Choose Image</span>
                                        </label>
                                        <input
                                            type="file"
                                            id="profile-pic"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        {profilePic && <span className="text-sm text-muted-foreground">{profilePic.name}</span>}
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full sm:w-auto">
                                Update Profile
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Writing Bot Settings Section */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-lg font-semibold text-foreground">Writing Bot Settings</h2>
                        </div>

                        <form onSubmit={handleBotSettingsUpdate} className="space-y-4">
                            <div>
                                <Label htmlFor="tone">Writing Tone</Label>
                                <select
                                    id="tone"
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="neutral">Neutral</option>
                                    <option value="formal">Formal</option>
                                    <option value="friendly">Friendly</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="language">Language</Label>
                                <select
                                    id="language"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="suggestions"
                                    checked={suggestions}
                                    onChange={(e) => setSuggestions(e.target.checked)}
                                    className="h-4 w-4 rounded border border-input cursor-pointer"
                                />
                                <Label htmlFor="suggestions" className="!mt-0 cursor-pointer">
                                    Enable AI Suggestions
                                </Label>
                            </div>

                            <Button type="submit" className="w-full sm:w-auto">
                                Update Bot Settings
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
