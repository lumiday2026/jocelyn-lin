'use strict';

/* ---------- Power-mode state machine ---------- */
(() => {
  const fsm = document.getElementById('fsm');
  if (!fsm) return;
  const states = {
    off:    ['Power off', 'No supply. Waiting for the rails to ramp before the reset domain comes up.'],
    reset:  ['Reset', 'Domains are released in sequence and clocks and voltages are configured before handing off to run mode.'],
    normal: ['Normal', 'Full-speed operation. Clocks and power domains are on.'],
    low:    ['Low speed', 'The SCU switches to a slower clock to save power while the system keeps running.'],
    sleep:  ['Sleep', 'The CPU halts on WFE and wakes on an interrupt. Peripherals stay powered.'],
    lsleep: ['LS sleep', 'Low-speed clocks with the CPU halted, for the lowest active-domain power.'],
    deep:   ['DeepSleep', 'Only the always-on domain stays powered, and a wake factor brings the chip back through reset. This is where 63.4 mW became 1.5 mW.'],
  };
  const nodes = [...fsm.querySelectorAll('.node')];
  const name = document.getElementById('fsmName');
  const desc = document.getElementById('fsmDesc');

  const select = (key) => {
    nodes.forEach((n) => n.classList.toggle('active', n.dataset.state === key));
    fsm.classList.toggle('is-deep', key === 'deep');
    name.textContent = states[key][0];
    desc.textContent = states[key][1];
  };

  nodes.forEach((n) => {
    n.setAttribute('tabindex', '0');
    n.setAttribute('role', 'button');
    n.setAttribute('aria-label', `${states[n.dataset.state][0]} state`);
    const go = () => { stopTour(); select(n.dataset.state); };
    n.addEventListener('click', go);
    n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  // Gentle auto-tour until the visitor interacts.
  const tour = ['off', 'reset', 'normal', 'low', 'lsleep', 'low', 'normal', 'sleep', 'normal', 'deep', 'reset', 'normal'];
  let i = 2, timer = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function stopTour() { clearInterval(timer); timer = null; }
  select('normal');
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && timer === null && i >= 0) {
        timer = setInterval(() => { i = (i + 1) % tour.length; select(tour[i]); }, 2200);
      } else if (!e.isIntersecting) stopTour();
    }, { threshold: 0.4 }).observe(fsm);
  }
})();

/* ---------- Reveal + counters ---------- */
(() => {
  const els = document.querySelectorAll('.reveal');
  const count = (el) => {
    const end = +el.dataset.count, t0 = performance.now(), dur = 1500;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('in'));
    document.querySelectorAll('[data-count]').forEach((e) => { e.textContent = e.dataset.count; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(count);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((e) => io.observe(e));
})();

/* ---------- Nav: scrolled state, active link, mobile menu ---------- */
(() => {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById('burger');
  const links = document.getElementById('navLinks');
  const close = () => { burger.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
  });
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  if ('IntersectionObserver' in window) {
    const anchors = [...links.querySelectorAll('a[href^="#"]:not(.nav__cta)')];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) anchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'about', 'experience'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
})();

/* ---------- Lightbox ---------- */
(() => {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lbImg');
  const cap = document.getElementById('lbCap');
  document.querySelectorAll('.g, .story__img, .honor__photo').forEach((g) => {
    g.addEventListener('click', () => {
      const pic = g.querySelector('img');
      img.src = g.dataset.full || pic.currentSrc || pic.src;
      img.alt = pic.alt;
      cap.textContent = g.dataset.cap || g.closest('.honor')?.querySelector('h3')?.textContent || '';
      lb.showModal();
    });
  });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.hasAttribute('data-close')) lb.close(); });
})();

