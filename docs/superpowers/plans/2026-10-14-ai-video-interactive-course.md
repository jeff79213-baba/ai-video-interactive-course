# AI 影片互動式課程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一份可在投影幕播放的 HTML 互動式課程簡報，開頭播放 MP4，之後進入 7 章內容，第 1～5 章附可放大、可掃描的提示詞 QR Code。

**Architecture:** 純 HTML/CSS/JS（ES Modules，無框架）。內容與外觀分離：課程文字寫在 HTML，提示詞集中在 `src/prompts-data.js`，樣式集中在 `styles.css` 並使用 CSS 變數。純邏輯抽成 `src/*.js` 以便用 Vitest 單元測試；DOM 互動以 jsdom 做元件測試。QR 由在地端函式庫 `vendor/qrcode.js` 依 `location.origin` 動態產生。

**Tech Stack:** HTML5、CSS（CSS 變數）、原生 ES Modules、Vitest + jsdom、qrcode-generator 1.4.4（vendored）、Firebase Hosting。

## Global Constraints

- 語系：全部繁體中文。
- 專案目錄：`ai影片互動式課程/`（以下所有路徑皆相對於此目錄）。
- 無框架、無 bundler；瀏覽器直接載入 `app.js` / `prompts.js`（`type="module"`）與 `vendor/qrcode.js`（傳統 script）。
- 樣式一律集中在 `styles.css`，使用 CSS 變數控制顏色／字級／間距；HTML 不得使用 inline style 調色（`style` 屬性僅允許用於必要的動態尺寸，且需於計畫中明列）。
- QR 內容 = `{location.origin}/prompts.html#{chapterId}`，不得依賴外部 QR 服務。
- QR 函式庫來源：`https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js`（下載後存放 `vendor/qrcode.js`，全域變數名為 `qrcode`）。
- Firebase site：`aivideo-sk`（專案 `opencode-sk`），網址 `https://aivideo-sk.web.app`。
- 章節：固定 7 章，第 1～5 章 `hasPrompt = true`，第 6、7 章 `hasPrompt = false`。
- 提示詞 ID：`p1-1`、`p2-a`、`p2-b`、`p3-1`、`p3-2`、`p3-3`、`p4-1`、`p4-2`、`p5-1`、`p5-2`。
- 測試指令：`npm test`（= `vitest run`）。每個任務結束都要跑並通過。

---

## File Structure

```
ai影片互動式課程/
├── index.html                 # 主簡報：影片區 + 7 章章節
├── prompts.html               # 提示詞總表（QR 掃描目標）
├── styles.css                 # 全部樣式（CSS 變數）
├── app.js                     # index.html 的進入點（翻頁、進度、QR、燈箱）
├── prompts.js                 # prompts.html 的進入點（渲染、複製、錨點）
├── src/
│   ├── course-data.js         # 章節資料 + 查詢函式
│   ├── prompts-data.js        # 提示詞資料（全數）
│   ├── qr-url.js              # buildPromptUrl
│   ├── navigation.js          # nextIndex / prevIndex / formatProgress
│   ├── qr.js                  # renderQrSvg（注入 qrFactory）
│   ├── prompts-render.js      # groupByChapter / escapeHtml / renderPromptsHtml / handleCopyClick
│   └── slideshow.js           # setActiveIndex / openLightbox / closeLightbox
├── vendor/
│   └── qrcode.js              # qrcode-generator 1.4.4（vendored）
├── video/
│   └── README.txt             # 說明放 intro.mp4
├── tests/
│   ├── course-data.test.js
│   ├── prompts-data.test.js
│   ├── qr-url.test.js
│   ├── navigation.test.js
│   ├── qr.test.js
│   ├── prompts-render.test.js
│   └── slideshow.test.js
├── package.json
├── vitest.config.js
├── .gitignore
├── firebase.json
├── .firebaserc
└── 網址.txt
```

---

### Task 1: 專案初始化與課程資料模組

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `.gitignore`
- Create: `src/course-data.js`
- Test: `tests/course-data.test.js`

**Interfaces:**
- Consumes: 無
- Produces:
  - `CHAPTERS`: `Array<{ id: string, index: number, title: string, hasPrompt: boolean }>`
  - `CHAPTER_COUNT`: `number`
  - `getChapterById(id: string): object | null`
  - `promptChapters(): Array<object>`

- [ ] **Step 1: 建立 `package.json`**

```json
{
  "name": "ai-video-interactive-course",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "serve": "npx --yes serve ."
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: 建立 `vitest.config.js`**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"]
  }
});
```

- [ ] **Step 3: 建立 `.gitignore`**

```
node_modules/
*.log
.firebase/
video/intro.mp4
```

- [ ] **Step 4: 寫失敗測試 `tests/course-data.test.js`**

```js
import { describe, it, expect } from "vitest";
import { CHAPTERS, CHAPTER_COUNT, getChapterById, promptChapters } from "../src/course-data.js";

describe("course-data", () => {
  it("共有 7 章", () => {
    expect(CHAPTER_COUNT).toBe(7);
    expect(CHAPTERS).toHaveLength(7);
  });

  it("章節 id 依序為 ch1..ch7 且 index 從 1 起算", () => {
    CHAPTERS.forEach((c, i) => {
      expect(c.id).toBe(`ch${i + 1}`);
      expect(c.index).toBe(i + 1);
    });
  });

  it("第 1～5 章有提示詞，第 6、7 章沒有", () => {
    expect(promptChapters().map((c) => c.id)).toEqual(["ch1", "ch2", "ch3", "ch4", "ch5"]);
    expect(getChapterById("ch6").hasPrompt).toBe(false);
    expect(getChapterById("ch7").hasPrompt).toBe(false);
  });

  it("getChapterById 找不到時回傳 null", () => {
    expect(getChapterById("ch99")).toBeNull();
  });
});
```

- [ ] **Step 5: 安裝依賴並確認測試失敗**

Run: `npm install`
Run: `npm test`
Expected: FAIL，找不到 `../src/course-data.js`。

- [ ] **Step 6: 寫最小實作 `src/course-data.js`**

```js
export const CHAPTERS = [
  { id: "ch1", index: 1, title: "看懂現在爆款短影音的架構", hasPrompt: true },
  { id: "ch2", index: 2, title: "找到你的受眾，挑一個拍攝方向", hasPrompt: true },
  { id: "ch3", index: 3, title: "用 AI 寫出大綱與腳本", hasPrompt: true },
  { id: "ch4", index: 4, title: "做一個「題材產生器」", hasPrompt: true },
  { id: "ch5", index: 5, title: "角色卡", hasPrompt: true },
  { id: "ch6", index: 6, title: "用免費平台做出影片（Google Vids）", hasPrompt: false },
  { id: "ch7", index: 7, title: "資訊差：Google 搜尋與 AI 搜尋有什麼不同", hasPrompt: false }
];

export const CHAPTER_COUNT = CHAPTERS.length;

export function getChapterById(id) {
  return CHAPTERS.find((c) => c.id === id) || null;
}

export function promptChapters() {
  return CHAPTERS.filter((c) => c.hasPrompt);
}
```

- [ ] **Step 7: 確認測試通過**

