"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { PhotoPicker } from "@/components/photos/photo-picker";
import { PhotoAnalyzer } from "@/components/analysis/photo-analyzer";
import { AlbumCreator } from "@/components/photos/album-creator";
import { LoginButton } from "@/components/auth/login-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for selected photos and analysis results
interface SelectedPhoto {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
}

interface AnalysisResult {
  photoId: string;
  technicalQuality: {
    blurScore: number;
    noiseScore: number;
    exposureScore: number;
    overallScore: number;
  };
  aesthetics: {
    meanScore: number;
    scoreDistribution: number[];
  };
  faceExpressions: {
    faceCount: number;
    expressions: any[];
    bestExpressionScore: number;
  };
  overallScore: number;
}

export default function Home() {
  const { data: session } = useSession();
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [albumCreated, setAlbumCreated] = useState(false);
  
  // Handle photo selection
  const handlePhotosSelected = (photos: SelectedPhoto[]) => {
    setSelectedPhotos(photos);
    setAnalysisResults([]);
    setSelectedPhotoIds([]);
    setAlbumCreated(false);
  };
  
  // Handle analysis completion
  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisResults(results);
    // Auto-select top 10 photos or all if less than 10
    const topPhotoIds = results
      .slice(0, Math.min(10, results.length))
      .map(result => result.photoId);
    setSelectedPhotoIds(topPhotoIds);
  };
  
  // Handle photo selection toggle
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => 
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };
  
  // Handle album creation
  const handleAlbumCreated = (album: any) => {
    setAlbumCreated(true);
  };
  
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Photo Analysis App</h1>
      
      {!session ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign in to get started</CardTitle>
              <CardDescription>
                Connect with your Google account to access your photos
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LoginButton />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Step 1: Select Photos */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Step 1: Select Photos</h2>
            <PhotoPicker onPhotosSelected={handlePhotosSelected} />
            
            {selectedPhotos.length > 0 && (
              <p className="mt-2 text-center">
                {selectedPhotos.length} photos selected
              </p>
            )}
          </section>
          
          {/* Step 2: Analyze Photos */}
          {selectedPhotos.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Step 2: Analyze Photos</h2>
              <PhotoAnalyzer 
                photos={selectedPhotos} 
                onAnalysisComplete={handleAnalysisComplete} 
              />
            </section>
          )}
          
          {/* Step 3: Review Results */}
          {analysisResults.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Step 3: Review Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResults.map(result => {
                  const photo = selectedPhotos.find(p => p.id === result.photoId);
                  if (!photo) return null;
                  
                  return (
                    <Card 
                      key={result.photoId}
                      className={`cursor-pointer ${
                        selectedPhotoIds.includes(result.photoId) 
                          ? 'ring-2 ring-blue-500' 
                          : ''
                      }`}
                      onClick={() => togglePhotoSelection(result.photoId)}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={`${photo.baseUrl}=w400-h400`} 
                          alt={photo.filename}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium truncate">{photo.filename}</h3>
                          <span className="text-sm font-bold">
                            {Math.round(result.overallScore * 100)}%
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Technical:</span>
                            <span>{Math.round(result.technicalQuality.overallScore * 100)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Aesthetic:</span>
                            <span>{Math.round((result.aesthetics.meanScore / 10) * 100)}%</span>
                          </div>
                          {result.faceExpressions.faceCount > 0 && (
                            <div className="flex justify-between">
                              <span>Faces ({result.faceExpressions.faceCount}):</span>
                              <span>{Math.round(result.faceExpressions.bestExpressionScore * 100)}%</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-4 text-center">
                <p>
                  {selectedPhotoIds.length} of {analysisResults.length} photos selected
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Click on photos to select/deselect them
                </p>
              </div>
            </section>
          )}
          
          {/* Step 4: Create Album */}
          {selectedPhotoIds.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Step 4: Create Album</h2>
              <AlbumCreator 
                photoIds={selectedPhotoIds} 
                onAlbumCreated={handleAlbumCreated} 
              />
              
              {albumCreated && (
                <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md text-center">
                  Album created successfully! Check your Google Photos account.
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
