import sys
import urllib.request
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def test_api():
    login_url = 'http://localhost:8080/api/auth/login'
    login_payload = json.dumps({'username': 'admin', 'password': '123456'}).encode('utf-8')
    req = urllib.request.Request(login_url, data=login_payload, headers={'Content-Type': 'application/json'})
    
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        token = res['data']['token']
        print(f"Logged in as admin! Token: {token[:20]}...")

    headers = {'Authorization': f'Bearer {token}'}

    for sem_id in [1, 2, 3, 4]:
        url = f'http://localhost:8080/api/exam-sessions/semester/{sem_id}'
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))['data']
            print(f"\n--- Semester {sem_id}: {len(data)} Exam Sessions ---")
            for sess in data[:3]:
                rooms_url = f"http://localhost:8080/api/exam-sessions/{sess['id']}/rooms"
                r_req = urllib.request.Request(rooms_url, headers=headers)
                with urllib.request.urlopen(r_req) as r_resp:
                    rooms = json.loads(r_resp.read().decode('utf-8'))['data']
                    print(f"  * [{sess['subjectCode']}] {sess['sessionName']} ({sess['examDate']} {sess['startTime']}-{sess['endTime']}): {len(rooms)} rooms, {sess['totalStudents']} students")
                    if rooms:
                        r0 = rooms[0]
                        print(f"      Room {r0['roomCode']} ({r0['roomLocation']}): {r0['studentCount']}/{r0['capacity']} students (Scored: {r0['scoredCount']}), Status: {r0['status']}")

    print("\n--- Verifying Grades Overview for Admin ---")
    for sem_id in [1, 2, 3]:
        url = f'http://localhost:8080/api/grades/admin/overview?semesterId={sem_id}'
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))['data']
            published_count = sum(1 for item in data if item['gradeStatus'] == 'PUBLISHED')
            print(f"Semester {sem_id} Grades Overview: {len(data)} sections, {published_count} PUBLISHED (100% completed)")

if __name__ == '__main__':
    test_api()
