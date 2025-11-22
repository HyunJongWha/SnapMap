import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Restaurant, Country } from "../types";

// Initialize the client
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const restaurantSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the restaurant or cafe." },
    country: { 
      type: Type.STRING, 
      enum: ["South Korea", "Japan", "Other"],
      description: "The country where the place is located." 
    },
    city: { type: Type.STRING, description: "The major city (e.g., Seoul, Tokyo, Osaka, Busan)." },
    district: { type: Type.STRING, description: "The specific district or ward (e.g., Gangnam-gu, Shinjuku)." },
    description: { type: Type.STRING, description: "A short 1-sentence summary of what makes this place good based on the image/text." },
    lat: { type: Type.NUMBER, description: "Estimated latitude based on the city/district." },
    lng: { type: Type.NUMBER, description: "Estimated longitude based on the city/district." },
    tags: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of 3 related keywords (e.g., 'Sushi', 'Spicy', 'View')."
    }
  },
  required: ["name", "country", "city", "district", "lat", "lng", "description", "tags"]
};

export const analyzeImage = async (base64Image: string): Promise<Omit<Restaurant, 'id' | 'originalImage' | 'createdAt'>> => {
  const modelId = "gemini-2.5-flash"; // Multimodal capable

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming jpeg/png, api handles generic image types well
              data: base64Image
            }
          },
          {
            text: `Analyze this screenshot from a social media video (Shorts/Reels). 
            Identify the restaurant or food spot. 
            Deduce the location (Focus on South Korea or Japan). 
            If the text is in Korean or Japanese, translate the location names to English but keep the Name in original script if it's iconic, or English if provided.
            Estimate the Latitude and Longitude for the district/city center so I can place it on a map.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: restaurantSchema,
        temperature: 0.4 // Lower temperature for more factual extraction
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    const data = JSON.parse(jsonText);

    return {
      name: data.name,
      country: data.country as Country,
      city: data.city,
      district: data.district,
      description: data.description,
      coordinates: { lat: data.lat, lng: data.lng },
      tags: data.tags
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try a clearer screenshot.");
  }
};
