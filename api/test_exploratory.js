const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const VISUAL_REFERENCE_TABLE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 GUIA VISUAL DO GRÁFICO FOREX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta imagem contém os seguintes elementos visuais:

┌─────────────────────────────────────────────────────────────────────┐
│ 1. BOX PRETO (Canto Superior Esquerdo)                              │
├─────────────────────────────────────────────────────────────────────┤
│ • Fundo: PRETO sólido                                               │
│ • Texto: BRANCO                                                     │
│ • Contém: Nome do par, Bias (COMPRA/VENDA/NEUTRO), Stop, Entrada   │
│ • Quantidade: 1 painel                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 2. CANDLES (Velas Japonesas)                                       │
├─────────────────────────────────────────────────────────────────────┤
│ • VERDE (Lime):        Alta normal                                  │
│ • VERMELHO (Red):      Baixa normal                                 │
│ • BRANCO (White):      Neutro/Sem sinal                            │
│ • CIANO (Cyan):        ⭐ SINAL DE COMPRA (importante!)             │
│ • LARANJA (Orange):    ⭐ SINAL DE VENDA (importante!)              │
│                                                                     │
│ ⚠️ CRÍTICO:                                                         │
│ • LARANJA ≠ VERMELHO (cores completamente diferentes!)             │
│ • CIANO ≠ VERDE (cores completamente diferentes!)                  │
│ • Sinais podem NÃO estar presentes em todas as imagens             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 3. SISTEMA DE BANDAS (Total: 9 linhas)                             │
├─────────────────────────────────────────────────────────────────────┤
│ LINHA CENTRAL:                                                      │
│ • BRANCA - 1 linha no meio                                          │
│                                                                     │
│ BANDAS SUPERIORES (4 linhas acima do preço):                       │
│ • Banda 1 (mais próxima): CIANO CLARO (Aqua)                       │
│ • Banda 2: AZUL CELESTE (DeepSkyBlue)                              │
│ • Banda 3: AZUL MÉDIO (DodgerBlue)                                 │
│ • Banda 4 (mais distante): AZUL ESCURO (RoyalBlue)                 │
│                                                                     │
│ BANDAS INFERIORES (4 linhas abaixo do preço):                      │
│ • Banda 1 (mais próxima): LARANJA CLARO (OrangeRed)                │
│ • Banda 2: LARANJA (Orange)                                         │
│ • Banda 3: LARANJA ESCURO (DarkOrange)                             │
│ • Banda 4 (mais distante): VERMELHO CARMESIM (Crimson)             │
│                                                                     │
│ Progressão visual: Claro → Escuro (conforme se afasta do preço)    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 4. BOX ROXO (Pode existir ou não)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ • Formato: RETÂNGULO ROXO/MAGENTA desenhado sobre os candles       │
│ • Texto dentro: "LATERAL"                                           │
│ • Localização: Sobre o gráfico de preços                           │
│                                                                     │
│ ⚠️ NÃO CONFUNDIR COM:                                               │
│ • Texto "Supreme ROC" na parte inferior (isso é o nome do indicador)│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 5. HISTOGRAMA INFERIOR (Supreme ROC)                                │
├─────────────────────────────────────────────────────────────────────┤
│ • AZUL (DodgerBlue):  Pressão compradora FORTE                     │
│ • VERMELHO (Red):     Pressão vendedora FORTE                      │
│ • AMARELO (Yellow):   Pressão FRACA (qualquer direção)             │
│                                                                     │
│ Barras verticais abaixo do gráfico principal                       │
└─────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

const VERIFICATION_PROMPT = `
${VISUAL_REFERENCE_TABLE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 SUA FUNÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você é um VERIFICADOR DE ELEMENTOS visuais em gráficos forex.

REGRAS:
1. Consulte a tabela acima como referência
2. Seja LITERAL - só reporte o que você VÊ
3. Se não vê algo claramente, diga "Não encontrado"
4. Use EXATAMENTE as cores descritas na tabela
5. NUNCA invente elementos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 VERIFIQUE A IMAGEM (direita→esquerda)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. CANDLES (últimos 5, posição 1=extrema direita):**

Posição 1:
- Cor: [VERDE/VERMELHO/BRANCO/CIANO/LARANJA]
- Tamanho: [pequeno/médio/grande]

Posição 2:
- Cor: [...]
- Tamanho: [...]

Posição 3:
- Cor: [...]
- Tamanho: [...]

Posição 4:
- Cor: [...]
- Tamanho: [...]

Posição 5:
- Cor: [...]
- Tamanho: [...]

⚠️ Se não vê CIANO ou LARANJA, isso é normal - são sinais que podem não existir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**2. BANDAS (conte cada linha individualmente):**

Superiores (acima do preço):
- Quantidade: [número]
- Progressão de cores: [do mais claro ao mais escuro]

Inferiores (abaixo do preço):
- Quantidade: [número]
- Progressão de cores: [do mais claro ao mais escuro]

Central:
- Existe? [SIM/NÃO]
- Cor: [...]

Total de linhas: [soma]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**3. BOX PRETO:**

Existe? [SIM/NÃO]
Linha com "Bias:": [transcreva]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**4. BOX ROXO (retângulo sobre candles):**

Existe retângulo roxo sobre o gráfico? [SIM/NÃO]

Se SIM:
- Posição: [...]
- Texto dentro: [...]

Se NÃO:
- Confirme: [Não há box roxo]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**5. HISTOGRAMA (últimas 5 barras):**

Barra 1: [AZUL/VERMELHO/AMARELO], [tamanho]
Barra 2: [cor], [tamanho]
Barra 3: [cor], [tamanho]
Barra 4: [cor], [tamanho]
Barra 5: [cor], [tamanho]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    console.log('🔍 Starting verification...');
    
    try {
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot required'
            });
        }
        
        console.log('📤 Sending to Gemini with visual reference table...');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.05,
                maxOutputTokens: 2500,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const result = await model.generateContent([
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            },
            { text: VERIFICATION_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        console.log(`✅ Verification complete`);
        console.log(`📊 Tokens: ${usage?.promptTokenCount || 0} in / ${usage?.candidatesTokenCount || 0} out`);
        
        return res.status(200).json({
            status: 'success',
            verification: text,
            tokens: {
                input: usage?.promptTokenCount || 0,
                output: usage?.candidatesTokenCount || 0,
                thinking: usage?.thoughtsTokenCount || 0,
                total: usage?.totalTokenCount || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
