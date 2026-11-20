# 주누디자인 링크생성기 (`joonoo_link`) 사내 PIN 보안 배포 가이드

> **중요 (배포 순서)**: 반드시 **1단계(Google Apps Script 배포)**를 먼저 완료한 뒤 **2단계(GitHub Pages 푸시)**를 진행하세요.
> 순서가 바뀌면 기존 `Apps Script`가 `action: "verify"` 응답을 반환하지 않아 편집 모드 잠금 해제가 차단됩니다. (기존 읽기/링크 클릭 기능은 영향 없음)

## 1단계: Google Apps Script (`Code.gs`) 반영 및 새 버전 배포
1. Google Sheets **`주누디자인링크`** 열기:
   - https://docs.google.com/spreadsheets/d/1LE2mxlQRfABEsUQEDkYTYg1g5f5AI26bMaoBJuw_-Js/edit
2. 상단 메뉴 **`확장 프로그램` → `Apps Script`** 클릭
3. 좌측 **`프로젝트 설정(톱니바퀴)` → `스크립트 속성` → `스크립트 속성 추가`**:
   - 속성: `EDIT_PIN`
   - 값: 사내 편집용 PIN (코드나 GitHub에 절대 저장하지 않음)
   - **`스크립트 속성 저장`** 클릭
4. 편집기(`Code.gs`)에 `C:\gemininew\joonoo_link\apps_script\Code.gs` 전체 내용을 붙여넣고 저장(`Ctrl+S`)
5. 우측 상단 **`배포` → `배포 관리`** → 현재 활성 웹 앱의 **수정(연필 아이콘)** 클릭
6. 버전 드롭다운에서 **`새 버전`** 선택 → **`배포`** 클릭
   - 기존 웹 앱 URL (`AKfycbzkU-D5m1R_JIypP3D6S0OqxOo1ICn3wXkE4b0VAoqIT-Yx2EA_Uru3F4blDlIBVnSd`)이 그대로 유지됩니다.

## 2단계: GitHub Pages (`index.html`) 반영
1단계 완료 후 아래 명령으로 `joonoodesign/joonoo_link` 저장소에 푸시합니다:

```powershell
python C:\gemininew\joonoo_github_hub\github_bridge.py push joonoo_link "사내 PIN 보안 인증 모달 및 Apps Script 서버 검증 연동"
```

## 3단계: 배포 후 30초 체크리스트
- [ ] `https://joonoodesign.github.io/joonoo_link/` 새로고침 후 링크 목록 정상 노출(PIN 없이 조회·검색·복사 가능)
- [ ] `편집 잠금 🔒` 클릭 → 잘못된 PIN 입력 시 차단 메시지 표시 확인
- [ ] 올바른 PIN 입력 → `편집 중 🔓` 전환 → 테스트 링크 추가 후 삭제 정상 동작 확인
- [ ] `편집 중 🔓` 클릭 시 즉시 잠금 전환 및 메모리 내 PIN 초기화 확인
