<script lang="ts">
  import { PDFDocument } from 'pdf-lib';

  let files: File[] = [];
  let merging = false;
  let errorMsg = '';
  let infoMsg = '';

  function onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    files = [...files, ...Array.from(input.files)].filter((f) => f.type === 'application/pdf');
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    files = [...files, ...dropped];
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function move(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= files.length) return;
    const copy = files.slice();
    const temp = copy[idx];
    copy[idx] = copy[to];
    copy[to] = temp;
    files = copy;
  }

  function removeAt(idx: number) {
    files = files.filter((_, i) => i !== idx);
  }

  function fmt(n: number) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let u = 0;
    let v = n;
    while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
    return `${v.toFixed(1)} ${units[u]}`;
  }

  async function mergePdfs() {
    errorMsg = '';
    infoMsg = '';
    if (files.length < 2) {
      errorMsg = 'Please add at least 2 PDF files.';
      return;
    }
    const total = files.reduce((a, f) => a + f.size, 0);
    if (total > 25 * 1024 * 1024) {
      errorMsg = 'Total file size exceeds 25 MB. Remove some files or use smaller PDFs.';
      return;
    }

    merging = true;
    try {
      const out = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        infoMsg = `Merging file ${i + 1} of ${files.length}…`;
        const bytes = new Uint8Array(await files[i].arrayBuffer());
        const src = await PDFDocument.load(bytes /*, { ignoreEncryption: true }*/);
        const pages = await out.copyPages(src, src.getPageIndices());
        for (const p of pages) out.addPage(p);
      }

      const mergedBytes = await out.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
      infoMsg = 'Merged! Your download should start automatically.';
    } catch (e) {
      console.error(e);
      errorMsg = 'Failed to merge PDFs. Try different files.';
    } finally {
      merging = false;
    }
  }
</script>

<div class="space-y-4">
  <div
    class="rounded-lg border-2 border-dashed border-slate-300 bg-white p-6 text-center cursor-pointer hover:bg-slate-50"
    on:drop={onDrop}
    on:dragover={onDragOver}
    on:click={() => document.getElementById('pdfPicker')?.click()}
  >
    <p class="font-medium">Drop PDF files here or click to choose</p>
    <p class="text-xs text-slate-500 mt-1">Max total 25 MB. PDFs only. Files stay in your browser.</p>
    <input id="pdfPicker" class="hidden" type="file" accept="application/pdf" multiple on:change={onPick} />
  </div>

  {#if files.length > 0}
    <div class="rounded-lg border bg-white">
      <div class="p-3 text-sm text-slate-600 border-b">Files ({files.length}) — drag order with buttons</div>
      <ul class="divide-y">
        {#each files as f, i}
          <li class="flex items-center justify-between p-3">
            <div class="min-w-0">
              <div class="truncate font-medium">{f.name}</div>
              <div class="text-xs text-slate-500">{fmt(f.size)}</div>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm" on:click={() => move(i, -1)} disabled={i===0}>↑</button>
              <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm" on:click={() => move(i, 1)} disabled={i===files.length-1}>↓</button>
              <button class="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm" on:click={() => removeAt(i)}>Remove</button>
            </div>
          </li>
        {/each}
      </ul>
      <div class="p-3 flex justify-end gap-2">
        <button class="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200" on:click={() => (files = [])}>Clear</button>
        <button class="px-3 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60" on:click={mergePdfs} disabled={merging || files.length < 2}>
          {merging ? 'Merging…' : 'Merge PDFs'}
        </button>
      </div>
    </div>
  {/if}

  {#if infoMsg}<div class="text-sm text-sky-700">{infoMsg}</div>{/if}
  {#if errorMsg}<div class="text-sm text-red-600">{errorMsg}</div>{/if}
  <p class="text-xs text-slate-500">Privacy note: All processing happens in your browser. Nothing is uploaded.</p>
</div>