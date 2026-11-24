# Desafio NTConsult

Automação do teste técnico de QA em um único projeto:

- **Web:** pesquisa de artigos no blog do Agi, com Playwright e JavaScript
- **API:** Dog API, com Playwright e JavaScript
- **Performance:** compra de passagem no BlazeDemo, com k6

Os cenários estão em Gherkin, em `features/`. A automação que executa esses cenários está em `tests/`, com Page Object na interface. O `npm test` roda a suíte funcional e, em seguida, a carga e o pico. O relatório para abrir é `playwright-report/index.html`: ele reúne a API, a interface e a performance.

## Pré-requisitos

- Node.js 22 ou superior
- k6 2.4, no PATH
- Google Chrome não é obrigatório: o Playwright baixa o Chromium
- Git

## Instalação

```bash
npm install
npx playwright install chromium
```

O k6, conforme o sistema:

```bash
winget install GrafanaLabs.k6
brew install k6
```

No Linux, o binário usado na pipeline é o k6 2.4.0 para amd64, publicado no GitHub do projeto k6.

## Executar

Funcional e performance, o mesmo comando da pipeline:

```bash
npm test
```

Somente a interface:

```bash
npm run test:ui
```

Somente a Dog API:

```bash
npm run test:api
```

Somente o fluxo de uma compra no BlazeDemo:

```bash
npm run test:fluxo
```

Somente carga, linha de base e pico:

```bash
npm run test:performance
```

## Relatórios

O relatório completo é `playwright-report/index.html`. Para abrir:

```bash
npm run report
```

Ele lista a API, a interface e a compra. Abaixo de **Teste Performance - fluxo/compra_passagem.spec.js**, o bloco **Dados do teste de Performance** abre a carga, a linha de base e o pico, com a faixa que diz se o critério foi atendido. Quando um teste falha, o mesmo relatório traz o erro, o screenshot e o trace.

## O que foi automatizado

### Blog do Agi

O enunciado aponta `https://blogdoagi.com.br/`. Esse endereço redireciona para `https://blog.agibank.com.br/`. A lupa do topo abre o campo "Digite sua busca".

| Cenário | Comportamento |
| --- | --- |
| Termo existente | `empréstimo` mostra resultados e ao menos um artigo |
| Termo inexistente | `xyzabc123naoexiste` mostra que nada foi encontrado |
| Limite | um único caractere, `a`, ainda abre a página de resultados |

### Dog API

| Cenário | Endpoint |
| --- | --- |
| Lista de raças | `GET /breeds/list/all` |
| Raça sem sub-raça e raça com sub-raças | o mesmo `GET`, conferindo `affenpinscher` e `bulldog` |
| Imagens de uma raça | `GET /breed/hound/images` |
| Imagem aleatória | `GET /breeds/image/random` |
| Raça inexistente | `GET /breed/raca-inexistente-qa/images` responde 404 |

### Compra no BlazeDemo

Há um cenário funcional de uma compra, de Paris para Buenos Aires, até a mensagem "Thank you for your purchase today!".

A carga e o pico estão no k6, em `performance/compra.js`. Playwright não é ferramenta de teste de carga.

## Performance

Critério do enunciado: 250 requisições por segundo, com o percentil 90 do tempo de resposta abaixo de 2 segundos.

Requisição, aqui, é cada chamada HTTP do fluxo: abrir a home, buscar os voos, escolher o voo e confirmar a compra. São quatro chamadas por compra. O k6 agenda as compras para que essas chamadas cheguem a 250 por segundo.

| Plano | Duração | Alvo |
| --- | --- | --- |
| Carga | 30 segundos | 250 requisições por segundo |
| Linha de base | 15 segundos | cerca de 10 requisições por segundo |
| Pico | 20 segundos | 250 requisições por segundo |

O critério é decidido na carga e no pico. A linha de base mostra o patamar de onde o pico sobe. Os dois planos principais precisam, juntos, passar de 250 requisições por segundo, ficar com o percentil 90 abaixo de 2000 ms e confirmar pelo menos 95% das compras.

Na última execução publicada, o critério não foi atendido. A carga fez 166,9 requisições por segundo, com percentil 90 de 2.932 ms. O pico fez 158,5 requisições por segundo, com percentil 90 de 2.699 ms. As compras confirmadas ficaram em 100% nos dois. A linha de base, que não entra na meta, fez 8,6 requisições por segundo, com percentil 90 de 443 ms. Uma nova execução atualiza esses números no HTML.

## CI

O workflow `.github/workflows/ci.yml` roda em push, pull request e disparo manual. Para executar na hora: abra Actions, escolha o workflow Testes e use Run workflow. Ele instala o k6 e o Chromium, executa `npm test` e publica o artefato `relatorio-playwright`. No fim da execução na branch main, o HTML do relatório fica em https://albuquerquetec.github.io/Desafio-NTConsult/. O resumo do job traz esse endereço e a conclusão da performance.

## Estrutura

```
features/            cenários Gherkin
tests/               automação Playwright dos cenários
src/pages/           Page Object do blog
src/api/             clientes da Dog API e do BlazeDemo
performance/         script k6 da carga e do pico
scripts/             comando que roda a suíte e a performance
.github/workflows/   execução contínua de tudo
```
