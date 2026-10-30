"""Import a downloaded official nationwide shelter CSV; never overwrite data on validation failure."""
import argparse,csv,hashlib,io,json,pathlib,datetime,re

def convert(raw):
    text=None
    for encoding in ['utf-8-sig','cp949']:
        try: text=raw.decode(encoding);break
        except UnicodeDecodeError: pass
    if text is None: raise ValueError('UTF-8 또는 CP949 CSV 파일이 필요합니다.')
    reader=csv.DictReader(io.StringIO(text))
    if not reader.fieldnames: raise ValueError('CSV 열 제목이 없습니다.')
    def get(row,*keys): return next((str(row[k]).strip() for k in keys if row.get(k) and str(row[k]).strip()),'')
    records=[]; skipped=0; unknown=0; seen=set()
    for row in reader:
        name=get(row,'민방위대피시설명','시설명','사업장명','대피시설명')
        road=get(row,'소재지도로명주소','도로명전체주소','도로명주소')
        land=get(row,'소재지지번주소','소재지전체주소','지번주소')
        status=get(row,'운영상태','운영상태명','영업상태명','상세영업상태명','시설상태')
        released=get(row,'해제일자','지정해제일자','폐업일자')
        if released or (status and status not in ['사용중','사용 중','영업/정상','정상','운영중']): skipped+=1;continue
        if not status: unknown+=1
        address=road or land
        if not name or not address: skipped+=1;continue
        lat=get(row,'위도','위도(EPSG4326)','WGS84위도','위도(WGS84)');lng=get(row,'경도','경도(EPSG4326)','WGS84경도','경도(WGS84)')
        try:
            lat,lng=float(lat),float(lng)
            if not (33<=lat<=39 and 124<=lng<=132):lat=lng=None
        except ValueError:lat=lng=None
        # Projected X/Y are NOT latitude/longitude. Keep unresolved until CRS is verified.
        parts=(land or road).split(); region=' '.join(parts[:2]);
        dong=get(row,'읍면동명','행정동명','법정동명') or next((p for p in parts[2:] if re.fullmatch('[가-힣0-9·]+[동읍면리]',p)),'')
        identity=get(row,'관리번호','시설번호') or name+'|'+address
        key=hashlib.sha256(identity.encode()).hexdigest()[:24]
        if key in seen:continue
        seen.add(key)
        records.append(dict(id='national-'+key,name=name,address=address,landAddress=land,region=region,dong=dong,lat=lat,lng=lng,phone=None,source='행정안전부 전국 민방위 대피시설 공개자료',sourceUrl='https://www.data.go.kr/data/15044951/fileData.do',dataDate=get(row,'데이터기준일자','데이터갱신일자','데이터갱신시점','최종수정시점','최종수정일자')))
    if not records: raise ValueError('지원되는 시설명·주소 열을 찾지 못했습니다. 실제 CSV 열 확인이 필요합니다. 열: '+', '.join(reader.fieldnames))
    return records,dict(inputColumns=reader.fieldnames,excluded=skipped,statusUnspecified=unknown,coordinateMissing=sum(r['lat'] is None for r in records))
def main():
    parser=argparse.ArgumentParser();parser.add_argument('csv_path');parser.add_argument('--output',default='backend/fixtures/national-official-shelters.json');args=parser.parse_args()
    raw=pathlib.Path(args.csv_path).read_bytes();records,quality=convert(raw)
    regions=set(r['region'].split()[0] for r in records)
    if len(records)<1000 or len(regions)<16:raise ValueError('전국 파일 검증 실패: 최소 1,000시설, 16개 이상 시도 자료가 필요합니다. 기존 자료를 유지합니다.')
    if quality['statusUnspecified']:raise ValueError('운영 상태 열이 확인되지 않았습니다. 해제 시설 제외를 위해 실제 파일 명세 확인이 필요합니다. 기존 자료를 유지합니다.')
    if quality['coordinateMissing']>len(records)*0.1:raise ValueError('위경도 누락이 10%를 초과합니다. 원본 좌표계 확인 및 변환 후 다시 가져와야 합니다. 기존 자료를 유지합니다.')
    payload=dict(scope='national',importedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),sha256=hashlib.sha256(raw).hexdigest(),regionCount=len(regions),quality=quality,records=records)
    dest=pathlib.Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True);temp=dest.with_suffix('.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8');temp.replace(dest)
    print(json.dumps(dict(records=len(records),regions=len(regions),quality=quality),ensure_ascii=False))
if __name__=='__main__':main()
