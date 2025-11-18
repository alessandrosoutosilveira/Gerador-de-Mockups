import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a mockup image using the Gemini API.
 * @param base64Image The user's uploaded image, encoded in base64.
 * @param mimeType The MIME type of the uploaded image.
 * @param category The context category for the mockup (e.g., 't-shirt').
 * @param optionalPrompt An additional text prompt for style.
 * @returns A promise that resolves to the base64 string of the generated image.
 */
export const generateMockup = async (
  base64Image: string,
  mimeType: string,
  category: string,
  optionalPrompt: string
): Promise<string> => {
  const model = 'gemini-2.5-flash-image';
  
  const prompt = `Crie um mockup fotorrealista. A imagem enviada pelo usuário deve ser aplicada em um(a) ${category}. ${optionalPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("Nenhum dado de imagem encontrado na resposta da API.");

  } catch (error) {
    console.error("Error generating mockup with Gemini API:", error);
    throw new Error("Falha ao gerar a imagem do mockup.");
  }
};