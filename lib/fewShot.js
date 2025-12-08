const fs = require('fs');
const path = require('path');

// Função helper para converter imagem para base64
function imageToBase64(imagePath) {
    const fullPath = path.join(__dirname, '..', imagePath);
    return fs.readFileSync(fullPath).toString('base64');
}

const FEW_SHOT_EXAMPLES = [
    // EXEMPLO 1 - BANDAS (Didático)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/bandas.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'observando',
                direction: null,
                entry_type: null,
                confidence: 0,
                reasoning: 'Imagem didática mostrando estrutura das bandas. Não há momento de mercado atual para analisar.',
                action: 'ignorar',
                context: null,
                quality_score: 0,
                risk_reward: null,
                trade_levels: {
                    bias: 'NEUTRO',
                    stop: 0,
                    entry: 0,
                    trailing_stop: 0,
                    breakeven: 0,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 2 - BANDAS INCERTAS (Filtro negativo)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/bandas_incertas.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'invalido',
                direction: null,
                entry_type: null,
                confidence: 0,
                reasoning: 'Bandas fechando, abrindo e serrilhadas. Volatilidade alta e movimento sem qualidade. Não operar.',
                action: 'ignorar',
                context: null,
                quality_score: 1,
                risk_reward: 'desfavoravel',
                trade_levels: {
                    bias: 'NEUTRO',
                    stop: 0,
                    entry: 0,
                    trailing_stop: 0,
                    breakeven: 0,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 3 - BANDAS PARALELAS (Válido)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/bandas_sr.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'aguardar',
                direction: 'COMPRA',
                entry_type: null,
                confidence: 5,
                reasoning: 'Três áreas com bandas paralelas (marcadas). Movimento de qualidade mas sem candle aqua/magenta visível no momento atual.',
                action: 'aguardar',
                context: null,
                quality_score: 8,
                risk_reward: 'neutro',
                trade_levels: {
                    bias: 'COMPRA',
                    stop: 0,
                    entry: 0,
                    trailing_stop: 0,
                    breakeven: 0,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 4 - CANDLES E BIAS (Didático)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/candles_bias.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'observando',
                direction: null,
                entry_type: null,
                confidence: 0,
                reasoning: 'Imagem didática explicando cores dos candles. Não há momento de mercado específico para executar.',
                action: 'ignorar',
                context: null,
                quality_score: 0,
                risk_reward: null,
                trade_levels: {
                    bias: 'NEUTRO',
                    stop: 0,
                    entry: 0,
                    trailing_stop: 0,
                    breakeven: 0,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 5 - COMPRA VÁLIDA (Executar!)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/compra.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'executar',
                direction: 'COMPRA',
                entry_type: 'AQUA',
                confidence: 9,
                reasoning: 'Pullback válido em tendência de compra. Bandas verdes paralelas, ROC verde forte (barras grandes), candle aqua presente. Setup perfeito.',
                action: 'compra',
                context: 'pullback',
                quality_score: 10,
                risk_reward: 'favoravel',
                trade_levels: {
                    bias: 'COMPRA',
                    stop: 103.07900,
                    entry: 103.12400,
                    trailing_stop: 103.14175,
                    breakeven: 103.18540,
                    take_profit: 103.19060
                }
            })
        }]
    },

    // EXEMPLO 6 - MÚLTIPLAS ENTRADAS (Continuação)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/compra2.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'executar',
                direction: 'COMPRA',
                entry_type: 'AQUA',
                confidence: 8,
                reasoning: 'Dois sinais de compra no mesmo movimento. Bandas semi-paralelas mantendo estrutura. Possível adicionar posição.',
                action: 'compra',
                context: 'continuacao',
                quality_score: 8,
                risk_reward: 'favoravel',
                trade_levels: {
                    bias: 'COMPRA',
                    stop: 101.693,
                    entry: 101.706,
                    trailing_stop: 101.706,
                    breakeven: 101.694,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 7 - CONSOLIDAÇÃO (NÃO operar!)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/consolidacao.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'invalido',
                direction: null,
                entry_type: null,
                confidence: 0,
                reasoning: 'Caixa amarela ativa indicando consolidação confirmada. Lateral (caixa cinza) também presente. Entrada proibida.',
                action: 'ignorar',
                context: 'consolidacao',
                quality_score: 0,
                risk_reward: 'desfavoravel',
                trade_levels: {
                    bias: 'NEUTRO',
                    stop: 1.16420,
                    entry: 1.16425,
                    trailing_stop: 1.16425,
                    breakeven: 1.16418,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 8 - SINAIS AQUA/MAGENTA + ROC
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/sinais_roc.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'observando',
                direction: null,
                entry_type: null,
                confidence: 0,
                reasoning: 'Imagem didática mostrando sinais aqua (compra) e magenta (venda) com ROC suavizado. Não há análise de momento atual.',
                action: 'ignorar',
                context: null,
                quality_score: 0,
                risk_reward: null,
                trade_levels: {
                    bias: 'NEUTRO',
                    stop: 0,
                    entry: 0,
                    trailing_stop: 0,
                    breakeven: 0,
                    take_profit: 0
                }
            })
        }]
    },

    // EXEMPLO 9 - VENDA (Pullback válido vs inválido)
    {
        role: 'user',
        parts: [
            {
                inlineData: {
                    data: imageToBase64('examples_jpeg/venda.jpg'),
                    mimeType: 'image/jpeg'
                }
            },
            { text: 'Analise este gráfico.' }
        ]
    },
    {
        role: 'model',
        parts: [{
            text: JSON.stringify({
                status: 'executar',
                direction: 'VENDA',
                entry_type: 'MAGENTA',
                confidence: 8,
                reasoning: 'Pullback válido (direita) com bandas vermelhas paralelas durante retração. Diferente do pullback inválido (centro) com bandas laterais.',
                action: 'venda',
                context: 'pullback',
                quality_score: 9,
                risk_reward: 'favoravel',
                trade_levels: {
                    bias: 'VENDA',
                    stop: 101.078,
                    entry: 101.145,
                    trailing_stop: 101.078,
                    breakeven: 0,
                    take_profit: 0
                }
            })
        }]
    }
];

module.exports = FEW_SHOT_EXAMPLES;
