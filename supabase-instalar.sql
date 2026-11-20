-- =====================================================================
-- Elegância de Mulher — banco de dados da loja (Supabase)
-- Como usar: no Supabase, abra "SQL Editor", clique em "New query",
-- cole este arquivo inteiro e clique em "Run". Rode uma vez só.
-- =====================================================================

-- ---------- Tabelas ----------
create table if not exists public.categorias (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  nome text not null check (char_length(nome) between 1 and 40),
  secao text not null default '',
  chamada text not null default '',
  nota text not null default '',
  ordem integer not null default 0
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  categoria text not null references public.categorias(id) on update cascade on delete restrict,
  preco numeric(10,2) check (preco is null or preco > 0),
  descricao text not null default '' check (char_length(descricao) <= 600),
  tamanhos text[] not null default array['P','M','G']::text[],
  cores jsonb not null default '[]'::jsonb check (jsonb_typeof(cores) = 'array'),
  foto_alta boolean not null default true,
  visivel boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists produtos_categoria_ordem on public.produtos (categoria, ordem);

create table if not exists public.config (
  id integer primary key default 1 check (id = 1),
  aviso text not null default '',
  hero_chamada text not null default '',
  hero_texto text not null default '',
  hero_detalhe text not null default '',
  banner_foto text not null default '',
  banner_alt text not null default '',
  destaque uuid references public.produtos(id) on delete set null,
  pix_chave text not null default '',
  pix_tipo text not null default '',
  pix_nome text not null default '',
  pix_cidade text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  instagram text not null default '',
  endereco text not null default '',
  entrega text not null default '',
  atualizado_em timestamptz not null default now()
);

create table if not exists public.inscritos (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  whatsapp text,
  criado_em timestamptz not null default now()
);
-- Lista do grupo de novidades no WhatsApp (também atualiza bancos criados com a versão antiga, de e-mail)
alter table public.inscritos add column if not exists nome text not null default '';
alter table public.inscritos add column if not exists whatsapp text;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inscritos' and column_name = 'email') then
    alter table public.inscritos alter column email drop not null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inscritos_whatsapp_formato') then
    alter table public.inscritos add constraint inscritos_whatsapp_formato check (whatsapp ~ '^55[0-9]{10,11}$' and char_length(nome) <= 80);
  end if;
end $$;
create unique index if not exists inscritos_whatsapp_unico on public.inscritos (whatsapp);

-- Quem pode mudar a loja (a dona). Ninguém lê esta tabela pela internet.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Atualiza a data de alteração sozinho
create or replace function public.tocar_atualizado()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;
drop trigger if exists produtos_atualizado on public.produtos;
create trigger produtos_atualizado before update on public.produtos for each row execute function public.tocar_atualizado();
drop trigger if exists config_atualizado on public.config;
create trigger config_atualizado before update on public.config for each row execute function public.tocar_atualizado();

-- A pessoa conectada é administradora da loja?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Regras de acesso (Row Level Security) ----------
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.config enable row level security;
alter table public.inscritos enable row level security;
alter table public.admins enable row level security;

grant select on public.categorias, public.produtos, public.config to anon, authenticated;
grant insert, update, delete on public.categorias, public.produtos to authenticated;
grant update on public.config to authenticated;
grant insert on public.inscritos to anon, authenticated;
grant select, delete on public.inscritos to authenticated;
revoke all on public.admins from anon, authenticated;

drop policy if exists "categorias: todos leem" on public.categorias;
create policy "categorias: todos leem" on public.categorias for select to anon, authenticated using (true);
drop policy if exists "categorias: admin muda" on public.categorias;
create policy "categorias: admin muda" on public.categorias for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "produtos: todos leem os visiveis" on public.produtos;
create policy "produtos: todos leem os visiveis" on public.produtos for select to anon, authenticated using (visivel or (select public.is_admin()));
drop policy if exists "produtos: admin muda" on public.produtos;
create policy "produtos: admin muda" on public.produtos for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "config: todos leem" on public.config;
create policy "config: todos leem" on public.config for select to anon, authenticated using (true);
drop policy if exists "config: admin muda" on public.config;
create policy "config: admin muda" on public.config for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "inscritos: qualquer um se inscreve" on public.inscritos;
create policy "inscritos: qualquer um se inscreve" on public.inscritos for insert to anon, authenticated with check (true);
drop policy if exists "inscritos: admin le" on public.inscritos;
create policy "inscritos: admin le" on public.inscritos for select to authenticated using ((select public.is_admin()));
drop policy if exists "inscritos: admin apaga" on public.inscritos;
create policy "inscritos: admin apaga" on public.inscritos for delete to authenticated using ((select public.is_admin()));

-- ---------- Fotos (Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: admin lista" on storage.objects;
create policy "fotos: admin lista" on storage.objects for select to authenticated using (bucket_id = 'fotos' and (select public.is_admin()));
drop policy if exists "fotos: admin envia" on storage.objects;
create policy "fotos: admin envia" on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and (select public.is_admin()));
drop policy if exists "fotos: admin troca" on storage.objects;
create policy "fotos: admin troca" on storage.objects for update to authenticated using (bucket_id = 'fotos' and (select public.is_admin()));
drop policy if exists "fotos: admin apaga" on storage.objects;
create policy "fotos: admin apaga" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and (select public.is_admin()));

