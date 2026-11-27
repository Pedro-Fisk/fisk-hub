#!/usr/bin/env python3
"""A VERSÃO DE CLIQUES DAS ATIVIDADES DE CONVERSAÇÃO (Pedro, 27/11/2026; fase 1).

Para cada PowerPoint da pasta da semana (English, Español e as subpastas deles), grava na subpasta
"Conversação (portal, não mexer)" da própria semana um PDF com UMA PÁGINA POR CLIQUE: é o que o Hub
(conversacao.html) passa na TV, com as revelações de aparecer e esmaecer do PowerPoint.

Como (o servidor do portal não desenha slide, por isso roda aqui no Mac):
  1. o Keynote abre o .pptx/.ppt e exporta um PDF com "todas as etapas" (all stages);
  2. o pdftoppm desenha cada etapa a 1920x1080;
  3. sai a etapa IDÊNTICA à anterior: o Keynote exporta duas vezes a partida de slide cuja única
     animação é esmaecer (no Babies eram as 4 perguntas do jogo; o professor clicava duas vezes);
  4. as etapas viram um PDF de imagens JPEG (~4 MB por atividade), gravado com o nome "<id do .pptx>.pdf".
O id vem do próprio Drive do Mac (atributo com.google.drivefs.item-id#S), e o Drive sobe sozinho.
Arquivo já convertido e mais novo que o .pptx é pulado; .pptx trocado na pasta é convertido de novo.

Uso:
  python3 scripts/conversa/converter.py                 # a semana de hoje
  python3 scripts/conversa/converter.py "<pasta da semana>"
  python3 scripts/conversa/converter.py --todas-do-mes  # todas as semanas do mês de hoje
Precisa: Keynote, poppler (pdftoppm) e Pillow.
"""
import os, re, sys, subprocess, tempfile, shutil, glob, datetime, unicodedata

RAIZ = os.path.expanduser('~/Library/CloudStorage/GoogleDrive-pedro.diretor@fiskpersonalizado.com/Shared drives/'
                          'Arquivos Pedagógicos - Professores/03 - Atividades Comunicativas {ano}')
PORTAL = 'Conversação (portal, não mexer)'
MESES = dict(JANEIRO=1, FEVEREIRO=2, MARCO=3, ABRIL=4, MAIO=5, JUNHO=6, JULHO=7, AGOSTO=8, SETEMBRO=9, OUTUBRO=10, NOVEMBRO=11, DEZEMBRO=12)


