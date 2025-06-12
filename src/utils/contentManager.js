import { collection, addDoc, setDoc, getDocs, doc } from 'firebase/firestore';
import { debounce } from 'lodash';
import { db, auth } from '../firebase/firebase';

// Function to save content to Firestore
export const saveContent = async (user, project, updatedSections, sectionOrder, title, articles) => {
    const currentProject = {
      title,
      sections: updatedSections,
      sectionOrder,
      lastEdited: Date.now(),
      articles
    };

    if (user) {
      try {
        let projectId = project?.id;

        // If no project ID exists, create a new document and store its ID
        if (!projectId) {
          const newDocRef = await addDoc(collection(db, `users/${user.uid}/projects`), currentProject);
          projectId = newDocRef.id;
          // Return both the ID and a flag indicating this is a new document
          return {
            id: projectId,
            isNew: true
          };
        }

        // Update existing document
        const docRef = doc(db, `users/${user.uid}/projects`, projectId);
        await setDoc(docRef, currentProject, { merge: true });
        return {
          id: projectId,
          isNew: false
        };
      } catch (e) {
        console.error("Error saving document: ", e);
        throw e;
      }
    } else {
      console.log('User is not authenticated');
    }
  };

// Function to load a project from Firestore
