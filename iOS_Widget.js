// 오늘 날짜 가져오기
const today = new Date();
const todayDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getDate()}`;

// 내일 날짜 계산 (안전한 방식)
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowDate = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getDate()}`;

// URL 설정
const url = "https://www.mmu.ac.kr/main/contents/todayMenu2";

// HTML 데이터 요청
let req = new Request(url);
let html = await req.loadString();

// HTML에서 식단 테이블 추출
let tableRegex = /<tbody>([\s\S]*?)<\/tbody>/;
let tableMatch = html.match(tableRegex);

if (!tableMatch) {
    throw new Error("식단 테이블을 찾을 수 없습니다.");
}

let tbody = tableMatch[1];

// 오늘 날짜 데이터 추출
let rowRegexToday = new RegExp(
    `<tr>\\s*<td[^>]*>.*?${todayDate}.*?<\\/td>([\\s\\S]*?)<\\/tr>`,
    "i"
);
let rowToday = tbody.match(rowRegexToday);

// 내일 날짜 데이터 추출
let rowRegexTomorrow = new RegExp(
    `<tr>\\s*<td[^>]*>.*?${tomorrowDate}.*?<\\/td>([\\s\\S]*?)<\\/tr>`,
    "i"
);
let rowTomorrow = tbody.match(rowRegexTomorrow);

if (!rowToday && !rowTomorrow) {
    throw new Error("오늘 또는 내일의 식단을 찾을 수 없습니다.");
}

// 메뉴 데이터 추출 함수
function extractMenus(rowData) {
    let mealRegex = /<td[^>]*>(.*?)<\/td>/g;
    let menus = [];
    let match;
    while ((match = mealRegex.exec(rowData)) !== null) {
        let menu = match[1]
            .replace(/<br\s*\/?>/g, "\n") // <br> 태그를 줄바꿈으로 대체
            .replace(/&amp;/g, "&") // HTML 엔티티 변환
            .replace(/<[^>]+>/g, "") // 모든 HTML 태그 제거
            .trim();
        menus.push(menu);
    }
    return menus;
}

// 오늘과 내일의 메뉴 가져오기
let todayMenus = rowToday ? extractMenus(rowToday[1]) : [];
let tomorrowMenus = rowTomorrow ? extractMenus(rowTomorrow[1]) : [];

// 현재 시간 가져오기
const now = new Date();
const hours = now.getHours();
const minutes = now.getMinutes();
const currentTime = hours * 60 + minutes; // 현재 시간을 분 단위로 변환

// 메뉴 결정
let selectedMenu;
let titleText;

// 시간대에 따라 메뉴와 제목 설정
if (currentTime >= 0 && currentTime <= 510) { // 00:00 ~ 08:30
    selectedMenu = todayMenus[0]; // 오늘 조식
    titleText = `오늘의 조식 🌅`;
} else if (currentTime >= 511 && currentTime <= 810) { // 08:31 ~ 13:30
    selectedMenu = todayMenus[1]; // 오늘 중식
    titleText = `오늘의 중식 🖼️`;
} else if (currentTime >= 811 && currentTime <= 1110) { // 13:31 ~ 18:30
    selectedMenu = todayMenus[2]; // 오늘 석식
    titleText = `오늘의 석식 🌆`;
} else { // 18:31 ~ 23:59 (다음 날의 조식)
    selectedMenu = tomorrowMenus[0]; // 내일 조식
    titleText = `내일의 조식 🌅`;
}

// 위젯 생성
let widget = new ListWidget();
widget.backgroundColor = new Color("#1C1C1E"); // 어두운 배경 설정

// 제목 추가 (간격 줄이기)
let title = widget.addText(titleText);
title.font = Font.boldSystemFont(14); // 제목 크기 설정
title.textColor = Color.white(); // 제목은 흰색
title.centerAlignText();
widget.addSpacer(8); // 제목 아래 간격을 최소화

// 메뉴 추가
let menu = widget.addText(selectedMenu || "메뉴 정보 없음");
menu.font = Font.thinSystemFont(12); // 메뉴 폰트 크기
menu.textColor = new Color("#FFCC00"); // 내용 글자색 변경
menu.centerAlignText();
widget.addSpacer(4); // 간격 축소

// 위젯 설정
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentSmall(); // 작은 위젯으로 확인
}

Script.complete();