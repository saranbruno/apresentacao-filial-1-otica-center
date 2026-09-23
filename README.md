# Ótica Center — estudo espacial 3D

Apresentação conceitual local em Three.js/Vite. Não é projeto executivo, levantamento do imóvel, identidade visual homologada ou aprovação da franqueadora.

## Uso

- `npm.cmd install --ignore-scripts --no-fund --no-audit` para instalar as versões do lockfile.
- `npm.cmd run dev` para iniciar no endereço local informado pelo Vite.
- No Center Code, abrir pelo navegador integrado (openProject).
- `npm.cmd test`: áreas, não sobreposição, construção dos dois modelos, descarte de recursos e conectividade dos percursos.
- `npm.cmd run build`: gera `dist/`. Nenhuma publicação é realizada.

## Controles

- **Maquete**: arrastar para orbitar; scroll/pinça para aproximar; botão direito para deslocar.
- **Planta**: vista superior com os mesmos móveis.
- **Fachada**: vista externa orbitável, botão Vista frontal e acesso Entrar na loja. A caminhada continua restrita ao interior; não há exploração a pé da rua.
- **Caminhar**: arrastar para olhar; W/A/S/D, setas ou controles na tela para mover. Esc volta à maquete.
- Lista e pontos de interesse: selecionar um ambiente. No modo caminhar, a lista transporta para um ponto livre do ambiente.
- **Apresentar**: passeio automático por oito perspectivas, começando pela fachada, com anterior/próximo, pausa e encerramento. Preferência do sistema por movimento reduzido inicia o passeio pausado.
- OP.1/OP.2, iluminação, legendas, tela cheia e captura PNG com identificação conceitual.
- **Sobre o estudo**: fontes, quadro comparativo e limitações.

## Fontes disponibilizadas na conversa

HiperManual 95, versão 39:
- 17095: fachada em ACM amarelo, referência de letreiro M-PVC 10 mm azul/branco e vidro fixo incolor 7 mm com alumínio branco polido.
- 17178: seis ambientes e áreas OP.1 (73,08 m²) / OP.2 (83,43 m²).
- 17190: tipos de mobiliário e equipamentos.
- 17168: diretrizes de implantação e detalhamento profissional.
- 17096: organização, materiais de demonstração, café e exposição de brindes.

Os tipos de itens, as áreas e a materialidade de fachada descrita acima são referências documentais. A geometria retangular (largura hipotética de 8,40 m e pé-direito de 2,80 m), localização das paredes, acessos, mobiliário, quantidades, equipamentos, materiais, cores e iluminação são propostas para visualização. A área do setor é calculada entre os limites geométricos; não é uma certificação de área útil após paredes/mobiliário. Não há norte conhecido, escala de levantamento ou validação de acessibilidade, segurança ou operação.

O nome da rede usa tipografia provisória, azul com contorno branco, não seu logotipo oficial. Os tons exatos, dimensões, paginação do ACM, calçada, canteiros e cobertura são hipóteses. O toldo, opcional no memorial, não foi incluído. A representação da placa do letreiro tem 10 mm, mas não reproduz o recorte/fabricação das letras oficiais. O conteúdo não comprova conformidade com os desenhos técnicos de móveis da franqueadora. Para fidelidade arquitetônica completa, substituir as hipóteses pela planta cotada, fachada, caderno de mobiliário e especificações oficiais da unidade.

## Implementação

Texturas procedurais e recursos locais; sem imagens, fontes, analytics ou APIs externas na aplicação. Armações instanciadas e superfícies estáticas agrupadas por material. Navegação com colisões simplificadas (não análise normativa). Nenhum equipamento tem funcionalidade clínica.

O endpoint `/__render-health` existe apenas no servidor de desenvolvimento, recebe diagnóstico técnico do próprio navegador e não dados pessoais. Um estado `rendered` confirma renderização WebGL, não inspeção visual humana ou aprovação arquitetônica.

O HTML antigo permanece apenas no workspace original como `index.anterior.html.bak`; não é versionado nem incluído no pacote de produção. Contém informações superadas e não deve ser usado como referência.
## Validação desta entrega

- 9 testes locais cobrindo as duas opções e colisões.
- 42 verificações automáticas no navegador de desenvolvimento, incluindo OP.1/OP.2, quatro vistas, fachada/frontal, entrada externa para o interior, pontos de acesso, modal de fontes, luz, legendas, controles do tour e pixels não uniformes.
- Projeção da maquete e do conjunto externo verificada em buffers de 1280×800 e 375×720, nas duas opções. Isso não substitui inspeção visual da interface nesses dispositivos.
- Na validação da fachada, o navegador integrado informou a página carregada, painel visível e renderização WebGL sem erro, em quadro de 889×864. As verificações de enquadramento usaram também os formatos desktop e celular descritos acima.
- Pendências manuais: inspeção visual humana da fachada e interior, experiência real de caminhada, tela cheia e arquivo de imagem exportado. Não foi realizada homologação arquitetônica.