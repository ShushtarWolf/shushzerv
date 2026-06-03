<template>
  <div class="min-h-dvh flex flex-col">
    <AppHeader />
    <main class="flex-1 pb-28 md:pb-10">
      <slot />
    </main>
    <AppFooter />
    <AppTabBar />
  </div>
</template>
