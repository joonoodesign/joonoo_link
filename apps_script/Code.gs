/**
 * 주누디자인 링크생성기 (joonoo_link) Google Apps Script 백엔드
 * - 대상 스프레드시트: 주누디자인링크 (시트1: id | name | url | category)
 * - 보안 원칙: 사내 편집 PIN은 코드에 하드코딩하지 않고 Script Properties('EDIT_PIN')에 저장합니다.
 *
 * [초기 설정 및 배포 절차]
 * 1. Google Sheets(주누디자인링크) -> 확장 프로그램 -> Apps Script 열기
 * 2. 프로젝트 설정(톱니바퀴) -> 스크립트 속성 -> 속성 추가:
 *    - 속성: EDIT_PIN
 *    - 값: 사내 편집 PIN (예: 숫자/문자 조합)
 * 3. 이 코드(Code.gs)를 붙여넣고 저장
 * 4. 배포 -> 배포 관리 -> 기존 웹 앱 편집(연필 아이콘) -> 버전: "새 버전" -> 배포
 *    (기존 웹 앱 URL을 유지해야 index.html의 SCRIPT_URL 변경 없이 바로 연동됩니다.)
 */

var VALID_CATEGORIES_ = {
  top: true,
  partner: true,
  design: true,
  frequent: true
};

function jsonOut_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getLinksSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets()[0];
}

function doGet() {
  var sheet = getLinksSheet_();
  var rows = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0] && !row[1] && !row[2]) continue;
    result.push({
      id: row[0],
      name: row[1],
      url: row[2],
      category: row[3] || "frequent"
    });
  }

  return jsonOut_(result);
}

function doPost(e) {
  var raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
  var data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return jsonOut_({
      ok: false,
      error: "INVALID_JSON",
      message: "요청 형식이 올바르지 않습니다."
    });
  }

  if (!data || typeof data !== "object") {
    return jsonOut_({
      ok: false,
      error: "INVALID_JSON",
      message: "요청 데이터가 비어 있습니다."
    });
  }

  // 1. 사내 PIN 토큰 검증 (모든 쓰기/인증 요청 공통)
  var expectedPin = String(PropertiesService.getScriptProperties().getProperty("EDIT_PIN") || "").trim();
  if (!expectedPin) {
    return jsonOut_({
      ok: false,
      error: "PIN_NOT_CONFIGURED",
      message: "Apps Script 속성에 EDIT_PIN이 설정되지 않았습니다."
    });
  }

  var providedPin = String(data.pin || "").trim();
  if (!providedPin || !safeEqual_(providedPin, expectedPin)) {
    return jsonOut_({
      ok: false,
      error: "INVALID_PIN",
      message: "사내 PIN이 올바르지 않습니다."
    });
  }

  // 2. 액션별 처리
  var action = String(data.action || "").trim();

  if (action === "verify") {
    return jsonOut_({
      ok: true,
      verified: true,
      action: "verify"
    });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getLinksSheet_();

    if (action === "add") {
      var name = String(data.name || "").trim();
      var url = String(data.url || "").trim();
      var category = String(data.category || "frequent").trim();
      var id = String(data.id || Date.now()).trim();

      if (!name || name.length > 100) {
        return jsonOut_({
          ok: false,
          error: "INVALID_NAME",
          message: "버튼 이름은 1~100자 이내로 입력해주세요."
        });
      }
      if (!/^https?:\/\/\S+$/i.test(url) || url.length > 2048) {
        return jsonOut_({
          ok: false,
          error: "INVALID_URL",
          message: "올바른 http:// 또는 https:// 주소만 등록할 수 있습니다."
        });
      }
      if (!VALID_CATEGORIES_[category]) {
        category = "frequent";
      }

      sheet.appendRow([id, name, url, category]);
      return jsonOut_({
        ok: true,
        action: "add",
        id: id
      });
    }

    if (action === "delete") {
      var targetId = String(data.id || "").trim();
      if (!targetId) {
        return jsonOut_({
          ok: false,
          error: "INVALID_ID",
          message: "삭제할 링크 ID가 없습니다."
        });
      }

      var rows = sheet.getDataRange().getValues();
      for (var i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]).trim() === targetId) {
          sheet.deleteRow(i + 1);
          return jsonOut_({
            ok: true,
            action: "delete",
            id: targetId
          });
        }
      }

      return jsonOut_({
        ok: false,
        error: "NOT_FOUND",
        message: "삭제할 링크를 찾을 수 없습니다."
      });
    }

    return jsonOut_({
      ok: false,
      error: "INVALID_ACTION",
      message: "지원하지 않는 요청입니다."
    });
  } finally {
    lock.releaseLock();
  }
}
