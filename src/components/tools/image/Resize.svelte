<script lang="ts">
  let file: File | null = null;
  let img: HTMLImageElement | null = null;

  // original image dimensions after load
  let ow = 0, oh = 0;

  // user inputs
  let width: number | '' = '';
  let height: number | '' = '';
  let keepAspect = true;

  // output options
  let format: 'image/webp' | 'image/jpeg' | 'image/png' | 'image/avif' = 'image/webp';
  let quality = 0.9;

  // ui state
  let processing = false;
  let errorMsg = '';
  let infoMsg = '';

  function sanitizeBase(name: string) {
    const base = name.replace(/\.[^/.]+$/, '');
    return base.normalize('NFKD').replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'image';
  }

  function onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith('image/')) { errorMsg = 'Select an image file.'; return; }
    if (f.size > 25 * 1024 * 1024) { errorMsg = 'File exceeds 25 MB.'; return; }

    errorMsg = '';
    file = f;

    const url = URL.createObjectURL(f);
    const i = new Image();
    i.onload = () => { img = i; ow = i.naturalWidth; oh = i.naturalHeight; URL.revokeObjectURL(url); };
    i.onerror = () => { errorMsg = 'Failed to load image.'; URL.revokeObjectURL(url); };
    i.src = url;
  }

  // compute target dimensions from inputs + original size
  function computeTarget(i: HTMLImageElement | null, wv: number | '', hv: number | '', keep: boolean) {
    if (!i) return { w: 0, h: 0 };
    let w = Number(wv) || 0;
    let h = Number(hv) || 0;

    if (!w && !h) {
      w = ow; h = oh;
    } else if (keep) {
      if (w && !h) h = Math.round((oh / ow) * w);
      else if (!w && h) w = Math.round((ow / oh) * h);
      // if both provided with keepAspect, we respect both values
    } else {
      if (!w) w = ow;
      if (!h) h = oh;
    }
    return { w, h };
  }

  // reactive: recompute whenever any dependency changes
  $: dims = computeTarget(img, width, height, keepAspect);

  function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encode failed'))), type, q);
    });
  }

  async function resizeAndDownload() {
    errorMsg = ''; infoMsg = '';
    if (!img || !file) { errorMsg = 'Please select an image.'; return; }
    const { w, h } = dims;
    if (!w || !h) { errorMsg = 'Enter width or height.'; return; }

    processing = true;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      let chosen = format;
      let blob: Blob;
      try { blob = await toBlob(canvas, chosen, quality); }
      catch { chosen = 'image/webp'; blob = await toBlob(canvas, chosen, quality); }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = chosen === 'image/png' ? 'png' : chosen === 'image/jpeg' ? 'jpg' : chosen === 'image/avif' ? 'avif' : 'webp';
      a.href = url;
      a.download = `${sanitizeBase(file.name)}_${w}x${h}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      infoMsg = 'Download started.';
    } catch (e: any) {
      console.error(e);
      errorMsg = e?.message || 'Failed to process image.';
    } finally {
      processing = false;
    }
  }

  function resetAll() {
    file = null; img = null; ow = 0; oh = 0;
    width = ''; height = ''; errorMsg = ''; infoMsg = '';
  }
</script>

<div class="space-y-4">
  <div class="rounded-lg border bg-white p-4">
    <label for="picker" class="block text-sm font-medium mb-2">Choose image (max 25 MB)</label>
    <input id="picker" class="block w-full" type="file" accept="image/*" on:change={onPick} />
    <div class="mt-3 text-xs text-slate-600">Original: {ow} × {oh}px</div>
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="text-xs text-slate-600" for="width">Width (px)</label>
      <input id="width" class="w-full border rounded px-2 py-1" type="number" min="1" bind:value={width} placeholder="e.g., 1024" />
    </div>
    <div>
      <label class="text-xs text-slate-600" for="height">Height (px)</label>
      <input id="height" class="w-full border rounded px-2 py-1" type="number" min="1" bind:value={height} placeholder="e.g., 768" />
    </div>
  </div>

  <label class="inline-flex items-center gap-2 text-sm">
    <input type="checkbox" bind:checked={keepAspect} />
    Keep aspect ratio
  </label>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="text-xs text-slate-600" for="format">Format</label>
      <select id="format" class="w-full border rounded px-2 py-1" bind:value={format}>
        <option value="image/webp">WEBP (recommended)</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/png">PNG</option>
        <option value="image/avif">AVIF (if supported)</option>
      </select>
    </div>
    <div>
      <label class="text-xs text-slate-600" for="quality">Quality</label>
      <input id="quality" class="w-full" type="range" min="0.1" max="1" step="0.05" bind:value={quality} />
      <div class="text-xs text-slate-600 mt-1">{Math.round(quality * 100)}%</div>
    </div>
  </div>

  <div class="text-xs text-slate-600">Target: {dims.w} × {dims.h}px</div>

  {#if errorMsg}<div class="text-sm text-red-600">{errorMsg}</div>{/if}
  {#if infoMsg}<div class="text-sm text-sky-700">{infoMsg}</div>{/if}

  <div class="flex gap-2">
    <button class="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200" on:click={resetAll}>Reset</button>
    <button class="px-4 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60"
      disabled={!img || processing}
      on:click={resizeAndDownload}>
      {processing ? 'Processing…' : 'Download resized image'}
    </button>
  </div>

  <p class="text-xs text-slate-500">All processing happens in your browser. Nothing is uploaded.</p>
</div>