# language: pt
# O criterio de 250 requisicoes por segundo fica no k6, em performance/compra.js.
# Este cenario cobre uma unica compra, para o fluxo existir na suite funcional.
@fluxo
Funcionalidade: Compra de passagem no BlazeDemo

  Cenario: Passagem comprada com sucesso
    Quando compro uma passagem de "Paris" para "Buenos Aires"
    Entao a compra da passagem e confirmada
