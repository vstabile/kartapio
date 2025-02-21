<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
  
    onMount(async () => {
      if (browser) {
        const { launchModal } = await import('https://esm.sh/@getalby/bitcoin-connect@3.6.3');
        launchModal();
      }
    });
  </script>
  
  <svelte:head>
    <title>Bitcoin Connect</title>
  </svelte:head>
  
  <main>
    <bc-pay-button invoice="lnbc1320n1pnm0ksadqqnp4qvgjk7awmrcflvs3582pshnd07vp5z9wmkjuqgc8lapww333cf8lupp5m5z5qgxuq4nlm3e2phwz34c68z2ugj067236w3lxdsmkyr29z93qsp5rvna4sm79xsc5pwkhsr5g3eemuwv67njs25wfr0du03hm0ys00vq9qyysgqcqpcxqyz5vqrzjqw9fu4j39mycmg440ztkraa03u5qhtuc5zfgydsv6ml38qd4azymlapyqqqqqqq2c5qqqqlgqqqq86qqjqfktmwupnymn9sltxl5jlfr5ldhhy0ahpuq3wehyjzwwnc8uuzutyflzw6jrevh59mn022332nmgweuyzy3lnqh5a4gvvf7mljxyrkpcp8gt6ec"></bc-pay-button>
  </main>