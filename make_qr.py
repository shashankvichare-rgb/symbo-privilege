"""Run locally on a private Recipients CSV export. Nothing is uploaded.
py tools/make_qr.py private-exports/recipients.csv --out qr-output
Requires: py -m pip install "qrcode[pil]"
"""
import argparse,csv,html,pathlib,re,urllib.parse
import qrcode
from qrcode.constants import ERROR_CORRECT_M
p=argparse.ArgumentParser();p.add_argument('csv_file');p.add_argument('--out',default='qr-output');p.add_argument('--include-tests',action='store_true');a=p.parse_args()
out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True);cards=[];seen=set()
with open(a.csv_file,encoding='utf-8-sig',newline='') as f:
 for r in csv.DictReader(f):
  pid=r.get('PrivilegeID','').strip();url=r.get('QRURL','').strip()
  if not pid or (pid.startswith('SYM-TEST-') and not a.include_tests):continue
  if r.get('Active','').strip().upper()!='TRUE':continue
  if not re.fullmatch(r'[A-Za-z0-9-]+',pid) or pid in seen:raise SystemExit('Unsafe or duplicate ID: '+pid)
  seen.add(pid);u=urllib.parse.urlsplit(url);query=urllib.parse.parse_qs(u.query)
  if u.scheme!='https' or not re.fullmatch(r'[a-f0-9]{64}',query.get('token',[''])[0]):raise SystemExit('Missing valid QRURL for '+pid)
  qr=qrcode.QRCode(error_correction=ERROR_CORRECT_M,box_size=12,border=4);qr.add_data(url);qr.make(fit=True);qr.make_image(fill_color='black',back_color='white').save(out/(pid+'.png'))
  cards.append(f'<article><h2>Symbo Privilege</h2><p>Your Festive Concierge</p><img src="{html.escape(pid)}.png" alt="Personal QR code"><strong>Scan to choose your privilege</strong><p>{html.escape(pid)} · Valid until {html.escape(r.get("ValidUntil",""))}</p><p>Call / WhatsApp: +91 86579 18455</p></article>')
(out/'qr-contact-sheet.html').write_text('<!doctype html><meta charset="utf-8"><title>PRIVATE • Symbo QR proof sheet</title><style>body{font:12px Arial;display:flex;flex-wrap:wrap;gap:12mm}article{width:85.6mm;min-height:70mm;border:1px solid #ddd;padding:6mm;box-sizing:border-box;break-inside:avoid}h2{font-size:17px}img{width:35mm;height:35mm;display:block;margin:4mm 0}strong{display:block}@media print{body{gap:8mm}}</style>'+''.join(cards),encoding='utf-8')
print(f'Generated {len(cards)} private QR images and a proof sheet in {out}. These bearer links grant access; share only with the intended print vendor/recipient.')
