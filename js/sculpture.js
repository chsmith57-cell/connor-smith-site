// Beat 03 — the sculpture loop. Plays only while on screen (saves battery/CPU);
// under prefers-reduced-motion it never autoplays — the poster frame stands in.
export function initSculpture(){
  const video = document.querySelector('.sculpture-video');
  if (!video) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  video.preload = 'auto';
  new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }
  }, { threshold: 0.2 }).observe(video);
}