Run: `npm test`
Expected: PASS，4 個測試通過。

- [ ] **Step 8: Commit**

```bash
git add package.json vitest.config.js .gitignore src/course-data.js tests/course-data.test.js
git commit -m "feat(ai影片互動式課程): 專案初始化與課程資料模組"
```

---

### Task 2: 提示詞資料模組

**Files:**
- Create: `src/prompts-data.js`
- Test: `tests/prompts-data.test.js`

**Interfaces:**
- Consumes: `CHAPTERS` 的 `chapterId`（僅作一致性檢查）
- Produces:
  - `PROMPTS`: `Array<{ id: string, chapterId: string, chapterTitle: string, label: string, text: string }>`
  - `promptsByChapter(chapterId: string): Array<object>`
  - `getPromptById(id: string): object | null`

- [ ] **Step 1: 寫失敗測試 `tests/prompts-data.test.js`**

```js
import { describe, it, expect } from "vitest";
import { PROMPTS, promptsByChapter, getPromptById } from "../src/prompts-data.js";
import { CHAPTERS } from "../src/course-data.js";

describe("prompts-data", () => {
  it("共有 10 段提示詞，id 不重複", () => {
    expect(PROMPTS).toHaveLength(10);
    expect(new Set(PROMPTS.map((p) => p.id)).size).toBe(10);
  });

  it("每段提示詞都屬於有提示詞的章節", () => {
    const promptChapterIds = CHAPTERS.filter((c) => c.hasPrompt).map((c) => c.id);
    for (const p of PROMPTS) {
      expect(promptChapterIds).toContain(p.chapterId);
      expect(typeof p.text).toBe("string");
      expect(p.text.length).toBeGreaterThan(20);
    }
  });

  it("第 3 章有 3 段、第 2 章有 2 段", () => {
    expect(promptsByChapter("ch3")).toHaveLength(3);
    expect(promptsByChapter("ch2")).toHaveLength(2);
  });

  it("getPromptById 取得指定提示詞，找不到回傳 null", () => {
    expect(getPromptById("p1-1").chapterId).toBe("ch1");
    expect(getPromptById("nope")).toBeNull();
  });
});
```

- [ ] **Step 2: 確認測試失敗**

Run: `npm test -- tests/prompts-data.test.js`
Expected: FAIL，找不到 `../src/prompts-data.js`。

- [ ] **Step 3: 寫實作 `src/prompts-data.js`**

```js
export const PROMPTS = [
  {
    id: "p1-1",
    chapterId: "ch1",
    chapterTitle: "第 1 章｜看懂現在爆款短影音的架構",
    label: "提示詞 1-1",
    text: `你是一位熟悉台灣短影音（Facebook Reels、Instagram Reels、YouTube Shorts、TikTok）的內容分析師。

請幫我分析「最近一個月」在台灣比較常被討論、或是觀察到流量表現不錯的短影音，整理出它們共通的架構。

請依下面的格式回答：
1. 最近常見的 5 種短影音類型（每種用一句話說明）
2. 每種類型的常見架構，請拆成：開頭 2 秒怎麼抓住人／中段怎麼推進／結尾怎麼收（互動或行動呼籲）
3. 這些影片通常的長度、字幕與節奏
4. 這些架構為什麼容易留住觀眾（用白話說明）

請注意：
- 如果你可以上網搜尋，請先搜尋最新資訊；如果不能，請直接告訴我「我無法確認最新資料」，並說明你的答案是依訓練資料的一般觀察
- 不確定的地方請標註「不確定」，不要編造數據或影片名稱
- 用國中生看得懂的白話回答`
  },
  {
    id: "p2-a",
    chapterId: "ch2",
    chapterTitle: "第 2 章｜找到你的受眾，挑一個拍攝方向",
    label: "提示詞 2-A：有產品或服務要賣",
    text: `你是一位熟悉台灣中小企業與短影音行銷的內容企劃。

我想拍一支短影音，請幫我找出適合的拍攝方向。以下是我的資料（【】內請依你的情況填寫，不確定的就寫「不確定」）：

- 我賣的產品或服務：【例如：手工餅乾、民宿、家具維修】
- 我目前的客人通常是：【例如：30～45歲的媽媽、來台中旅遊的情侶，不確定也可以寫】
- 我想把影片給誰看（受眾）：【例如：附近的上班族】
- 我所在的地區：【例如：台中】
- 我最近想達成的目標：【例如：讓更多人認識我、增加詢問、提升來店人數】

另外，我剛剛分析出的熱門短影音架構如下（可以參考）：
【把第 1 章 AI 給你的答案貼在這裡】

請依下面的格式回答：
1. 如果我的受眾填的是「不確定」，請先根據我的產品，推測 3 種最可能的受眾，並各用一句話說明
2. 給我 8 個拍攝方向，每個方向請包含：
   - 方向名稱
   - 這支影片想給誰看
   - 看完想讓觀眾有什麼感覺或行動
   - 一句話畫面概念
   - 最適合搭配上面哪一種短影音架構
3. 每個方向的畫面，都要能用 AI 生成一段約 8 秒、單一場景的影片來呈現（不要設計需要多個場景或複雜劇情的方向）
4. 用國中生看得懂的白話回答`
  },
  {
    id: "p2-b",
    chapterId: "ch2",
    chapterTitle: "第 2 章｜找到你的受眾，挑一個拍攝方向",
    label: "提示詞 2-B：沒有東西要賣",
    text: `你是一位熟悉台灣短影音的內容企劃。

我沒有要賣東西，只是想拍一支短影音。請幫我找出適合的拍攝方向。以下是我的資料（【】內請依你的情況填寫，不確定的就寫「不確定」）：

- 我想拍的主題：【例如：家裡的毛小孩、做菜、親子日常、我的興趣】
- 我想把影片給誰看：【例如：家人朋友、同樣養貓的人，不確定也可以寫】
- 我想讓看的人有什麼感覺：【例如：放鬆、好笑、被療癒、想留言分享】
- 我所在的地區：【例如：台中】

另外，我剛剛分析出的熱門短影音架構如下（可以參考）：
【把第 1 章 AI 給你的答案貼在這裡】

請依下面的格式回答：
1. 如果我的「想給誰看」填的是「不確定」，請先根據我的主題，推測 3 種最可能喜歡的觀眾，並各用一句話說明
2. 給我 8 個拍攝方向，每個方向請包含：
   - 方向名稱
   - 這支影片想給誰看
   - 看完想讓觀眾有什麼感覺
   - 一句話畫面概念
   - 最適合搭配上面哪一種短影音架構
3. 每個方向的畫面，都要能用 AI 生成一段約 8 秒、單一場景的影片來呈現（不要設計需要多個場景或複雜劇情的方向）
4. 用國中生看得懂的白話回答`
  },
  {
    id: "p3-1",
    chapterId: "ch3",
    chapterTitle: "第 3 章｜用 AI 寫出大綱與腳本",
    label: "提示詞 3-1：寫出大綱",
    text: `你是一位短影音編劇。

這是我從 AI 給的方向中挑出來的拍攝方向：
【貼上你選的那一個方向】

