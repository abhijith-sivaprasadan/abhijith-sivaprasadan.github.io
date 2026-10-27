#!/usr/bin/env python3
"""Rebuild canonical portfolio pages directly from uploaded Claude Control Volume boards.
No old-site wrappers. Existing case-study pages, PDFs, data, tracks, and skill dossiers survive.

Usage: python3 scripts/rebuild-claude-site.py  [repo root]
Design source: design/claude-control-volume/claude-page-sources.zip (immutable approved pages)
"""
from __future__ import annotations
import os,sys,re,json,zipfile,html,shutil,datetime
from pathlib import Path
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parents[1]).resolve()
source=ROOT/'design/claude-control-volume/claude-page-sources.zip'
if not source.exists():
    partdir=ROOT/'design/claude-control-volume/chunks'
    if partdir.exists():
        import base64
        source.parent.mkdir(parents=True,exist_ok=True)
        encoded=''.join(p.read_text().strip() for p in sorted(partdir.glob('*.b64')))
        source.write_bytes(base64.b64decode(encoded,validate=True))
if not source.exists():
    raise SystemExit('Missing approved Claude source archive at '+str(source))

mapping={'Applied':'index.html','Projects':'projects.html','About':'about.html','Research':'research.html',
    'Energy':'energy-systems.html','Industrial':'industrial-rd.html','Record':'experience.html',
    'Courses':'courses.html','Ideas':'ideas.html','Interests':'interests.html','Hobbies':'hobbies.html',
    'NotFound':'404.html','Story':'story.html'}
filelinks={f'{name}.html':target for name,target in mapping.items()}
filelinks.update({'#':'#'})

# Every design snapshot is a complete document with its own header, page hierarchy and footer.
# Never insert those documents into the older site shell.
CSS='<link rel="stylesheet" href="styles/claude-exact.css?v=20261027-v2">'
JS='<script src="scripts/claude-exact.js?v=20261027-v2" defer></script>'
CV_SCRIPT='<script src="scripts/control-volume.js?v=20261027-control-volume" defer></script>'

project_links={
 'Siemens Energy thesis':'projects/siemens-thesis.html',
 'Structural FEA reactor-internals pilot study':'projects/structural-fea-reactor-internals.html',
 'Comparative energy audit methods':'projects/alleima-energy-efficiency.html',
 'District heating dispatch optimisation':'projects/district-heating-optimisation.html',
 'Heating demand forecasting':'projects/heating-demand-forecasting.html',
 'Distribution grid study':'projects/distribution-grid-study.html',
 'PyPSA-NL grid flexibility':'projects/pypsa-nl-grid-flexibility.html',
 'Industrial energy KPI toolkit':'projects/industrial-energy-kpi-toolkit.html',
}

def hrefs(s):
    for src,dst in filelinks.items():
        if src!='#':s=s.replace('href="'+src+'"','href="'+dst+'"')
    # Links that were unimplemented in the design snapshots now go to real evidence.
    for title,target in project_links.items():
        s=re.sub(r'(<a\s+href=")#("[^>]*>\s*'+re.escape(title)+r'\s*</a>)',lambda m:m.group(1)+target+m.group(2),s,flags=re.I)
    replacements={
        'THESIS ON DIVA':'https://urn.kb.se/resolve?urn=urn:nbn:se:kth:diva-381965',
        'DOWNLOAD RESEARCH CV':'downloads/Abhijith_Sivaprasadan_CV_Generic_Research.pdf',
        'DOWNLOAD ENERGY SYSTEMS / R&amp;D CV':'downloads/Abhijith_Sivaprasadan_CV_Generic_Modelling.pdf',
        'FULL COURSE RECORD':'courses.html',
        'READ THE RESEARCH STATEMENT':'research.html',
        'OPEN THE FULL RECORD':'experience.html',
    }
    for label,target in replacements.items():
        s=re.sub(r'(<a\s+href=")#("[^>]*>\s*'+re.escape(label)+r'[^<]*</a>)',lambda m:m.group(1)+target+m.group(2),s,flags=re.I)
    # Unimplemented link placeholders should not scroll readers to the top.
    s=re.sub(r'<a\s+href="#"([^>]*)>',r'<span class="cv-not-linked"\1>',s)
    # Match corresponding closing tags conservatively only for initially blank links.
    # Above conversion is reverted for links where closing anchor cannot be identified safely.
    s=s.replace('<span class="cv-not-linked"','<a href="#"')
    return s

