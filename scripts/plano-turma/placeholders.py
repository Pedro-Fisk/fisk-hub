#!/usr/bin/env python3
"""Os placeholders das turmas kids e teens, a partir do plano do semestre (prévia; não grava nada).

    python3 scripts/plano-turma/placeholders.py <card.xlsx> <Escola> [<card2.xlsx> <Escola2> ...] --desde 2026-10-24 [--saida previa.json]

Pedido das secretárias (Pedro, 23/10/2026): abandonar o "p" e o "." como presença nas turmas infantis e teens e
adotar o placeholder, como nos cards dos jovens e adultos. Para cada aluno ATIVO cujo livro está no plano
(assets/plano-turma/<semestre>.js), cada aula a partir de --desde cuja célula está VAZIA recebe ".<lição>" da semana
do plano que contém aquela data. Nunca escreve em célula preenchida. A aula de 2h30 tem duas células no mesmo dia:
as duas recebem a lição; "L10/L11" dá a primeira à primeira aula da semana e a segunda à seguinte. Semana sem lição
(revisão, despedida) fica vazia.

A saída é a lista EXATA de células (escola, aba, linha, coluna, texto), que a rota de aplicação do backend confere de
novo (só escreve se a célula ainda estiver vazia).
"""
import sys, re, json, os, subprocess, datetime as dt, unicodedata
import openpyxl

args, _pula = [], False
for a in sys.argv[1:]:
    if _pula: _pula = False; continue
    if a.startswith('--'): _pula = True; continue
    args.append(a)
PARES = list(zip(args[0::2], args[1::2]))
DESDE = sys.argv[sys.argv.index('--desde') + 1] if '--desde' in sys.argv else dt.date.today().isoformat()
SAIDA = sys.argv[sys.argv.index('--saida') + 1] if '--saida' in sys.argv else None
SEM = sys.argv[sys.argv.index('--sem') + 1] if '--sem' in sys.argv else '2026-2'
ANO = int(SEM.split('-')[0])
AQUI = os.path.dirname(os.path.abspath(__file__))
PLANO = json.loads(subprocess.run(['node', '-e', 'global.window={};require(process.argv[1]);console.log(JSON.stringify(window.PLANO_TURMA[process.argv[2]]))',
                                   os.path.join(AQUI, '..', '..', 'assets', 'plano-turma', SEM + '.js'), SEM], capture_output=True, text=True).stdout)

def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode()
    return re.sub(r'\s+', ' ', s).strip().lower()
