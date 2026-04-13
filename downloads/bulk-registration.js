/**
 * 가맹점 일괄등록 다운로드 (ADMIN-SITE-UI 이식)
 * JSZip 기반 템플릿 조작 + CSV 생성
 */

var SUPPLIER = {
  bizNo: "6468800430",
  name: "주식회사 스마트올리브",
  ceo: "박현숙",
  email: "rpa@smart-olive.co.kr",
  taxEmail: "tax@smart-olive.co.kr"
};

var COMMISSION_RATE = 0.0275;

// 컬럼 레터 배열 (A~BZ)
function colLettersUpTo(maxCol) {
  var letters = [];
  for (var i = 0; i <= maxCol; i++) {
    if (i < 26) letters.push(String.fromCharCode(65 + i));
    else letters.push(String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
  }
  return letters;
}

var COL_REVERSE = colLettersUpTo(66);    // A~BO (67 cols)
var COL_FORWARD_50 = colLettersUpTo(58); // A~BG (59 cols)
var COL_FORWARD_101 = colLettersUpTo(50);// A~AY (51 cols)

// XML 이스케이프
function escXml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// 다운로드 트리거
function downloadBlob(blob, fileName) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 가맹점 마스터 조회
function findMaster(bizNo, name) {
  if (typeof storeMaster === 'undefined') return {ceoName:'', email:''};
  if (storeMaster[bizNo]) return storeMaster[bizNo];
  // 하이픈 없는 10자리 → XXX-XX-XXXXX 포맷으로 재조회
  var digits = String(bizNo||'').replace(/\D/g,'');
  if (digits.length === 10) {
    var hy = digits.slice(0,3) + '-' + digits.slice(3,5) + '-' + digits.slice(5);
    if (storeMaster[hy]) return storeMaster[hy];
  }
  return {ceoName:'', email:''};
}

/* ================================================================ */
/*  역발행 설정                                                       */
/* ================================================================ */
function getReverseConfig(buyer) {
  var B = buyer || SUPPLIER;
  var buyerEmail = B.email || SUPPLIER.taxEmail;
  return {
    templateUrl: "downloads/templates/reverse.xlsx",
    colLetters: COL_REVERSE, maxCol: 66, lastColLetter: "BO", spans: "1:67",
    buildVals: function(item, master, storeBizNo, supply, tax, writeDay, itemText, receiptType) {
      var v = {};
      v[0]={type:"s",value:"03"}; v[1]={type:"s",value:""};
      v[2]={type:"s",value:storeBizNo.replace(/-/g,"")};
      v[4]={type:"s",value:item.name}; v[5]={type:"s",value:master.ceoName||""};
      v[9]={type:"s",value:master.email||""};
      v[10]={type:"s",value:B.bizNo}; v[12]={type:"s",value:B.name};
      v[13]={type:"s",value:B.ceo}; v[17]={type:"s",value:buyerEmail};
      v[19]={type:"s",value:SUPPLIER.bizNo}; v[21]={type:"s",value:SUPPLIER.name};
      v[22]={type:"s",value:SUPPLIER.ceo}; v[26]={type:"s",value:SUPPLIER.taxEmail};
      v[27]={type:"n",value:supply}; v[28]={type:"n",value:tax};
      v[30]={type:"s",value:writeDay}; v[31]={type:"s",value:itemText};
      v[35]={type:"n",value:supply}; v[36]={type:"n",value:tax};
      v[66]={type:"s",value:receiptType};
      return v;
    }
  };
}

function getForward50Config() {
  return {
    templateUrl: "downloads/templates/forward_50.xlsx",
    colLetters: COL_FORWARD_50, maxCol: 58, lastColLetter: "BG", spans: "1:59",
    buildVals: function(item, master, storeBizNo, supply, tax, writeDay, itemText, receiptType) {
      var v = {};
      v[0]={type:"s",value:"01"}; v[1]={type:"s",value:""};
      v[2]={type:"s",value:SUPPLIER.bizNo}; v[4]={type:"s",value:SUPPLIER.name};
      v[5]={type:"s",value:SUPPLIER.ceo}; v[9]={type:"s",value:SUPPLIER.email};
      v[10]={type:"s",value:storeBizNo.replace(/-/g,"")}; v[12]={type:"s",value:item.name};
      v[13]={type:"s",value:master.ceoName||""}; v[17]={type:"s",value:master.email||""};
      v[19]={type:"n",value:supply}; v[20]={type:"n",value:tax};
      v[22]={type:"s",value:writeDay}; v[23]={type:"s",value:itemText};
      v[27]={type:"n",value:supply}; v[28]={type:"n",value:tax};
      v[58]={type:"s",value:receiptType};
      return v;
    }
  };
}

function getForward101Config() {
  return {
    templateUrl: "downloads/templates/forward_101.xlsx",
    colLetters: COL_FORWARD_101, maxCol: 50, lastColLetter: "AY", spans: "1:51",
    buildVals: function(item, master, storeBizNo, supply, tax, writeDay, itemText, receiptType) {
      var v = {};
      v[0]={type:"s",value:"01"}; v[1]={type:"s",value:""};
      v[2]={type:"s",value:storeBizNo.replace(/-/g,"")}; v[4]={type:"s",value:item.name};
      v[5]={type:"s",value:master.ceoName||""}; v[9]={type:"s",value:master.email||""};
      v[11]={type:"n",value:supply}; v[12]={type:"n",value:tax};
      v[14]={type:"s",value:writeDay}; v[15]={type:"s",value:itemText};
      v[19]={type:"n",value:supply}; v[20]={type:"n",value:tax};
      v[50]={type:"s",value:receiptType};
      return v;
    }
  };
}

/* ================================================================ */
/*  홈택스 Excel 생성 (JSZip 템플릿 조작)                               */
/* ================================================================ */
function generateBulkRegExcel(params) {
  var type = params.type, items = params.items, writeDate = params.writeDate;
  var itemName = params.itemName, wihagoCode = params.wihagoCode, receiptType = params.receiptType;
  var forceLarge = params.forceLargeTemplate;
  var onProgress = params.onProgress || function(){};
  var totalItems = items.length;
  onProgress(10);

  // 설정 결정
  var config;
  if (type === "reverse") config = getReverseConfig(params.buyer);
  else if (forceLarge) config = getForward101Config();
  else config = getForward50Config();

  var defaultWiCode = type === "reverse" ? "45710" : type === "forward" ? "40720" : "40710";
  var wiCode = wihagoCode || defaultWiCode;
  var itemText = "[" + wiCode + "] " + itemName;
  var writeDay = writeDate.slice(6, 8);

  // 템플릿 로드
  fetch(config.templateUrl).then(function(res) {
    return res.arrayBuffer();
  }).then(function(buf) {
    return JSZip.loadAsync(buf);
  }).then(function(zip) {
    onProgress(20);

    // 폰트 크기 조정
    return zip.file("xl/styles.xml").async("string").then(function(stylesXml) {
      zip.file("xl/styles.xml", stylesXml.replace(/<sz val="11"\/>/g, '<sz val="9"/>'));
      return zip.file("xl/sharedStrings.xml").async("string");
    }).then(function(ssXml) {
      // shared strings 파싱
      var ssItems = [];
      var siRegex = /<si>([\s\S]*?)<\/si>/g;
      var siMatch;
      while ((siMatch = siRegex.exec(ssXml)) !== null) ssItems.push(siMatch[1]);

      function addSS(text) {
        var escaped = escXml(text);
        var idx = ssItems.length;
        ssItems.push("<t>" + escaped + "</t>");
        return idx;
      }

      return zip.file("xl/worksheets/sheet1.xml").async("string").then(function(sheetXml) {
        onProgress(30);

        // 7행 스타일 추출
        var row7Match = sheetXml.match(/<row r="7"[^>]*>([\s\S]*?)<\/row>/);
        var styleMap = {};
        if (row7Match) {
          var cellRegex = /<c r="([A-Z]+)7" s="(\d+)"\/>/g;
          var cm;
          while ((cm = cellRegex.exec(row7Match[1])) !== null) styleMap[cm[1]] = cm[2];
        }

        // 데이터 행 생성
        var newRows = [];
        for (var i = 0; i < totalItems; i++) {
          var item = items[i];
          var supply = item.supply || 0;
          var tax = item.tax || 0;
          var storeBizNo = (item.note || item.bizNo || "").replace(/\s/g, "");
          var master = findMaster(storeBizNo, item.name);

          var rowNum = 7 + i;
          var vals = config.buildVals(item, master, storeBizNo, supply, tax, writeDay, itemText, receiptType);
          vals[1] = {type:"s", value:writeDate};

          var cells = "";
          for (var c = 0; c <= config.maxCol; c++) {
            var col = config.colLetters[c];
            var ref = col + rowNum;
            var s = styleMap[col] ? ' s="' + styleMap[col] + '"' : "";
            var v = vals[c];
            if (v && String(v.value) !== "") {
              if (v.type === "n") {
                cells += '<c r="' + ref + '"' + s + '><v>' + v.value + '</v></c>';
              } else {
                var ssIdx = addSS(String(v.value));
                cells += '<c r="' + ref + '"' + s + ' t="s"><v>' + ssIdx + '</v></c>';
              }
            } else {
              cells += '<c r="' + ref + '"' + s + '/>';
            }
          }
          newRows.push('<row r="' + rowNum + '" spans="' + config.spans + '" ht="24" customHeight="1">' + cells + '</row>');
          onProgress(30 + Math.round(((i + 1) / totalItems) * 50));
        }

        // sheet XML 업데이트
        var maxDimRow = Math.max(6 + totalItems, 106);
        var updatedSheetXml = sheetXml
          .replace(/<dimension ref="[^"]*"/, '<dimension ref="A1:' + config.lastColLetter + maxDimRow + '"')
          .replace(/(<row r="7"[\s\S]*?)(<\/sheetData>)/, newRows.join("") + "$2")
          .replace(/ bestFit="1"/g, "");

        // shared strings 업데이트
        var newSsXml = ssXml
          .replace(/<sst[^>]*>/, '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + ssItems.length + '" uniqueCount="' + ssItems.length + '">')
          .replace(/<si>[\s\S]*<\/sst>/, ssItems.map(function(s){return "<si>" + s + "</si>";}).join("") + "</sst>");

        zip.file("xl/worksheets/sheet1.xml", updatedSheetXml);
        zip.file("xl/sharedStrings.xml", newSsXml);
        onProgress(95);

        return zip.generateAsync({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
      });
    });
  }).then(function(blob) {
    var typeLabel = type === "reverse" ? "역발행" : type === "forward" ? "정발행(일반)" : "정발행(간이)";
    var sizeLabel = totalItems > 100 ? "_대량" : "";
    downloadBlob(blob, "세금계산서_일괄등록_" + typeLabel + sizeLabel + "_" + writeDate + ".xlsx");
    onProgress(100);
  }).catch(function(err) {
    console.error("일괄등록 Excel 생성 실패:", err);
    alert("엑셀 생성 실패: " + err.message);
  });
}

/* ================================================================ */
/*  U+ 전자문서 CSV 생성                                              */
/* ================================================================ */
// 원본 72개 헤더 (ADMIN-SITE-UI csv-generator.ts 기준)
var UPLUS_CSV_HEADER = [
  "작성일자","문서관리번호","세금계산서종류","세금계산서분류","영수청구구분",
  "수정코드","권","번호","일련번호","수입신고번호","일괄발급시작일","일괄발급종료일","수입총건",
  "공급자사업자등록번호","공급자종사업장번호","공급자상호","공급자대표자성명","공급자주소","공급자업태","공급자업종",
  "공급자담당부서명","공급자담당자명","공급자전화번호","공급자이메일",
  "공급받는자구분코드","공급받는자사업자등록번호","공급받는자종사업장번호","공급받는자상호","공급받는자대표자성명",
  "공급받는자주소","공급받는자업태","공급받는자업종","공급받는자담당부서명","공급받는자담당자명","공급받는자전화번호","공급받는자이메일",
  "공급받는자담당부서명2","공급받는자담당자명2","공급받는자전화번호2","공급받는자이메일2",
  "수탁자사업자등록번호","수탁자종사업장번호","수탁자상호","수탁자대표자성명","수탁자주소","수탁자업태","수탁자업종",
  "수탁자부서명","수탁자담당자명","수탁자전화번호","수탁자이메일",
  "현금결제금액","수표결제금액","어음결제금액","외상결제금액",
  "공급가액합계","세액합계","총금액","매출매입구분","수기여부","비고",
  "공급자담당자사번","공급받는자담당자사번",
  "상품일련번호","거래일자","품목명","규격","수량","단가","공급가액","세액","거래비고","당초승인번호"
];

// EUC-KR 인코더 (ADMIN-SITE-UI encoding.ts 기준)
function createEucKrEncoder() {
  var decoder = new TextDecoder("euc-kr");
  var map = new Map();
  for (var b = 0; b < 0x80; b++) map.set(String.fromCharCode(b).charCodeAt(0), [b]);
  for (var hi = 0x81; hi <= 0xfe; hi++) {
    for (var lo = 0x41; lo <= 0xfe; lo++) {
      var bytes = new Uint8Array([hi, lo]);
      var ch = decoder.decode(bytes);
      if (ch && ch !== "\uFFFD" && ch.length === 1) map.set(ch.charCodeAt(0), [hi, lo]);
    }
  }
  return function(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      var b = map.get(code);
      if (b) { for (var j = 0; j < b.length; j++) result.push(b[j]); }
      else result.push(0x3f);
    }
    return new Uint8Array(result);
  };
}

// CSV 필드 이스케이프 (원본 기준)
function csvEscape(v) {
  if (!v) return "";
  if (v.indexOf(",") >= 0 || v.indexOf('"') >= 0 || v.indexOf("\n") >= 0) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function generateBulkRegCsv(params) {
  var type = params.type, items = params.items, writeDate = params.writeDate;
  var tradeDate = params.tradeDate, itemName = params.itemName, wihagoCode = params.wihagoCode;
  var receiptType = params.receiptType;
  var onProgress = params.onProgress || function(){};
  var totalItems = items.length;
  onProgress(10);

  var defaultWiCode = type === "reverse" ? "45710" : type === "forward" ? "40720" : "40710";
  var wiCode = wihagoCode || defaultWiCode;
  var itemText = "[" + wiCode + "] " + itemName;
  var uplusReceiptType = type === "reverse" ? "2" : receiptType === "01" ? "1" : "2";

  onProgress(20);
  var csvRows = [];
  for (var i = 0; i < totalItems; i++) {
    var item = items[i];
    var supply = item.supply || 0;
    var tax = item.tax || 0;
    var total = supply + tax;
    var storeBizNo = (item.note || item.bizNo || "").replace(/\s/g,"").replace(/-/g,"");
    var master = findMaster(storeBizNo, item.name);

    var vals = new Array(UPLUS_CSV_HEADER.length).fill("");
    vals[0] = writeDate; vals[2] = "1";
    vals[3] = type === "reverse" ? "3" : "1";
    vals[4] = uplusReceiptType;

    if (type === "reverse") {
      var B = params.buyer || SUPPLIER;
      var buyerEmail = B.email || SUPPLIER.email;
      vals[13] = storeBizNo; vals[15] = item.name;
      vals[16] = master.ceoName || ""; vals[23] = master.email || "";
      vals[25] = B.bizNo; vals[27] = B.name;
      vals[28] = B.ceo; vals[35] = buyerEmail;
    } else {
      vals[13] = SUPPLIER.bizNo; vals[15] = SUPPLIER.name;
      vals[16] = SUPPLIER.ceo; vals[23] = SUPPLIER.email;
      vals[25] = storeBizNo; vals[27] = item.name;
      vals[28] = master.ceoName || ""; vals[35] = master.email || "";
    }

    vals[55] = String(supply); vals[56] = String(tax); vals[57] = String(total);
    vals[58] = type === "reverse" ? "2" : "1";
    vals[64] = tradeDate; vals[65] = itemText;
    vals[69] = String(supply); vals[70] = String(tax);

    csvRows.push(vals.map(csvEscape).join(","));
    onProgress(20 + Math.round(((i + 1) / totalItems) * 60));
  }

  onProgress(90);
  var csvContent = UPLUS_CSV_HEADER.map(csvEscape).join(",") + "\n" + csvRows.join("\n") + "\n";
  // EUC-KR 인코딩
  var encodeToEucKr = createEucKrEncoder();
  var encoded = encodeToEucKr(csvContent);
  var blob = new Blob([encoded], {type:"text/csv"});
  var typeLabel = type === "reverse" ? "역발행" : type === "forward" ? "정발행(일반)" : "정발행(간이)";
  downloadBlob(blob, "세금계산서_일괄등록_" + typeLabel + "_전자문서_" + writeDate + ".csv");
  onProgress(100);
}

/* ================================================================ */
/*  내역 다운로드 (역발행/정발행 일반/간이) - 템플릿 기반                   */
/* ================================================================ */
function generateDetailExcel(type, items, companyName, year, month) {
  var labels = {reverse:'역발행', forward:'정발행(일반)', forwardSimple:'정발행(간이)'};
  var today = new Date();
  var dateStr = today.getFullYear() + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0');

  fetch("downloads/templates/reverse_detail.xlsx").then(function(res){
    return res.arrayBuffer();
  }).then(function(buf){
    return JSZip.loadAsync(buf);
  }).then(function(zip){
    // sharedStrings 파싱
    return zip.file("xl/sharedStrings.xml").async("string").then(function(ssXml){
      var ssItems = [];
      var siRegex = /<si>([\s\S]*?)<\/si>/g, m;
      while((m=siRegex.exec(ssXml))!==null) ssItems.push(m[1]);
      var newStrings = ssItems.map(function(si){
        var tMatch = si.match(/<t[^>]*>([^<]*)<\/t>/);
        return tMatch ? tMatch[1] : "";
      });

      // 타이틀 교체
      var titleIdx = newStrings.findIndex(function(s){return s.indexOf("■")>=0;});
      if(titleIdx>=0) newStrings[titleIdx] = "■"+year+"년 "+month+"월 "+companyName+" "+labels[type]+" 내역";

      // 기간 교체
      var periodIdx = newStrings.findIndex(function(s){return /\d{4}-\d{2}-\d{2}/.test(s);});
      if(periodIdx>=0) newStrings[periodIdx] = year+"-"+month+"-01~"+year+"-"+month+"-28";

      // 가맹점명 교체 (가맹점1~가맹점12)
      for(var i=1;i<=12;i++){
        var tpl="가맹점"+i;
        var idx=newStrings.findIndex(function(s){return s===tpl;});
        if(idx>=0) newStrings[idx] = i<=items.length ? items[i-1].name : "";
      }

      // sharedStrings 재빌드
      var rebuilt = ssXml.replace(/<si>[\s\S]*?<\/si>/g, (function(){
        var j=0;
        return function(){ var str=newStrings[j]||""; j++; return '<si><t>'+escXml(str)+'</t></si>'; };
      })());
      rebuilt = rebuilt.replace(/uniqueCount="\d+"/, 'uniqueCount="'+newStrings.length+'"');
      rebuilt = rebuilt.replace(/count="\d+"/, 'count="'+newStrings.length+'"');
      zip.file("xl/sharedStrings.xml", rebuilt);

      return zip.file("xl/worksheets/sheet1.xml").async("string");
    }).then(function(sheetXml){
      // 숫자 셀 업데이트 (C5~G16 데이터, D17~G17 합계)
      function updateCell(xml, ref, val){
        var re = new RegExp('(<c r="'+ref+'"[^>]*>)(<v>[^<]*<\\/v>)','g');
        return xml.replace(re, function(match,prefix){
          if(prefix.indexOf('t="s"')>=0) return match;
          return prefix+'<v>'+val+'</v>';
        });
      }

      var totalFee=0,totalBill=0,totalSupply=0,totalTax=0;
      items.forEach(function(item,i){
        if(i>=12) return;
        var row = 5+i;
        var adj = item.amount;
        var fee = Math.round(adj * COMMISSION_RATE);
        var bill = type==='reverse' ? adj-fee : fee;
        var tax = Math.ceil(bill/11);
        var supply = bill-tax;
        totalFee+=fee; totalBill+=bill; totalSupply+=supply; totalTax+=tax;

        sheetXml = updateCell(sheetXml, "C"+row, adj);
        sheetXml = updateCell(sheetXml, "D"+row, fee);
        sheetXml = updateCell(sheetXml, "E"+row, bill);
        sheetXml = updateCell(sheetXml, "F"+row, supply);
        sheetXml = updateCell(sheetXml, "G"+row, tax);
      });
      // 합계 행 (row 17)
      sheetXml = updateCell(sheetXml, "D17", totalFee);
      sheetXml = updateCell(sheetXml, "E17", totalBill);
      sheetXml = updateCell(sheetXml, "F17", totalSupply);
      sheetXml = updateCell(sheetXml, "G17", totalTax);

      zip.file("xl/worksheets/sheet1.xml", sheetXml);
      return zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    });
  }).then(function(blob){
    downloadBlob(blob, companyName+"_"+year+"년"+month+"월_"+labels[type]+"_내역_원본_"+dateStr+".xlsx");
  }).catch(function(err){
    console.error("내역 Excel 생성 실패:", err);
    alert("내역 엑셀 생성에 실패했습니다.");
  });
}

/* ================================================================ */
/*  대량이체 다운로드 (JSZip 스타일 포함)                                */
/* ================================================================ */
function generateTransferExcel(items, companyName, year, month) {
  var today = new Date();
  var dateStr = today.getFullYear() + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0');

  // SharedStrings 빌드
  var ss = [];
  function ssIdx(str){ var s=String(str); var i=ss.indexOf(s); if(i>=0) return i; ss.push(s); return ss.length-1; }
  var headerTexts = ["은행","계좌번호","금액","설명","비고"];
  headerTexts.forEach(ssIdx);

  var rowsXml = '';
  // 헤더 행
  rowsXml += '<row r="1" spans="1:5" ht="20" customHeight="1">';
  headerTexts.forEach(function(h,c){ rowsXml += '<c r="'+String.fromCharCode(65+c)+'1" s="3" t="s"><v>'+ssIdx(h)+'</v></c>'; });
  rowsXml += '</row>';
  // 데이터 행
  items.forEach(function(item,r){
    var rowNum = r+2;
    var fee = Math.round(item.amount * COMMISSION_RATE);
    var amt = item.amount - fee;
    rowsXml += '<row r="'+rowNum+'" spans="1:5" ht="16.5" customHeight="1">';
    rowsXml += '<c r="A'+rowNum+'" s="1" t="s"><v>'+ssIdx("")+'</v></c>';
    rowsXml += '<c r="B'+rowNum+'" s="1" t="s"><v>'+ssIdx("")+'</v></c>';
    rowsXml += '<c r="C'+rowNum+'" s="2"><v>'+amt+'</v></c>';
    rowsXml += '<c r="D'+rowNum+'" s="1" t="s"><v>'+ssIdx(item.name)+'</v></c>';
    rowsXml += '<c r="E'+rowNum+'" s="1" t="s"><v>'+ssIdx(item.bizNo||"")+'</v></c>';
    rowsXml += '</row>';
  });

  var sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  +'<cols><col min="1" max="1" width="11" customWidth="1"/><col min="2" max="2" width="16" customWidth="1"/><col min="3" max="3" width="13" customWidth="1"/><col min="4" max="4" width="38" customWidth="1"/><col min="5" max="5" width="12" customWidth="1"/></cols>'
  +'<sheetData>'+rowsXml+'</sheetData></worksheet>';

  var ssXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'+ss.length+'" uniqueCount="'+ss.length+'">'
  +ss.map(function(s){return '<si><t>'+escXml(s)+'</t></si>';}).join('')+'</sst>';

  var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  +'<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>'
  +'<fonts count="2"><font><sz val="10"/><name val="맑은 고딕"/></font><font><b/><sz val="10"/><name val="맑은 고딕"/></font></fonts>'
  +'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F1F2"/></patternFill></fill></fills>'
  +'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>'
  +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  +'<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs></styleSheet>';

  var zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="대량이체" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>');
  zip.file('xl/worksheets/sheet1.xml', sheetXml);
  zip.file('xl/styles.xml', stylesXml);
  zip.file('xl/sharedStrings.xml', ssXml);

  zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}).then(function(blob){
    downloadBlob(blob, companyName+"_"+year+"년"+month+"월_대량이체_원본_"+dateStr+".xlsx");
  });
}

/* ================================================================ */
/*  회계전표 다운로드 (JSZip 스타일 포함)                                */
/* ================================================================ */
function generateSlipExcel(items, companyName, year, month) {
  var today = new Date();
  var dateStr = today.getFullYear() + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0');
  var mon = parseInt(month);

  var ss = [];
  function ssIdx(str){ var s=String(str); var i=ss.indexOf(s); if(i>=0) return i; ss.push(s); return ss.length-1; }
  var headers = ["월","일","구분","Code","계정과목","거래처코드","거래처","차변","대변","거래처","적요"];
  headers.forEach(ssIdx);

  var rowsXml = '';
  // 헤더
  rowsXml += '<row r="1" spans="1:11" ht="20" customHeight="1">';
  headers.forEach(function(h,c){ rowsXml += '<c r="'+String.fromCharCode(65+c)+'1" s="3" t="s"><v>'+ssIdx(h)+'</v></c>'; });
  rowsXml += '</row>';

  var totalBill = 0;
  // 가맹점 전표 (차변)
  items.forEach(function(item,r){
    var fee = Math.round(item.amount * COMMISSION_RATE);
    var bill = item.amount - fee;
    totalBill += bill;
    var rowNum = r+2;
    rowsXml += '<row r="'+rowNum+'" spans="1:11" ht="16.5" customHeight="1">';
    rowsXml += '<c r="A'+rowNum+'" s="2"><v>'+mon+'</v></c>';
    rowsXml += '<c r="B'+rowNum+'" s="1"/>';
    rowsXml += '<c r="C'+rowNum+'" s="1" t="s"><v>'+ssIdx("차변")+'</v></c>';
    rowsXml += '<c r="D'+rowNum+'" s="2"><v>27500</v></c>';
    rowsXml += '<c r="E'+rowNum+'" s="1" t="s"><v>'+ssIdx("가맹점예수금")+'</v></c>';
    rowsXml += '<c r="F'+rowNum+'" s="1"/>';
    rowsXml += '<c r="G'+rowNum+'" s="1" t="s"><v>'+ssIdx(item.name)+'</v></c>';
    rowsXml += '<c r="H'+rowNum+'" s="2"><v>'+bill+'</v></c>';
    rowsXml += '<c r="I'+rowNum+'" s="1"/>';
    rowsXml += '<c r="J'+rowNum+'" s="1"/>';
    rowsXml += '<c r="K'+rowNum+'" s="1" t="s"><v>'+ssIdx(mon+"월 "+item.name)+'</v></c>';
    rowsXml += '</row>';
  });
  // 기업 전표 (대변)
  var lastRow = items.length + 2;
  rowsXml += '<row r="'+lastRow+'" spans="1:11" ht="16.5" customHeight="1">';
  rowsXml += '<c r="A'+lastRow+'" s="2"><v>'+mon+'</v></c>';
  rowsXml += '<c r="B'+lastRow+'" s="1"/>';
  rowsXml += '<c r="C'+lastRow+'" s="1" t="s"><v>'+ssIdx("대변")+'</v></c>';
  rowsXml += '<c r="D'+lastRow+'" s="2"><v>34500</v></c>';
  rowsXml += '<c r="E'+lastRow+'" s="1" t="s"><v>'+ssIdx("외상매출금")+'</v></c>';
  rowsXml += '<c r="F'+lastRow+'" s="1"/>';
  rowsXml += '<c r="G'+lastRow+'" s="1" t="s"><v>'+ssIdx(companyName)+'</v></c>';
  rowsXml += '<c r="H'+lastRow+'" s="1"/>';
  rowsXml += '<c r="I'+lastRow+'" s="2"><v>'+totalBill+'</v></c>';
  rowsXml += '<c r="J'+lastRow+'" s="1"/>';
  rowsXml += '<c r="K'+lastRow+'" s="1" t="s"><v>'+ssIdx(mon+"월 식대 이용료")+'</v></c>';
  rowsXml += '</row>';

  var colWidths = [5,5,6,8,14,12,24,14,14,10,24];
  var colsXml = '<cols>';
  colWidths.forEach(function(w,i){colsXml += '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';});
  colsXml += '</cols>';

  var sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+colsXml+'<sheetData>'+rowsXml+'</sheetData></worksheet>';
  var ssXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'+ss.length+'" uniqueCount="'+ss.length+'">'+ss.map(function(s){return '<si><t>'+escXml(s)+'</t></si>';}).join('')+'</sst>';

  var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="10"/><name val="맑은 고딕"/></font><font><b/><sz val="10"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F1F2"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs></styleSheet>';

  var zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="전표" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>');
  zip.file('xl/worksheets/sheet1.xml', sheetXml);
  zip.file('xl/styles.xml', stylesXml);
  zip.file('xl/sharedStrings.xml', ssXml);

  zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}).then(function(blob){
    downloadBlob(blob, companyName+"_"+year+"년"+month+"월_전표_원본_"+dateStr+".xlsx");
  });
}