def patch_toys(s,name):
    if name=='Applied':
        s=s.replace('>PROBE · MOVE INTO THE FIELD</div>',' id="cv-live-field-readout" aria-live="polite">PROBE · MOVE INTO THE FIELD</div>',1)
        s=s.replace('<div class="field" role="application"','<div class="field" data-cv-toy="heat-field" data-readout="#cv-live-field-readout" tabindex="0" role="group"',1)
        # Start from clean source; the runtime supplies dynamic hot source and contours.
        s=re.sub(r'<div class="iso" style="left:300px;top:180px"></div>', '', s)
        s=s.replace('<div class="src" style="left:300px;top:180px"></div>','')
        # Mesh original snapshot uses buttons and visible SVG: add runtime hooks.
        s=s.replace('class="cd cs" data-probe="L1 · COARSE','class="cd cs" data-cv-toy="mesh" data-probe="L1 · COARSE',1)
        for i,label in enumerate(['L1 · COARSE','L2 · MEDIUM','L3 · FINE'],1):
            s=s.replace('class="lvl" style=',f'class="lvl" data-level="{i}" style=',1)
        s=s.replace('<path class="mesh-lines" d=', '<path class="mesh-lines" data-out="mesh" d=',1)
        s=s.replace('<path d="M0 0" fill="none" stroke="#f98e09"','<path data-out="infl" d="M0 0" fill="none" stroke="#f98e09"',1)
        s=re.sub(r'(?<!data-out=)"cells"','"cells"',s)
        s=s.replace('95 SCHEMATIC CELLS','<span data-out="cells">95 SCHEMATIC CELLS</span>',1)
        s=s.replace('COARSE · Δ TO NEXT LEVEL STILL LARGE','<span data-out="verdict">COARSE · Δ TO NEXT LEVEL STILL LARGE</span>',1)
        # Turn static day-300 orbit into a date-driven diagram; no static floating label over the ellipse.
        s=s.replace('<div class="cd" data-probe="DAY 300 · KERALA MONSOON · NEXT IN 217 DAYS"','<div class="cd cv-year-exact" data-cv-toy="year" data-probe="ANNUAL CYCLE · KERALA"',1)
        s=re.sub(r'<polyline points="[0-9.,\s-]+" fill="none" stroke="#8fb7ff"', '<polyline data-out="monsoon" points="" fill="none" stroke="#8fb7ff"',s,count=1)
        s=re.sub(r'<polyline points="[0-9.,\s-]+" fill="none" stroke="#65d6c9"', '<polyline data-out="done" points="" fill="none" stroke="#65d6c9"',s,count=1)
        s=re.sub(r'<text[^>]*>ഇടവപ്പാതി · KERALA MONSOON</text>','',s,count=1)
        # Both concentric marker circles move on the year as the visitor drags the date slider.
        s=re.sub(r'<circle(?![^>]*data-out)[^>]*r="16"[^>]*></circle>',lambda m:m.group(0).replace('<circle','<circle data-out="dot"',1),s,count=1)
        s=re.sub(r'<circle(?![^>]*data-out)[^>]*r="7"[^>]*></circle>',lambda m:m.group(0).replace('<circle','<circle data-out="dot"',1),s,count=1)
        s=s.replace('DAY 300 / 365','<span data-out="day">DAY 300 / 365</span>',1)
        s=re.sub(r'82\s*%\s*ROUND THE CYCLE · 2026','<span data-out="pct">82 % ROUND THE CYCLE · 2026</span>',s,count=1)
        s=s.replace('KERALA MONSOON · NEXT IN 217 DAYS','<span data-out="montext">KERALA MONSOON · NEXT IN 217 DAYS</span>',1)
        marker='The loop closes every 31 December.'
        k=s.find(marker)
        if k!=-1:
            controls='<div class="cv-exact-year-control"><label for="cv-exact-year-day">EXPLORE THE YEAR · <output data-cv-year-date aria-live="polite"></output></label><input id="cv-exact-year-day" type="range" data-cv-year-day min="1" max="366" value="300" step="1" aria-label="Day of the year"><button type="button" data-cv-year-reset>↺ TODAY</button></div>'
            s=s[:k]+controls+s[k:]
    elif name=='Research':
        # The design has actual range input controls; use the audited core Biot computation.
        # Match the containing section with the three source sliders.
        m=re.search(r'(<div class="cd cs b"[^>]*>)(.*?)(</div>\s*</section>)',s,re.S)
        if m:
            prefix=m.group(1).replace('class="cd cs b"','class="cd cs b" data-cv-toy="biot"')
            body=m.group(2)
            # Wire the exact rendered controls to the existing audited Biot implementation.
            # Preserve the supplied composition: only stable data hooks are added.
            for param in ('h','L','k'):
                body=body.replace('<input type="range"',f'<input data-k="{param}" type="range"',1)
                body=re.sub(r'(<b)( style="color:#f2f0e7">)([0-9.]+)( W/m²K| mm| W/mK)(</b>)',lambda m: m.group(1)+f' data-out="{param}"'+m.group(2)+m.group(3)+m.group(5)+m.group(4),body,count=1)
            body=body.replace('>Bi = 0.0035</div>',' data-out="bi">Bi = 0.0035</div>',1)
            body=body.replace('<span style="font-size:13px;letter-spacing:.12em">LUMPED', '<span data-out="verdict" style="font-size:13px;letter-spacing:.12em">LUMPED',1)
            body=body.replace('style="flex:0.9965;background:#8fb7ff','data-out="conv" style="flex:0.9965;background:#8fb7ff',1)
            body=body.replace('style="flex:0.0060;background:#65d6c9','data-out="wall" style="flex:0.0060;background:#65d6c9',1)
            body=body.replace('style="position:absolute;top:-6px;width:3px','data-out="needle" style="position:absolute;top:-6px;width:3px',1)
            s=s[:m.start()]+prefix+body+m.group(3)+s[m.end():]
    return s

