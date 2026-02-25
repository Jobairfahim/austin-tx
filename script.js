/* ════════════════════════════════════════
   Fast Austin Locksmith — script.js
   ════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Navbar scroll effect (optimized for mobile) ── */
  const navbar = document.getElementById('navbar');
  let ticking = false;
  
  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        // Show/hide scroll-to-top button
        const scrollBtn = document.getElementById('scrollTop');
        if (window.scrollY > 400) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
        // Highlight active nav link (throttled on mobile)
        if (window.innerWidth > 768) {
          updateActiveNav();
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  
  // Use passive listeners for better scroll performance
  window.addEventListener('scroll', handleScroll, { passive: true });

  /* ── Active nav link on scroll ── */
  const sections = document.querySelectorAll('section[id], div[id="services-overview"]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  /* ── Hamburger / Mobile Menu ── */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');

  hamburger.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu when a nav link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  function closeMobileMenu() {
    navMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (!navbar.contains(e.target)) {
      closeMobileMenu();
      closeDropdown();
    }
  });

  /* ── Services Dropdown ── */
  const servicesBtn = document.getElementById('services-btn');
  const servicesMenu = document.getElementById('services-menu');

  function closeDropdown() {
    servicesMenu.classList.remove('open');
    servicesBtn.setAttribute('aria-expanded', 'false');
  }

  servicesBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = servicesMenu.classList.toggle('open');
    servicesBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close dropdown when a menu item is clicked
  servicesMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function () {
      closeDropdown();
      closeMobileMenu();
    });
  });

  // Close dropdown on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDropdown();
      closeMobileMenu();
    }
  });

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Scroll to top button ── */
  document.getElementById('scrollTop').addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── FAQ Accordion ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', function () {
      const answer = this.nextElementSibling;
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Close all others
      document.querySelectorAll('.faq-q').forEach(other => {
        if (other !== this) {
          other.setAttribute('aria-expanded', 'false');
          const otherAnswer = other.nextElementSibling;
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      // Toggle current
      this.setAttribute('aria-expanded', String(!isExpanded));
      if (answer) answer.hidden = isExpanded;
    });
  });

  /* ── Contact Form ── */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear previous errors
      form.querySelectorAll('.field-error').forEach(el => el.remove());
      form.querySelectorAll('input, select, textarea').forEach(el => {
        el.style.borderColor = '';
      });

      const name = form.querySelector('#name');
      const phone = form.querySelector('#phone');
      let valid = true;

      if (!name.value.trim()) {
        showFieldError(name, 'Please enter your name.');
        valid = false;
      }
      if (!phone.value.trim()) {
        showFieldError(phone, 'Please enter your phone number.');
        valid = false;
      } else if (!/[\d\s\-\(\)\+]{7,}/.test(phone.value.trim())) {
        showFieldError(phone, 'Please enter a valid phone number.');
        valid = false;
      }

      if (!valid) return;

      // Submit to ClickSend SMS backend
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email') || '',
        phone: formData.get('phone'),
        message: formData.get('message')
      };

      fetch('/send-clicksend.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('API result:', result);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        
        let successMsg = form.querySelector('.form-success');
        if (!successMsg) {
          successMsg = document.createElement('div');
          successMsg.className = 'form-success';
          form.appendChild(successMsg);
        }

        if (result.success) {
          successMsg.textContent = '✅ Message sent! We\'ll get back to you shortly. For immediate help, please call us.';
          form.reset();
        } else {
          successMsg.textContent = '❌ ' + (result.message || 'Failed to send message. Please try again or call us directly.');
          successMsg.style.background = 'rgba(231,76,60,0.1)';
          successMsg.style.borderColor = 'rgba(231,76,60,0.3)';
          successMsg.style.color = '#e74c3c';
        }
        
        successMsg.classList.add('visible');
        setTimeout(() => successMsg.classList.remove('visible'), 6000);
      })
      .catch(error => {
        console.log('Network error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        
        let successMsg = form.querySelector('.form-success');
        if (!successMsg) {
          successMsg = document.createElement('div');
          successMsg.className = 'form-success';
          successMsg.textContent = '❌ Network error. Please try again or call us directly.';
          successMsg.style.background = 'rgba(231,76,60,0.1)';
          successMsg.style.borderColor = 'rgba(231,76,60,0.3)';
          successMsg.style.color = '#e74c3c';
          form.appendChild(successMsg);
        }
        
        successMsg.classList.add('visible');
        setTimeout(() => successMsg.classList.remove('visible'), 6000);
      });
    });
  }

  function showFieldError(field, message) {
    field.style.borderColor = '#e74c3c';
    const error = document.createElement('p');
    error.className = 'field-error';
    error.textContent = message;
    field.parentNode.appendChild(error);
    field.focus();
  }

  /* ── Intersection Observer — fade-in on scroll (mobile optimized) ── */
  const fadeTargets = document.querySelectorAll(
    '.service-card, .area-card, .ig-card, .why-item, .faq-group, .ci-item'
  );

  if ('IntersectionObserver' in window) {
    // Use more conservative settings for mobile
    const isMobile = window.innerWidth <= 768;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            // Unobserve after animation for better performance
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: isMobile ? 0.05 : 0.1, 
        rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -40px 0px'
      }
    );

    fadeTargets.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      // Reduce animation complexity on mobile
      const transitionDuration = isMobile ? '0.3s' : '0.5s';
      el.style.transition = `opacity ${transitionDuration} ease ${(i % 6) * 0.08}s, transform ${transitionDuration} ease ${(i % 6) * 0.08}s`;
      observer.observe(el);
    });
  }

  /* ── Init ── */
  handleScroll();

})();
