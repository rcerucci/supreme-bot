const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const DEBUG_PROMPT = `
Você é um analisador técnico de gráficos forex. Descreva TUDO que vê, sem omitir nenhum elemento.

VOCÊ DEVE RESPONDER TODAS AS 7 SEÇÕES ABAIXO. NÃO OMITA NENHUMA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 1: ÚLTIMOS 3 CANDLES (extrema direita)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDLE 1 (mais à direita):
- COR EXATA: (verde escuro fosco / verde claro fosco / verde neon / vermelho escuro fosco / vermelho claro fosco / vermelho neon / cinza / cyan elétrico / rosa/magenta / outra?)
- BRILHO: (neon elétrico brilhante / opaco fosco?)
- TAMANHO ABSOLUTO: (muito grande / grande / médio / pequeno / muito pequeno?)
- TAMANHO RELATIVO: Comparado aos grandes candles vermelhos do meio do gráfico, este candle é (muito menor / menor / igual / maior)?
- CORPO: (longo / médio / curto / quase inexistente?)

CANDLE 2 (segundo da direita):
- COR EXATA:
- BRILHO:
- TAMANHO ABSOLUTO:
- TAMANHO RELATIVO aos grandes vermelhos do meio:
- CORPO:

CANDLE 3 (terceiro da direita):
- COR EXATA:
- BRILHO:
- TAMANHO ABSOLUTO:
- TAMANHO RELATIVO aos grandes vermelhos do meio:
- CORPO:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 2: SETAS/SÍMBOLOS (OBRIGATÓRIO RESPONDER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Você vê SETAS no gráfico? (SIM / NÃO)
- Se SIM, responda TUDO abaixo:
  - TOTAL de setas visíveis no gráfico inteiro: (conte todas)
  - COR principal das setas: (azul claro / azul escuro / magenta/roxo / verde / vermelho / outra?)
  - DIREÇÃO: (apontando para cima ↑ ou para baixo ↓?)
  - LOCALIZAÇÃO GERAL das setas:
    * Quantas estão nos ÚLTIMOS 3 candles à direita?
    * Quantas estão no MEIO do gráfico (zona de consolidação)?
    * Quantas estão mais à ESQUERDA?
  - POSIÇÃO VERTICAL: As setas estão acima ou abaixo dos candles?
  - TAMANHO das setas: (pequenas / médias / grandes?)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 3: BANDAS/LINHAS CURVAS (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LINHAS ACIMA DO PREÇO ATUAL:
- Quantas linhas verdes/claras você vê ACIMA dos candles atuais? (conte)
- COR EXATA dessas linhas superiores: (verde escuro fosco / verde claro / outra?)
- ESTILO: (sólidas / pontilhadas / tracejadas?)
- Essas linhas superiores estão separadas ou próximas entre si?

LINHAS ABAIXO DO PREÇO ATUAL:
- Quantas linhas vermelhas/escuras você vê ABAIXO dos candles atuais? (conte)
- COR EXATA dessas linhas inferiores: (vermelho escuro fosco / vermelho claro / outra?)
- ESTILO: (sólidas / pontilhadas / tracejadas?)

LINHA CENTRAL:
- Há uma linha no MEIO cortando o preço? (SIM / NÃO)
- Se SIM, qual a COR? (amarela / laranja / outra?)
- ESPESSURA dessa linha central: (fina / média / grossa?)

DIREÇÃO GERAL DAS BANDAS:
- Na extrema direita, as bandas estão: (subindo / descendo / horizontais / expandindo / contraindo?)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 4: CAIXAS/RETÂNGULOS (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Você vê alguma CAIXA ou RETÂNGULO desenhado? (SIM / NÃO)

Se SIM, descreva CADA caixa que você vê:

CAIXA 1:
- COR: (amarela / cinza / verde / vermelha / outra?)
- BRILHO: (fosca / brilhante?)
- ESPESSURA DA BORDA: (fina / média / grossa?)
- PREENCHIMENTO: A caixa é (só contorno / preenchida?)

- LOCALIZAÇÃO HORIZONTAL (CRÍTICO):
  - LADO ESQUERDO da caixa começa: (início do gráfico / 25% / meio 50% / 75% / perto do final?)
  - LADO DIREITO da caixa termina: (meio do gráfico / 75% / perto da extrema direita / extrema direita / além da extrema direita?)
  - Em barras aproximadas: A caixa cobre quantas barras/candles? (30 / 50 / 100 / 150 / mais?)

- LOCALIZAÇÃO VERTICAL:
  - Topo da caixa está em qual nível de preço aproximado?
  - Base da caixa está em qual nível?
  - A caixa cobre: (parte superior / parte inferior / centro do gráfico?)

- CONTEÚDO INTERNO DA CAIXA:
  - DENTRO da caixa, você vê: (só candles vermelhos / só verdes / misturados / outros elementos?)
  - Se misturados, qual cor predomina no lado ESQUERDO interno?
  - Qual cor predomina no lado DIREITO interno?
  - Há setas DENTRO da caixa?

- TEXTO NA CAIXA:
  - Tem texto escrito? (SIM / NÃO)
  - Se SIM, onde está o texto? (canto superior direito / meio / outro?)
  - O que está escrito? (tente ler)

Se há mais caixas, descreva CAIXA 2, CAIXA 3, etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 5: HISTOGRAMA INFERIOR (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÚLTIMAS 5 BARRAS do histograma (extrema direita):

Barra 1 (mais à direita):
- COR: (verde / vermelho / cinza / outra?)
- TAMANHO: (muito grande / grande / médio / pequeno / muito pequeno?)
- DIREÇÃO: (para cima / para baixo?)

Barra 2:
- COR:
- TAMANHO:
- DIREÇÃO:

Barra 3:
- COR:
- TAMANHO:
- DIREÇÃO:

Barra 4:
- COR:
- TAMANHO:
- DIREÇÃO:

Barra 5:
- COR:
- TAMANHO:
- DIREÇÃO:

PADRÃO GERAL DO HISTOGRAMA:
- As últimas 10 barras estão: (aumentando / diminuindo / estáveis?)
- Cor predominante nas últimas 10: (verde / vermelho / cinza / misturado?)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 6: TEXTO NO CANTO SUPERIOR ESQUERDO (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Leia e transcreva TODOS os valores visíveis:

- Linha 1 - Nome do indicador: (consegue ler?)
- Linha 2 - "Bias:": (qual o valor/texto após "Bias:"?)
- Linha 3 - "Stop:": (qual o número?)
- Linha 4 - "Entrada:": (quais os dois valores - Upper1 e Lower1?)
- Linha 5 - "Trailing Stop:": (quais os valores?)
- Linha 6 - "Breakeven:": (quais os valores?)
- Linha 7 - "Take Profit:": (quais os valores?)

Se não conseguir ler algum valor, escreva "ilegível".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEÇÃO 7: OUTROS ELEMENTOS VISÍVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Há linhas horizontais tracejadas? (SIM / NÃO - onde?)
- Há algum texto "#0", "#1" etc no gráfico? (SIM / NÃO - onde?)
- Há outros símbolos ou marcações que não foram descritos acima?
- Qual o par de moedas mostrado? (tente ler no topo)
- Qual o timeframe? (tente ler no topo - M1/M5/M15/H1/etc?)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS CRÍTICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ RESPONDA TODAS AS 7 SEÇÕES - não omita nenhuma
✓ Use termos EXATOS de cores: "verde escuro fosco", "magenta/roxo", "cyan elétrico"
✓ CONTE elementos: "7 setas", "4 linhas acima", "3 caixas"
✓ COMPARE tamanhos: "muito menor que os candles vermelhos do meio"
✓ DESCREVA posições: "caixa começa no meio (50%) e vai até 95% à direita"
✓ NÃO interprete - apenas DESCREVA
✓ Se não conseguir ver/ler algo, diga "não consigo ver" ou "ilegível"

AGORA RESPONDA TODAS AS 7 SEÇÕES ACIMA.
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
                message: 'Screenshot is required'
            });
        }
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.05,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const result = await model.generateContent([
            DEBUG_PROMPT,
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            }
        ]);
        
        const description = result.response.text();
        const usage = result.response.usageMetadata;
        
        return res.status(200).json({
            status: 'success',
            description,
            metadata: {
                timestamp: new Date().toISOString(),
                tokens_input: usage?.promptTokenCount || 0,
                tokens_output: usage?.candidatesTokenCount || 0,
                model: MODEL
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