def supplement_projects(s):
    path=ROOT/'api/projects.json'
    if not path.exists():return s
    data=json.loads(path.read_text()).get('projects',[])
    unique={}
    for p in data:
        if p.get('status') not in ('published','complete','completed'):continue
        u=p.get('caseStudyUrl')
        if not u or u.startswith('http'):continue
        if u not in unique:unique[u]=p
    covered=set(project_links.values())
    rows=[]
    for p in sorted(unique.values(),key=lambda x:(x.get('order',99),x.get('title',''))):
        u=p['caseStudyUrl'];
        if u in covered:continue
        title=html.escape(p.get('title','Untitled'))
        summary=html.escape(p.get('summary','Evidence is described in the linked case study.'))
        tools=html.escape(' · '.join(p.get('tools',[])[:4]) or 'See methodology')
        category=html.escape(p.get('category') or 'Research')
        hints=p.get('highlights') or []
        deny=[h for h in hints if re.search(r'\b(no |not |without |pending|unvalidated|prototype|alpha|beta|limits?\b|synthetic)',h,re.I)]
        residual=html.escape(deny[0] if deny else 'Evidence bounds and open items are given in the linked case study; independent field validation is not implied.')
        rows.append(f'''<article data-cv-case data-cv-case-category="{category}" class="cv-exact-case-row" data-probe="CASE · SOURCE LINKED"><div class="cv-exact-case-title"><span class="m cv-exact-type">{category}</span><a href="{html.escape(u,quote=True)}">{title} ↗</a></div><div class="cv-exact-case-summary">{summary}</div><div class="m cv-exact-case-method">{tools}</div><div class="rs cv-exact-case-residual">{residual}</div></article>''')
    if not rows:return s
    marker='</main>'
    extra=f'''<section class="cv-exact-extended" aria-label="Additional published case studies"><div class="cv-exact-extended-head"><span class="eb">L2 · ADDITIONAL CASES</span><h2>Source-linked engineering work</h2><p>Further cases from the public portfolio, read using the same boundary, method and residual grammar.</p></div><div class="cv-exact-case-header"><span>CASE</span><span>01 · BOUNDARY</span><span>02 · METHOD</span><span>04 · RESIDUAL</span></div>{''.join(rows)}</section>'''
    return s.replace(marker,extra+'\n'+marker,1)

def patch_projects(s):
    s=re.sub(r'<article data-probe="([^"]+)"',r'<article data-cv-case data-cv-case-category="\1" data-probe="\1"',s)
    s=s.replace('8 OF 8 CASES · RESIDUAL 4/8 STATED','<span data-cv-case-count>8 OF 8 CASES · FOUR TERMS STATED</span>',1)
    s=re.sub(r'(<button type="button"[^>]*>)(ALL|CFD / CHT|STRUCTURAL|ENERGY MANAGEMENT|ENERGY SYSTEMS|GRID|SOFTWARE)(</button>)',lambda m:m.group(1).replace('<button','<button data-cv-filter="'+m.group(2)+'"',1)+m.group(2)+m.group(3),s,flags=re.I)
    return supplement_projects(s)

