<script setup lang="ts">
const { t, locale } = useI18n()
useHead({ title: () => t('footer.about') })
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-4">{{ t('footer.about') }}</h1>
    <div class="glass-panel space-y-4 p-6 leading-relaxed text-sz-gray-700">
      <template v-if="locale === 'fa'">
        <p>
          <strong>شوش‌زرو</strong> پلتفرم رزرو ورزشی است — زمین، کلاس و مربی را در یک اپ وب پیدا کنید و رزرو کنید.
          این نسخه دمو برای استفاده محلی است؛ پرداخت در محل باشگاه انجام می‌شود.
        </p>
        <p>با دوستان از طریق GitHub کد را به اشتراک بگذارید؛ برای دمو زنده از تونل (ngrok) یا همان Wi‑Fi استفاده کنید.</p>
      </template>
      <template v-else>
        <p>
          <strong>Shushzerv</strong> is a sports booking web app — find courts, classes, and coaches in one place.
          This is a local demo; payment is made at the club.
        </p>
        <p>Share code via GitHub; for a live demo use a tunnel (ngrok) or the same Wi‑Fi network.</p>
      </template>
    </div>
    <div class="mt-8">
      <FaqAccordion />
    </div>
  </div>
</template>
