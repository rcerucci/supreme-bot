// api/test_bands_histogram.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

// api/test_exploratory.js - VERSÃO MELHORADA

const ANALYSIS_PROMPT = `
You are analyzing a trading chart with 2 components.

CRITICAL: Focus ONLY on the RIGHTMOST 10-20% of the image.
Ignore everything on the left side - only analyze the EXTREME RIGHT END.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 1 - BANDS (top section): 9 parallel white lines

Look at where these 9 lines END (rightmost tips):

1. SPACING: At the right end, are all 9 lines maintaining CONSTANT distance from each other?
   - PARALLEL = distance stays the same
   - SQUEEZE = lines getting closer together (converging)
   - EXPANSION = lines getting farther apart (diverging)

2. DIRECTION: At the right end, are ALL 9 line tips pointing the SAME direction?
   - UP = tips angling upward
   - DOWN = tips angling downward
   - HORIZONTAL = tips flat/sideways
   - MIXED = some up, some down

3. SMOOTHNESS: Are the rightmost portions smooth or jagged?
   - SMOOTH = clean curves
   - CHOPPY = very jagged/erratic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 2 - HISTOGRAM (bottom): Vertical white bars

Look at the LAST 5-10 bars on the RIGHT:

1. POSITION: Are the rightmost bars above or below the horizontal center?
   - ABOVE = bars extending upward from center
   - BELOW = bars extending downward from center
   - MIXED = some above, some below

2. TREND: Are the rightmost bars getting bigger or smaller?
   - GROWING = each bar taller than previous
   - SHRINKING = each bar shorter than previous
   - FLAT = similar sizes

3. CONSISTENCY: Do the rightmost bars stay on same side of center?
   - CONSISTENT = all above OR all below
   - OSCILLATING = jumping between above and below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: 
- Only analyze the RIGHTMOST portion
- Ignore historical patterns on the left
- Focus on current state (right edge)

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