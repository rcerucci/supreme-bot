// api/test_exploratory.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const BANDS_PROMPT = `
You see 9 white lines on a dark grid background.

CRITICAL INSTRUCTION: 
Look ONLY at where the lines END on the RIGHT edge of the image.
Do NOT analyze the middle portions or left side.
Focus exclusively on the RIGHTMOST COLUMN of the grid where lines terminate.

The grid has perpendicular lines (90° X and Y axes) as reference.

Answer 3 questions about the RIGHT EDGE ONLY:

1. SPACING: At the right edge, are the outer white lines getting CLOSER to the center line, getting FARTHER from it, or staying SAME DISTANCE?
   Use the grid squares to measure distance between lines at the right edge.
   Answer: CLOSER / FARTHER / SAME

2. DIRECTION: At the right edge, are the white line tips pointing UP, DOWN, or FLAT relative to the horizontal grid lines?
   UP = tips angling upward above horizontal
   DOWN = tips angling downward below horizontal  
   FLAT = tips following horizontal grid lines
   Answer: UP / DOWN / FLAT

3. SMOOTHNESS: At the right edge, are the white lines SMOOTH or JAGGED?
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
            return res.status(400).json({ 
                status: 'error', 
                message: 'Screenshot required' 
            });
        }
        
        const buffer = Buffer.from(screenshot, 'base64');
        const metadata = await sharp(buffer).metadata();
        
        // Crop AGRESSIVO: últimos 10% largura (não 20%)
        const cropWidth = Math.floor(metadata.width * 0.10);
        const cropX = metadata.width - cropWidth;
        
        console.log(`📐 Original: ${metadata.width}x${metadata.height}px`);
        console.log(`✂️  Crop: ${cropWidth}x${metadata.height}px (last ${Math.round(cropWidth/metadata.width*100)}%)`);
        
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
        
        console.log('🤖 Sending to Gemini...');
        
        const result = await model.generateContent([
            { 
                inlineData: { 
                    data: croppedBase64, 
                    mimeType: 'image/png' 
                } 
            },
            { text: BANDS_PROMPT }
        ]);
        
        const analysis = JSON.parse(result.response.text());
        const usage = result.response.usageMetadata;
        
        console.log('✅ Analysis complete');
        console.log(`📊 Raw response: ${JSON.stringify(analysis)}`);
        
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
            crop_info: {
                original_width: metadata.width,
                crop_width: cropWidth,
                percentage: Math.round(cropWidth/metadata.width*100)
            },
            tokens: {
                input: usage?.promptTokenCount || 0,
                output: usage?.candidatesTokenCount || 0,
                total: usage?.totalTokenCount || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        return res.status(500).json({ 
            status: 'error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};