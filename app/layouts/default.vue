<template>
  <div class="min-h-dvh flex flex-col">
    <AppHeader />
    <main class="flex-1 pb-28 md:pb-12 pt-[var(--sz-safe-top)]">
      <slot />
    </main>
    <AppFooter />
    <AppTabBar />
  </div>
</template>
