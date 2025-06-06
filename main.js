 
 const patterns = [
{ type: "COMMENT", regex: /^\/\/.*/ } ,
      { type: "KEYWORD", regex: /^(var|let|const|if|else|function|return|while|do|for|switch|case|break|default)\b/ },
   { type: "NUMBER", regex: /^\d+\.?\d*/ },
    { type: "IDENTIFIER", regex: /^[a-zA-Z_]\w*/ },
  { type: "OPERATOR", regex: /^(==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|<|>|=|\+|\-|\*|\/)/ },
   { type: "SYMBOL", regex: /^[{};'(),!?:.\[\]]/ },
   { type: "STRING", regex: /^"(?:[^"\\]|\\.)*"/ }, 
    { type: "WHITESPACE", regex: /^\s+/ }
    
  ];

const textarea = document.querySelector('textarea');
const pre = document.querySelector('pre');

textarea.addEventListener('scroll', function() {
  pre.scrollTop = textarea.scrollTop;
  pre.scrollLeft = textarea.scrollLeft;
});

// Tokenizer: Girdi metnini token'lara ayırır
  function tokenize(input) {
    const tokens = [];
    let line = 1;
    while (input.length > 0) {
      let matched = false;
     for (const pattern of patterns) {
  const match = input.match(pattern.regex);
  if (match) {
    const value = match[0];

    // Satır numarasını token'a ekle
    tokens.push({ type: pattern.type, value: value, line });

    // Yeni satır karakterleri varsa satır sayısını artır
    const newlines = value.match(/\n/g);
    if (newlines) {
      line += newlines.length;
    }

    input = input.slice(value.length);
    matched = true;
    break;
  }
}
      if (!matched) {
        tokens.push({ type: "ERROR", value: input[0] });
        input = input.slice(1);
      }
    }
    return tokens;
  }
// Parser: Token'ları ayrıştırır ve AST oluşturur
  function Parser(tokens) {
  let current = 0;
// Peek: Sıradaki token'ı döner, ancak ilerletmez
  function peek() {
    return tokens[current];
  }
// Consume: Sıradaki token'ı beklenen türde ve değerde ise alır, aksi halde hata fırlatır
  function consume(expectedType, expectedValue = null) {
    const token = tokens[current];
    if (
      token &&
      token.type === expectedType &&
      (expectedValue === null || token.value === expectedValue)
    ) {
      current++;
      return token;
    }
   throw new Error(`Beklenen ${expectedType}${expectedValue ? " '" + expectedValue + "'" : ""}, ama gelen: ${token?.type} '${token?.value}' (satır ${token?.line})`);
  }

  // Program en az bir statement içerir
  function parseProgram() {
    while (current < tokens.length) {
      parseStatement();
    }
  }

  // Statement çeşitlerini kontrol et
  function parseStatement() {
  const token = peek();
  if (!token) return;

  if (token.type === "KEYWORD") {
    switch (token.value) {
       case "var":
    case "let":
    case "const":
        parseVarDeclaration();
        break;
      case "if":
        parseIfStatement();
        break;
      
      case "switch":
        parseSwitchStatement();
         break;
        case "break":
        consume("KEYWORD", "break");
        consume("SYMBOL", ";");
        break;  
        
      case "while":
        parseWhileStatement();
        break;
      case "do":
        parseDoWhileStatement();
        break;  
      case "for":
        parseForStatement();
        break;
      case "function":
        parseFunctionDeclaration();
        break;
      case "return":
        parseReturnStatement();
        break;
      default:
        throw new Error(`Bilinmeyen anahtar kelime: '${token.value}'`);
    }
  } else {
    parseExpressionStatement();
  }
}
// Var declaration: var x = 5; veya let y = "hello";
function parseVarDeclaration(expectSemicolon = true) {
  if (peek().type === "KEYWORD" && ["var", "let", "const"].includes(peek().value)) {
    consume("KEYWORD");
  } else {
    throw new Error(`Beklenen KEYWORD 'var', 'let' veya 'const', ama gelen: ${peek().type} '${peek().value}'`);
  }
  consume("IDENTIFIER");
  consume("OPERATOR", "=");
  parseExpression();
  if (expectSemicolon) {
    consume("SYMBOL", ";");
  }
}
// While statement: while (condition) { statements }
function parseWhileStatement() {
  consume("KEYWORD", "while");
  consume("SYMBOL", "(");
  parseExpression();
  consume("SYMBOL", ")");
  parseBlock();
}
// Do-While statement: do { statements } while (condition);
function parseDoWhileStatement() {
  consume("KEYWORD", "do");
  parseBlock();
  consume("KEYWORD", "while");
  consume("SYMBOL", "(");
  parseExpression();
  consume("SYMBOL", ")");
  consume("SYMBOL", ";");
}



// For statement: for (init; condition; increment) { statements }
function parseForStatement() {
  consume("KEYWORD", "for");
  consume("SYMBOL", "(");

  // init (opsiyonel)
  if (peek() && !(peek().type === "SYMBOL" && peek().value === ";")) {
   if (peek().type === "KEYWORD" && ["var", "let", "const"].includes(peek().value)) {
  parseVarDeclaration(false); // Noktalı virgül bekleme!
} else {
  parseExpression();
}
  }
  consume("SYMBOL", ";");

  // condition (opsiyonel)
  if (peek() && !(peek().type === "SYMBOL" && peek().value === ";")) {
    parseExpression();
  }
  consume("SYMBOL", ";");

  // increment (opsiyonel)
  if (peek() && !(peek().type === "SYMBOL" && peek().value === ")")) {
    parseExpression();
  }
  consume("SYMBOL", ")");

  parseBlock();
}

// Switch statement: switch (expr) { case expr: statements; ... default: statements; }
function parseSwitchStatement() {
  consume("KEYWORD", "switch");
  consume("SYMBOL", "(");
  parseExpression();
  consume("SYMBOL", ")");
  consume("SYMBOL", "{");
  while (peek() && (peek().type === "KEYWORD" && (peek().value === "case" || peek().value === "default"))) {
    if (peek().value === "case") {
      consume("KEYWORD", "case");
      parseExpression();
      consume("SYMBOL", ":");
      while (peek() && !(peek().type === "KEYWORD" && (peek().value === "case" || peek().value === "default")) && !(peek().type === "SYMBOL" && peek().value === "}")) {
        parseStatement();
      }
    } else if (peek().value === "default") {
      consume("KEYWORD", "default");
      consume("SYMBOL", ":");
      while (peek() && !(peek().type === "KEYWORD" && (peek().value === "case" || peek().value === "default")) && !(peek().type === "SYMBOL" && peek().value === "}")) {
        parseStatement();
      }
    }
  }
  consume("SYMBOL", "}");
}

  // if (expr) { statements } [else { statements }]
  function parseIfStatement() {
  consume("KEYWORD", "if");
  consume("SYMBOL", "(");
  const condition = parseExpression();
  consume("SYMBOL", ")");

  let thenBranch = null;
  if (peek() && peek().type === "SYMBOL" && peek().value === "{") {
    parseBlock();
    thenBranch = true; // veya boş bir dizi, ya da sadece parse et
  } else {
    thenBranch = parseStatement();
  }

  let elseBranch = null;
  if (peek() && peek().type === "KEYWORD" && peek().value === "else") {
    consume("KEYWORD", "else");
    if (peek() && peek().type === "KEYWORD" && peek().value === "if") {
      elseBranch = parseIfStatement();
    } else if (peek() && peek().type === "SYMBOL" && peek().value === "{") {
      parseBlock();
      elseBranch = true;
    } else {
      elseBranch = parseStatement();
    }
  }

  return {
    type: "IfStatement",
    condition,
    thenBranch,
    elseBranch,
  };
}

  // Function declaration: function name(params) { statements }
  function parseFunctionDeclaration() {
    consume("KEYWORD", "function");
    consume("IDENTIFIER");
    consume("SYMBOL", "(");
    parseParameters();
    consume("SYMBOL", ")");
    parseBlock();
  }

  // param1, param2, ...
  function parseParameters() {
    if (peek() && peek().type === "IDENTIFIER") {
      consume("IDENTIFIER");
      while (peek() && peek().type === "SYMBOL" && peek().value === ",") {
        consume("SYMBOL", ",");
        consume("IDENTIFIER");
      }
    }
  }

  // return expr;
  function parseReturnStatement() {
  consume("KEYWORD", "return");
  // Eğer sıradaki token ';' ise, ifade yok demektir
  if (peek() && !(peek().type === "SYMBOL" && peek().value === ";")) {
    parseExpression();
  }
  consume("SYMBOL", ";");
}

  // { statements }
  function parseBlock() {
  consume("SYMBOL", "{");
  while (peek() && !(peek().type === "SYMBOL" && peek().value === "}")) {
    parseStatement();
  }
  consume("SYMBOL", "}");
  // return []; // Eğer bir değer döndürmek istiyorsan
}

  // if, var, function, return değilse expression statement olabilir: expr;
  function parseExpressionStatement() {
    parseExpression();
    consume("SYMBOL", ";");
  }

  // Expression: Term ((+ | -) Term)*
 function parseExpression() {
  parseAssignment();
}
// Atama işlemleri: x = 5, y += 10, z-- gibi ifadeleri işler
function parseAssignment() {
  // Atama ve kısa atama operatörleri
  if (
    peek()?.type === "IDENTIFIER" &&
    tokens[current + 1]?.type === "OPERATOR" &&
    ["=", "+=", "-=", "*=", "/="].includes(tokens[current + 1].value)
  ) {
    consume("IDENTIFIER");
    consume("OPERATOR");
    // Sağ tarafı kontrol et: ifade yoksa hata ver
    if (peek() && !(peek().type === "SYMBOL" && peek().value === ";")) {
      parseAssignment(); // sağ taraf da bir atama olabilir
    } else {
      throw new Error(`Atama operatöründen sonra bir ifade bekleniyor`);
    }
  } else if (
    peek()?.type === "IDENTIFIER" &&
    tokens[current + 1]?.type === "OPERATOR" &&
    (tokens[current + 1].value === "++" || tokens[current + 1].value === "--")
  ) {
    consume("IDENTIFIER");
    consume("OPERATOR"); // ++ veya --
} else {
  if (
    peek()?.type === "IDENTIFIER" &&
    tokens[current + 1]?.type === "SYMBOL" &&
    tokens[current + 1]?.value === "("
  ) {
    parseFunctionCall(); // ← doğrudan fonksiyon çağrısı
  } else {
    parseLogicalOr(); // ← normal ifade
  }
}
}
// Logical OR: expr (|| expr)*
function parseLogicalOr() {
  parseLogicalAnd();
  while (peek() && peek().type === "OPERATOR" && peek().value === "||") {
    consume("OPERATOR", "||");
    parseLogicalAnd();
  }
}
// Logical AND: expr (&& expr)*
function parseLogicalAnd() {
  parseEquality();
  while (peek() && peek().type === "OPERATOR" && peek().value === "&&") {
    consume("OPERATOR", "&&");
    parseEquality();
  }
}
// Equality: expr (== | != expr)*
function parseEquality() {
  parseRelational();
  while (
    peek() &&
    peek().type === "OPERATOR" &&
    (peek().value === "==" || peek().value === "!=")
  ) {
    consume("OPERATOR");
    parseRelational();
  }
}
// Relational: expr (< | > | <= | >= expr)*
function parseRelational() {
  parseAdditive();
  while (
    peek() &&
    peek().type === "OPERATOR" &&
    ["<", ">", "<=", ">="].includes(peek().value)
  ) {
    consume("OPERATOR");
    parseAdditive();
  }
}
// Additive: expr (+ | - expr)*
function parseAdditive() {
  parseTerm();
  while (
    peek() &&
    peek().type === "OPERATOR" &&
    (peek().value === "+" || peek().value === "-")
  ) {
    consume("OPERATOR");
    parseTerm();
  }
}
// Term: Factor ((* | /) Factor)*
function parseTerm() {
  parseFactor();
  while (
    peek() &&
    peek().type === "OPERATOR" &&
    (peek().value === "*" || peek().value === "/")
  ) {
    consume("OPERATOR");
    parseFactor();
  }
}
// Factor: Unary | Array | Number | String | Parentheses | Identifier
function parseFactor() {
  const token = peek();

  if (!token) throw new Error("Beklenmeyen ifade sonu");

  // 🔹 Unary operator: -x, !x gibi ifadeler
  if (token.type === "OPERATOR" && ["-", "!"].includes(token.value)) {
    consume(token.type);
    parseFactor(); // operand'ı oku
    return;
  }

  // 🔹 Array literal: [1, 2, "x"] veya []
  if (token.type === "SYMBOL" && token.value === "[") {
    consume("SYMBOL", "[");

    // boş dizi [] kontrolü
    if (peek() && peek().type === "SYMBOL" && peek().value === "]") {
      consume("SYMBOL", "]");
      return;
    }

    while (true) {
      parseExpression(); // her bir elemanı işle

      if (peek() && peek().type === "SYMBOL" && peek().value === ",") {
        consume("SYMBOL", ",");
      } else {
        break;
      }
    }

    consume("SYMBOL", "]"); // dizi bitişi
    return;
  }

  // 🔹 Sayı (örneğin: 42)
  if (token.type === "NUMBER") {
    consume("NUMBER");
    return;
  }

  // 🔹 String (örneğin: "hello")
  if (token.type === "STRING") {
    consume("STRING");
    return;
  }

  // 🔹 Parantezli ifade (örneğin: (a + b))
  if (token.type === "SYMBOL" && token.value === "(") {
    consume("SYMBOL", "(");
    parseExpression();
    consume("SYMBOL", ")");
    return;
  }

  // 🔹 Tanımlayıcı (değişken/fonksiyon adı)
  if (token.type === "IDENTIFIER") {
  consume("IDENTIFIER");

  // Nokta ile erişim: console.log
  while (peek()?.type === "SYMBOL" && peek().value === ".") {
    consume("SYMBOL", ".");
    consume("IDENTIFIER");
  }

  // Fonksiyon çağrısı: console.log()
  if (peek()?.type === "SYMBOL" && peek().value === "(") {
    consume("SYMBOL", "(");
    parseArguments();
    consume("SYMBOL", ")");
  }

  return;
}

  // 🔴 Tanınmayan yapı
  throw new Error(`Beklenmeyen ifade: ${token.value}`);
}


// Additive: expr (+ | - expr)*
function parseAdditive() {
  parseTerm();
  while (peek() && peek().type === "OPERATOR" && ["+", "-"].includes(peek().value)) {
    consume("OPERATOR");
    parseTerm();
  }
}

  // Term: Factor ((* | /) Factor)*
  function parseTerm() {
    parseFactor();
    while (peek() && peek().type === "OPERATOR" && ["*", "/"].includes(peek().value)) {
      consume("OPERATOR");
      parseFactor();
    }
  }


 
  // fname(expr, expr, ...)
  function parseFunctionCall() {
    consume("IDENTIFIER");
    consume("SYMBOL", "(");
    parseArguments();
    consume("SYMBOL", ")");
  }

  // arg1, arg2, ...
  function parseArguments() {
    if (peek() && peek().type !== "SYMBOL") {
      parseExpression();
      while (peek() && peek().type === "SYMBOL" && peek().value === ",") {
        consume("SYMBOL", ",");
        parseExpression();
      }
    }
  }

  return {
    parse: parseProgram
  };
}

let hataTimeout = null; // Hata mesajını gösterme için kullanılan zaman aşımı
// Hata gösterme ve gizleme fonksiyonları
function hataGosterDebounced(hataMesaji) {
  if (hataTimeout) clearTimeout(hataTimeout);
  hataTimeout = setTimeout(function() {
    document.getElementById("errorBox").textContent = "❌ Parse hatası: " + hataMesaji;
    document.getElementById("errorBox").style.display = "block";
  }, 1000); // 2 saniye bekler
}
// Hata gizleme fonksiyonu
function hataGizleDebounced() {
  if (hataTimeout) clearTimeout(hataTimeout);
  document.getElementById("errorBox").textContent = "";
  document.getElementById("errorBox").style.display = "none";
}
// Renklendirme fonksiyonu
function highlightCode() {
  const input = document.getElementById("codeInput").value;
  const tokens = tokenize(input);

  // HTML'e renklendirme için span'li çıktı oluştur
  const html = tokens.map(t =>
    `<span class="${t.type}">${t.value
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</span>`
  ).join("");
  document.getElementById("highlightedCode").innerHTML = html;

  // Parser'dan boşluk ve yorumları çıkar
  const tokensForParser = tokens.filter(t =>
    t.type !== "WHITESPACE" && t.type !== "COMMENT"
  );

  // Hataları kontrol et ve göster
 try {
  const parser = Parser(tokensForParser);
  parser.parse();
  hataGizleDebounced();
} catch (e) {
  hataGosterDebounced(e.message);
} }


  document.getElementById("codeInput").addEventListener("input", highlightCode); // Girdi değiştiğinde renklendirme yap
// Başlangıçta renklendirme yap
  window.addEventListener("DOMContentLoaded", () => {
  const ornekKod = `// Bu örnek kod, bir fonksiyonun toplamını hesaplar ve sonucu kontrol eder.
  function toplamAl(a, b, c) {
  let toplam = 0;

  for (let i = 0; i < 3; i++) {
    toplam = toplam + a + b + c;
  }

  if (toplam > 30) {
    return "Yüksek toplam";
  } else {
    return "Düşük toplam";
  }
}

let sonuc = toplamAl(2, 3, 4);`;

  document.getElementById("codeInput").value = ornekKod;
  highlightCode();
});