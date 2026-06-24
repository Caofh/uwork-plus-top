<template>
  <div class="about">
    <ParticleWhirlpoolBg :blur="2" class="bg-about c-flex-x-center">
      <div class="welcome">Welcome to the Uwork Plus</div>
    </ParticleWhirlpoolBg>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import ParticleWhirlpoolBg from '@/components/ui/bg-particle-whirlpool/ParticleWhirlpoolBg.vue'

  const about = ref('about')
</script>
<style scoped lang="scss">
  .about {
    color: #fff;
    .welcome {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -60%);
      font-size: 30px;
      font-weight: 800;
      background-color: #00000078;
      width: 60vw;
      text-align: center;
      border-radius: 10px;
    }
    :deep(.about-bg) {
      height: calc(100vh - 40px);
    }
  }
</style>