-- ---------- Dados iniciais (as 13 peças atuais) ----------

insert into public.categorias (id, nome, secao, chamada, nota, ordem) values ('vestidos', 'Vestidos', 'Vestidos para as festas', 'Lançamentos', 'Tamanhos P, M e G', 1) on conflict (id) do nothing;
insert into public.categorias (id, nome, secao, chamada, nota, ordem) values ('saias', 'Saias', 'Saias', 'Saias', '', 2) on conflict (id) do nothing;
insert into public.categorias (id, nome, secao, chamada, nota, ordem) values ('tricos', 'Tricôs', 'Blusas e tricôs', 'Tamanho único', 'Disponíveis em várias cores', 3) on conflict (id) do nothing;
insert into public.categorias (id, nome, secao, chamada, nota, ordem) values ('coletes', 'Coletes', 'Blusas e tricôs', '', '', 4) on conflict (id) do nothing;
insert into public.categorias (id, nome, secao, chamada, nota, ordem) values ('cropped', 'Cropped', 'Blusas e tricôs', '', '', 5) on conflict (id) do nothing;

insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  'f21248bf-c13f-4157-a39b-cf537a32e691', 'Vestido Longo com Laço', 'vestidos', null, 'Vestido longo sem mangas, com gola alta, pregas e botões encapados na frente e faixa para laço na cintura.',
  array['P', 'M', 'G']::text[],
  '[{"nome": "Vermelho", "amostra": "#C3161F", "foto": "fotos/vestido-laco-vermelho.jpg"}, {"nome": "Verde", "amostra": "#A2AD95", "foto": "fotos/vestido-laco-verde.jpg"}, {"nome": "Off-white", "amostra": "#EFE9DC", "foto": "fotos/vestido-laco-off-white.jpg"}]'::jsonb,
  true, true, 1) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '24213b27-65a4-4bce-a677-61a645d0c172', 'Vestido Midi com Babados', 'vestidos', null, 'Vestido midi com babados nos ombros, vivos brancos e cintura marcada.',
  array['P', 'M', 'G']::text[],
  '[{"nome": "Vermelho", "amostra": "#C3161F", "foto": "fotos/vestido-babados-vermelho.jpg"}]'::jsonb,
  true, true, 2) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  'c81e880d-a934-4ffc-9933-83332aae009d', 'Vestido Midi com Peplum', 'vestidos', null, 'Vestido midi com decote coração, peplum na frente, broche de brilho na cintura e alças finas.',
  array['P', 'M', 'G']::text[],
  '[{"nome": "Amarelo", "amostra": "#F2E29A", "foto": "fotos/vestido-peplum-amarelo.jpg"}]'::jsonb,
  true, true, 3) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  'dca746e8-1fd1-49e0-910d-a139bb1ef11c', 'Vestido Midi Floral', 'vestidos', null, 'Vestido midi sem mangas, com estampa floral delicada e cintura franzida.',
  array['P', 'M', 'G']::text[],
  '[{"nome": "Floral escuro", "amostra": "radial-gradient(circle, #E7B8C3 22%, transparent 27%) 0 0 / 6px 6px, #23242F", "foto": "fotos/vestido-floral-floral-escuro.jpg"}]'::jsonb,
  true, true, 4) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '9a5a200a-2bdb-4494-8df1-f94859659529', 'Saia Longa com Fenda', 'saias', null, 'Saia longa de cintura alta, com passantes, bolsos laterais e fenda na frente.',
  array['P', 'M', 'G']::text[],
  '[{"nome": "Verde", "amostra": "#7DB98C", "foto": "fotos/saia-fenda-verde.jpg"}, {"nome": "Azul-marinho", "amostra": "#1F2A4E", "foto": "fotos/saia-fenda-azul-marinho.jpg"}, {"nome": "Rosê", "amostra": "#D98F86", "foto": "fotos/saia-fenda-rose.jpg"}, {"nome": "Azul", "amostra": "#6F9CDB", "foto": "fotos/saia-fenda-azul.jpg"}, {"nome": "Marrom", "amostra": "#8A5536", "foto": "fotos/saia-fenda-marrom.jpg"}, {"nome": "Creme", "amostra": "#F0E1C6", "foto": "fotos/saia-fenda-creme.jpg"}, {"nome": "Off-white", "amostra": "#F7F3EA", "foto": "fotos/saia-fenda-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/saia-fenda-preto.jpg"}]'::jsonb,
  false, true, 1) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '3599836b-5f02-4d0d-ab73-8ca0541a7d93', 'Blusa Tricô com Pérolas', 'tricos', null, 'Blusa de tricô canelado com pérolas aplicadas na gola e mangas curtas.',
  array['Único']::text[],
  '[{"nome": "Verde", "amostra": "#BFE0BF", "foto": "fotos/trico-perolas-verde.jpg"}, {"nome": "Azul", "amostra": "#A7CBEE", "foto": "fotos/trico-perolas-azul.jpg"}, {"nome": "Rosa", "amostra": "#F4D3CD", "foto": "fotos/trico-perolas-rosa.jpg"}, {"nome": "Pêssego", "amostra": "#F6D3A8", "foto": "fotos/trico-perolas-pessego.jpg"}, {"nome": "Off-white", "amostra": "#F5EEE2", "foto": "fotos/trico-perolas-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/trico-perolas-preto.jpg"}]'::jsonb,
  true, true, 1) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '06e41235-fd79-4d11-901d-82ccf3d81b91', 'Blusa Tricô com Botões', 'tricos', null, 'Blusa de tricô canelado com acabamento em contraste e botões dourados.',
  array['Único']::text[],
  '[{"nome": "Verde", "amostra": "#C7E2B9", "foto": "fotos/trico-botoes-verde.jpg"}, {"nome": "Amarelo", "amostra": "#F2E8A8", "foto": "fotos/trico-botoes-amarelo.jpg"}, {"nome": "Azul", "amostra": "#AEC3EA", "foto": "fotos/trico-botoes-azul.jpg"}, {"nome": "Off-white", "amostra": "#F6EEDF", "foto": "fotos/trico-botoes-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/trico-botoes-preto.jpg"}]'::jsonb,
  true, true, 2) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  'e3611833-ae45-4716-b5aa-6ee9298d943f', 'Blusa Tricô Gola Larga', 'tricos', null, 'Blusa de tricô com gola larga dobrada e textura em relevo.',
  array['Único']::text[],
  '[{"nome": "Rosa", "amostra": "#F4D4D9", "foto": "fotos/trico-gola-rosa.jpg"}, {"nome": "Verde", "amostra": "#BFE0BE", "foto": "fotos/trico-gola-verde.jpg"}, {"nome": "Lilás", "amostra": "#D3C7E4", "foto": "fotos/trico-gola-lilas.jpg"}, {"nome": "Azul", "amostra": "#A9CDEB", "foto": "fotos/trico-gola-azul.jpg"}, {"nome": "Pêssego", "amostra": "#F6D5A8", "foto": "fotos/trico-gola-pessego.jpg"}, {"nome": "Off-white", "amostra": "#F6EEDD", "foto": "fotos/trico-gola-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/trico-gola-preto.jpg"}]'::jsonb,
  true, true, 3) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  'd6cffbd3-30a3-4c5c-b02e-b0d79c66a614', 'Blusa Tricô com Zíper', 'tricos', null, 'Blusa de tricô canelado com zíper no decote e mangas curtas.',
  array['Único']::text[],
  '[{"nome": "Rosa", "amostra": "#F5D9DA", "foto": "fotos/trico-ziper-rosa.jpg"}, {"nome": "Azul", "amostra": "#A8CDF0", "foto": "fotos/trico-ziper-azul.jpg"}, {"nome": "Verde", "amostra": "#C3E5C2", "foto": "fotos/trico-ziper-verde.jpg"}, {"nome": "Pêssego", "amostra": "#F6D5AD", "foto": "fotos/trico-ziper-pessego.jpg"}, {"nome": "Off-white", "amostra": "#F5EEE3", "foto": "fotos/trico-ziper-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/trico-ziper-preto.jpg"}]'::jsonb,
  true, true, 4) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '5ecca11c-a5d4-407d-9e52-3667f1d1948f', 'Polo Tricô Listrada', 'tricos', null, 'Blusa polo de tricô com listras finas, gola e mangas curtas.',
  array['Único']::text[],
  '[{"nome": "Amarelo", "amostra": "#F6E58F", "foto": "fotos/polo-listrada-amarelo.jpg"}, {"nome": "Rosa", "amostra": "#F4C7C7", "foto": "fotos/polo-listrada-rosa.jpg"}, {"nome": "Lilás", "amostra": "#C9B9E1", "foto": "fotos/polo-listrada-lilas.jpg"}, {"nome": "Azul", "amostra": "#9DCBEF", "foto": "fotos/polo-listrada-azul.jpg"}, {"nome": "Pêssego", "amostra": "#F2C9A1", "foto": "fotos/polo-listrada-pessego.jpg"}, {"nome": "Off-white com listras pretas", "amostra": "repeating-linear-gradient(180deg, #F4F0E7 0 4px, #1C1A1A 4px 5px)", "foto": "fotos/polo-listrada-off-white-com-listras-pretas.jpg"}, {"nome": "Preto com listras brancas", "amostra": "repeating-linear-gradient(180deg, #1C1A1A 0 4px, #F4F0E7 4px 5px)", "foto": "fotos/polo-listrada-preto-com-listras-brancas.jpg"}]'::jsonb,
  true, true, 5) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '05d04b6b-1dfa-4b86-adb9-dae78977471c', 'Polo Tricô Vazada', 'tricos', null, 'Polo de tricô com textura vazada e barras listradas nas mangas e na cintura.',
  array['Único']::text[],
  '[{"nome": "Lilás", "amostra": "#D4CCE6", "foto": "fotos/polo-vazada-lilas.jpg"}, {"nome": "Verde", "amostra": "#BFE3C0", "foto": "fotos/polo-vazada-verde.jpg"}, {"nome": "Rosa", "amostra": "#F4D9D6", "foto": "fotos/polo-vazada-rosa.jpg"}, {"nome": "Azul", "amostra": "#A9CBEF", "foto": "fotos/polo-vazada-azul.jpg"}, {"nome": "Amarelo", "amostra": "#F5E3B5", "foto": "fotos/polo-vazada-amarelo.jpg"}, {"nome": "Off-white", "amostra": "#F4EEE2", "foto": "fotos/polo-vazada-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/polo-vazada-preto.jpg"}]'::jsonb,
  true, true, 6) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  '3c3582c9-5e13-4d17-89f4-161e05d451f8', 'Colete Tricô Botões Dourados', 'coletes', null, 'Colete de tricô com decote V, botões dourados e bolsinhos na frente.',
  array['Único']::text[],
  '[{"nome": "Vinho", "amostra": "#7E1F2B", "foto": "fotos/colete-vinho.jpg"}, {"nome": "Azul-marinho", "amostra": "#1F2752", "foto": "fotos/colete-azul-marinho.jpg"}, {"nome": "Marrom", "amostra": "#7A4A35", "foto": "fotos/colete-marrom.jpg"}, {"nome": "Bege", "amostra": "#E8D2B3", "foto": "fotos/colete-bege.jpg"}, {"nome": "Off-white", "amostra": "#F2EEE6", "foto": "fotos/colete-off-white.jpg"}, {"nome": "Preto", "amostra": "#1C1A1A", "foto": "fotos/colete-preto.jpg"}]'::jsonb,
  true, true, 1) on conflict (id) do nothing;