這是我自己的補充（為什麼選它、我想要的細節）：
【用你自己的話寫 2～3 句】

請幫我寫出這支影片的大綱：
1. 影片的一句話主題
2. 開頭 2 秒要抓住人的點
3. 畫面內容（因為這支影片只有約 8 秒、單一場景，請只設計一個核心畫面）
4. 結尾想留下的感覺或行動
5. 這支影片會用到的主角、場景、道具清單

請用國中生看得懂的白話，並且不要設計需要多個場景或複雜劇情的內容。`
  },
  {
    id: "p3-2",
    chapterId: "ch3",
    chapterTitle: "第 3 章｜用 AI 寫出大綱與腳本",
    label: "提示詞 3-2：專業版腳本（含配樂、英文）",
    text: `請依照上面的大綱，幫我寫一份「專業版」AI 生成影片腳本，影片長度約 8 秒、單一場景。

請包含下列項目，並且中英文各寫一份：
1. 畫面描述（主體、動作、場景、光線、色調）
2. 鏡頭（景別、運鏡方式）
3. 聲音（環境音、必要的音效）
4. 配樂建議（風格、節奏、情緒，並說明適合放在哪個時間點）
5. 一句話的整體氛圍

英文版請用適合 AI 影片生成工具的寫法：句子簡單、具體，主體、動作、場景寫清楚。`
  },
  {
    id: "p3-3",
    chapterId: "ch3",
    chapterTitle: "第 3 章｜用 AI 寫出大綱與腳本",
    label: "提示詞 3-3：簡約版腳本（給免費平台）",
    text: `請把上面的專業版腳本，改寫成「簡約版」，要貼到免費的 AI 影片平台使用。

規則：
1. 只能有一個畫面、一個主體、一個動作、一個場景
2. 全部用英文，2～3 句話以內
3. 不要放配樂、不要放運鏡術語、不要要求畫面上出現文字
4. 不要出現複雜的情緒或抽象概念，改用看得見的動作來表達

請輸出：
A. 英文簡約版（直接給平台用）
B. 這段英文的中文意思（讓我自己確認有沒有跑掉）
C. 生成前檢查：主體、動作、場景是不是都只有一個？`
  },
  {
    id: "p4-1",
    chapterId: "ch4",
    chapterTitle: "第 4 章｜做一個「題材產生器」",
    label: "提示詞 4-1：建議 4～6 個維度",
    text: `你是一位短影音內容企劃。

這是我選定的拍攝方向：
【貼上你在第 2 章選的方向】

我想做一個「隨機混合故事提案」的工具，做法是把故事拆成幾個維度，每個維度準備一些選項，再隨機組合。

請幫我：
1. 針對這個拍攝方向，建議 4～6 個最適合的維度（例如：主角、場景、遇到的狀況、情緒、結尾……，請依我的方向自己決定，不要照抄例子）
2. 每個維度請說明「這個維度負責決定故事的什麼」，用一句話
3. 每個維度先給 6～8 個選項範例
4. 所有選項都要能用 AI 生成「約 8 秒、單一場景」的畫面來呈現，不要有需要多場景或複雜劇情的選項
5. 用國中生看得懂的白話回答`
  },
  {
    id: "p4-2",
    chapterId: "ch4",
    chapterTitle: "第 4 章｜做一個「題材產生器」",
    label: "提示詞 4-2：在 Canvas 裡製作隨機混合工具",
    text: `請在 Canvas 裡幫我做一個「隨機混合故事提案」的小工具，並讓我可以直接在 Canvas 裡預覽、點擊操作。

【我的維度與選項】
（貼上你確認後的最終版，格式：維度名稱：選項1、選項2、選項3……）

工具規格：
1. 做成「單一 HTML 頁面」，不需要網路、不需要任何 API
2. 按下「產生提案」按鈕，從每個維度各隨機抽出一個選項，組合成 3 則不同的故事提案
3. 每則提案用一小段白話文字呈現（把抽到的選項串成通順的一兩句）
4. 每則提案旁邊有「複製」按鈕，複製後的內容是這個格式：
   「我想拍一支約 8 秒、單一場景的短影音，提案如下：（提案內容）」
5. 每個維度的選項，我之後可以自己在畫面上新增或刪除
6. 畫面簡潔、手機也看得清楚，文字用繁體中文

做好之後，請告訴我怎麼操作，以及如果按鈕沒反應或畫面壞掉，我該怎麼請你修正。`
  },
  {
    id: "p5-1",
    chapterId: "ch5",
    chapterTitle: "第 5 章｜角色卡",
    label: "提示詞 5-1：上傳人物照片，直接產出角色卡",
    text: `請根據我上傳的照片，幫我生成一張「角色卡」圖片。

要求：
1. 保留照片中人物的臉部特徵，讓看的人能認出是同一個人
2. 同一張圖裡包含：正面全身、側面全身、背面全身，以及 3 個臉部表情（微笑、認真、驚訝）
3. 服裝、髮型與配件，請依照我上傳照片中的樣子，側面和背面要自然延續
4. 背景用乾淨的單色背景，不要有多餘的物件
5. 光線自然、寫實風格，各個角度的人物比例、髮型與服裝保持一致`
  },
  {
    id: "p5-2",
    chapterId: "ch5",
    chapterTitle: "第 5 章｜角色卡",
    label: "提示詞 5-2：參考網路角色卡版面 + 人物照片",
    text: `我上傳了兩張圖片：
- 第 1 張是「角色卡參考圖」，只用來參考版面、角度配置、表情安排和整體風格
- 第 2 張是「人物照片」，是我要做成角色卡的人物

請幫我生成一張新的角色卡圖片：
1. 版面、角度配置（例如正面、側面、背面、表情）、整體風格，請參考第 1 張
2. 人物的臉部特徵、髮型、服裝與配件，請完全依照第 2 張照片，讓看的人能認出是同一個人
3. 不要複製第 1 張圖裡的人物長相或原有的角色設計，只借用它的版面安排
4. 各個角度的人物比例、髮型與服裝保持一致
5. 背景保持乾淨，不要有多餘的物件`
  }
];

export function promptsByChapter(chapterId) {
  return PROMPTS.filter((p) => p.chapterId === chapterId);
}

export function getPromptById(id) {
  return PROMPTS.find((p) => p.id === id) || null;
}
```

- [ ] **Step 4: 確認測試通過**

Run: `npm test`
Expected: PASS（course-data + prompts-data 全部通過）。

- [ ] **Step 5: Commit**

```bash
git add src/prompts-data.js tests/prompts-data.test.js
git commit -m "feat(ai影片互動式課程): 新增提示詞資料模組"
```

---

### Task 3: QR 網址組裝

**Files:**
- Create: `src/qr-url.js`
- Test: `tests/qr-url.test.js`

**Interfaces:**
- Consumes: 無
- Produces: `buildPromptUrl(origin: string, chapterId: string): string`

- [ ] **Step 1: 寫失敗測試 `tests/qr-url.test.js`**