MESES = {'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12}
DIAS = {'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'SÁB', 'DOM'}

def blocoDe(livro):
    n = norm(livro).replace(' book', '')
    for b in PLANO['blocos']:
        for x in b['livros']:
            if norm(x).replace(' book', '') == n: return b, x
    return None, None

def semanaDe(b, dia):
    best, bl = None, 1e9
    for i, s in enumerate(b['semanas']):
        if s['de'] <= dia <= s['ate']:
            ln = (dt.date.fromisoformat(s['ate']) - dt.date.fromisoformat(s['de'])).days
            if ln < bl or (ln == bl and (best is None or i > best)): best, bl = i, ln
    return best

def codigos(licao):
    """'L7 (full lesson)' → ['L7']; 'L10/L11' → ['L10','L11']; 'REVIEW 2 + TEST 2' / 'RW2 & Test2' → ['RW2','EG']."""
    t = str(licao or '')
    m = re.match(r'^\s*(?:REVIEW|RW)\s*(\d)', t, re.I)
    if m: return ['RW' + m.group(1), 'EG']
    m = re.match(r'^\s*Adv\s*(\d)', t, re.I)
    if m: return ['Adv' + m.group(1)]
    ls = re.findall(r'L\s*(\d+)', t, re.I)
    return ['L' + x for x in ls] if ls else []

def tx(v):
    if v is None: return ''
    if isinstance(v, bool): return 'TRUE' if v else 'FALSE'
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v)

def ehTitulo(row):
    a = tx(row[0] if row else None).strip(); b = tx(row[1] if len(row) > 1 else None).strip()
    return bool(re.fullmatch(r'\d{0,2}', a)) and len(b) > 3 and 'PEDAG' in ' '.join(str(c or '') for c in row[:6]).upper()

celulas, resumo = [], []
for caminho, escola in PARES:
    wb = openpyxl.load_workbook(caminho, data_only=True)
    for ws in wb.worksheets:
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        i = 0
        while i < len(rows):
            if not ehTitulo(rows[i]): i += 1; continue
            tit, dias, cab = rows[i], rows[i + 1] if i + 1 < len(rows) else [], rows[i + 2] if i + 2 < len(rows) else []
            turma = str(tit[1]).split('\n')[0].strip()
            ini = next((c for c, v in enumerate(dias) if str(v or '').strip().upper() in DIAS), None)
            fim = next((c for c in range(len(tit) - 1, -1, -1) if str(tit[c] or '').strip() == 'Faltas'), len(tit))
            datas, mes = {}, None
            if ini is not None:
                for c in range(0, fim):
                    v = norm(tit[c]) if c < len(tit) else ''
                    for w in re.findall(r'[a-z]{3,}', v):
                        if w[:3] in MESES and c >= ini - 1: mes = MESES[w[:3]]
                    if c < ini: continue
                    d = tx(cab[c] if c < len(cab) else None).strip()
                    if mes and re.fullmatch(r'\d{1,2}', d):
                        try: datas[c] = dt.date(ANO, mes, int(d)).isoformat()
                        except ValueError: pass
            rot = [norm(tx(v)) for v in cab]
            cLivro = next((c for c, v in enumerate(rot) if v == 'book'), None)
            if cLivro is None: cLivro = next((c for c, v in enumerate(rot) if v.startswith('book') or v.startswith('livro')), 5)
            cNome = next((c for c, v in enumerate(rot) if v == 'alunos'), 2)
            cAtivo = next((c for c, v in enumerate(rot) if v == 'ativo'), 1)
            j = i + 3; n_turma = 0; alunos = 0
            while j < len(rows) and not ehTitulo(rows[j]):
                r = rows[j]
                ativo = tx(r[cAtivo] if len(r) > cAtivo else None).strip().upper() == 'TRUE'
                livro = tx(r[cLivro] if len(r) > cLivro else None).strip()
                b, nomeP = blocoDe(livro) if livro else (None, None)
                if ativo and b and r[cNome]:
                    alunos += 1
                    porSemana = {}
                    for c in sorted(datas):
                        dia = datas[c]
                        if dia < DESDE: continue
                        si = semanaDe(b, dia)
                        if si is None: continue
                        L = b['semanas'][si]['livros'].get(nomeP)
                        cods = codigos(L and L.get('licao'))
                        if not cods: continue
                        ordem = porSemana.setdefault(si, [])
                        if dia not in ordem: ordem.append(dia)
                        cod = cods[min(ordem.index(dia), len(cods) - 1)]
                        v = tx(r[c] if c < len(r) else None).strip()
                        # vazia, ou só o "." numa aula FUTURA (o ponto sozinho não diz lição nenhuma: é o que o pedido troca)
                        if v not in ('', '.'): continue
                        celulas.append({'escola': escola, 'aba': ws.title, 'linha': j + 1, 'col': c + 1, 'data': dia, 'texto': '.' + cod,
                                        'aluno': tx(r[cNome]).strip(), 'antes': v, 'raf': str(r[7] or '').strip(), 'livro': livro, 'turma': turma})
                        n_turma += 1
                j += 1
            if alunos: resumo.append((escola, ws.title, turma, alunos, n_turma))
            i = j

print('células a escrever: %d (desde %s)' % (len(celulas), DESDE))
for e, a, t, n, c in resumo: print('  %-9s %-15s %-60s %2d alunos  %3d células' % (e[:9], a[:15], t[:60], n, c))
if SAIDA:
    json.dump({'desde': DESDE, 'semestre': SEM, 'celulas': celulas}, open(SAIDA, 'w'), ensure_ascii=False, indent=0)
    print('lista em', SAIDA)
