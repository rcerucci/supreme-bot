#!/bin/bash

# Criar diretório para JPEGs
mkdir -p examples_jpeg

# Converter PNG para JPEG (qualidade 80%)
convert ../uploads/BANDAS.png -quality 80 examples_jpeg/bandas.jpg
convert ../uploads/BANDASINCERTAS.png -quality 80 examples_jpeg/bandas_incertas.jpg
convert ../uploads/BANDASSR.png -quality 80 examples_jpeg/bandas_sr.jpg
convert ../uploads/CANDLESBIAS.png -quality 80 examples_jpeg/candles_bias.jpg
convert ../uploads/COMPRA.png -quality 80 examples_jpeg/compra.jpg
convert ../uploads/COMPRA2.png -quality 80 examples_jpeg/compra2.jpg
convert ../uploads/CONSOLIDACAO.png -quality 80 examples_jpeg/consolidacao.jpg
convert ../uploads/SIANISEROC.png -quality 80 examples_jpeg/sinais_roc.jpg
convert ../uploads/VENDA.png -quality 80 examples_jpeg/venda.jpg

echo "✅ Conversão completa!"