```js
import { describe, it, expect } from "vitest";
import { buildPromptUrl } from "../src/qr-url.js";

describe("buildPromptUrl", () => {
  it("組合 origin 與 prompts.html 錨點", () => {
    expect(buildPromptUrl("https://aivideo-sk.web.app", "ch1"))
      .toBe("https://aivideo-sk.web.app/prompts.html#ch1");
  });

  it("origin 尾端有斜線時不重複", () => {
    expect(buildPromptUrl("http://localhost:3000/", "ch3"))
      .toBe("http://localhost:3000/prompts.html#ch3");
  });

  it("缺少 chapterId 時丟出錯誤", () => {
    expect(() => buildPromptUrl("http://localhost:3000", "")).toThrow();
  });
});
```

- [ ] **Step 2: 確認測試失敗**

Run: `npm test -- tests/qr-url.test.js`
Expected: FAIL，找不到 `../src/qr-url.js`。

- [ ] **Step 3: 寫實作 `src/qr-url.js`**

```js
export function buildPromptUrl(origin, chapterId) {
  if (!chapterId) {
    throw new Error("chapterId is required");
  }
  const base = String(origin || "").replace(/\/+$/, "");
  return `${base}/prompts.html#${chapterId}`;
}
```

- [ ] **Step 4: 確認測試通過**

Run: `npm test -- tests/qr-url.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/qr-url.js tests/qr-url.test.js
git commit -m "feat(ai影片互動式課程): 新增 QR 網址組裝"
```

---

### Task 4: 章節導覽純函式

**Files:**
- Create: `src/navigation.js`
- Test: `tests/navigation.test.js`

**Interfaces:**
- Consumes: 無
- Produces:
  - `nextIndex(current: number, count: number): number`
  - `prevIndex(current: number, count: number): number`
  - `formatProgress(current: number, count: number): string`

- [ ] **Step 1: 寫失敗測試 `tests/navigation.test.js`**

```js
import { describe, it, expect } from "vitest";
import { nextIndex, prevIndex, formatProgress } from "../src/navigation.js";

describe("navigation", () => {
  it("nextIndex 前進，最後一章停在原地", () => {
    expect(nextIndex(0, 7)).toBe(1);
    expect(nextIndex(5, 7)).toBe(6);
    expect(nextIndex(6, 7)).toBe(6);
  });

  it("prevIndex 後退，第一章停在原地", () => {
    expect(prevIndex(3, 7)).toBe(2);
    expect(prevIndex(0, 7)).toBe(0);
  });

  it("count 為 0 時回傳 0", () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(prevIndex(5, 0)).toBe(0);
  });

  it("formatProgress 以 1 起算顯示", () => {
    expect(formatProgress(0, 7)).toBe("第 1 / 7 章");
    expect(formatProgress(6, 7)).toBe("第 7 / 7 章");
  });
});
```

- [ ] **Step 2: 確認測試失敗**

Run: `npm test -- tests/navigation.test.js`
Expected: FAIL，找不到 `../src/navigation.js`。

- [ ] **Step 3: 寫實作 `src/navigation.js`**

```js
export function nextIndex(current, count) {
  if (count <= 0) return 0;
  return current >= count - 1 ? count - 1 : current + 1;
}

export function prevIndex(current, count) {
  if (count <= 0) return 0;
  return current <= 0 ? 0 : current - 1;
}

export function formatProgress(current, count) {
  return `第 ${current + 1} / ${count} 章`;
}
```

- [ ] **Step 4: 確認測試通過**

Run: `npm test -- tests/navigation.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/navigation.js tests/navigation.test.js
git commit -m "feat(ai影片互動式課程): 新增章節導覽純函式"
```

---

### Task 5: QR 產生（下載函式庫 + 包裝）

**Files:**
- Create: `vendor/qrcode.js`（下載）
- Create: `src/qr.js`
- Test: `tests/qr.test.js`

**Interfaces:**
- Consumes: `qrFactory(typeNumber, errorCorrectionLevel)`（瀏覽器為全域 `qrcode`）
- Produces: `renderQrSvg(qrFactory, url, cellSize = 4, margin = 2): string`

- [ ] **Step 1: 下載 QR 函式庫到 `vendor/qrcode.js`**

Run（於專案目錄）:
```powershell
New-Item -ItemType Directory -Force -Path vendor | Out-Null
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js" -OutFile "vendor/qrcode.js" -UseBasicParsing
```

- [ ] **Step 2: 驗證下載內容**

Run:
```powershell
(Get-Content -LiteralPath "vendor/qrcode.js" -TotalCount 1); (Get-Content -LiteralPath "vendor/qrcode.js" -Raw).Length
```
Expected: 首行為 `//---...`，長度 > 50000。

- [ ] **Step 3: 寫失敗測試 `tests/qr.test.js`**

```js
import { describe, it, expect } from "vitest";
import { renderQrSvg } from "../src/qr.js";

function fakeQrFactory() {
  const calls = {};
  const instance = {
    addData(data) { calls.data = data; return this; },
    make() { calls.made = true; return this; },
    createSvgTag(cellSize, margin) {
      calls.svgOpts = { cellSize, margin };
      return `<svg data-test="qr">${calls.data}</svg>`;
    }
  };
  return { calls, factory: () => instance };
}

describe("renderQrSvg", () => {
  it("把 url 交給 QR 實例並回傳 SVG 字串", () => {
    const { calls, factory } = fakeQrFactory();
    const svg = renderQrSvg(factory, "https://x.test/prompts.html#ch1");
    expect(svg).toContain("https://x.test/prompts.html#ch1");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(calls.made).toBe(true);
    expect(calls.svgOpts).toEqual({ cellSize: 4, margin: 2 });
  });

  it("可自訂 cellSize / margin", () => {
    const { calls, factory } = fakeQrFactory();
    renderQrSvg(factory, "x", 8, 4);
    expect(calls.svgOpts).toEqual({ cellSize: 8, margin: 4 });
  });
});
```

- [ ] **Step 4: 確認測試失敗**

Run: `npm test -- tests/qr.test.js`
Expected: FAIL，找不到 `../src/qr.js`。

- [ ] **Step 5: 寫實作 `src/qr.js`**

```js
export function renderQrSvg(qrFactory, url, cellSize = 4, margin = 2) {
  const qr = qrFactory(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag(cellSize, margin);
}
```

- [ ] **Step 6: 確認測試通過**

Run: `npm test -- tests/qr.test.js`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add vendor/qrcode.js src/qr.js tests/qr.test.js
git commit -m "feat(ai影片互動式課程): vendored QR 函式庫與產生包裝"
```

---

### Task 6: 提示詞頁資料渲染與複製邏輯

**Files:**
- Create: `src/prompts-render.js`
- Test: `tests/prompts-render.test.js`

**Interfaces:**
- Consumes: `PROMPTS`（Task 2）
- Produces:
  - `escapeHtml(str: string): string`
  - `groupByChapter(prompts: Array): Array<{ chapterId: string, chapterTitle: string, items: Array }>`
  - `renderPromptsHtml(groups: Array): string`
  - `handleCopyClick(target: EventTarget, prompts: Array, writeText: (t: string) => Promise<void>): Promise<boolean>`

- [ ] **Step 1: 寫失敗測試 `tests/prompts-render.test.js`**

```js
import { describe, it, expect, vi } from "vitest";
import {
  escapeHtml,
  groupByChapter,
  renderPromptsHtml,
  handleCopyClick
} from "../src/prompts-render.js";
import { PROMPTS } from "../src/prompts-data.js";

