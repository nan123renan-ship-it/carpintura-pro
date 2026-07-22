// Armazena mapeamento despesa_id -> categorias[] no localStorage
// Usado como fallback quando a coluna categorias não existe no banco

const KEY = 'despesas_categorias_map';

function getMap(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function salvarCategoriasDespesa(despesaId: string, categorias: string[]) {
  if (!categorias || categorias.length === 0) return;
  const map = getMap();
  map[despesaId] = categorias;
  saveMap(map);
}

export function getCategoriasDespesa(despesaId: string): string[] | undefined {
  const map = getMap();
  return map[despesaId];
}

export function removerCategoriasDespesa(despesaId: string) {
  const map = getMap();
  delete map[despesaId];
  saveMap(map);
}

export function enriquecerDespesasComCategorias<T extends { id: string; categorias?: string[] }>(
  despesas: T[]
): T[] {
  if (typeof window === 'undefined') return despesas;
  const map = getMap();
  return despesas.map(d => {
    if (d.categorias && d.categorias.length > 0) return d;
    const cats = map[d.id];
    if (cats && cats.length > 0) return { ...d, categorias: cats };
    return d;
  });
}
