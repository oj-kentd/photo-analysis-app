"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for selected photos
interface SelectedPhoto {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
}

/**
 * PhotoPicker component that integrates with Google Photos Picker API
 * to allow users to select photos for analysis
 */
export function PhotoPicker({ onPhotosSelected }: { onPhotosSelected: (photos: SelectedPhoto[]) => void }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  // Function to initialize and open the Google Photos Picker
  const openPhotoPicker = async () => {
    if (!session?.accessToken) {
      console.error("No access token available");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Load the Google Photos Picker API script dynamically
      if (!window.gapi) {
        await loadGapiScript();
      }
      
      if (!window.gapi.client) {
        await new Promise<void>((resolve) => {
          window.gapi.load('client', () => resolve());
        });
      }
      
      // Initialize the Google Photos Picker
      await window.gapi.client.init({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/photoslibrary/v1/rest'],
      });
      
      // Create and configure the picker
      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.PHOTOS)
        .setOAuthToken(session.accessToken as string)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string)
        .setCallback(pickerCallback)
        .build();
      
      picker.setVisible(true);
    } catch (error) {
      console.error("Error opening photo picker:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Callback function for the picker
  const pickerCallback = (data: any) => {
    if (data.action === google.picker.Action.PICKED) {
      const selectedPhotos: SelectedPhoto[] = data.docs.map((doc: any) => ({
        id: doc.id,
        baseUrl: doc.baseUrl,
        filename: doc.name,
        mimeType: doc.mimeType
      }));
      
      onPhotosSelected(selectedPhotos);
    }
  };
  
  // Helper function to load the Google API script
  const loadGapiScript = () => {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select Photos</CardTitle>
        <CardDescription>
          Choose photos from your Google Photos library to analyze
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={openPhotoPicker} 
          disabled={!session || isLoading}
          className="w-full"
        >
          {isLoading ? "Loading..." : "Open Google Photos Picker"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Add type definitions for Google API
declare global {
  interface Window {
    gapi: any;
    google: {
      picker: {
        PickerBuilder: any;
        ViewId: {
          PHOTOS: string;
        };
        Action: {
          PICKED: string;
        };
      };
    };
  }
}