describe("prompts-render", () => {
  it("escapeHtml 轉義 HTML 特殊字元", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });

  it("groupByChapter 依章節分組並保留順序", () => {
    const groups = groupByChapter(PROMPTS);
    expect(groups.map((g) => g.chapterId)).toEqual(["ch1", "ch2", "ch3", "ch4", "ch5"]);
    expect(groups[2].items).toHaveLength(3);
  });

  it("renderPromptsHtml 產生章節錨點與複製按鈕", () => {
    const html = renderPromptsHtml(groupByChapter(PROMPTS));
    expect(html).toContain('id="ch1"');
    expect(html).toContain('id="ch5"');
    expect(html).toContain('data-copy="p1-1"');
    expect(html).toContain('data-copy="p5-2"');
  });

  it("handleCopyClick 複製對應文字並改按鈕文字", async () => {
    document.body.innerHTML = `<button data-copy="p1-1">複製</button>`;
    const btn = document.querySelector("[data-copy]");
    const writeText = vi.fn().mockResolvedValue();
    const ok = await handleCopyClick(btn, PROMPTS, writeText);
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(PROMPTS.find((p) => p.id === "p1-1").text);
    expect(btn.textContent).toBe("已複製");
  });

  it("handleCopyClick 非複製按鈕回傳 false", async () => {
    document.body.innerHTML = `<div id="notBtn"></div>`;
    const ok = await handleCopyClick(document.getElementById("notBtn"), PROMPTS, vi.fn());
    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2: 確認測試失敗**

Run: `npm test -- tests/prompts-render.test.js`
Expected: FAIL，找不到 `../src/prompts-render.js`。

- [ ] **Step 3: 寫實作 `src/prompts-render.js`**

```js
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function groupByChapter(prompts) {
  const groups = [];
  for (const p of prompts) {
    let g = groups.find((x) => x.chapterId === p.chapterId);
    if (!g) {
      g = { chapterId: p.chapterId, chapterTitle: p.chapterTitle, items: [] };
      groups.push(g);
    }
    g.items.push(p);
  }
  return groups;
}

export function renderPromptsHtml(groups) {
  return groups
    .map(
      (g) => `
    <section class="prompt-group" id="${escapeHtml(g.chapterId)}">
      <h2 class="prompt-group__title">${escapeHtml(g.chapterTitle)}</h2>
      ${g.items
        .map(
          (p) => `
        <article class="prompt-card">
          <div class="prompt-card__head">
            <h3 class="prompt-card__label">${escapeHtml(p.label)}</h3>
            <button type="button" class="prompt-card__copy" data-copy="${escapeHtml(p.id)}">複製</button>
          </div>
          <pre class="prompt-card__text">${escapeHtml(p.text)}</pre>
        </article>`
        )
        .join("")}
    </section>`
    )
    .join("");
}

export async function handleCopyClick(target, prompts, writeText) {
  const btn = target && target.closest ? target.closest("[data-copy]") : null;
  if (!btn) return false;
  const prompt = prompts.find((p) => p.id === btn.dataset.copy);
  if (!prompt) return false;
  await writeText(prompt.text);
  btn.textContent = "已複製";
  return true;
}
```

- [ ] **Step 4: 確認測試通過**

Run: `npm test -- tests/prompts-render.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/prompts-render.js tests/prompts-render.test.js
git commit -m "feat(ai影片互動式課程): 提示詞渲染與複製邏輯"
```

---

### Task 7: 主簡報互動模組（翻頁、進度、燈箱）

**Files:**
- Create: `src/slideshow.js`
- Test: `tests/slideshow.test.js`

**Interfaces:**
- Consumes: `formatProgress`（Task 4）
- Produces:
  - `setActiveIndex(root: HTMLElement, index: number): { index: number, count: number }`
  - `openLightbox(lightboxEl: HTMLElement, svgHtml: string): void`
  - `closeLightbox(lightboxEl: HTMLElement): void`

- [ ] **Step 1: 寫失敗測試 `tests/slideshow.test.js`**

```js
import { describe, it, expect } from "vitest";
import { setActiveIndex, openLightbox, closeLightbox } from "../src/slideshow.js";

describe("slideshow", () => {
  it("setActiveIndex 切換 is-active 並更新進度", () => {
    document.body.innerHTML = `
      <div id="root">
        <span data-progress></span>
        <section data-chapter></section>
        <section data-chapter></section>
        <section data-chapter></section>
      </div>`;
    const root = document.getElementById("root");
    const res = setActiveIndex(root, 1);
    const sections = root.querySelectorAll("[data-chapter]");
    expect(res).toEqual({ index: 1, count: 3 });
    expect(sections[1].classList.contains("is-active")).toBe(true);
    expect(sections[0].classList.contains("is-active")).toBe(false);
    expect(root.querySelector("[data-progress]").textContent).toBe("第 2 / 3 章");
  });

  it("openLightbox 寫入 QR 並開啟", () => {
    document.body.innerHTML = `<div id="lb"><div data-lightbox-qr></div></div>`;
    const lb = document.getElementById("lb");
    openLightbox(lb, "<svg>qr</svg>");
    expect(lb.classList.contains("is-open")).toBe(true);
    expect(lb.getAttribute("aria-hidden")).toBe("false");
    expect(lb.querySelector("[data-lightbox-qr]").innerHTML).toContain("qr");
  });

  it("closeLightbox 關閉", () => {
    document.body.innerHTML = `<div id="lb" class="is-open" aria-hidden="false"></div>`;
    const lb = document.getElementById("lb");
    closeLightbox(lb);
    expect(lb.classList.contains("is-open")).toBe(false);
    expect(lb.getAttribute("aria-hidden")).toBe("true");
  });
});
```

- [ ] **Step 2: 確認測試失敗**

Run: `npm test -- tests/slideshow.test.js`
Expected: FAIL，找不到 `../src/slideshow.js`。

- [ ] **Step 3: 寫實作 `src/slideshow.js`**

```js
import { formatProgress } from "./navigation.js";

export function setActiveIndex(root, index) {
  const sections = root.querySelectorAll("[data-chapter]");
  sections.forEach((s, i) => s.classList.toggle("is-active", i === index));
  const counter = root.querySelector("[data-progress]");
  if (counter) counter.textContent = formatProgress(index, sections.length);
  return { index, count: sections.length };
}

export function openLightbox(lightboxEl, svgHtml) {
  const canvas = lightboxEl.querySelector("[data-lightbox-qr]");
  if (canvas) canvas.innerHTML = svgHtml;
  lightboxEl.classList.add("is-open");
  lightboxEl.setAttribute("aria-hidden", "false");
}

export function closeLightbox(lightboxEl) {
  lightboxEl.classList.remove("is-open");
  lightboxEl.setAttribute("aria-hidden", "true");
}
```

- [ ] **Step 4: 確認測試通過**

Run: `npm test -- tests/slideshow.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/slideshow.js tests/slideshow.test.js
git commit -m "feat(ai影片互動式課程): 主簡報互動模組"
```

---

### Task 8: 樣式表 `styles.css`

**Files:**
- Create: `styles.css`

**Interfaces:**
- Consumes: 無
- Produces: CSS 類別：`.intro`、`.chapter`、`.is-active`、`.chapter__nav`、`.qr-thumb`、`.lightbox`、`.lightbox.is-open`、`.prompt-group`、`.prompt-card`、`.prompt-card__copy`、`.prompt-card__text`

> 需求：內容與外觀分離，顏色／字級／間距集中在 `:root` 變數，日後換設計只需改這支。

- [ ] **Step 1: 寫 `styles.css`**

```css
:root {
  --bg: #0f1115;
  --surface: #171a21;
  --surface-2: #1f2430;
  --text: #e8eaed;
  --text-dim: #9aa3b2;
  --accent: #5b9dff;
  --accent-ink: #0b1220;
  --border: #2a3140;
  --radius: 14px;
  --gap: 1rem;
  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.75rem;
  --step-3: 2.5rem;
  --font: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  line-height: 1.7;
}

a { color: var(--accent); }

/* ---------- intro ---------- */
.intro {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem var(--step-0);
  text-align: center;
}
.intro__title { font-size: var(--step-3); margin: 0 0 var(--step-0); }
.intro__video {
  width: 100%;
  max-height: 60vh;
  background: #000;
  border-radius: var(--radius);
  display: block;
}
.intro__hint { color: var(--text-dim); font-size: var(--step-0); }

/* ---------- chapters ---------- */
.slideshow { max-width: 900px; margin: 0 auto; padding: 0 var(--step-0) 6rem; }

.chapter { display: none; }
.chapter.is-active { display: block; }
.chapter__title { font-size: var(--step-2); margin: var(--step-2) 0 var(--step-0); }
.chapter__body { max-height: 60vh; overflow-y: auto; padding-right: 0.5rem; }

.chapter__nav {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap);
  padding: var(--step-0);
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0;
}
.chapter__nav button {
  font: inherit;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
}
.chapter__nav button:disabled { opacity: 0.35; cursor: not-allowed; }
.chapter__progress { color: var(--text-dim); }

/* ---------- QR thumb ---------- */
.prompt-card-inline {
  margin: var(--step-1) 0;
  padding: var(--step-0);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-align: center;
}
.qr-thumb {
  width: 140px;
  height: 140px;
  padding: 8px;
  background: #fff;
  border-radius: 10px;
  cursor: zoom-in;
  display: inline-block;
}
.qr-thumb svg { width: 100%; height: 100%; display: block; }

/* ---------- lightbox ---------- */
.lightbox {
  position: fixed;
  inset: 0;
  display: none;
  place-items: center;
  background: rgba(0, 0, 0, 0.92);
  z-index: 50;
  cursor: zoom-out;
}
.lightbox.is-open { display: grid; }
.lightbox__canvas {
  width: min(80vmin, 80vh);
  height: min(80vmin, 80vh);
  padding: 24px;
  background: #fff;
  border-radius: var(--radius);
}
.lightbox__canvas svg { width: 100%; height: 100%; display: block; }
.lightbox__caption { color: #fff; margin-top: var(--step-0); text-align: center; }

/* ---------- prompts page ---------- */
.prompts-page { max-width: 860px; margin: 0 auto; padding: var(--step-2) var(--step-0) 6rem; }
.prompts-page__title { font-size: var(--step-3); }
.prompt-group { margin-bottom: var(--step-3); scroll-margin-top: 1rem; }
.prompt-group__title { font-size: var(--step-2); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
.prompt-card {
  margin: var(--step-1) 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.prompt-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap);
  padding: 0.75rem var(--step-0);
  background: var(--surface-2);
}
.prompt-card__label { font-size: var(--step-1); margin: 0; }
.prompt-card__copy {
  font: inherit;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--accent);
  color: var(--accent-ink);
  cursor: pointer;
  white-space: nowrap;
}
.prompt-card__text {
  margin: 0;
  padding: var(--step-0);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font);
  font-size: var(--step-0);
  color: var(--text);
}
```

- [ ] **Step 2: 語法自我檢查**

Run: `npm test`
Expected: 既有測試仍全部 PASS（CSS 不影響測試）。

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat(ai影片互動式課程): 新增樣式表"
```

---

### Task 9: 主頁 `index.html` 與 `app.js`

**Files:**
- Create: `index.html`
- Create: `app.js`

**Interfaces:**
- Consumes: `CHAPTERS`（Task 1）、`buildPromptUrl`（Task 3）、`nextIndex` / `prevIndex`（Task 4）、`renderQrSvg`（Task 5）、`openLightbox` / `closeLightbox` / `setActiveIndex`（Task 7）；全域 `qrcode`（`vendor/qrcode.js`）
- Produces: 可運作的 `index.html`（影片 + 7 章 + 章節內 QR 燈箱）

- [ ] **Step 1: 建立 `video/README.txt`**

```
把課程影片命名為 intro.mp4 放在這個資料夾。
檔案不存在時，首頁會顯示「影片尚未上傳」提示，不會壞版。
（intro.mp4 已列入 .gitignore，不進版控）
```

- [ ] **Step 2: 寫 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 影片互動式課程</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="intro">
    <h1 class="intro__title">AI 短影音課程</h1>
    <video id="introVideo" class="intro__video" controls preload="metadata" playsinline>
      <source src="video/intro.mp4" type="video/mp4">
    </video>
    <p class="intro__hint" data-video-hint>影片尚未上傳（請將 MP4 放到 video/intro.mp4）</p>
  </header>

  <main class="slideshow" id="slideshow">
    <section class="chapter" data-chapter id="ch1">
      <h2 class="chapter__title">第 1 章｜看懂現在爆款短影音的架構</h2>
      <div class="chapter__body">
        <p><strong>這章要做什麼</strong> 請 AI 整理最近熱門短影音的共通架構，讓你知道現在大家都怎麼拍、怎麼抓住觀眾。</p>
        <p><strong>你會得到</strong> 5 種常見短影音類型，以及每一種的開頭、中段、結尾怎麼安排。</p>
        <div class="prompt-card-inline">
          <p>提示詞 1-1</p>
          <div class="qr-thumb" role="button" tabindex="0" data-qr="ch1" data-prompt-label="提示詞 1-1" aria-label="放大 QR Code：提示詞 1-1"></div>
          <p>點 QR Code 放大，讓學員掃描取得提示詞</p>
        </div>
        <p><strong>小提醒</strong> AI 有時會把舊資料講得很肯定，提示詞裡特別要求它「不確定就標註」。建議可打開 App 對照，或把同一份提示詞貼給 2 個不同 AI 比較。</p>
        <p><strong>請存下來</strong>：AI 整理的短影音架構清單，第 2 章會用到。</p>
      </div>
    </section>

    <section class="chapter" data-chapter id="ch2">
      <h2 class="chapter__title">第 2 章｜找到你的受眾，挑一個拍攝方向</h2>
      <div class="chapter__body">
        <p><strong>這章要做什麼</strong> 填入你的產品（或主題）與受眾，讓 AI 給你 8 個拍攝方向，你從中挑 1 個。</p>
        <p><strong>請先選一個版本</strong> 有產品或服務要賣 → 提示詞 2-A；沒有東西要賣，只是想拍 → 提示詞 2-B。</p>
        <div class="prompt-card-inline">
          <p>提示詞 2-A / 2-B</p>
          <div class="qr-thumb" role="button" tabindex="0" data-qr="ch2" data-prompt-label="提示詞 2-A / 2-B" aria-label="放大 QR Code：提示詞 2-A / 2-B"></div>
          <p>點 QR Code 放大，讓學員掃描取得提示詞</p>
        </div>
        <p><strong>請存下來</strong>：你挑中的那一個拍攝方向（整段複製）。</p>
      </div>
    </section>

    <section class="chapter" data-chapter id="ch3">
      <h2 class="chapter__title">第 3 章｜用 AI 寫出大綱與腳本</h2>
      <div class="chapter__body">
        <p><strong>這章要做什麼</strong> 把你挑的方向，依序變成：大綱 → 專業版腳本（含配樂、中英文）→ 簡約版腳本（給免費平台用）。</p>
        <p><strong>開始前的小任務</strong> 從第 2 章挑出的方向，用自己的話寫 2～3 句：「我為什麼選這個」「我希望畫面有什麼細節」。</p>
        <p>建議用同一個對話，依序貼 3-1、3-2、3-3。</p>
        <div class="prompt-card-inline">
          <p>提示詞 3-1 / 3-2 / 3-3</p>
          <div class="qr-thumb" role="button" tabindex="0" data-qr="ch3" data-prompt-label="提示詞 3-1 / 3-2 / 3-3" aria-label="放大 QR Code：提示詞 3-1 / 3-2 / 3-3"></div>
          <p>點 QR Code 放大，讓學員掃描取得提示詞</p>
        </div>
        <p><strong>請存下來</strong>：簡約版英文腳本（A 項）。</p>
      </div>
    </section>

    <section class="chapter" data-chapter id="ch4">
      <h2 class="chapter__title">第 4 章｜做一個「題材產生器」</h2>
      <div class="chapter__body">
        <p><strong>這章要做什麼</strong> 先讓 AI 針對你的拍攝方向建議 4～6 個維度，你自己確認、修改，再讓 AI 在 Canvas 裡做出「按一下就隨機混合出 3 則故事提案」的小工具。</p>
        <p><strong>什麼是維度？</strong> 把一個故事拆成幾個部分（主角、場景、狀況、結尾），每個部分準備一些選項，隨機各抽一個組合起來。</p>
        <div class="prompt-card-inline">
          <p>提示詞 4-1 / 4-2</p>
          <div class="qr-thumb" role="button" tabindex="0" data-qr="ch4" data-prompt-label="提示詞 4-1 / 4-2" aria-label="放大 QR Code：提示詞 4-1 / 4-2"></div>
          <p>點 QR Code 放大，讓學員掃描取得提示詞</p>
        </div>
        <p><strong>請存下來</strong>：工具產出的故事提案。</p>
      </div>
    </section>

    <section class="chapter" data-chapter id="ch5">
      <h2 class="chapter__title">第 5 章｜角色卡</h2>
      <div class="chapter__body">
        <p><strong>這章要做什麼</strong> 角色卡是一張「讓 AI 每次都畫出同一個人」的參考圖，通常包含正面、側面、背面與幾個表情。</p>
        <p><strong>請先選一個做法</strong> 做法 A（5-1）直接上傳人物照片；做法 B（5-2）先找一張喜歡的角色卡當版面參考，再搭配人物照片。</p>
        <div class="prompt-card-inline">
          <p>提示詞 5-1 / 5-2</p>
          <div class="qr-thumb" role="button" tabindex="0" data-qr="ch5" data-prompt-label="提示詞 5-1 / 5-2" aria-label="放大 QR Code：提示詞 5-1 / 5-2"></div>
          <p>點 QR Code 放大，讓學員掃描取得提示詞</p>
        </div>
        <p><strong>請存下來</strong>：最滿意的那一張角色卡圖片。</p>
      </div>
    </section>

    <section class="chapter" data-chapter id="ch6">
      <h2 class="chapter__title">第 6 章｜用免費平台做出影片（Google Vids）</h2>
      <div class="chapter__body">
        <p>使用第 3 章的簡約版腳本，以及第 5 章的角色卡，成果是單支約 8 秒的影片。</p>
        <p>免費版每月有生成次數限制，上課時提醒學員並查詢當月最新規定；生成前先自己檢查腳本，避免浪費次數。</p>
        <p><em>本章詳細內容待補。</em></p>
      </div>
    </section>

    <section class="chapter" data-chapter id="ch7">
      <h2 class="chapter__title">第 7 章｜資訊差：Google 搜尋與 AI 搜尋有什麼不同</h2>
      <div class="chapter__body">
        <p><em>本章詳細內容待補。</em></p>
      </div>
    </section>

    <nav class="chapter__nav">
      <button type="button" data-nav="prev">上一章</button>
      <span class="chapter__progress" data-progress></span>
      <button type="button" data-nav="next">下一章</button>
    </nav>
  </main>

  <div class="lightbox" id="lightbox" data-lightbox aria-hidden="true" role="dialog" aria-label="QR Code 放大">
    <div class="lightbox__inner">
      <div class="lightbox__canvas" data-lightbox-qr></div>
      <p class="lightbox__caption" data-lightbox-caption>點畫面任一處關閉</p>
    </div>
  </div>

  <script src="vendor/qrcode.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 3: 寫 `app.js`**

```js
import { CHAPTERS, CHAPTER_COUNT } from "./src/course-data.js";
import { buildPromptUrl } from "./src/qr-url.js";
import { nextIndex, prevIndex } from "./src/navigation.js";
import { renderQrSvg } from "./src/qr.js";
import { setActiveIndex, openLightbox, closeLightbox } from "./src/slideshow.js";

const root = document.getElementById("slideshow");
const lightbox = document.getElementById("lightbox");
const caption = lightbox.querySelector("[data-lightbox-caption]");
const btnPrev = root.querySelector('[data-nav="prev"]');
const btnNext = root.querySelector('[data-nav="next"]');

let current = 0;

function chapterIdAtIndex(i) {
  return CHAPTERS[i] ? CHAPTERS[i].id : null;
}

function render() {
  const { index } = setActiveIndex(root, current);
  btnPrev.disabled = index === 0;
  btnNext.disabled = index === CHAPTER_COUNT - 1;
}

function go(delta) {
  current = delta > 0 ? nextIndex(current, CHAPTER_COUNT) : prevIndex(current, CHAPTER_COUNT);
  render();
}

btnPrev.addEventListener("click", () => go(-1));
btnNext.addEventListener("click", () => go(1));
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") go(1);
  if (e.key === "ArrowLeft") go(-1);
  if (e.key === "Escape") closeLightbox(lightbox);
});

root.querySelectorAll("[data-qr]").forEach((el) => {
  const svg = renderQrSvg(window.qrcode, buildPromptUrl(window.location.origin, el.dataset.qr));
  el.innerHTML = svg;
  const open = () => {
    if (caption) caption.textContent = `${el.dataset.promptLabel || ""}｜掃描後可取得提示詞｜點畫面任一處關閉`;
    openLightbox(lightbox, svg);
  };
  el.addEventListener("click", open);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
});

lightbox.addEventListener("click", () => closeLightbox(lightbox));

const video = document.getElementById("introVideo");
const hint = document.querySelector("[data-video-hint]");
if (video && hint) {
  video.addEventListener("loadeddata", () => { hint.hidden = true; });
  video.addEventListener("error", () => { hint.hidden = false; video.hidden = true; });
}

render();
```

- [ ] **Step 4: 確認測試仍通過**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 5: 本機預覽驗證（人工）**

Run: `npm run serve`
然後開 `http://localhost:3000/`，確認：
1. 影片區顯示「影片尚未上傳」提示（因為 intro.mp4 尚未放入）。
2. 上一章／下一章與鍵盤 ← → 可切換 1～7 章，第 1 章「上一章」、第 7 章「下一章」呈禁用。
3. 每章 QR 有顯示；點 QR 後彈出全螢幕放大 QR；點畫面可關閉。
4. 用手機掃 QR，會開啟 `…/prompts.html#chN`（Task 10 完成後才會有內容頁）。

- [ ] **Step 6: Commit**

```bash
git add index.html app.js video/README.txt
git commit -m "feat(ai影片互動式課程): 主簡報頁面與互動"
```

---

### Task 10: 提示詞頁 `prompts.html` 與 `prompts.js`

**Files:**
- Create: `prompts.html`
- Create: `prompts.js`

**Interfaces:**
- Consumes: `PROMPTS`（Task 2）、`groupByChapter` / `renderPromptsHtml` / `handleCopyClick`（Task 6）
- Produces: 可運作的 `prompts.html`（章節錨點、複製按鈕、載入時捲到 hash）

- [ ] **Step 1: 寫 `prompts.html`**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>提示詞講義｜AI 短影音課程</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="prompts-page">
    <h1 class="prompts-page__title">提示詞講義</h1>
    <p>點每段右上角的「複製」，貼到 AI 對話框即可。文字中的【 】是要自己填的空格。</p>
    <div id="prompts"></div>
    <p><a href="index.html">← 回到課程簡報</a></p>
  </main>
  <script type="module" src="prompts.js"></script>
</body>
</html>
```

- [ ] **Step 2: 寫 `prompts.js`**

```js
import { PROMPTS } from "./src/prompts-data.js";
import { groupByChapter, renderPromptsHtml, handleCopyClick } from "./src/prompts-render.js";

const root = document.getElementById("prompts");
root.innerHTML = renderPromptsHtml(groupByChapter(PROMPTS));

root.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const original = btn.textContent;
  try {
    await handleCopyClick(e.target, PROMPTS, (text) => navigator.clipboard.writeText(text));
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch {
    btn.textContent = "複製失敗";
    setTimeout(() => { btn.textContent = original; }, 1500);
  }
});

