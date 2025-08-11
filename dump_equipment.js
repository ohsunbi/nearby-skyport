// dump_equipment.js (CommonJS)
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// 1) 서비스 계정 키 로드
// GitHub Actions에서 secrets.CPK_SERVICE_ACCOUNT_JSON을 serviceAccountKey.json로 저장합니다.
const serviceAccount = require(path.resolve('./serviceAccountKey.json'));

// 2) Admin SDK 초기화
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

(async () => {
  try {
    // 3) Firestore → JSON
    const snap = await db.collection('equipment_status').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 4) public/data/ 폴더 보장
    const outDir = './public/data';
    fs.mkdirSync(outDir, { recursive: true });

    // 5) 그룹 나누기 (ALL, C1, C2, C3)
    const byDept = {
      ALL: data,
      C1: data.filter(item => item.e_orgdept === 'C1'),
      C2: data.filter(item => item.e_orgdept === 'C2'),
      C3: data.filter(item => item.e_orgdept === 'C3'),
    };

    // 6) 파일로 쓰기
    const writeJSON = (filename, payload) => {
      const fullPath = path.join(outDir, filename);
      fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2));
      return fullPath;
    };

    const paths = [];
    paths.push(writeJSON('equipment_ALL.json', byDept.ALL));
    paths.push(writeJSON('equipment_C1.json', byDept.C1));
    paths.push(writeJSON('equipment_C2.json', byDept.C2));
    paths.push(writeJSON('equipment_C3.json', byDept.C3));

    console.log('저장 완료:');
    console.log(
      `- ALL: ${byDept.ALL.length}건\n- C1: ${byDept.C1.length}건\n- C2: ${byDept.C2.length}건\n- C3: ${byDept.C3.length}건`
    );
    console.log('파일:', paths.join('\n'));
  } catch (err) {
    console.error('생성 중 오류:', err);
    process.exit(1);
  }
})();
