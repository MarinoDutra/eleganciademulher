# Elegância de Mulher — loja virtual

Loja de moda feminina com vitrine, carrinho, pagamento somente via PIX (QR code e copia e cola com o valor do pedido) e um painel onde a dona cadastra e edita as peças, cores, fotos, preços e categorias.

## O que tem aqui

| Caminho | O que é |
| --- | --- |
| `site/index.html` | A loja (vitrine, carrinho e PIX) |
| `site/painel.html` | Painel da dona (precisa de login) |
| `site/js/config.js` | Endereço e chave **publishable** do Supabase. Vazio = modo demonstração |
| `site/fotos/` | Fotos das 13 peças iniciais |
| `supabase-instalar.sql` | Cria as tabelas, as regras de acesso, a pasta de fotos e as peças iniciais |
| `supabase-atualizar-whatsapp.sql` | Só para quem já tinha rodado o script antes: troca a lista de novidades de e-mail para WhatsApp |
| `netlify.toml` | Diz ao Netlify para publicar a pasta `site` |

O site é só HTML, CSS e JavaScript: não tem build nem `npm install`.

## Rodar no computador

Abra a pasta `site` no VS Code e use a extensão **Live Server** (botão direito no `index.html` > Open with Live Server), ou rode dentro de `site`:

```
npx serve .
```

## Banco de dados (Supabase)

1. Crie um projeto em supabase.com e rode `supabase-instalar.sql` no SQL Editor.
2. Em Authentication > Users, crie o usuário da dona e libere como administradora:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL-DA-DONA@exemplo.com'
   on conflict do nothing;
   ```
3. Desligue **Allow new users to sign up** em Authentication > Sign In / Providers.
4. Cole a Project URL e a chave publishable (`sb_publishable_...`) em `site/js/config.js`. Nunca coloque a chave secret.

## Publicar (Netlify)

Conecte este repositório no Netlify (Add new project > Import an existing project). O `netlify.toml` já aponta para a pasta `site`, então cada `git push` publica o site de novo. Em Project configuration > General > Visitor access > Project visibility, deixe o projeto **Public**.

## Bibliotecas incluídas (licença MIT)

- [supabase-js](https://github.com/supabase/supabase-js) — `site/js/supabase.js`
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), de Kazuhiko Arase — `site/js/qrcode.js`
