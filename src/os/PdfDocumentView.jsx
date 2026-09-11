import React, { useEffect, useRef, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * PdfDocumentView — one PDF viewer for the whole OS
 *
 * Before this, the resume was a pre-rendered JPEG and every uploaded PDF
 * fell through to the browser's built-in viewer, so the same folder showed
 * two completely different documents: a clean page on a grey mat, and
 * Chrome's dark toolbar with its own page nav, print and download buttons.
 * pdf.js renders both the same way — pages on a mat, our chrome around it.
 * ------------------------------------------------------------------ */

let pdfjsPromise = null;

/**
 * pdf.js is ~1.6 MB with its worker, which is dead weight for the visitors
 * who never open a document. Importing it on first use lets Vite split it
 * into its own chunk that is fetched only when a PDF window opens.
 */
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [lib, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      ]);
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    })().catch((err) => {
      // A failed import must not be cached as a permanent failure: the next
      // document opened should get a fresh attempt.
      pdfjsPromise = null;
      throw err;
    });
  }
  return pdfjsPromise;
}

const MAX_PIXEL_RATIO = 2;
const PAGE_GAP = 16;

function base64ToBytes(dataUrl) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * One page, drawn only once it is near the viewport. A 40-page deck would
 * otherwise rasterise every page up front and block the window on open.
 */
function PdfPage({ pdfDoc, pageNumber, scale, scrollRootRef }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [isNear, setIsNear] = useState(pageNumber === 1);
  const [size, setSize] = useState(null);

  useEffect(() => {
    if (isNear) return undefined;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsNear(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      {
        // The scroll container, not the viewport: pages outside it are
        // clipped by it, so a viewport root would never see a page coming
        // and every page would start blank as it scrolled in.
        root: scrollRootRef?.current || null,
        rootMargin: '800px 0px'
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isNear, scrollRootRef]);

  // Reserve the page's real footprint before it is drawn, so the scroll
  // height does not jump around as pages arrive.
  useEffect(() => {
    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      setSize({ width: viewport.width, height: viewport.height });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, scale]);

  useEffect(() => {
    if (!isNear) return undefined;
    let cancelled = false;
    let renderTask = null;

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Draw at device resolution and scale back down with CSS, so text
        // is not soft on a retina display. The oversampling is handed to
        // pdf.js as `transform` rather than set on the context directly:
        // pdf.js manages the context transform itself while rendering.
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        renderTask = page.render({
          canvas,
          viewport,
          transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0]
        });
        await renderTask.promise;
      } catch (err) {
        // A cancelled render is the expected outcome of zooming or closing
        // mid-draw, not a failure worth surfacing.
        if (err?.name !== 'RenderingCancelledException' && !cancelled) {
          console.error(`Failed to render PDF page ${pageNumber}:`, err);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNumber, scale, isNear]);

  // Paper stays white in dark mode: the canvas paints the page's own
  // background, and a dark sheet behind it would only show as a flash
  // before the render lands.
  return (
    <div
      ref={wrapRef}
      className="shrink-0 bg-white shadow-xl rounded-sm overflow-hidden"
      style={size ? { width: size.width, height: size.height } : { width: '100%', minHeight: 200 }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

/**
 * Renders every page of `url` stacked vertically on a mat.
 *
 * `zoom` is relative to fit-to-width, so 100% means the page fills the
 * window at whatever size the window happens to be — the same behaviour the
 * resume's image view had.
 */
export default function PdfDocumentView({
  url,
  zoom = 1,
  isDark = false,
  onDocumentLoad,
  onError,
  className = ''
}) {
  const scrollRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [containerWidth, setContainerWidth] = useState(0);
  const [baseScale, setBaseScale] = useState(1);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!url) {
      setStatus('error');
      return undefined;
    }

    let cancelled = false;
    let loadingTask = null;
    setStatus('loading');
    setPdfDoc(null);

    (async () => {
      try {
        const pdfjsLib = await loadPdfjs();
        if (cancelled) return;
        loadingTask = pdfjsLib.getDocument({
          // A base64 payload is decoded here rather than handed over as a
          // URL: callers hold PDFs as data: URLs (files kept inline when the
          // server upload failed) and pdf.js wants the bytes.
          ...(url.startsWith('data:application/pdf')
            ? { data: base64ToBytes(url) }
            : { url }),
          // Shipped under public/ so a PDF that leans on the standard 14
          // fonts without embedding them still renders its text.
          standardFontDataUrl: '/pdfjs/standard_fonts/'
        });
        const doc = await loadingTask.promise;
        // No doc.destroy() here: pdf.js 6 dropped it from PDFDocumentProxy,
        // and tearing down the loading task in cleanup releases the document.
        if (cancelled) return;
        setPdfDoc(doc);
        setStatus('ready');
        onDocumentLoad?.({ numPages: doc.numPages });
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to open PDF:', err);
        setStatus('error');
        onError?.(err);
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy?.();
    };
    // onDocumentLoad / onError are notifications; re-running on a new
    // identity would reload the document on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Fit-to-width, measured off page 1 so a landscape deck and a portrait
  // résumé both open filling the window rather than at an arbitrary scale.
  useEffect(() => {
    if (!pdfDoc || !containerWidth) return;
    let cancelled = false;
    pdfDoc.getPage(1).then((page) => {
      if (cancelled) return;
      const unscaled = page.getViewport({ scale: 1 });
      const available = Math.max(containerWidth - PAGE_GAP * 2, 120);
      setBaseScale(available / unscaled.width);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [pdfDoc, containerWidth]);

  const scale = Math.max(baseScale * zoom, 0.05);

  const matClass = isDark ? 'bg-slate-950' : 'bg-slate-200 dark:bg-slate-950';

  if (status === 'error') {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center ${matClass} ${className}`}>
        <FileText className="w-12 h-12 text-[#c0392b]" />
        <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
          This document could not be displayed here.
        </p>
        <p className="text-[11px] text-slate-500">
          Use Download or Open externally to read it.
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className={`flex-1 overflow-auto ${matClass} ${className}`}>
      {status === 'loading' || !pdfDoc ? (
        <div className="h-full min-h-[200px] flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[11px] font-medium">Opening document…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-4">
          {Array.from({ length: pdfDoc.numPages }, (_, i) => (
            <PdfPage
              key={`${url}-${i + 1}`}
              pdfDoc={pdfDoc}
              pageNumber={i + 1}
              scale={scale}
              scrollRootRef={scrollRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}
