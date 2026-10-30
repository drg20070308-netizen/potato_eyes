import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('national_import',Path(__file__).parents[1]/'scripts/import-national.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ImportTests(unittest.TestCase):
 def test_keeps_active_and_excludes_released(self):
  records,quality=module.convert(('시설명,소재지도로명주소,소재지지번주소,운영상태,해제일자,위도,경도\n정상시설,부산 사하구 낙동대로 1,부산 사하구 하단동 1,사용중,,35.1,128.96\n해제시설,서울 중구 길 1,,사용중,2026-01-01,37.5,127\n폐쇄시설,서울 중구 길 2,,폐쇄,,37.5,127\n').encode('utf-8'))
  self.assertEqual(len(records),1);self.assertEqual(records[0]['dong'],'하단동');self.assertEqual(quality['excluded'],2);self.assertIsNone(records[0]['phone'])
 def test_projected_coordinates_are_not_latitude(self):
  records,quality=module.convert('시설명,소재지도로명주소,운영상태,좌표정보(x),좌표정보(y)\n시험시설,부산 사하구 길 1,사용중,200000,300000\n'.encode('cp949'))
  self.assertIsNone(records[0]['lat']);self.assertEqual(quality['coordinateMissing'],1)
 def test_unknown_columns_fail_explicitly(self):
  with self.assertRaises(ValueError):module.convert(b'unknown,other\nx,y\n')
if __name__=='__main__':unittest.main()