function scrollToHash() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.addEventListener("hashchange", scrollToHash);
scrollToHash();
```

- [ ] **Step 3: 確認測試仍通過**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 4: 本機預覽驗證（人工）**

Run: `npm run serve`
然後開 `http://localhost:3000/prompts.html#ch3`，確認：
1. 頁面自動捲到「第 3 章」區塊。
2. 每段提示詞有「複製」按鈕，點下後變成「已複製」並可貼出正確文字。
3. 從首頁掃 QR 進入對應章節也能正確定位。

- [ ] **Step 5: Commit**

```bash
git add prompts.html prompts.js
git commit -m "feat(ai影片互動式課程): 提示詞總表頁面"
```

---

### Task 11: 部署設定與網址文件

**Files:**
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `網址.txt`

**Interfaces:**
- Consumes: 無
- Produces: 可 `firebase deploy --only hosting` 的設定

- [ ] **Step 1: 寫 `firebase.json`**

```json
{
  "hosting": {
    "site": "aivideo-sk",
    "public": ".",
    "ignore": [
      "firebase.json",
      ".firebaserc",
      "**/.*",
      "**/node_modules/**",
      "docs/**",
      "tests/**",
      "package.json",
      "package-lock.json",
      "vitest.config.js",
      "video/README.txt",
      "網址.txt"
    ],
    "headers": [
      {
        "source": "**/*.@(html|js|css)",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

- [ ] **Step 2: 寫 `.firebaserc`**

```json
{
  "projects": {
    "default": "opencode-sk"
  },
  "targets": {
    "opencode-sk": {
      "hosting": {
        "aivideo-sk": {}
      }
    }
  }
}
```

- [ ] **Step 3: 寫 `網址.txt`**

```
AI 影片互動式課程
Firebase Hosting：https://aivideo-sk.web.app
提示詞頁：https://aivideo-sk.web.app/prompts.html
本機預覽：npm run serve → http://localhost:3000/
```

- [ ] **Step 4: 確認 site 不存在衝突**

Run: `firebase hosting:sites:list --project opencode-sk`
Expected: 清單中**沒有** `aivideo-sk`。若已存在則改用其他名稱並同步修改 `firebase.json`、`.firebaserc`、`網址.txt`。

- [ ] **Step 5: 建立 Hosting site**

Run: `firebase hosting:sites:create aivideo-sk --project opencode-sk`
Expected: 建立成功（若已存在則略過）。

- [ ] **Step 6: 部署**

Run: `firebase deploy --only hosting --project opencode-sk`
Expected: 部署成功，輸出 Hosting URL `https://aivideo-sk.web.app`。

