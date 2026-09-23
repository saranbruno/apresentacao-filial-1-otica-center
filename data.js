export const SOURCE = { version: 39, facade: 17095, areas: 17178, furniture: 17190, implementation: 17168, organization: 17096 };
export const ROOM_INFO = {
  sales: { name: 'Atendimento & exposição', official: 'Captação / Atendimento / Caixa / Cortesias', short: 'Área comercial', text: 'Mesas de atendimento, expositores com armações, caixa e um ponto de café. Uma proposta visual para a experiência do cliente.', items: 'Mesas com 3 cadeiras · expositores · espelhos · caixa · café', source: 'Ambiente e área: módulo 17178. Tipos de móveis: módulo 17190. Posições, quantidade e desenho: proposta conceitual.' },
  lab: { name: 'Montagem', official: 'Montagem', short: 'Montagem', text: 'Bancadas de montagem, mesa de pedidos, ferramentas e equipamentos representativos. Detalhamento técnico não incluído.', items: 'Bancadas · carrinho de apoio · mesa de pedidos · ferramentas', source: 'Área: módulo 17178. Tipos de móveis: módulo 17190. Equipamentos e instalação: representação ilustrativa.' },
  stock: { name: 'Estoque & refeitório', official: 'Estoque / Refeitório', short: 'Estoque / apoio', text: 'Estantes com caixas, roupeiro de 12 portas, pia, geladeira, micro-ondas e balcão para refeições.', items: 'Estantes · roupeiro · copa · balcão com 4 cadeiras', source: 'Área: módulo 17178. Lista de móveis/equipamentos: módulo 17190. Organização espacial proposta.' },
  reception: { name: 'Recepção optometria', official: 'Recepção Optometria', short: 'Recepção', text: 'Área de espera representada com assentos e sinalização. Os acessos mostrados são uma proposta, não a planta oficial.', items: 'Assentos de espera · sinalização · acesso aos ambientes', source: 'Nome e área: módulo 17178. Móveis e distribuição desta recepção: proposta visual.' },
  exam: { name: 'Sala de optometria', official: 'Sala de Optometria', short: 'Optometria', text: 'Representação de cadeira de exames com refrator, mesa de autorrefrator e TV em pedestal. Não representa autorização de funcionamento.', items: 'Cadeira de exames · refrator · autorrefrator · TV em pedestal', source: 'Área: módulo 17178. Tipos de equipamentos: módulo 17190. Validação técnica e operacional pendente.' },
  bathroom: { name: 'Banheiro', official: 'Banheiro', short: 'Banheiro', text: 'Representação de louças, bancada e espelho. A área de referência, sozinha, não comprova acessibilidade ou conformidade.', items: 'Lavatório · vaso sanitário · espelho · acessórios', source: 'Nome e área: módulo 17178. Louças, portas e circulação: proposta sem validação normativa.' }
};
export function createPlan(option = 'op2') {
  if (!['op1', 'op2'].includes(option)) throw new Error('Modelo desconhecido');
  const salesArea = option === 'op1' ? 35.09 : 45.44;
  const width = 8.4; // hipótese geométrica; não é dimensão medida do imóvel
  const total = option === 'op1' ? 73.08 : 83.43;
  const depth = total / width, front = depth / 2, back = -depth / 2;
  const techDepth = 37.99 / width, boundary = back + techDepth;
  const split = -width / 2 + 21.19 / techDepth;
  const rightWidth = width / 2 - split, examDepth = 9 / rightWidth;
  const examFront = back + examDepth, frontTechDepth = boundary - examFront;
  const bathRight = split + 3.6 / frontTechDepth;
  const stockFront = back + 11.28 / (split + width / 2);
  function room(id, x0, x1, z0, z1, area) { return { id, x0, x1, z0, z1, area, x: (x0+x1)/2, z: (z0+z1)/2, w:x1-x0, d:z1-z0, ...ROOM_INFO[id] }; }
  const rooms = [
    room('sales', -width/2, width/2, boundary, front, salesArea),
    room('lab', -width/2, split, stockFront, boundary, 9.91),
    room('stock', -width/2, split, back, stockFront, 11.28),
    room('reception', bathRight, width/2, examFront, boundary, 4.2),
    room('exam', split, width/2, back, examFront, 9),
    room('bathroom', split, bathRight, examFront, boundary, 3.6)
  ];
  return { option, width, depth, front, back, boundary, split, examFront, bathRight, stockFront, total, salesArea, rooms };
}
export const formatArea = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function isPositionClear(x,z,colliders,radius=.18) { return !colliders.some(b => x > b.x0-radius && x < b.x1+radius && z > b.z0-radius && z < b.z1+radius); }