def correct_facts(s,name):
    s=s.replace("Test engineer and master's thesis student","Master's thesis researcher · test engineering and CFD")
    s=s.replace('115 hp','120 hp').replace('115 HP','120 HP')
    s=s.replace('RECORDED ON THE KTH TRANSCRIPT, MAY 2026','REQUIREMENTS COMPLETED · SEPTEMBER 2026')
    s=s.replace('M.Sc. Sustainable Energy Engineering student at KTH','M.Sc. Sustainable Energy Engineering programme completed at KTH')
    s=s.replace('M.Sc. Sustainable Energy Engineering, expected 2026','M.Sc. Sustainable Energy Engineering, programme requirements completed in 2026; certificate pending')
    s=s.replace('[RESIDUAL LINE NEEDED]','Scenario or prototype study; no live operational validation is claimed.')
    # The thesis is a verified KTH-approved numerical study, not a validation of heater operation.
    s=s.replace('formal root cause analysis','documented failure and scope review')
    return s

def process(s,name):
    s=s.replace('../core/control-volume.css','styles/control-volume.css?v=20261027-control-volume')
    s=s.replace('../core/control-volume.js','scripts/control-volume.js?v=20261027-control-volume')
    s=s.replace('data-cv-focused','')
    s=s.replace('<body class="cv"',f'<body class="cv" data-design-source="claude-control-volume-v1" data-page-key="{name.lower()}"')
    s=hrefs(s)
    s=correct_facts(s,name)
    s=patch_toys(s,name)
    if name=='Projects': pass  # Authored design shell + dynamically loaded complete case catalogue
    s=s.replace('</head>',CSS+'\n</head>',1)
    s=s.replace('</body>',JS+'\n</body>',1)
    if name=='Projects':
        s=re.sub(r'<article data-probe=[\s\S]*?</article>\s*','',s)
        marker='<div class="m mu" style="display:flex;flex-wrap:wrap;gap:8px 32px;padding:0 0 12px;border-bottom:1px solid #2d3a31;font-size:11px;letter-spacing:.14em">'
        idx=s.find(marker)
        if idx>=0:
            end=s.index('</div>',s.index('04 RESIDUAL',idx))
            end=s.index('</div>',end+6)+len('</div>')
            s=s[:end]+'\n<div id="cv-case-list" aria-live="polite" class="cv-source-driven-library"></div>'+s[end:]
        s=s.replace('8 OF 8 CASES · RESIDUAL 4/8 STATED','<span data-cv-case-count>LOADING SOURCE-LINKED CASES · …</span>')
        s=re.sub(r'(<button)( type="button"[^>]*>)(All|CFD / CHT|STRUCTURAL|ENERGY MANAGEMENT|ENERGY SYSTEMS|GRID|SOFTWARE)(</button>)',lambda m:m.group(1)+' data-cv-filter="'+m.group(3)+'"'+m.group(2)+m.group(3)+m.group(4),s,flags=re.I)
        s=s.replace('</body>','<script src="scripts/claude-cases.js?v=20261027-v2" defer></script>\n</body>',1)
    if name=='Applied':
        aliases = {'system':['about'],'lenses':['skills','learning'],'cases':['projects'],'record':['experience','education'],'evidence':['resources'],'open-boundary':['contact','scope']}
        for section,names in aliases.items():
            pat=re.compile(r'(<section id="'+section+r'" style="[^"]*)(">)')
            s=pat.sub(lambda m:m.group(1)+';position:relative'+m.group(2)+''.join('<span id="'+x+'" class="cv-legacy-anchor" aria-hidden="true"></span>' for x in names),s,count=1)
    if name=='Applied':
        s=s.replace('href="#" style="text-decoration:none;color:#65d6c9;padding:12px 0">ORCID', 'href="https://orcid.org/0009-0009-8429-1266" style="text-decoration:none;color:#65d6c9;padding:12px 0">ORCID')
        s=s.replace('href="#" style="text-decoration:none;color:#65d6c9;padding:12px 0">CV','href="downloads/Abhijith_Sivaprasadan_CV_Generic_Research.pdf" style="text-decoration:none;color:#65d6c9;padding:12px 0">CV')
    s=s.replace('Control volume reference','Abhijith Sivaprasadan · Control Volume')
    # Root website cannot retain page-local URLs for the public URL namespace.
    return s

if not (ROOT/'scripts').exists(): (ROOT/'scripts').mkdir(parents=True)
(ROOT/'design/claude-control-volume').mkdir(parents=True,exist_ok=True)
archive=ROOT/'design-legacy'
archive.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(source) as z:
    for name,target in mapping.items():
        dest=ROOT/target
        if dest.exists() and not (archive/target).exists():
            (archive/target).parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(dest,archive/target)
        data=z.read('pages/'+name+'.html').decode('utf-8')
        dest.write_text(process(data,name),encoding='utf-8')
print('Claude-design rebuild:',len(mapping),'canonical pages; originals preserved in design-legacy/')
