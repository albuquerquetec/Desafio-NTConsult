# language: pt
# O endereco do enunciado, https://blogdoagi.com.br/, redireciona para https://blog.agibank.com.br/.
# A lupa do topo abre um overlay com o campo "Digite sua busca".
@ui
Funcionalidade: Pesquisa de artigos no blog do Agi
  Como leitor do blog
  Quero pesquisar pela lupa
  Para achar um artigo ou saber que ele nao existe

  Cenario: Pesquisa com termo existente exibe artigos
    Dado que estou na pagina inicial do blog do Agi
    Quando pesquiso por "empréstimo"
    Entao vejo resultados para "empréstimo"
    E vejo ao menos um artigo compativel com "empréstimo"

  Cenario: Pesquisa com termo inexistente informa ausencia de artigos
    Dado que estou na pagina inicial do blog do Agi
    Quando pesquiso por "xyzabc123naoexiste"
    Entao vejo a mensagem de que nada foi encontrado para "xyzabc123naoexiste"

  Cenario: Pesquisa com um unico caractere ainda abre a pagina de resultados
    Dado que estou na pagina inicial do blog do Agi
    Quando pesquiso por "a"
    Entao vejo resultados para "a"
