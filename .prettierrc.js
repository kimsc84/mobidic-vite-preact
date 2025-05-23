// .prettierrc.js
module.exports = {
  "semi": false, // 세미콜론 사용 안 함
  "singleQuote": true, // 작은따옴표 사용
  "tabWidth": 2, // 탭 너비는 2칸
  "trailingComma": "es5", // ES5에서 사용 가능한 후행 쉼표 (객체나 배열 마지막)
  "printWidth": 100, // 한 줄 최대 글자 수
  "overrides": [
    {
      "files": "*.json", // 모든 .json 파일에 적용
      "options": {
        // 이 옵션 덕분에 JSON 파일에서도 주석을 쓸 수 있게 된다!
        "parser": "json5"
      }
    }
  ]
}