/* ---------- Project details dialog ---------- */
(() => {
  const notes = {
    pmu: ['01 · SiliconAuto · PMU driver', 'Teaching a chip when to sleep', [
      'Designed and implemented register-level PMU drivers in bare-metal C for an ARM Cortex-M automotive SoC.',
      'Built the power-mode and wake-up state machines, plus voltage-domain transitions.',
      'Debugged IST, BOR and power sequencing on early silicon with the ASIC and SE teams.',
      'Removed a single point of failure by implementing reliable low-power wake-up.',
      'Cut DeepSleep power from 63.4 mW to 1.5 mW (~97%) through power-sequencing optimization.',
    ]],
    scu: ['02 · SiliconAuto · SCU driver', 'Clocks, resets & a secure boundary', [
      'Implemented the clock tree, clock gating and dependency management.',
      'Developed reset control and sequencing.',
      'Configured TrustZone security: MSC for secure/non-secure memory access, MPC for memory protection and PPC for peripheral access.',
      'Implemented LDO and oscillator trimming.',
      'Supported SoC bring-up and low-power operation, and made the system more stable and flexible.',
    ]],
    validation: ['03 · SiliconAuto · System validation', 'Confidence across every stage', [
      'Ported FreeRTOS for multitasking and driver validation.',
      'Built a system-level validation framework covering functional testing, stress testing and HTOL.',
      'Developed chip-sorting and SIV tests.',
      'Automated test cases on FPGA prototypes before silicon, then reused the same suites on EVBs and production devices.',
      'Built automation for power measurement and IP-level characterization.',
    ]],
    customer: ['04 · Customer platform · Germany', "From a chip to a customer's platform", [
      'Provided on-site support in Germany for customer platform bring-up and low-level driver integration.',
      'Developed Zephyr shim drivers and delivered SDK releases.',
      'Debugged system-level issues across HW / SW with the customer and FAE teams.',
      'Delivered a successful customer demonstration at Embedded World 2026.',
    ]],
    quanta: ['05 · Quanta Computer · NVIDIA Orin', 'Finding the amps hiding in standby', [
      'Enabled NVIDIA Orin SC7 DeepSleep, triggered by KL15 OFF.',
      'Designed the MCU-to-SoC notification over UDP for SC7 entry.',
      'Replaced shell-based GPIO polling with automatic background detection.',
      'Debugged PMIC, CAN PHY and GPIO state-transition issues with the EE, QA and vendor FAE teams.',
      'Cut standby current from 2.6 A to 0.8 A (~70%).',
    ]],
    linux: ['06 · Self-directed · Raspberry Pi 5', 'Taking it up to the kernel', [
      'Extending bare-metal and RTOS bring-up experience to the Linux side of an SoC (Broadcom BCM2712).',
      'Writing loadable kernel modules and character device drivers with file_operations.',
      'Writing platform drivers bound via device-tree overlays that manage GPIO/IRQ resources.',
      'Using spinlocks and mutexes for synchronization, workqueues and tasklets for deferred work, and interrupt handlers.',
      'Debugging with dmesg, ftrace, /proc and /sys.',
    ]],
  };
  const media = {
    pmu: [['images/xmotiv-board.png', 'XMotiv automotive SoC module']],
    customer: [
      ['images/germany-team.jpg', 'Jocelyn with the customer engineering team in Germany'],
      ['images/ew2026-booth.jpg', 'The SiliconAuto team at the Embedded World 2026 booth'],
      ['images/germany-lunch.jpg', 'Lunch with the customer engineers'],
    ],
    quanta: [['images/quanta-team.jpg', 'Jocelyn with her team at Quanta Computer']],
  };
  const dlg = document.getElementById('notes');
  if (!dlg) return;
  const mediaBox = document.getElementById('notesMedia');
  const meta = document.getElementById('notesMeta');
  const title = document.getElementById('notesTitle');
  const list = document.getElementById('notesList');
  document.querySelectorAll('[data-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = notes[btn.dataset.note];
      if (!n) return;
      const m = media[btn.dataset.note] || [];
      mediaBox.innerHTML = '';
      mediaBox.className = 'notes__media notes__media--' + m.length;
      mediaBox.hidden = m.length === 0;
      mediaBox.dataset.note = btn.dataset.note;
      m.forEach(([src, alt]) => { const img = document.createElement('img'); img.src = src; img.alt = alt; img.loading = 'lazy'; mediaBox.appendChild(img); });
      meta.textContent = n[0];
      title.textContent = n[1];
      list.innerHTML = '';
      n[2].forEach((t) => { const li = document.createElement('li'); li.textContent = t; list.appendChild(li); });
      dlg.showModal();
    });
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close(); });
})();

document.getElementById('year').textContent = new Date().getFullYear();
