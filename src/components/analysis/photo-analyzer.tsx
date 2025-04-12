"use client";

import { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceapi from "face-api.js";

// Define types for analysis results
interface TechnicalQualityResult {
  blurScore: number;
  noiseScore: number;
  exposureScore: number;
  overallScore: number;
}

interface AestheticResult {
  meanScore: number;
  scoreDistribution: number[];
}

interface FaceExpressionResult {
  faceCount: number;
  expressions: {
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
    neutral: number;
  }[];
  bestExpressionScore: number;
}

interface AnalysisResult {
  photoId: string;
  technicalQuality: TechnicalQualityResult;
  aesthetics: AestheticResult;
  faceExpressions: FaceExpressionResult;
  overallScore: number;
}

/**
 * PhotoAnalyzer component that analyzes photos for technical quality,
 * aesthetics, and face expressions
 */
export function PhotoAnalyzer({ 
  photos, 
  onAnalysisComplete 
}: { 
  photos: { id: string, baseUrl: string }[], 
  onAnalysisComplete: (results: AnalysisResult[]) => void 
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load TensorFlow.js model for NIMA aesthetic evaluation
        await tf.ready();
        
        // Load face-api.js models for face expression analysis
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/face-api');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models/face-api');
        
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    
    loadModels();
    
    // Create canvas element for image processing
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }
    
    return () => {
      // Clean up canvas on unmount
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, []);
  
  // Start analysis when photos are provided and models are loaded
  const startAnalysis = async () => {
    if (!modelsLoaded || photos.length === 0 || !canvasRef.current) {
      return;
    }
    
    setIsAnalyzing(true);
    setProgress(0);
    setResults([]);
    
    const analysisResults: AnalysisResult[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      try {
        const photo = photos[i];
        
        // Load image
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = `${photo.baseUrl}=w1024-h1024`;
        });
        
        // Analyze technical quality
        const technicalQuality = await analyzeTechnicalQuality(img);
        
        // Analyze aesthetics
        const aesthetics = await analyzeAesthetics(img);
        
        // Analyze face expressions
        const faceExpressions = await analyzeFaceExpressions(img);
        
        // Calculate overall score
        const overallScore = calculateOverallScore(
          technicalQuality,
          aesthetics,
          faceExpressions
        );
        
        // Add to results
        analysisResults.push({
          photoId: photo.id,
          technicalQuality,
          aesthetics,
          faceExpressions,
          overallScore
        });
        
        // Update progress
        setProgress(Math.round(((i + 1) / photos.length) * 100));
      } catch (error) {
        console.error(`Error analyzing photo ${i}:`, error);
      }
    }
    
    // Sort results by overall score (descending)
    analysisResults.sort((a, b) => b.overallScore - a.overallScore);
    
    setResults(analysisResults);
    setIsAnalyzing(false);
    onAnalysisComplete(analysisResults);
  };
  
  // Technical quality analysis (blur, noise, exposure)
  const analyzeTechnicalQuality = async (img: HTMLImageElement): Promise<TechnicalQualityResult> => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    // Resize image to fit canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze blur using Laplacian variance
    const blurScore = detectBlur(imageData);
    
    // Analyze noise using standard deviation in uniform areas
    const noiseScore = detectNoise(imageData);
    
    // Analyze exposure using histogram analysis
    const exposureScore = analyzeExposure(imageData);
    
    // Calculate overall technical quality score
    const overallScore = (blurScore * 0.4 + noiseScore * 0.3 + exposureScore * 0.3);
    
    return {
      blurScore,
      noiseScore,
      exposureScore,
      overallScore
    };
  };
  
  // Detect blur using Laplacian variance (higher variance = less blur)
  const detectBlur = (imageData: ImageData): number => {
    // Convert to grayscale
    const gray = new Uint8Array(imageData.width * imageData.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    // Apply Laplacian filter
    const laplacian = new Int16Array(gray.length);
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        laplacian[idx] = 
          -1 * gray[idx - width - 1] + -1 * gray[idx - width] + -1 * gray[idx - width + 1] +
          -1 * gray[idx - 1] + 8 * gray[idx] + -1 * gray[idx + 1] +
          -1 * gray[idx + width - 1] + -1 * gray[idx + width] + -1 * gray[idx + width + 1];
      }
    }
    
    // Calculate variance
    let sum = 0;
    let sumSquared = 0;
    let count = 0;
    
    for (let i = 0; i < laplacian.length; i++) {
      // Skip border pixels
      if (i % width === 0 || i % width === width - 1 || 
          i < width || i >= (height - 1) * width) {
        continue;
      }
      
      sum += laplacian[i];
      sumSquared += laplacian[i] * laplacian[i];
      count++;
    }
    
    const mean = sum / count;
    const variance = (sumSquared / count) - (mean * mean);
    
    // Normalize to 0-1 range (higher is better)
    // Empirically determined thresholds
    const normalizedScore = Math.min(1, Math.max(0, variance / 1000));
    
    return normalizedScore;
  };
  
  // Detect noise using standard deviation in uniform areas
  const detectNoise = (imageData: ImageData): number => {
    const blockSize = 8;
    const width = imageData.width;
    const height = imageData.height;
    const blocks = Math.floor(width / blockSize) * Math.floor(height / blockSize);
    
    let totalNoise = 0;
    let uniformBlocks = 0;
    
    // Analyze noise in small blocks
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const blockVariance = calculateBlockVariance(imageData, x, y, blockSize);
        
        // If block is relatively uniform (low variance in color)
        if (blockVariance.meanVariance < 100) {
          totalNoise += blockVariance.noiseLevel;
          uniformBlocks++;
        }
      }
    }
    
    // If no uniform blocks found, assume medium noise
    if (uniformBlocks === 0) {
      return 0.5;
    }
    
    const averageNoise = totalNoise / uniformBlocks;
    
    // Normalize to 0-1 range (higher is better = less noise)
    // Empirically determined thresholds
    const normalizedScore = Math.min(1, Math.max(0, 1 - (averageNoise / 20)));
    
    return normalizedScore;
  };
  
  // Calculate variance in a block to detect noise
  const calculateBlockVariance = (imageData: ImageData, x: number, y: number, blockSize: number) => {
    const width = imageData.width;
    const pixelValues: number[] = [];
    
    // Collect pixel values in the block
    for (let j = 0; j < blockSize; j++) {
      for (let i = 0; i < blockSize; i++) {
        const idx = ((y + j) * width + (x + i)) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        pixelValues.push(gray);
      }
    }
    
    // Calculate mean
    const mean = pixelValues.reduce((sum, val) => sum + val, 0) / pixelValues.length;
    
    // Calculate variance (color uniformity)
    const colorVariance = pixelValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixelValues.length;
    
    // Calculate noise level (standard deviation of differences between adjacent pixels)
    let diffSum = 0;
    let diffCount = 0;
    
    for (let j = 0; j < blockSize; j++) {
      for (let i = 0; i < blockSize - 1; i++) {
        const idx1 = j * blockSize + i;
        const idx2 = j * blockSize + i + 1;
        const diff = Math.abs(pixelValues[idx1] - pixelValues[idx2]);
        diffSum += diff;
        diffCount++;
      }
    }
    
    for (let i = 0; i < blockSize; i++) {
      for (let j = 0; j < blockSize - 1; j++) {
        const idx1 = j * blockSize + i;
        const idx2 = (j + 1) * blockSize + i;
        const diff = Math.abs(pixelValues[idx1] - pixelValues[idx2]);
        diffSum += diff;
        diffCount++;
      }
    }
    
    const noiseLevel = diffSum / diffCount;
    
    return {
      meanVariance: colorVariance,
      noiseLevel
    };
  };
  
  // Analyze exposure using histogram analysis
  const analyzeExposure = (imageData: ImageData): number => {
    // Create histogram
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histogram[gray]++;
    }
    
    // Normalize histogram
    const pixelCount = imageData.width * imageData.height;
    const normalizedHistogram = histogram.map(count => count / pixelCount);
    
    // Calculate mean and standard deviation
    let mean = 0;
    for (let i = 0; i < 256; i++) {
      mean += i * normalizedHistogram[i];
    }
    
    let stdDev = 0;
    for (let i = 0; i < 256; i++) {
      stdDev += Math.pow(i - mean, 2) * normalizedHistogram[i];
    }
    stdDev = Math.sqrt(stdDev);
    
    // Check for over/under exposure
    const darkPixelRatio = normalizedHistogram.slice(0, 50).reduce((sum, val) => sum + val, 0);
    const brightPixelRatio = normalizedHistogram.slice(200, 256).reduce((sum, val) => sum + val, 0);
    
    // Ideal mean is around 128 (middle of range)
    // Ideal standard deviation is around 50-60 (good contrast)
    const meanScore = 1 - Math.abs(mean - 128) / 128;
    const stdDevScore = Math.min(stdDev / 60, 1);
    
    // Penalize for too many dark or bright pixels
    const extremePixelPenalty = Math.max(0, darkPixelRatio - 0.1) + Math.max(0, brightPixelRatio - 0.1);
    
    // Calculate overall exposure score
    const exposureScore = Math.max(0, (meanScore * 0.5 + stdDevScore * 0.5) - extremePixelPenalty);
    
    return exposureScore;
  };
  
  // Aesthetic evaluation using a simplified NIMA-inspired approach
  const analyzeAesthetics = async (img: HTMLImageElement): Promise<AestheticResult> => {
    // In a real implementation, this would use a pre-trained NIMA model
    // For this prototype, we'll use a simplified approach based on composition rules
    
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    // Resize image to fit canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze color harmony
    const colorScore = analyzeColorHarmony(imageData);
    
    // Analyze composition
    const compositionScore = analyzeComposition(imageData);
    
    // Analyze contrast
    const contrastScore = analyzeContrast(imageData);
    
    // Generate a simulated score distribution (1-10)
    // In a real implementation, this would come from the NIMA model
    const meanScore = (colorScore * 0.4 + compositionScore * 0.4 + contrastScore * 0.2) * 9 + 1;
    const scoreDistribution = generateScoreDistribution(meanScore);
    
    return {
      meanScore,
      scoreDistribution
    };
  };
  
  // Analyze color harmony
  const analyzeColorHarmony = (imageData: ImageData): number => {
    // Extract dominant colors
    const colors = extractDominantColors(imageData);
    
    // Calculate color harmony score based on hue differences
    let harmonyScore = 0;
    
    if (colors.length >= 2) {
      // Check for complementary colors (hues ~180° apart)
      // Check for analogous colors (hues within 30° of each other)
      // Check for triadic colors (hues ~120° apart)
      
      let complementaryCount = 0;
      let analogousCount = 0;
      let triadicCount = 0;
      
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          const hueDiff = Math.abs(colors[i].hue - colors[j].hue);
          const normalizedHueDiff = Math.min(hueDiff, 360 - hueDiff);
          
          if (normalizedHueDiff > 165 && normalizedHueDiff < 195) {
            complementaryCount++;
          } else if (normalizedHueDiff < 30) {
            analogousCount++;
          } else if (normalizedHueDiff > 105 && normalizedHueDiff < 135) {
            triadicCount++;
          }
        }
      }
      
      // Calculate harmony score based on color relationships
      harmonyScore = Math.min(1, (complementaryCount * 0.3 + analogousCount * 0.2 + triadicCount * 0.2) / colors.length);
    }
    
    return harmonyScore;
  };
  
  // Extract dominant colors from image
  const extractDominantColors = (imageData: ImageData, maxColors = 5) => {
    const width = imageData.width;
    const height = imageData.height;
    const pixelCount = width * height;
    const sampleRate = Math.max(1, Math.floor(pixelCount / 1000)); // Sample at most 1000 pixels
    
    const colorMap = new Map<string, { count: number, r: number, g: number, b: number, hue: number, sat: number, val: number }>();
    
    // Sample pixels and count colors
    for (let i = 0; i < pixelCount; i += sampleRate) {
      const idx = i * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      
      // Convert to HSV
      const hsv = rgbToHsv(r, g, b);
      
      // Quantize colors to reduce variety
      const quantizedR = Math.floor(r / 16) * 16;
      const quantizedG = Math.floor(g / 16) * 16;
      const quantizedB = Math.floor(b / 16) * 16;
      
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      if (colorMap.has(colorKey)) {
        colorMap.get(colorKey)!.count++;
      } else {
        colorMap.set(colorKey, { 
          count: 1, 
          r: quantizedR, 
          g: quantizedG, 
          b: quantizedB,
          hue: hsv.h,
          sat: hsv.s,
          val: hsv.v
        });
      }
    }
    
    // Sort colors by count and take top N
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxColors);
    
    return sortedColors;
  };
  
  // Convert RGB to HSV
  const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    
    if (diff === 0) {
      h = 0;
    } else if (max === r) {
      h = 60 * ((g - b) / diff % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / diff + 2);
    } else {
      h = 60 * ((r - g) / diff + 4);
    }
    
    if (h < 0) {
      h += 360;
    }
    
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    return { h, s, v };
  };
  
  // Analyze composition using rule of thirds and visual balance
  const analyzeComposition = (imageData: ImageData): number => {
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate rule of thirds points
    const thirdX1 = Math.floor(width / 3);
    const thirdX2 = Math.floor(width * 2 / 3);
    const thirdY1 = Math.floor(height / 3);
    const thirdY2 = Math.floor(height * 2 / 3);
    
    // Find edges using a simple gradient approach
    const edges = findEdges(imageData);
    
    // Calculate interest at rule of thirds points
    const ruleOfThirdsScore = calculateRuleOfThirdsScore(edges, width, height, thirdX1, thirdX2, thirdY1, thirdY2);
    
    // Calculate visual balance
    const balanceScore = calculateVisualBalance(edges, width, height);
    
    // Combine scores
    return (ruleOfThirdsScore * 0.6 + balanceScore * 0.4);
  };
  
  // Find edges in image
  const findEdges = (imageData: ImageData) => {
    const width = imageData.width;
    const height = imageData.height;
    const edges = new Uint8Array(width * height);
    
    // Convert to grayscale
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    // Simple gradient-based edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Horizontal and vertical gradients
        const gx = Math.abs(gray[idx - 1] - gray[idx + 1]);
        const gy = Math.abs(gray[idx - width] - gray[idx + width]);
        
        // Gradient magnitude
        const g = Math.sqrt(gx * gx + gy * gy);
        
        // Threshold
        edges[idx] = g > 30 ? 255 : 0;
      }
    }
    
    return edges;
  };
  
  // Calculate rule of thirds score
  const calculateRuleOfThirdsScore = (
    edges: Uint8Array, 
    width: number, 
    height: number,
    thirdX1: number,
    thirdX2: number,
    thirdY1: number,
    thirdY2: number
  ) => {
    // Define regions around rule of thirds points
    const regionSize = Math.floor(Math.min(width, height) / 10);
    const regions = [
      { x: thirdX1, y: thirdY1 }, // Top-left intersection
      { x: thirdX2, y: thirdY1 }, // Top-right intersection
      { x: thirdX1, y: thirdY2 }, // Bottom-left intersection
      { x: thirdX2, y: thirdY2 }  // Bottom-right intersection
    ];
    
    // Calculate edge density in each region
    let totalEdgePixels = 0;
    let intersectionEdgePixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (edges[idx] > 0) {
          totalEdgePixels++;
          
          // Check if pixel is near any rule of thirds intersection
          for (const region of regions) {
            if (Math.abs(x - region.x) <= regionSize && Math.abs(y - region.y) <= regionSize) {
              intersectionEdgePixels++;
              break;
            }
          }
        }
      }
    }
    
    // If no edges found, return neutral score
    if (totalEdgePixels === 0) {
      return 0.5;
    }
    
    // Calculate ratio of edges at intersections vs. total edges
    const expectedRatio = (4 * regionSize * regionSize) / (width * height);
    const actualRatio = intersectionEdgePixels / totalEdgePixels;
    
    // Score is higher when actual ratio exceeds expected ratio
    const ruleOfThirdsScore = Math.min(1, actualRatio / (expectedRatio * 2));
    
    return ruleOfThirdsScore;
  };
  
  // Calculate visual balance
  const calculateVisualBalance = (edges: Uint8Array, width: number, height: number) => {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    let leftWeight = 0;
    let rightWeight = 0;
    let topWeight = 0;
    let bottomWeight = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (edges[idx] > 0) {
          // Horizontal balance
          if (x < centerX) {
            leftWeight++;
          } else {
            rightWeight++;
          }
          
          // Vertical balance
          if (y < centerY) {
            topWeight++;
          } else {
            bottomWeight++;
          }
        }
      }
    }
    
    // Calculate balance ratios (closer to 1 is better balanced)
    const horizontalBalance = Math.min(leftWeight, rightWeight) / Math.max(leftWeight, rightWeight);
    const verticalBalance = Math.min(topWeight, bottomWeight) / Math.max(topWeight, bottomWeight);
    
    // Combine horizontal and vertical balance
    const balanceScore = (horizontalBalance * 0.5 + verticalBalance * 0.5);
    
    return balanceScore;
  };
  
  // Analyze contrast
  const analyzeContrast = (imageData: ImageData): number => {
    // Create histogram
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histogram[gray]++;
    }
    
    // Find percentiles
    const pixelCount = imageData.width * imageData.height;
    let sum = 0;
    
    let p5 = 0;
    let p95 = 255;
    
    // Find 5th percentile
    for (let i = 0; i < 256; i++) {
      sum += histogram[i];
      if (sum >= pixelCount * 0.05) {
        p5 = i;
        break;
      }
    }
    
    // Reset sum and find 95th percentile
    sum = 0;
    for (let i = 255; i >= 0; i--) {
      sum += histogram[i];
      if (sum >= pixelCount * 0.05) {
        p95 = i;
        break;
      }
    }
    
    // Calculate contrast ratio
    const contrastRange = p95 - p5;
    
    // Normalize to 0-1 range
    // Ideal contrast range is around 200
    const contrastScore = Math.min(1, contrastRange / 200);
    
    return contrastScore;
  };
  
  // Generate a simulated score distribution around a mean
  const generateScoreDistribution = (meanScore: number): number[] => {
    const distribution = new Array(10).fill(0);
    
    // Create a bell curve around the mean
    const stdDev = 1.0;
    let sum = 0;
    
    for (let i = 0; i < 10; i++) {
      const score = i + 1; // Scores are 1-10
      const z = (score - meanScore) / stdDev;
      distribution[i] = Math.exp(-0.5 * z * z);
      sum += distribution[i];
    }
    
    // Normalize to sum to 1
    for (let i = 0; i < 10; i++) {
      distribution[i] /= sum;
    }
    
    return distribution;
  };
  
  // Analyze face expressions
  const analyzeFaceExpressions = async (img: HTMLImageElement): Promise<FaceExpressionResult> => {
    try {
      // Detect faces and expressions
      const detections = await faceapi.detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections.length === 0) {
        return {
          faceCount: 0,
          expressions: [],
          bestExpressionScore: 0
        };
      }
      
      // Extract expressions for each face
      const expressions = detections.map(detection => detection.expressions);
      
      // Calculate best expression score (prioritize happy expressions)
      let bestExpressionScore = 0;
      
      for (const expression of expressions) {
        // Happy expressions get highest weight
        const happyScore = expression.happy * 1.0;
        
        // Neutral expressions get medium weight
        const neutralScore = expression.neutral * 0.7;
        
        // Surprised expressions get lower weight
        const surprisedScore = expression.surprised * 0.5;
        
        // Negative expressions get lowest weight
        const negativeScore = (expression.sad + expression.angry + expression.fearful + expression.disgusted) * 0.1;
        
        const totalScore = happyScore + neutralScore + surprisedScore - negativeScore;
        bestExpressionScore = Math.max(bestExpressionScore, totalScore);
      }
      
      // Normalize to 0-1 range
      bestExpressionScore = Math.min(1, Math.max(0, bestExpressionScore));
      
      return {
        faceCount: detections.length,
        expressions: expressions.map(expr => ({
          happy: expr.happy,
          sad: expr.sad,
          angry: expr.angry,
          fearful: expr.fearful,
          disgusted: expr.disgusted,
          surprised: expr.surprised,
          neutral: expr.neutral
        })),
        bestExpressionScore
      };
    } catch (error) {
      console.error("Error analyzing face expressions:", error);
      return {
        faceCount: 0,
        expressions: [],
        bestExpressionScore: 0
      };
    }
  };
  
  // Calculate overall score combining all factors
  const calculateOverallScore = (
    technicalQuality: TechnicalQualityResult,
    aesthetics: AestheticResult,
    faceExpressions: FaceExpressionResult
  ): number => {
    // Technical quality (40%)
    const technicalScore = technicalQuality.overallScore * 0.4;
    
    // Aesthetics (40%)
    const aestheticScore = (aesthetics.meanScore / 10) * 0.4;
    
    // Face expressions (20%)
    // If no faces, this factor doesn't contribute
    const faceScore = faceExpressions.faceCount > 0 
      ? faceExpressions.bestExpressionScore * 0.2 
      : 0;
    
    // If no faces, redistribute weights
    const totalScore = faceExpressions.faceCount > 0
      ? technicalScore + aestheticScore + faceScore
      : (technicalScore * 0.5) + (aestheticScore * 0.5);
    
    return totalScore;
  };
  
  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <button
        onClick={startAnalysis}
        disabled={!modelsLoaded || isAnalyzing || photos.length === 0}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
      >
        {isAnalyzing ? `Analyzing... ${progress}%` : `Analyze ${photos.length} Photos`}
      </button>
      
      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Analysis Complete!</h3>
          <p>Photos have been ranked by overall quality.</p>
        </div>
      )}
    </div>
  );
}
