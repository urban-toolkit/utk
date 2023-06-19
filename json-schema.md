## A gramática é composta dos seguintes componentes:

- components: lista de elementos, que compoem o dash no front

  - item 0:

    - map: Definição do mapa. Contém a configuração básica do mapa em si

      - camera: Definição da camêra

        - position: Array de 3 valores float, contendo a origem da camêra
        - direction: Identifica a direção da camêra no espaço
          - right: Array de 3 valores float que indica a posição p/ direita
          - lookAt: Array de 3 valores float que indica para que local a camêra está olhando
          - up: Array de 3 valores.

      - knots: lista de strings que contém os ids dos knots existentes na cena
      - interactions: lista de interações que estes knots podem ter. Caso não tenham, é preenchido com `"NONE"`

      - plots: Contém definições em Vega-Lite dos plots que serão usados

    - knots: Indica knots existentes dentro da camera, é uma lista que contém o seguinte tipo de objetos:
      - id: o id do knot
      - integration_scheme: uma lista de schemas do knot
        - spatial_relationship: string que identifica como os dados devem ser relacionados espacialmente. Os valores possíveis são `INTERSECTS`, `CONTAINS` , `WITHIN` , `TOUCHES` , `CROSSES` , `OVERLAPS` , `NEAREST` e `DIRECT`
        - in/out: indica se é de entrada ou saída
        - name: nome do knot
        - level: nível do knot (verificar possíveis valores)
      - position: Indica qual posição da tela o componente mapa irá ocupar
        - width: lista com dois inteiros
        - height: lista com dois inteiros

  - item 1/2: Widgets, além do mapa. Será depreciado no futuro e juntado ao mapa.
    Widgets são funcionalidaes a mais que podem adicionar ajudar na manipulação dos dados e mapas.

    - type: string identificadora do tipo de Widget. Pode ser `TOGGLE_KNOT`, `GRAMMAR` ou `SEARCH`
    - map_id: identificador único do mapa que este widget será aplicado. Fixo para 0 aparentemente
    - title: Título do Widget, string
    - subtitle: Subtitulo do Widget. string
    - categories: lista de categorias que pode indicar relação entre layes, existente somente no widget `TOGGLE_KNOT`. Cada item contém os seguintes dados:
      - category_name: nome da categoria, string
      - elements: lista de elementos e outras categorias.
        Abaixo segue exemplo deste campo
      ```js
        {
            type: "TOGGLE_KNOT",
            map_id: 0,
            title: "Toggle knots",
            subtitle: "Widget to toggle knots",
            categories: [
                {
                    category_name: "cat1",
                    elements: [
                        "element1",
                        {
                            category_name: "cat1.1",
                            elements: [
                                "element2",
                                "element3"
                            ]
                        }
                    ]
                }
            ]
        }
      ```
    - position: Indica qual posição o widget irá ocupar na tela.
      - width: lista com dois inteiros
      - height: lista com dois inteiros

- arrangement: string que identifica como os plot deve ser mostrado no front end. Os valores possíveis são:

  - `FOOT_EMBEDDED`: descrever melhor
  - `SUR_EMBEDDED`: descrever melhor
  - `LINKED`: descrever melhor

- grid: O Grid específica como os componentes serão divididos na tela

  - width: inteiro
  - height: inteiro

    Abaixo, segue um exemplo de uma tela dividida em 12 seções horizontais e 4 verticais

  ```js
  grid:{
      width: 12,
      height: 4
  }
  ```

## Gramática Comentada

Segue um exemplo de gramática comentada, para clarificar melhor os dados acimas

```js
  {
    // a lista de componentes relevantes desta gramática
    "components": [
        {
            // dados do mapa
            "map": {
                // dados da camera
                "camera": {
                    // origem da camera
                    "position": [
                        -8239611,
                        4941390.5,
                        2.100369140625
                    ],
                    // direção da camera
                    "direction": {
                        "right": [
                            553.601318359375,
                            -2370.810546875,
                            2100.369140625
                        ],
                        "lookAt": [
                            563.9249267578125,
                            -1633.5897216796875,
                            1424.7962646484375
                        ],
                        "up": [
                            0.009459096007049084,
                            0.6755067110061646,
                            0.7372931241989136
                        ]
                    }
                },
                 // Os ids dos knots
                // que serão definidos abaixos.
                // Para cada novo knot,
                // ele é necessário de ser adicionado aqui.
                // Pense no knot como uma layer
                "knots": [
                    "purewater",
                    "pureparks",
                    "pureroads",
                    "buildings"
                ],
                // Cada knot também obrigatoriamente
                // adiciona uma interação.
                // A listas tem que ter o mesmo tamanho
                "interactions": [
                    "NONE",
                    "NONE",
                    "NONE",
                    "NONE"
                ]
            },
            //Plots do Vega-Lite. Aqui não temos
            "plots": [],
            //As definições dos knots
            "knots": [
                {
                    //ID do knot
                    "id": "purewater",
                    //Esquema de integração
                    "integration_scheme": [
                        {
                            //Knot PURO, só entra o nome e sai a layer
                            "out": {
                                "name": "water",
                                "level": "OBJECTS"
                            }
                        }
                    ]
                },
                {
                    "id": "pureparks",
                    "integration_scheme": [
                        {
                            "out": {
                                "name": "parks",
                                "level": "OBJECTS"
                            }
                        }
                    ]
                },
                {
                    "id": "pureroads",
                    "integration_scheme": [
                        {
                            "out": {
                                "name": "roads",
                                "level": "OBJECTS"
                            }
                        }
                    ]
                },
                {
                    //Este é um knot não puro, usado para sombras
                    "id": "buildings",
                    "integration_scheme": [
                        {
                            // Indica a relação espacial entre os elementos
                            //Dado o building mais proximo, me dê
                            // suas coordenadas 3D
                            // Aplique sombras nela
                            "spatial_relation": "NEAREST",
                            "out": {
                                "name": "buildings",
                                "level": "COORDINATES3D"
                            },
                            "in": {
                                "name": "shadow",
                                "level": "COORDINATES3D"
                            },
                            "operation": "NONE",
                            "abstract": true
                        }
                    ]
                }
            ],
            //Posição do Widget
            "position": {
                "width": [
                    6,
                    12
                ],
                "height": [
                    1,
                    4
                ]
            }
        },
        {
          // Widget de edição de gramática
            "type": "GRAMMAR",
            "position": {
                "width": [
                    1,
                    5
                ],
                "height": [
                    3,
                    4
                ]
            }
        },
        {   //Widget de manipulação de Knots,permite ativar/desativar
            "type": "TOGGLE_KNOT",
            "map_id": 0,
            "position": {
                "width": [
                    1,
                    5
                ],
                "height": [
                    1,
                    2
                ]
            }
        }
    ],
    // Como o plot será mostrado
    "arrangement": "LINKED",
    // Posicionamento geral
    "grid": {
        "width": 12,
        "height": 4
    }
}
```
