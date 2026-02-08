import { collection, addDoc, setDoc, getDocs, doc } from 'firebase/firestore';
import { debounce } from 'lodash';
import { db, auth } from '../firebase/firebase';
import { logFirebaseOperation, logFirebaseError, getFirebaseErrorMessage } from './firebaseDebug';

// Function to save content to Firestore
export const saveContent = async (user, project, updatedSections, sectionOrder, title, articles) => {
    console.log('🔥 contentManager.saveContent called', {
      userId: user?.uid,
      userEmail: user?.email,
      projectId: project?.id,
      title,
      sectionCount: Object.keys(updatedSections || {}).length,
      sectionOrder,
      articleCount: articles?.length,
    });

    const currentProject = {
      title,
      sections: updatedSections,
      sectionOrder,
      lastEdited: Date.now(),
      articles
    };

    if (!user) {
      logFirebaseError('saveContent', new Error('User is not authenticated'));
      throw new Error('User is not authenticated');
    }

    try {
      let projectId = project?.id;

      logFirebaseOperation('saveContent', {
        userId: user.uid,
        isNewProject: !projectId,
        title,
        hasArticles: Boolean(articles?.length)
      });

      // If no project ID exists, create a new document and store its ID
      if (!projectId) {
        const newDocRef = await addDoc(collection(db, `users/${user.uid}/projects`), currentProject);
        projectId = newDocRef.id;

        logFirebaseOperation('saveContent-success', {
          operation: 'create',
          projectId,
          title
        });

        // Return both the ID and a flag indicating this is a new document
        return {
          id: projectId,
          isNew: true
        };
      }

      // Update existing document
      const docRef = doc(db, `users/${user.uid}/projects`, projectId);
      await setDoc(docRef, currentProject, { merge: true });

      logFirebaseOperation('saveContent-success', {
        operation: 'update',
        projectId,
        title
      });

      return {
        id: projectId,
        isNew: false
      };
    } catch (error) {
      logFirebaseError('saveContent', error);
      console.error('❌ FIREBASE ERROR on save:', {
        code: error.code,
        message: error.message,
        friendlyMessage: getFirebaseErrorMessage(error)
      });
      throw error;
    }
  };

// Function to load a project from Firestore