insert into public.produtos (id, nome, categoria, preco, descricao, tamanhos, cores, foto_alta, visivel, ordem) values (
  'b1792e7d-7516-492e-9db9-92d101fc003a', 'Cropped com Faixa', 'cropped', null, 'Cropped sem mangas com faixa longa no ombro, que dá movimento ao look.',
  array['Único']::text[],
  '[{"nome": "Coral", "amostra": "#F39A6C", "foto": "fotos/cropped-faixa-coral.jpg"}, {"nome": "Amarelo", "amostra": "#F2E26C", "foto": "fotos/cropped-faixa-amarelo.jpg"}, {"nome": "Nude", "amostra": "#E8D7C3", "foto": "fotos/cropped-faixa-nude.jpg"}]'::jsonb,
  true, true, 1) on conflict (id) do nothing;

insert into public.config (id, aviso, hero_chamada, hero_texto, hero_detalhe, banner_foto, banner_alt, destaque, pix_chave, pix_tipo, pix_nome, pix_cidade, whatsapp, email, instagram, endereco, entrega) values (1, 'Chegaram os looks para as festas de fim de ano', 'Coleção de festas', 'Vestidos, saias e tricôs para você se sentir linda em cada ocasião — do dia a dia às festas de fim de ano.', 'Peças em P, M, G e tamanho único', 'fotos/vestido-laco-vermelho.jpg', 'Modelo usando Vestido Longo com Laço na cor Vermelho', '9a5a200a-2bdb-4494-8df1-f94859659529'::uuid, '(98) 99232-6467', 'Celular', 'Alessandra Pereira', 'São Luís', '', '', '', '', '') on conflict (id) do nothing;

-- =====================================================================
-- ÚLTIMO PASSO (rode separado, depois de criar o usuário da dona em
-- Authentication > Users > Add user): troque o e-mail abaixo pelo dela.
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'EMAIL-DA-DONA@exemplo.com'
--   on conflict do nothing;
-- =====================================================================
