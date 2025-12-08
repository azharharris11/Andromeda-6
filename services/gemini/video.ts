
import { ProjectContext, GenResult } from "../../types";
import { ai } from "./client";

export const generateVeoVideo = async (
    project: ProjectContext,
    imageUrl: string | undefined,
    prompt: string
): Promise<GenResult<string | null>> => {
    
    // Veo needs a prompt. If we have an image, we use it as start frame (image-to-video).
    // If no image, we do text-to-video (less controllable for ads, but possible).
    
    const model = 'veo-3.1-fast-generate-preview'; // Use fast model for UI responsiveness
    
    try {
        let operation;
        
        // Prepare base64 image if available
        let imagePart = null;
        if (imageUrl) {
            const base64Data = imageUrl.split(',')[1];
            imagePart = {
                imageBytes: base64Data,
                mimeType: 'image/png' // Assuming PNG from previous steps
            };
        }

        if (imagePart) {
             console.log("Starting Veo Image-to-Video...");
             operation = await ai.models.generateVideos({
                model,
                prompt: `${prompt}. Cinematic movement, advertising quality, high resolution.`,
                image: imagePart,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '1:1' // Matching our square ads usually, or use 9:16 if vertical
                }
            });
        } else {
             console.log("Starting Veo Text-to-Video...");
             operation = await ai.models.generateVideos({
                model,
                prompt: `${prompt}. Cinematic advertising shot for ${project.productName}.`,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '9:16' // Vertical default for text-to-video
                }
            });
        }

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({operation: operation});
            console.log("Veo Status:", operation.metadata);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (downloadLink && process.env.API_KEY) {
            // Fetch the actual bytes to avoid expiring link issues or CORS if possible, 
            // though usually we display the link or blob. 
            // For this demo, we'll try to proxy or use the link directly if accessible.
            // Note: Veo links require the API Key appended.
            const authenticatedLink = `${downloadLink}&key=${process.env.API_KEY}`;
            return { data: authenticatedLink, inputTokens: 0, outputTokens: 0 };
        }
        
        return { data: null, inputTokens: 0, outputTokens: 0 };

    } catch (e) {
        console.error("Veo Generation Error:", e);
        return { data: null, inputTokens: 0, outputTokens: 0 };
    }
};
