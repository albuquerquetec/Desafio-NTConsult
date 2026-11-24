# language: pt
@api
Funcionalidade: Consulta de racas na Dog API

  Cenario: Listar todas as racas
    Quando consulto todas as racas
    Entao a Dog API responde com sucesso
    E a lista contem a raca "hound"

  Cenario: A lista distingue raca sem sub-raca e raca com sub-racas
    Quando consulto todas as racas
    Entao a raca "affenpinscher" nao tem sub-racas
    E a raca "bulldog" tem sub-racas

  Cenario: Listar imagens de uma raca existente
    Quando consulto as imagens da raca "hound"
    Entao a Dog API responde com sucesso
    E a mensagem e uma lista de imagens

  Cenario: Consultar uma imagem aleatoria
    Quando consulto uma imagem aleatoria
    Entao a Dog API responde com sucesso
    E a mensagem e uma url de imagem

  Cenario: Consultar imagens de uma raca inexistente
    Quando consulto as imagens da raca "raca-inexistente-qa"
    Entao a Dog API informa que a raca nao existe
