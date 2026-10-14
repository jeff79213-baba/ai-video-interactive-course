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
