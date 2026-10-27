"""Desde out/2026 não se passa tarefa de casa: o que o plano chamava de HW é feito em aula.
Tira o rótulo HW/HW: e deixa só o conteúdo, como atividade normal; "HW" vazio e "No homework"
somem, e o HWC (correção da tarefa) também, porque não há mais tarefa para corrigir.
As chaves (k) NÃO mudam: são calculadas antes, com o texto original, e os tiques já feitos continuam valendo.

Uso avulso, sobre o arquivo já gerado:  python3 sem_tarefa.py ../../assets/plano-turma/2026-2.js"""
import json, re, sys

def tipo(t):
    s = t.upper()
    if 'VIDEO' in s: return 'video'
    if s == 'MD' or re.match(r'MD\b', s): return 'md'
    if s.startswith('TE') or s.startswith('TM'): return 'te'
    if re.match(r'(SB|BS|ST)\b', s): return 'sb'
    if 'CYBER' in s or 'APP' in s: return 'app'
    return 'outro'

def limpa(t):
    t = re.sub(r'^\s*HW\b\s*[:\-–]?\s*', '', t)
    t = re.sub(r'\s*[-–]\s*in class\s*', ', ', t, flags=re.I)
    t = re.sub(r'\s+(in|at) your house\b|\s+at home\b', '', t, flags=re.I)
    t = re.sub(r'\s+', ' ', t).strip(' -–:;')
    return t[:1].upper() + t[1:]

def semTarefa(blocos):
    n = 0
    for b in blocos:
        for s in b['semanas']:
            for L in s['livros'].values():
                novos = []
                for it in L['itens']:
                    if it.get('tipo') == 'hwc' or re.match(r'\s*HWC\b', it['t']): n += 1; continue
                    if it.get('tipo') == 'hw' or re.match(r'\s*HW\b', it['t']):
                        t = limpa(it['t']); n += 1
                        if not t or re.fullmatch(r'no homework', t, re.I): continue
                        if re.match(r'p(g|\.|\s)', t, re.I):
                            # só a página: no Hello B é o Jolly's Book que veio antes ("ST: Pg 21 - Jolly's B:"), nos teens é o SB
                            t = re.sub(r'\bp(?:g)?\s*[.:]*\s*', 'p. ', t, flags=re.I)
                            ant = novos[-1]['t'] if novos else ''
                            t = ('Jolly’s Book ' if re.search(r'jolly.s b\W*$', ant, re.I) else 'SB ') + t
                        it = dict(it, t=t, tipo=tipo(t))
                    novos.append(it)
                L['itens'] = novos
    return n

if __name__ == '__main__':
    arq = sys.argv[1]
    txt = open(arq, encoding='utf-8').read()
    ini, fim = txt.index('= {') + 2, txt.rindex(';')
    dados = json.loads(txt[ini:fim])
    n = semTarefa(dados['blocos'])
    open(arq, 'w', encoding='utf-8').write(txt[:ini] + json.dumps(dados, ensure_ascii=False, indent=1) + txt[fim:])
    print('itens de tarefa tratados:', n)
