// Custom Cursor
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Slight delay for outline for a smooth effect
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 150, fill: "forwards" });
});

// Cursor Hover Effect on links and buttons
const interactables = document.querySelectorAll('a, button');
interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorOutline.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
        cursorOutline.classList.remove('hover');
    });
});

// Header Scroll Effect
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Hero Animation
const tl = gsap.timeline();
tl.from('.hero-tag', { y: 20, opacity: 0, duration: 0.6, delay: 0.2 })
  .from('.hero-title', { y: 30, opacity: 0, duration: 0.8 }, "-=0.4")
  .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
  .from('.btn-group', { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
  .from('.hero-image', { scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.8");

// Scroll Reveal for Sections
gsap.utils.toArray('section').forEach(section => {
    if(section.classList.contains('hero')) return;
    
    gsap.from(section.querySelectorAll('.section-title, .project-card, .stack-card, .edu-item, .ending h2, .ending p, .ending a'), {
        scrollTrigger: {
            trigger: section,
            start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
    });
});
