---
title: 题库
---

# 题库

欢迎来到题库！这里收集了各类编程相关的练习题目，帮助你巩固所学知识。

## 软考专区

<div class="question-cards">

<a href="https://www.ruankaodaren.com/exam/#/" target="_blank" class="question-card">
  <div class="question-card-content">
    <div class="question-card-title">软考达人</div>
    <div class="question-card-desc">专业的软考刷题题库</div>
  </div>
</a>

</div>

## 嵌入式专区

<div class="question-cards">

<a href="https://mianbao.zutils.cn/" target="_blank" class="question-card">
  <div class="question-card-content">
    <div class="question-card-title">面包刷题</div>
    <div class="question-card-desc">嵌入式面试刷题平台</div>
  </div>
</a>

</div>

<style>
.question-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.question-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--vp-c-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
  text-decoration: none !important;
  color: var(--vp-c-text-1) !important;
  transition: all 0.3s ease;
  cursor: pointer;
}

.question-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px 0 rgba(0, 0, 0, 0.15);
}

.dark .question-card:hover {
  box-shadow: 0 16px 48px 0 rgba(0, 0, 0, 0.5);
}

.question-card-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.question-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.question-card-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.question-card-desc {
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-weight: 400;
}

@media (max-width: 640px) {
  .question-cards {
    grid-template-columns: 1fr;
  }
}
</style>