"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for album creation
interface Album {
  id: string;
  title: string;
  productUrl: string;
}

/**
 * AlbumCreator component that integrates with Google Photos Library API
 * to create albums and add selected photos to them
 */
export function AlbumCreator({ 
  photoIds, 
  onAlbumCreated 
}: { 
  photoIds: string[], 
  onAlbumCreated: (album: Album) => void 
}) {
  const { data: session } = useSession();
  const [albumTitle, setAlbumTitle] = useState("Photo Analysis Results");
  const [isCreating, setIsCreating] = useState(false);
  
  // Function to create a new album and add selected photos
  const createAlbum = async () => {
    if (!session?.accessToken || photoIds.length === 0) {
      console.error("No access token available or no photos selected");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create a new album
      const createResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          album: { title: albumTitle }
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create album: ${createResponse.statusText}`);
      }
      
      const albumData = await createResponse.json();
      
      // Add photos to the album
      const addResponse = await fetch(`https://photoslibrary.googleapis.com/v1/albums/${albumData.id}:batchAddMediaItems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaItemIds: photoIds
        })
      });
      
      if (!addResponse.ok) {
        throw new Error(`Failed to add photos to album: ${addResponse.statusText}`);
      }
      
      // Notify parent component of successful album creation
      onAlbumCreated({
        id: albumData.id,
        title: albumData.title,
        productUrl: albumData.productUrl
      });
      
    } catch (error) {
      console.error("Error creating album:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Create Album</CardTitle>
        <CardDescription>
          Create a new album with your selected photos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="album-title" className="text-sm font-medium">
            Album Title
          </label>
          <input
            id="album-title"
            type="text"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
        
        <Button 
          onClick={createAlbum} 
          disabled={!session || isCreating || photoIds.length === 0}
          className="w-full"
        >
          {isCreating ? "Creating..." : `Create Album with ${photoIds.length} Photos`}
        </Button>
      </CardContent>
    </Card>
  );
}