def norm(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().upper()


def datas_da_semana(nome, ano):
    """A mesma regra do servidor (fisk-hub-backend/ConversaSemana.js, csemSemanaDatas_)."""
    m = re.search(r'DE\s+(\d{1,2})(?:\s+DE\s+([A-Z]+))?\s+A\s+(\d{1,2})\s+DE\s+([A-Z]+)', norm(nome))
    if not m: return None
    mf = MESES.get(m.group(4)); mi = MESES.get(m.group(2)) if m.group(2) else mf
    if not mf or not mi: return None
    return datetime.date(ano - 1 if mi > mf else ano, mi, int(m.group(1))), datetime.date(ano, mf, int(m.group(3)))


def semanas_do_mes(hoje):
    raiz = RAIZ.format(ano=hoje.year)
    out = []
    for mes in os.listdir(raiz):
        n = re.match(r'(\d+)', mes)
        if not n or int(n.group(1)) not in {(hoje.month - 2) % 12 + 1, hoje.month, hoje.month % 12 + 1}: continue
        for sem in os.listdir(os.path.join(raiz, mes)):
            d = datas_da_semana(sem, hoje.year)
            if d: out.append((d[0], d[1], os.path.join(raiz, mes, sem)))
    return sorted(out)


def semana_de_hoje(hoje):
    sems = semanas_do_mes(hoje)
    dentro = [s for s in sems if s[0] <= hoje <= s[1]]
    if dentro: return sorted(dentro, key=lambda s: s[1])[0][2]
    prox = [s for s in sems if 0 < (s[0] - hoje).days <= 3]
    if prox: return prox[0][2]
    passadas = [s for s in sems if s[1] < hoje]
    return passadas[-1][2] if passadas else None


def item_id(caminho):
    r = subprocess.run(['xattr', '-p', 'com.google.drivefs.item-id#S', caminho], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ''


def keynote_pdf(origem, destino):
    script = f'''
tell application "Keynote"
  set d to open POSIX file {applescript_str(origem)}
  delay 2
  export d to POSIX file {applescript_str(destino)} as PDF with properties {{all stages:true, skipped slides:false}}
  close d saving no
end tell'''
    subprocess.run(['osascript', '-e', script], check=True, capture_output=True, timeout=600)


def applescript_str(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


def converter(origem, destino):
    from PIL import Image, ImageChops
    tmp = tempfile.mkdtemp(prefix='conversa-')
    try:
        pdf = os.path.join(tmp, 'etapas.pdf')
        keynote_pdf(origem, pdf)
        subprocess.run(['pdftoppm', '-jpeg', '-jpegopt', 'quality=85', '-scale-to-x', '1920', '-scale-to-y', '1080', pdf, os.path.join(tmp, 'e')], check=True)
        etapas = sorted(glob.glob(os.path.join(tmp, 'e-*.jpg')), key=lambda f: int(re.findall(r'(\d+)\.jpg$', f)[0]))
        imgs, anterior, tiradas = [], None, 0
        for f in etapas:
            im = Image.open(f).convert('RGB')
            if anterior is not None:
                a = anterior.convert('L').resize((480, 270)); b = im.convert('L').resize((480, 270))
                if sum(ImageChops.difference(a, b).histogram()[24:]) < 200:   # nada mudou: etapa repetida
                    tiradas += 1; continue
            imgs.append(im); anterior = im
        if not imgs: raise RuntimeError('o Keynote não exportou nenhuma etapa')
        saida = os.path.join(tmp, 'cliques.pdf')
        imgs[0].save(saida, 'PDF', save_all=True, append_images=imgs[1:], quality=85, resolution=144)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copyfile(saida, destino)
        return len(imgs), tiradas, os.path.getsize(destino)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    args = sys.argv[1:]
    hoje = datetime.date.today()
    if args and args[0] == '--todas-do-mes':
        pastas = [s[2] for s in semanas_do_mes(hoje) if s[0].month == hoje.month or s[1].month == hoje.month]
    elif args:
        pastas = [args[0]]
    else:
        p = semana_de_hoje(hoje)
        if not p: sys.exit('Não achei a pasta da semana de hoje.')
        pastas = [p]
    for semana in pastas:
        print('▶', os.path.basename(semana), flush=True)
        portal = os.path.join(semana, PORTAL)
        for dirpath, dirs, files in os.walk(semana):
            if PORTAL in dirpath: continue
            for f in sorted(files):
                if not re.search(r'\.(pptx|ppt|pptm)$', f, re.I) or f.startswith('~$'): continue
                origem = os.path.join(dirpath, f)
                fid = item_id(origem)
                if not fid: print('  ⚠ sem id do Drive (ainda sincronizando?):', f); continue
                destino = os.path.join(portal, fid + '.pdf')
                if os.path.exists(destino) and os.path.getmtime(destino) >= os.path.getmtime(origem):
                    print('  ✓ já convertida:', f); continue
                try:
                    n, tiradas, tam = converter(origem, destino)
                    print(f'  ✓ {f}: {n} cliques' + (f' ({tiradas} repetidos tirados)' if tiradas else '') + f', {tam / 1e6:.1f} MB', flush=True)
                except Exception as e:
                    print('  ✗', f, '→', str(e)[:200], flush=True)


if __name__ == '__main__':
    main()
