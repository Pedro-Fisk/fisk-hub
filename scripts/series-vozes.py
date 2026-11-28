#!/usr/bin/env python3
"""AS VOZES DAS SÉRIES DA CONVERSAÇÃO (Pedro, 28/11/2026: "pode gerar pelo TTS e já deixar embutido dentro da
atividade mesmo, não precisa passar pela chave da Azure")

    python3 scripts/series-vozes.py            # gera o que falta e reescreve os índices
    python3 scripts/series-vozes.py --listar   # só diz quantas frases faltam, sem gerar nada

Buddy Talks, Countries, Everyday Life e YouTubers têm o texto fixo, então cada 🔊 (as palavras do Important Words e a
frase do "ouça e escolha") vira um mp3 gerado AQUI, offline, pelo edge-tts, e vai junto da atividade:
    <pasta>/voz/<hash>.mp3      o áudio (o nome é o hash de voz + texto: a mesma frase na mesma voz é um arquivo só)
    <pasta>/voz/index.json      { "<id da atividade>": { "voz": "...", "a": { "<texto>": "<hash>.mp3" } } }
A conversacao.html lê o índice ao abrir a atividade e só cai na API da Azure (portal, api/voz.js) quando falta o
arquivo, que é o caso das atividades do Conversation Maker, geradas na hora.

⚠️ REGRAS DA VOZ (CLAUDE.md do portal-aluno-fisk, "Voz"): sempre TTS neural, nunca a do navegador. Sotaque americano
padrão (aqui o sotaque é cenário, não matéria). A voz VARIA POR ATIVIDADE, homens e mulheres, e nunca dentro dela.

⚠️ Mexeu no conteúdo de uma série (rodou build-buddy-talks/countries/everyday/youtubers)? Rode este script DEPOIS e
commite a pasta voz/. Palavra nova sem mp3 cai na API e, sem ela, no aviso "Read aloud" para o professor ler.
O edge-tts usa WebSocket: roda no computador, não no ambiente de nuvem (o proxy de lá não deixa passar).
"""
import asyncio
import hashlib
import json
import re
import os
import subprocess
import sys

RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
# as mesmas vozes neurais americanas do api/voz.js do portal, alternando homem e mulher
VOZES = ['en-US-AvaNeural', 'en-US-AndrewNeural', 'en-US-EmmaNeural', 'en-US-BrianNeural', 'en-US-JennyNeural',
         'en-US-GuyNeural', 'en-US-MichelleNeural', 'en-US-ChristopherNeural', 'en-US-AriaNeural', 'en-US-EricNeural']
TAXA = '-8%'   # o mesmo ritmo do api/voz.js


def voz_de(ident):
    return VOZES[hashlib.sha256(ident.encode('utf-8')).digest()[0] % len(VOZES)]


def falado(texto):
    # as setas da entonação ("isn't it? ↓") e as barras são para o olho; a voz leria "down arrow"
    return re.sub(r'\s+', ' ', re.sub(r'[↑↓→←↗↘⬆⬇/]+', ' ', texto)).strip() or texto


def arquivo(voz, texto):
    return hashlib.sha1((voz + '|' + texto).encode('utf-8')).hexdigest()[:16] + '.mp3'


async def gera(sem, voz, texto, destino):
    import edge_tts
    async with sem:
        for tentativa in range(4):
            try:
                tmp = destino + '.parcial'
                await edge_tts.Communicate(falado(texto), voz, rate=TAXA).save(tmp)
                if os.path.getsize(tmp) < 1000:
                    raise RuntimeError('mp3 vazio')
                os.replace(tmp, destino)
                return True
            except Exception as e:  # noqa: BLE001
                if tentativa == 3:
                    print('  ✗', voz, repr(texto), e)
                    return False
                await asyncio.sleep(2 * (tentativa + 1))


async def principal(listar):
    textos = json.loads(subprocess.check_output(['node', os.path.join(RAIZ, 'scripts/series-vozes-textos.js')], cwd=RAIZ))
    faltam, total = [], 0
    for pasta, atividades in textos.items():
        os.makedirs(os.path.join(RAIZ, pasta, 'voz'), exist_ok=True)
        for ident, lista in atividades.items():
            voz = voz_de(ident)
            for t in lista:
                total += 1
                destino = os.path.join(RAIZ, pasta, 'voz', arquivo(voz, t))
                if not os.path.exists(destino):
                    faltam.append((voz, t, destino))
    unicos = {f[2]: f for f in faltam}
    print(f'{total} frases nas séries; faltam {len(unicos)} mp3')
    if listar:
        return 0
    sem = asyncio.Semaphore(4)
    ok = await asyncio.gather(*[gera(sem, v, t, d) for v, t, d in unicos.values()])
    falhas = ok.count(False)
    # os índices: só o que tem arquivo; e os mp3 que nenhuma atividade usa mais saem
    for pasta, atividades in textos.items():
        indice, usados = {}, set()
        for ident, lista in atividades.items():
            voz = voz_de(ident)
            a = {}
            for t in lista:
                f = arquivo(voz, t)
                if os.path.exists(os.path.join(RAIZ, pasta, 'voz', f)):
                    a[t] = f
                    usados.add(f)
            indice[ident] = {'voz': voz, 'a': a}
        with open(os.path.join(RAIZ, pasta, 'voz', 'index.json'), 'w', encoding='utf-8') as fh:
            json.dump(indice, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
        for f in os.listdir(os.path.join(RAIZ, pasta, 'voz')):
            if f.endswith('.mp3') and f not in usados:
                os.remove(os.path.join(RAIZ, pasta, 'voz', f))
    print(f'gerados {len(unicos) - falhas}, falharam {falhas}')
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(principal('--listar' in sys.argv)))
