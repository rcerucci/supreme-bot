// api/test_exploratory.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const BANDS_PROMPT = `
You see 9 white lines on black background.

Look at the RIGHTMOST tips of these lines (where they end).

Answer 3 questions:

1. Are the outer lines getting CLOSER to the center line, FARTHER from center line, or staying SAME DISTANCE?
   Answer: CLOSER / FARTHER / SAME

2. Are the tips pointing UP, DOWN, or FLAT?
   Answer: UP / DOWN / FLAT

3. Are the lines SMOOTH or JAGGED?
   Answer: SMOOTH / JAGGED

Return ONLY this JSON (no other text):
{
  "spacing": "CLOSER|FARTHER|SAME",
  "direction": "UP|DOWN|FLAT",
  "smoothness": "SMOOTH|JAGGED"
}
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({ status: 'error', message: 'Screenshot required' });
        }
        
        const buffer = Buffer.from(screenshot, 'base64');
        const metadata = await sharp(buffer).metadata();
        
        // Crop: últimos 20% largura, toda altura
        const cropWidth = Math.floor(metadata.width * 0.20);
        const cropX = metadata.width - cropWidth;
        
        const croppedBuffer = await sharp(buffer)
            .extract({
                left: cropX,
                top: 0,
                width: cropWidth,
                height: metadata.height
            })
            .toBuffer();
        
        const croppedBase64 = croppedBuffer.toString('base64');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 200,
                responseMimeType: 'application/json'
            }
        });
        
        const result = await model.generateContent([
            { inlineData: { data: croppedBase64, mimeType: 'image/png' } },
            { text: BANDS_PROMPT }
        ]);
        
        const analysis = JSON.parse(result.response.text());
        const usage = result.response.usageMetadata;
        
        // Traduzir para termos finais
        const spacing = analysis.spacing === 'CLOSER' ? 'SQUEEZE' 
                      : analysis.spacing === 'FARTHER' ? 'EXPANSION'
                      : 'PARALLEL';
        
        const valid = spacing === 'PARALLEL' && 
                     (analysis.direction === 'UP' || analysis.direction === 'DOWN') &&
                     analysis.smoothness === 'SMOOTH';
        
        return res.status(200).json({
            status: 'success',
            bands: {
                spacing: spacing,
                direction: analysis.direction,
                smoothness: analysis.smoothness,
                valid: valid
            },
            raw: analysis,
            tokens: {
                input: usage?.promptTokenCount || 0,
                output: usage?.candidatesTokenCount || 0,
                total: usage?.totalTokenCount || 0
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};