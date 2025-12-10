// api/test_bands_histogram.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const ANALYSIS_PROMPT = `
You are analyzing a trading chart with a RED VERTICAL LINE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL INSTRUCTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

There is a RED VERTICAL LINE in the image.

ONLY ANALYZE what is TO THE RIGHT of this red line.
COMPLETELY IGNORE everything to the left of the red line.

The red line marks: "ANALYZE FROM HERE →"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 1 - BANDS (9 white lines at top):

Look ONLY at the portion RIGHT of the red line:

1. SPACING: Are the 9 lines maintaining constant distance?
   - PARALLEL = lines stay same distance apart
   - SQUEEZE = lines getting closer (converging toward center)
   - EXPANSION = lines getting farther apart (diverging)

2. DIRECTION: Which way are the line tips pointing?
   - UP = angling upward /
   - DOWN = angling downward \\
   - HORIZONTAL = staying flat —
   - MIXED = some up, some down

3. SMOOTHNESS: SMOOTH / CHOPPY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 2 - HISTOGRAM (vertical bars at bottom):

Look ONLY at bars RIGHT of the red line:

1. POSITION: Are bars above or below the horizontal center?
   - ABOVE = bars extending upward
   - BELOW = bars extending downward
   - MIXED = some up, some down

2. TREND: Are bars getting bigger or smaller?
   - GROWING = increasing height
   - SHRINKING = decreasing height
   - FLAT = similar sizes

3. CONSISTENCY: CONSISTENT / OSCILLATING

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