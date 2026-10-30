import re, json, html, pathlib, urllib.request, urllib.parse, concurrent.futures
root=pathlib.Path(__file__).resolve().parents[2]
def text(s): return html.unescape(re.sub('<[^>]+>', '', s)).strip()
items=[]
saha=urllib.request.urlopen('https://www.saha.go.kr/portal/contents.do?mId=0409020000',timeout=40).read().decode('utf-8')
section=saha[saha.index('민방위 비상대피시설 동별 현황'):]
section=section[:section.index('</table>')]
dong=''
for row in re.findall(r'<tr[^>]*>(.*?)</tr>',section,re.S):
    cells=re.findall(r'<td([^>]*)>(.*?)</td>',row,re.S)
    if not cells or not text(cells[0][1]).isdigit(): continue
    values=[text(v) for _,v in cells]
    if len(values)==8: dong=values.pop(1)
    name,address=values[1:3]
    link=re.search(r'href="(https?://[^"]+)"',row)
    items.append(dict(id='saha-'+values[0],name=name,address='부산 사하구 '+address,region='부산 사하구',dong=dong,lat=None,lng=None,phone=None,source='사하구청 민방위 비상시설 안내',sourceUrl='https://www.saha.go.kr/portal/contents.do?mId=0409020000',mapUrl=link.group(1) if link else None,checkedAt='2026-10-30'))
page=urllib.request.urlopen('https://www.sasang.go.kr/index.sasang?menuCd=DOM_000000108011001000',timeout=40).read().decode('utf-8')
dongs=re.findall(r'href="#(DONG\d+)"[^>]*>([^<(]+)',page)
def fetch(pair):
    code,dong=pair
    req=urllib.request.Request('https://www.sasang.go.kr/index.sasang?contentsSid=1331',data=urllib.parse.urlencode({'dong':code}).encode())
    body=urllib.request.urlopen(req,timeout=35).read().decode('utf-8')
    found=[]
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>',body,re.S):
        match=re.search(r"changeLocation\('([\d.]+)',\s*'([\d.]+)'\)[^>]*>([^<]+)</a>",row)
        if not match: continue
        cells=re.findall(r'<td[^>]*>(.*?)</td>',row,re.S)
        found.append(dict(id='sasang-'+text(cells[0]),name=text(match[3]),address='부산 사상구 '+dong,region='부산 사상구',dong=dong,lat=float(match[1]),lng=float(match[2]),phone=None,source='사상구청 대피시설 안내',sourceUrl='https://www.sasang.go.kr/index.sasang?menuCd=DOM_000000108011001000',checkedAt='2026-10-30'))
    return found
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for group in pool.map(fetch,dongs): items.extend(group)
assert len(items)>100, len(items)
(root/'backend/fixtures/busan-official-shelters.json').write_text(json.dumps(items,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Official records:',len(items),'Hadan:',sum('하단' in i['dong'] for i in items),'Deokpo:',sum('덕포' in i['dong'] for i in items))
