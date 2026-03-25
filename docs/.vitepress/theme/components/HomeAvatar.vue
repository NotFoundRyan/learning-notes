<script setup lang="ts">
</script>

<template>
  <div class="home-avatar">
    <div class="avatar-container">
      <img
        src="/avatar.jpg"
        alt="Ryan's Avatar"
        class="avatar-image"
      />
      <div class="avatar-intro">
        <span class="avatar-name">I'm Ryan</span>
        <span class="avatar-welcome">欢迎来到我的主页</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-avatar {
  position: absolute;
  right: 64px;
  top: 30%;
  transform: translateY(-50%);
  z-index: 10;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--vp-c-brand-1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.avatar-image:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
}

.avatar-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.avatar-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.avatar-welcome {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
  .home-avatar {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .avatar-image {
    width: 100px;
    height: 100px;
  }

  .avatar-name {
    font-size: 1.1rem;
  }

  .avatar-welcome {
    font-size: 0.85rem;
  }
}
</style>
