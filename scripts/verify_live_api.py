import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://localhost:8080/api'

def test_login(username, password='123456'):
    url = f'{BASE_URL}/auth/login'
    payload = json.dumps({'username': username, 'password': password}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = data.get('data', {}).get('token')
            role = data.get('data', {}).get('role')
            print(f"[OK] Login success for {username}: role={role}")
            return token
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[FAIL] Login failed for {username}: HTTP {e.code} - {err_body}")
        return None
    except Exception as e:
        print(f"[FAIL] Login failed for {username}: {e}")
        return None

def test_curriculum(token, label):
    if not token:
        return
    url = f'{BASE_URL}/curriculum/me'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            prog = data.get('data', {}).get('program', {})
            progress = data.get('data', {}).get('progress', {})
            blocks = data.get('data', {}).get('blocks', [])
            print(f"   -> Curriculum {label}: {prog.get('name')}")
            print(f"      Total Required: {progress.get('requiredCredits')} | Completed: {progress.get('completedCredits')} | In-Progress: {progress.get('inProgressCredits')} | Percent: {progress.get('completionPercent')}%")
            print(f"      Blocks count: {len(blocks)}")
    except Exception as e:
        print(f"   -> Curriculum failed for {label}: {e}")

def test_audit(token, label):
    if not token:
        return
    url = f'{BASE_URL}/curriculum/me/degree-audit'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            d = data.get('data', {})
            audit_cpa = d.get('auditCpa')
            official_cpa = d.get('officialCpa')
            eligible = d.get('isGraduationEligible')
            reasons = d.get('unsatisfiedReasons', [])
            print(f"   -> Degree Audit {label}: Audit CPA={audit_cpa} | Official CPA={official_cpa} | Eligible={eligible} | Missing Req Count={len(reasons)}")
    except Exception as e:
        print(f"   -> Degree Audit failed for {label}: {e}")

def test_graph(token, label):
    if not token:
        return
    url = f'{BASE_URL}/curriculum/me/prerequisite-graph'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            d = data.get('data', {})
            nodes = d.get('nodes', [])
            edges = d.get('edges', [])
            print(f"   -> Prerequisite Graph {label}: Nodes={len(nodes)}, Edges={len(edges)}")
    except Exception as e:
        print(f"   -> Prerequisite Graph failed for {label}: {e}")

def main():
    print("=" * 60)
    print("VERIFYING LIVE SMS BACKEND APIS FOR ALL MAJORS")
    print("=" * 60)
    test_cases = [
        ('admin', 'ADMIN'),
        ('sv_cntt_k16', 'CNTT K16 (Senior)'),
        ('sv_qtkd_k17', 'QTKD K17 (Junior)'),
        ('sv_dtvt_k18', 'DTVT K18 (Sophomore)'),
        ('sv_ck_k16', 'CK K16 (Senior)'),
        ('sv_nn_k17', 'NN K17 (Junior)'),
        ('sv_kt_k18', 'KT K18 (Sophomore)'),
        ('sv_luat_k16', 'LUAT K16 (Senior)'),
        ('sv_xd_k17', 'XD K17 (Junior)'),
        ('sv_yd_k19', 'YD K19 (Freshman)')
    ]
    for u, lbl in test_cases:
        t = test_login(u)
        if lbl != 'ADMIN':
            test_curriculum(t, lbl)
            test_audit(t, lbl)
            test_graph(t, lbl)

if __name__ == '__main__':
    main()
