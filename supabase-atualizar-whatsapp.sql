-- Elegância de Mulher — atualização: grupo de novidades pelo WhatsApp
-- Para quem já rodou o supabase-instalar.sql antes. Cole no SQL Editor do Supabase e clique em Run.
-- Pode rodar mais de uma vez sem problema; nada da loja é apagado.

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
