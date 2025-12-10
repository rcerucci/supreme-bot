// api/test_bands_histogram.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const ANALYSIS_PROMPT = `
You are analyzing a trading chart with 2 components:

PART 1 - BANDS (top section): 9 parallel bands
Look ONLY at the extreme right end of these bands.

Check:
1. SPACING: Are all 9 bands maintaining CONSTANT distance?
   - PARALLEL = good
   - SQUEEZE = converging (bad)
   - EXPANSION = diverging (bad)

2. DIRECTION: Are ALL 9 bands pointing the SAME way?
   - UP = bullish
   - DOWN = bearish
   - HORIZONTAL or MIXED = bad

3. SMOOTHNESS: Are lines relatively smooth (not too jagged)?
   - SMOOTH = good
   - CHOPPY = bad

PART 2 - HISTOGRAM (bottom section): Vertical bars
Look ONLY at the extreme right end (last 5-10 bars).

Check:
1. POSITION: Are bars above or below the center line?
   - ABOVE = positive/bullish
   - BELOW = negative/bearish
   - MIXED = unclear

2. TREND: Are bars consistently growing?
   - GROWING = momentum increasing
   - SHRINKING = momentum decreasing
   - FLAT = no clear trend

3. CONSISTENCY: Are bars uniform in direction?
   - CONSISTENT = all same side of line
   - OSCILLATING = jumping above/below

Answer ONLY with valid JSON (no markdown, no backticks):
{
  "bands": {
    "spacing": "PARALLEL" | "SQUEEZE" | "EXPANSION",
    "direction": "UP" | "DOWN" | "HORIZONTAL" | "MIXED",
    "smoothness": "SMOOTH" | "CHOPPY",
    "valid": true/false
  },
  "histogram": {
    "position": "ABOVE" | "BELOW" | "MIXED",
    "trend": "GROWING" | "SHRINKING" | "FLAT",
    "consistency": "CONSISTENT" | "OSCILLATING",
    "momentum": "BULLISH" | "BEARISH" | "WEAK"
  },
  "setup": {
    "confluence": true/false,
    "bias": "BULLISH" | "BEARISH" | "INVALID",
    "quality": "STRONG" | "WEAK" | "POOR"
  }
}

Valid setup requires:
- Bands: PARALLEL + (UP or DOWN) + SMOOTH
- Histogram: CONSISTENT direction + GROWING
- Confluence: Bands and histogram pointing same direction
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
                    data: screenshot,
                    mimeType: 'image/png'
                }
            },
            { text: ANALYSIS_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        // Parse JSON response
        let analysis;
        try {
            analysis = JSON.parse(text);
        } catch (e) {
            // Se não for JSON válido, retornar texto bruto
            analysis = { raw: text, parse_error: true };
        }
        
        return res.status(200).json({
            status: 'success',
            analysis: analysis,
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