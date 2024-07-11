<script lang="ts">
    import { onMount } from 'svelte';
    import QRCode from 'qrcode';
    import Button from './ui/button/button.svelte';
    import LucideDownload from '~icons/lucide/download';

    export let url: string;
    export let width = 400;

    let qrCanvas: HTMLCanvasElement;
    let downloadLink: HTMLAnchorElement;

    onMount(() => {
        if (url) {
            QRCode.toCanvas(qrCanvas, url, { width }, (error) => {
                if (error) console.error(error);
            });

            qrCanvas.style.height = '100%';
            qrCanvas.style.width = 'auto';

            downloadLink.href = qrCanvas.toDataURL();
            downloadLink.download = 'qr-code.png';
        }
    });
</script>

<div class="qrcode-container flex h-full w-auto items-center justify-center">
    <canvas bind:this={qrCanvas}></canvas>
    <a href={url} bind:this={downloadLink} class="qrcode-link">
        <Button class="border bg-white text-gray-800 hover:bg-white"><LucideDownload /></Button>
    </a>
</div>

<style>
    .qrcode-container:hover .qrcode-link {
        visibility: visible;
    }

    .qrcode-link {
        position: absolute;
        visibility: hidden;
    }
</style>
