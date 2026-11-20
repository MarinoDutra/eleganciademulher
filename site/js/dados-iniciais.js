/* Dados iniciais da loja (as 13 peças). Usados só no modo demonstração; no site de verdade os dados vêm do Supabase. */
window.DADOS_INICIAIS = {
 "categorias": [
  {
   "id": "vestidos",
   "nome": "Vestidos",
   "secao": "Vestidos para as festas",
   "chamada": "Lançamentos",
   "nota": "Tamanhos P, M e G",
   "ordem": 1
  },
  {
   "id": "saias",
   "nome": "Saias",
   "secao": "Saias",
   "chamada": "Saias",
   "nota": "",
   "ordem": 2
  },
  {
   "id": "tricos",
   "nome": "Tricôs",
   "secao": "Blusas e tricôs",
   "chamada": "Tamanho único",
   "nota": "Disponíveis em várias cores",
   "ordem": 3
  },
  {
   "id": "coletes",
   "nome": "Coletes",
   "secao": "Blusas e tricôs",
   "chamada": "",
   "nota": "",
   "ordem": 4
  },
  {
   "id": "cropped",
   "nome": "Cropped",
   "secao": "Blusas e tricôs",
   "chamada": "",
   "nota": "",
   "ordem": 5
  }
 ],
 "produtos": [
  {
   "id": "f21248bf-c13f-4157-a39b-cf537a32e691",
   "nome": "Vestido Longo com Laço",
   "categoria": "vestidos",
   "preco": null,
   "descricao": "Vestido longo sem mangas, com gola alta, pregas e botões encapados na frente e faixa para laço na cintura.",
   "tamanhos": [
    "P",
    "M",
    "G"
   ],
   "cores": [
    {
     "nome": "Vermelho",
     "amostra": "#C3161F",
     "foto": "fotos/vestido-laco-vermelho.jpg"
    },
    {
     "nome": "Verde",
     "amostra": "#A2AD95",
     "foto": "fotos/vestido-laco-verde.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#EFE9DC",
     "foto": "fotos/vestido-laco-off-white.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 1
  },
  {
   "id": "24213b27-65a4-4bce-a677-61a645d0c172",
   "nome": "Vestido Midi com Babados",
   "categoria": "vestidos",
   "preco": null,
   "descricao": "Vestido midi com babados nos ombros, vivos brancos e cintura marcada.",
   "tamanhos": [
    "P",
    "M",
    "G"
   ],
   "cores": [
    {
     "nome": "Vermelho",
     "amostra": "#C3161F",
     "foto": "fotos/vestido-babados-vermelho.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 2
  },
  {
   "id": "c81e880d-a934-4ffc-9933-83332aae009d",
   "nome": "Vestido Midi com Peplum",
   "categoria": "vestidos",
   "preco": null,
   "descricao": "Vestido midi com decote coração, peplum na frente, broche de brilho na cintura e alças finas.",
   "tamanhos": [
    "P",
    "M",
    "G"
   ],
   "cores": [
    {
     "nome": "Amarelo",
     "amostra": "#F2E29A",
     "foto": "fotos/vestido-peplum-amarelo.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 3
  },
  {
   "id": "dca746e8-1fd1-49e0-910d-a139bb1ef11c",
   "nome": "Vestido Midi Floral",
   "categoria": "vestidos",
   "preco": null,
   "descricao": "Vestido midi sem mangas, com estampa floral delicada e cintura franzida.",
   "tamanhos": [
    "P",
    "M",
    "G"
   ],
   "cores": [
    {
     "nome": "Floral escuro",
     "amostra": "radial-gradient(circle, #E7B8C3 22%, transparent 27%) 0 0 / 6px 6px, #23242F",
     "foto": "fotos/vestido-floral-floral-escuro.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 4
  },
  {
   "id": "9a5a200a-2bdb-4494-8df1-f94859659529",
   "nome": "Saia Longa com Fenda",
   "categoria": "saias",
   "preco": null,
   "descricao": "Saia longa de cintura alta, com passantes, bolsos laterais e fenda na frente.",
   "tamanhos": [
    "P",
    "M",
    "G"
   ],
   "cores": [
    {
     "nome": "Verde",
     "amostra": "#7DB98C",
     "foto": "fotos/saia-fenda-verde.jpg"
    },
    {
     "nome": "Azul-marinho",
     "amostra": "#1F2A4E",
     "foto": "fotos/saia-fenda-azul-marinho.jpg"
    },
    {
     "nome": "Rosê",
     "amostra": "#D98F86",
     "foto": "fotos/saia-fenda-rose.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#6F9CDB",
     "foto": "fotos/saia-fenda-azul.jpg"
    },
    {
     "nome": "Marrom",
     "amostra": "#8A5536",
     "foto": "fotos/saia-fenda-marrom.jpg"
    },
    {
     "nome": "Creme",
     "amostra": "#F0E1C6",
     "foto": "fotos/saia-fenda-creme.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F7F3EA",
     "foto": "fotos/saia-fenda-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/saia-fenda-preto.jpg"
    }
   ],
   "foto_alta": false,
   "visivel": true,
   "ordem": 1
  },
  {
   "id": "3599836b-5f02-4d0d-ab73-8ca0541a7d93",
   "nome": "Blusa Tricô com Pérolas",
   "categoria": "tricos",
   "preco": null,
   "descricao": "Blusa de tricô canelado com pérolas aplicadas na gola e mangas curtas.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Verde",
     "amostra": "#BFE0BF",
     "foto": "fotos/trico-perolas-verde.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#A7CBEE",
     "foto": "fotos/trico-perolas-azul.jpg"
    },
    {
     "nome": "Rosa",
     "amostra": "#F4D3CD",
     "foto": "fotos/trico-perolas-rosa.jpg"
    },
    {
     "nome": "Pêssego",
     "amostra": "#F6D3A8",
     "foto": "fotos/trico-perolas-pessego.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F5EEE2",
     "foto": "fotos/trico-perolas-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/trico-perolas-preto.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 1
  },
  {
   "id": "06e41235-fd79-4d11-901d-82ccf3d81b91",
   "nome": "Blusa Tricô com Botões",
   "categoria": "tricos",
   "preco": null,
   "descricao": "Blusa de tricô canelado com acabamento em contraste e botões dourados.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Verde",
     "amostra": "#C7E2B9",
     "foto": "fotos/trico-botoes-verde.jpg"
    },
    {
     "nome": "Amarelo",
     "amostra": "#F2E8A8",
     "foto": "fotos/trico-botoes-amarelo.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#AEC3EA",
     "foto": "fotos/trico-botoes-azul.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F6EEDF",
     "foto": "fotos/trico-botoes-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/trico-botoes-preto.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 2
  },
  {
   "id": "e3611833-ae45-4716-b5aa-6ee9298d943f",
   "nome": "Blusa Tricô Gola Larga",
   "categoria": "tricos",
   "preco": null,
   "descricao": "Blusa de tricô com gola larga dobrada e textura em relevo.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Rosa",
     "amostra": "#F4D4D9",
     "foto": "fotos/trico-gola-rosa.jpg"
    },
    {
     "nome": "Verde",
     "amostra": "#BFE0BE",
     "foto": "fotos/trico-gola-verde.jpg"
    },
    {
     "nome": "Lilás",
     "amostra": "#D3C7E4",
     "foto": "fotos/trico-gola-lilas.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#A9CDEB",
     "foto": "fotos/trico-gola-azul.jpg"
    },
    {
     "nome": "Pêssego",
     "amostra": "#F6D5A8",
     "foto": "fotos/trico-gola-pessego.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F6EEDD",
     "foto": "fotos/trico-gola-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/trico-gola-preto.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 3
  },
  {
   "id": "d6cffbd3-30a3-4c5c-b02e-b0d79c66a614",
   "nome": "Blusa Tricô com Zíper",
   "categoria": "tricos",
   "preco": null,
   "descricao": "Blusa de tricô canelado com zíper no decote e mangas curtas.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Rosa",
     "amostra": "#F5D9DA",
     "foto": "fotos/trico-ziper-rosa.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#A8CDF0",
     "foto": "fotos/trico-ziper-azul.jpg"
    },
    {
     "nome": "Verde",
     "amostra": "#C3E5C2",
     "foto": "fotos/trico-ziper-verde.jpg"
    },
    {
     "nome": "Pêssego",
     "amostra": "#F6D5AD",
     "foto": "fotos/trico-ziper-pessego.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F5EEE3",
     "foto": "fotos/trico-ziper-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/trico-ziper-preto.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 4
  },
  {
   "id": "5ecca11c-a5d4-407d-9e52-3667f1d1948f",
   "nome": "Polo Tricô Listrada",
   "categoria": "tricos",
   "preco": null,
   "descricao": "Blusa polo de tricô com listras finas, gola e mangas curtas.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Amarelo",
     "amostra": "#F6E58F",
     "foto": "fotos/polo-listrada-amarelo.jpg"
    },
    {
     "nome": "Rosa",
     "amostra": "#F4C7C7",
     "foto": "fotos/polo-listrada-rosa.jpg"
    },
    {
     "nome": "Lilás",
     "amostra": "#C9B9E1",
     "foto": "fotos/polo-listrada-lilas.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#9DCBEF",
     "foto": "fotos/polo-listrada-azul.jpg"
    },
    {
     "nome": "Pêssego",
     "amostra": "#F2C9A1",
     "foto": "fotos/polo-listrada-pessego.jpg"
    },
    {
     "nome": "Off-white com listras pretas",
     "amostra": "repeating-linear-gradient(180deg, #F4F0E7 0 4px, #1C1A1A 4px 5px)",
     "foto": "fotos/polo-listrada-off-white-com-listras-pretas.jpg"
    },
    {
     "nome": "Preto com listras brancas",
     "amostra": "repeating-linear-gradient(180deg, #1C1A1A 0 4px, #F4F0E7 4px 5px)",
     "foto": "fotos/polo-listrada-preto-com-listras-brancas.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 5
  },
  {
   "id": "05d04b6b-1dfa-4b86-adb9-dae78977471c",
   "nome": "Polo Tricô Vazada",
   "categoria": "tricos",
   "preco": null,
   "descricao": "Polo de tricô com textura vazada e barras listradas nas mangas e na cintura.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Lilás",
     "amostra": "#D4CCE6",
     "foto": "fotos/polo-vazada-lilas.jpg"
    },
    {
     "nome": "Verde",
     "amostra": "#BFE3C0",
     "foto": "fotos/polo-vazada-verde.jpg"
    },
    {
     "nome": "Rosa",
     "amostra": "#F4D9D6",
     "foto": "fotos/polo-vazada-rosa.jpg"
    },
    {
     "nome": "Azul",
     "amostra": "#A9CBEF",
     "foto": "fotos/polo-vazada-azul.jpg"
    },
    {
     "nome": "Amarelo",
     "amostra": "#F5E3B5",
     "foto": "fotos/polo-vazada-amarelo.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F4EEE2",
     "foto": "fotos/polo-vazada-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/polo-vazada-preto.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 6
  },
  {
   "id": "3c3582c9-5e13-4d17-89f4-161e05d451f8",
   "nome": "Colete Tricô Botões Dourados",
   "categoria": "coletes",
   "preco": null,
   "descricao": "Colete de tricô com decote V, botões dourados e bolsinhos na frente.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Vinho",
     "amostra": "#7E1F2B",
     "foto": "fotos/colete-vinho.jpg"
    },
    {
     "nome": "Azul-marinho",
     "amostra": "#1F2752",
     "foto": "fotos/colete-azul-marinho.jpg"
    },
    {
     "nome": "Marrom",
     "amostra": "#7A4A35",
     "foto": "fotos/colete-marrom.jpg"
    },
    {
     "nome": "Bege",
     "amostra": "#E8D2B3",
     "foto": "fotos/colete-bege.jpg"
    },
    {
     "nome": "Off-white",
     "amostra": "#F2EEE6",
     "foto": "fotos/colete-off-white.jpg"
    },
    {
     "nome": "Preto",
     "amostra": "#1C1A1A",
     "foto": "fotos/colete-preto.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 1
  },
  {
   "id": "b1792e7d-7516-492e-9db9-92d101fc003a",
   "nome": "Cropped com Faixa",
   "categoria": "cropped",
   "preco": null,
   "descricao": "Cropped sem mangas com faixa longa no ombro, que dá movimento ao look.",
   "tamanhos": [
    "Único"
   ],
   "cores": [
    {
     "nome": "Coral",
     "amostra": "#F39A6C",
     "foto": "fotos/cropped-faixa-coral.jpg"
    },
    {
     "nome": "Amarelo",
     "amostra": "#F2E26C",
     "foto": "fotos/cropped-faixa-amarelo.jpg"
    },
    {
     "nome": "Nude",
     "amostra": "#E8D7C3",
     "foto": "fotos/cropped-faixa-nude.jpg"
    }
   ],
   "foto_alta": true,
   "visivel": true,
   "ordem": 1
  }
 ],
 "config": {
  "id": 1,
  "aviso": "Chegaram os looks para as festas de fim de ano",
  "hero_chamada": "Coleção de festas",
  "hero_texto": "Vestidos, saias e tricôs para você se sentir linda em cada ocasião — do dia a dia às festas de fim de ano.",
  "hero_detalhe": "Peças em P, M, G e tamanho único",
  "banner_foto": "fotos/vestido-laco-vermelho.jpg",
  "banner_alt": "Modelo usando Vestido Longo com Laço na cor Vermelho",
  "destaque": "9a5a200a-2bdb-4494-8df1-f94859659529",
  "pix_chave": "(98) 99232-6467",
  "pix_tipo": "Celular",
  "pix_nome": "Alessandra Pereira",
  "pix_cidade": "São Luís",
  "whatsapp": "",
  "email": "",
  "instagram": "",
  "endereco": "",
  "entrega": ""
 }
};
