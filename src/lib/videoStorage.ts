import { db } from './firebase';
import { storage } from './firebaseStorage';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface VideoLink {
  id: string;
  title: string;
  description: string;
  videoLink: string;
  adLink: string;
  thumbnail: string;
  createdAt: string;
}

export const generateUniqueId = async (): Promise<string> => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  let newId: string;
  let attempts = 0;
  const maxAttempts = 10000;
  
  do {
    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    newId = `${letter1}${letter2}${numbers}`;
    
    const docRef = doc(db, 'videos', newId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      break;
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique ID. Database may be full.');
  }
  
  return newId;
};

export const uploadImageToStorage = async (file: File, id: string): Promise<string> => {
  const storageRef = ref(storage, `images/${id}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export const saveVideoLink = async (
  videoLink: Omit<VideoLink, 'id' | 'createdAt'>,
  thumbnailFile?: File
): Promise<VideoLink> => {
  const id = await generateUniqueId();
  const createdAt = new Date().toISOString();
  
  let thumbnailURL = videoLink.thumbnail;
  if (thumbnailFile) {
    thumbnailURL = await uploadImageToStorage(thumbnailFile, id);
  }
  
  const newLink: VideoLink = {
    ...videoLink,
    id,
    thumbnail: thumbnailURL,
    createdAt,
  };
  
  // Use the video ID as the document ID
  const docRef = doc(db, 'videos', id);
  await setDoc(docRef, newLink);
  
  return newLink;
};

export const getVideoLinkById = async (id: string): Promise<VideoLink | null> => {
  const docRef = doc(db, 'videos', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return docSnap.data() as VideoLink;
};

export const incrementVideoCounter = async (id: string): Promise<number> => {
  const docRef = doc(db, 'videos', id);
  await updateDoc(docRef, { counter: increment(1) });
  
  // Fetch the updated document to get the new counter value
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data().counter || 1) : 1;
};

