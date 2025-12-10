// api/test_exploratory.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const ANALYSIS_PROMPT = `
Analyze this trading chart section:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 - BANDS (top: 9 white lines)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SPACING: Are lines maintaining constant distance?
   - PARALLEL = distance stays same
   - SQUEEZE = lines converging (getting closer)
   - EXPANSION = lines diverging (getting farther)

2. DIRECTION: Which way are tips pointing?
   - UP / DOWN / HORIZONTAL / MIXED

3. SMOOTHNESS: SMOOTH / CHOPPY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 - HISTOGRAM (bottom: vertical white bars)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The histogram has a HORIZONTAL CENTER LINE (zero line).

1. POSITION: Are the bars extending above or below this CENTER LINE?
   - ABOVE = bars extending UPWARD from center line (positive values)
   - BELOW = bars extending DOWNWARD from center line (negative values)
   - MIXED = some bars up, some bars down

2. TREND: Are bars getting bigger or smaller?
   - GROWING / SHRINKING / FLAT

3. CONSISTENCY: Are bars on same side of center line?
   - CONSISTENT / OSCILLATING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return JSON only:
{
  "bands": {
    "spacing": "PARALLEL|SQUEEZE|EXPANSION",
    "direction": "UP|DOWN|HORIZONTAL|MIXED",
    "smoothness": "SMOOTH|CHOPPY",
    "valid": true/false
  },
  "histogram": {
    "position": "ABOVE|BELOW|MIXED",
    "trend": "GROWING|SHRINKING|FLAT",
    "consistency": "CONSISTENT|OSCILLATING",
    "momentum": "BULLISH|BEARISH|WEAK"
  },
  "setup": {
    "confluence": true/false,
    "bias": "BULLISH|BEARISH|INVALID",
    "quality": "STRONG|WEAK|POOR"
  }
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
        
        // CROP: últimos 15% da imagem (extrema direita)
        const buffer = Buffer.from(screenshot, 'base64');
        const metadata = await sharp(buffer).metadata();
        
        const cropWidth = Math.floor(metadata.width * 0.15);
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
        
        // Enviar SOMENTE o crop para Gemini
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.01,
                maxOutputTokens: 1000,
                responseMimeType: 'application/json'
            }
        });
        
        const result = await model.generateContent([
            {
                inlineData: {
                    data: croppedBase64,
                    mimeType: 'image/png'
                }
            },
            { text: ANALYSIS_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        let analysis;
        try {
            analysis = JSON.parse(text);
        } catch (e) {
            analysis = { raw: text, parse_error: true };
        }
        
        return res.status(200).json({
            status: 'success',
            analysis: analysis,
            cropped_region: `Last ${cropWidth}px (${Math.floor(cropWidth/metadata.width*100)}%)`,
            tokens: {
                input: usage?.promptTokenCount || 0,
                output: usage?.candidatesTokenCount || 0,
                total: usage?.totalTokenCount || 0
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};