- [ ] **Step 7: Commit**

```bash
git add firebase.json .firebaserc "網址.txt"
git commit -m "chore(ai影片互動式課程): 新增 Firebase Hosting 部署設定"
```

---

## 人工驗收清單（部署後）

- [ ] 開 `https://aivideo-sk.web.app`，影片區顯示提示（尚未放 MP4）。
- [ ] 章節 1～7 可翻頁、可捲動，進度顯示正確。
- [ ] 第 1～5 章 QR 可放大；第 6、7 章無 QR。
- [ ] 手機掃 QR → 開啟 `prompts.html#chN` 並定位到該章。
- [ ] 提示詞「複製」按鈕可用。
- [ ] 放入 `video/intro.mp4` 後重新部署，影片可播放。

## Self-Review 對照（spec → task）

- 影片放最前：Task 9（`index.html` intro 區 + fallback）。
- 章節內捲動、章節間翻頁：Task 7（互動）+ Task 8（`overflow-y`）+ Task 9（`chapter__nav`）。
- 第 1～5 章提示詞：Task 2（資料）+ Task 9（QR）。
- QR 點擊放大燈箱：Task 7（openLightbox）+ Task 8（`.lightbox`）+ Task 9（綁定）。
- QR 動態網址：Task 3 + Task 9（`location.origin`）。
- 掃描後顯示提示詞 + 複製：Task 6 + Task 10。
- 內容/樣式分離、CSS 變數：Task 8。
- 純 HTML/CSS/JS：全部。
- 部署 `aivideo-sk`：Task 11。
- 測試策略（單元 + 元件、無 E2E）：Task 1/2/3/4/5/6/7。
