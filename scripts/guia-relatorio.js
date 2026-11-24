export const tiposDeTeste = [
  {
    rotulo: 'Teste API - api/dog_api.spec.js',
    arquivo: 'tests/api/dog_api.spec.js',
  },
  {
    rotulo: 'Teste UI - ui/pesquisa_blog.spec.js',
    arquivo: 'tests/ui/pesquisa_blog.spec.js',
  },
  {
    rotulo: 'Teste Performance - fluxo/compra_passagem.spec.js',
    arquivo: 'tests/fluxo/compra_passagem.spec.js',
  },
];

export function rotuloDoArquivo(file) {
  const normalized = String(file).replaceAll('\\', '/');
  const tipo = tiposDeTeste.find((item) => {
    const curto = item.arquivo.replace(/^tests\//, '');
    return (
      normalized === item.rotulo ||
      normalized === item.arquivo ||
      normalized === curto ||
      normalized.endsWith(`/${item.arquivo}`) ||
      normalized.endsWith(`/${curto}`)
    );
  });
  return tipo ? tipo.rotulo : null;
}
