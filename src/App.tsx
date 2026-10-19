import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Product {
  name: string;
  price: string;
  badge: string;
  specs: string[];
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'products-page' | 'repair-page' | 'contact-page'>('home');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contact form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBranch, setFormBranch] = useState('Hazira');
  const [formMsg, setFormMsg] = useState('');

  const stageRef = useRef<HTMLDivElement>(null);

  // 3D Three.js phone effect
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || currentView !== 'home') return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.innerHTML = '';
    stage.appendChild(renderer.domElement);

    const hintEl = document.createElement('div');
    hintEl.className = 'hint';
    hintEl.textContent = 'Drag to rotate the phone';
    stage.appendChild(hintEl);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const k = new THREE.PointLight(0xff9a4d, 1.4, 30);
    k.position.set(5, 4, 6);
    scene.add(k);
    const f = new THREE.PointLight(0x4d7bff, 1.6, 30);
    f.position.set(-6, -2, 5);
    scene.add(f);

    const rr = (w: number, h: number, r: number) => {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };

    const phone = new THREE.Group();
    const bodyG = new THREE.ExtrudeGeometry(rr(1.7, 3.5, 0.3), {
      depth: 0.16,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 4,
      curveSegments: 16,
    });
    bodyG.center();
    phone.add(new THREE.Mesh(bodyG, new THREE.MeshStandardMaterial({ color: 0x1a1f33, metalness: 0.9, roughness: 0.25 })));

    // Screen texture
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 1024;
    const ctx = cv.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, 512, 1024, 64);
      else ctx.rect(0, 0, 512, 1024);
      ctx.clip();
      const gr = ctx.createLinearGradient(0, 0, 512, 1024);
      gr.addColorStop(0, '#ff7a1a');
      gr.addColorStop(0.5, '#ff3d7a');
      gr.addColorStop(1, '#2f6bff');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, 512, 1024);
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.textAlign = 'center';
      ctx.font = '700 40px system-ui,sans-serif';
      ctx.fillText('Ambika Mobile', 256, 380);
      ctx.font = '400 26px system-ui,sans-serif';
      ctx.fillText('Sale & Service · Gwalior', 256, 430);
      ctx.font = '300 120px system-ui,sans-serif';
      ctx.fillText('9:41', 256, 200);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        const x = 64 + (i % 4) * 100;
        const y = 640 + Math.floor(i / 4) * 120;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, 84, 84, 22);
        else ctx.rect(x, y, 84, 84);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 3.38), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    screen.position.z = 0.125;
    phone.add(screen);

    // Camera module on the back
    const lensM = new THREE.MeshStandardMaterial({ color: 0x05070d, metalness: 1, roughness: 0.1 });
    const ringM = new THREE.MeshStandardMaterial({ color: 0xc9ced9, metalness: 1, roughness: 0.2 });
    [[-0.35, 1.2], [0.35, 1.2], [0, 0.6]].forEach(([x, y]) => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 32), ringM);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, -0.17);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 32), lensM);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, y, -0.18);
      phone.add(ring, lens);
    });
    scene.add(phone);

    // Floating shapes + particles
    const floaters: THREE.Mesh[] = [];
    const mats = [0xff7a1a, 0x2f6bff, 0xff3d7a].map(c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.3 }));
    [
      [-2.6, 1.4, -1, new THREE.TorusGeometry(0.4, 0.13, 16, 40)],
      [2.7, -1.2, -0.5, new THREE.IcosahedronGeometry(0.38)],
      [2.3, 1.7, -1.5, new THREE.OctahedronGeometry(0.3)],
      [-2.4, -1.6, -0.8, new THREE.SphereGeometry(0.28, 24, 24)],
    ].forEach(([x, y, z, geo], i) => {
      const m = new THREE.Mesh(geo as THREE.BufferGeometry, mats[i % 3]);
      m.position.set(x as number, y as number, z as number);
      m.userData = { y, s: 0.6 + Math.random() * 0.6, p: Math.random() * 6 };
      scene.add(m);
      floaters.push(m);
    });

    const N = 160;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 14;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9db4ff, size: 0.03, transparent: true, opacity: 0.7 }));
    scene.add(pts);

    let tx = 0, ty = 0, dragging = false, lx = 0, spin = 0, vel = 0;

    const onPointerMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (dragging) {
        vel = (e.clientX - lx) * 0.01;
        spin += vel;
        lx = e.clientX;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const resize = () => {
      if (!stage) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.9 ? 11 : 9;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();

    const still = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    let visible = true;
    const obs = new IntersectionObserver(e => (visible = e[0].isIntersecting));
    obs.observe(stage);

    let animId: number;
    const clock = new THREE.Clock();
    const loop = () => {
      animId = requestAnimationFrame(loop);
      if (!visible) return;
      const t = clock.getElapsedTime();
      const sy = Math.min(window.scrollY / window.innerHeight, 1.5);
      if (!dragging) {
        spin += still ? 0 : 0.006;
      }
      phone.rotation.y += ((spin + tx * 0.6 + sy * 1.2) - phone.rotation.y) * 0.08;
      phone.rotation.x += (ty * 0.4 - phone.rotation.x) * 0.08;
      phone.position.y = still ? 0 : Math.sin(t * 1.2) * 0.12;

      floaters.forEach(m => {
        m.rotation.x += 0.008 * m.userData.s;
        m.rotation.y += 0.01 * m.userData.s;
        if (!still) m.position.y = m.userData.y + Math.sin(t * m.userData.s + m.userData.p) * 0.25;
      });
      pts.rotation.y = t * 0.02;
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      obs.disconnect();
      window.removeEventListener('resize', resize);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      if (renderer && renderer.domElement) {
        renderer.dispose();
      }
    };
  }, [currentView]);

  // Scroll reveal observer & tilt effect
  useEffect(() => {
    const io = new IntersectionObserver(
      es =>
        es.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    const tilts = document.querySelectorAll('.tilt');
    const handlers: { c: Element; move: any; leave: any }[] = [];

    tilts.forEach(c => {
      const move = (e: PointerEvent) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        (c as HTMLElement).style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${ -y * 10 }deg) translateY(-4px)`;
      };
      const leave = () => {
        (c as HTMLElement).style.transform = '';
      };
      c.addEventListener('pointermove', move as any);
      c.addEventListener('pointerleave', leave);
      handlers.push({ c, move, leave });
    });

    return () => {
      io.disconnect();
      handlers.forEach(({ c, move, leave }) => {
        c.removeEventListener('pointermove', move);
        c.removeEventListener('pointerleave', leave);
      });
    };
  }, [currentView, selectedBrand]);

  const switchView = (view: 'home' | 'products-page' | 'repair-page' | 'contact-page', brand?: string) => {
    setCurrentView(view);
    if (brand) {
      setSelectedBrand(brand);
    } else if (view !== 'products-page') {
      setSelectedBrand(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const brandProducts: Record<string, Product[]> = {
    Apple: [
      { name: 'iPhone 16 Pro Max', price: '₹1,44,900', badge: 'Flagship', specs: ['A18 Pro chip with 6-core GPU', '6.9" Super Retina XDR display', '48MP Fusion camera system', 'Titanium design with Action Button'] },
      { name: 'iPhone 16', price: '₹79,900', badge: 'Latest', specs: ['A18 chip with 5-core GPU', '6.1" OLED display', 'Camera Control button', 'Advanced dual-camera system'] },
      { name: 'iPhone 15', price: '₹69,900', badge: 'Best Value', specs: ['A16 Bionic chip', 'Dynamic Island & 6.1" display', '48MP main camera with 2x Telephoto', 'USB-C connectivity'] },
      { name: 'iPhone 14', price: '₹58,900', badge: 'Popular', specs: ['A15 Bionic chip with 5-core GPU', '6.1" Super Retina XDR', 'Crash Detection & Emergency SOS', 'All-day battery life'] },
    ],
    Samsung: [
      { name: 'Galaxy S25 Ultra', price: '₹1,29,900', badge: 'Ultra Flagship', specs: ['Snapdragon 8 Elite for Galaxy', 'Built-in S Pen', '200MP Quad Camera with AI Zoom', '6.8" Dynamic AMOLED 2X 120Hz'] },
      { name: 'Galaxy S25+', price: '₹99,900', badge: 'Flagship', specs: ['Exynos 2500 / Snapdragon 8 Elite', '6.7" QHD+ AMOLED display', 'Advanced AI photo & chat assist', '4900mAh battery with 45W charging'] },
      { name: 'Galaxy Z Fold 6', price: '₹1,64,900', badge: 'Foldable', specs: ['Snapdragon 8 Gen 3 for Galaxy', '7.6" Main Foldable Inner Screen', 'AI-powered productivity & multitasking', 'Armor Aluminum hinge'] },
      { name: 'Galaxy A55 5G', price: '₹36,900', badge: 'Best Seller', specs: ['Exynos 1480 with AMD graphics', '6.6" Super AMOLED 120Hz', '50MP OIS Triple Camera', 'IP67 dust & water resistance'] },
    ],
    OnePlus: [
      { name: 'OnePlus 13', price: '₹69,900', badge: 'Flagship Killer', specs: ['Snapdragon 8 Elite processor', 'Hasselblad 4th Gen Camera for Mobile', '6000mAh battery with 100W SuperVOOC', '2K 120Hz ProXDR display'] },
      { name: 'OnePlus 13R', price: '₹42,900', badge: 'Performance', specs: ['Snapdragon 8 Gen 3', '6.78" 1.5K AMOLED display', '6500mAh massive battery', 'Triple stereo speakers'] },
      { name: 'OnePlus Open', price: '₹1,39,900', badge: 'Foldable', specs: ['Snapdragon 8 Gen 2', 'Dual ProXDR displays', 'Flexion Hinge with zero crease', '48MP Sony LYT-T808 sensor'] },
      { name: 'OnePlus Nord 4', price: '₹29,900', badge: 'Mid-Range', specs: ['Snapdragon 7+ Gen 3', 'All-metal unibody design', '5500mAh battery with 100W charging', '50MP Sony LYT-600 main camera'] },
    ],
    Vivo: [
      { name: 'Vivo X200 Pro', price: '₹94,900', badge: 'Camera King', specs: ['MediaTek Dimensity 9400', 'Zeiss 200MP APO Telephoto camera', '6000mAh BlueVolt battery', '6.78" 120Hz curved AMOLED'] },
      { name: 'Vivo V40 Pro', price: '₹49,900', badge: 'Portrait Expert', specs: ['Dimensity 9200+', 'Zeiss All Main Camera system', '50MP Studio Quality Portrait', 'Ultra-slim 3D curved design'] },
      { name: 'Vivo T3 Ultra', price: '₹31,900', badge: 'Value Power', specs: ['MediaTek Dimensity 9200+', 'Slimmest curved 120Hz display', '5500mAh battery with 80W FlashCharge', '50MP Sony IMX921 OIS camera'] },
      { name: 'Vivo Y300 Pro', price: '₹23,900', badge: 'Reliable', specs: ['Snapdragon 6 Gen 1', '6500mAh battery with 80W fast charge', '1300 nits bright AMOLED display', '50MP main camera'] },
    ],
  };

  const handleBookRepair = (serviceName: string) => {
    const phone = '919826011111';
    const message = `Hello Ambika Mobile, I would like to book a repair slot for: ${serviceName}. Please let me know the availability and estimated time at your Hazira / Thatipur branch.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleInquireProduct = (modelName: string, price: string) => {
    const phone = '919826011111';
    const message = `Hello Ambika Mobile, I am interested in inquiring about / purchasing the ${modelName} (${price}). Please let me know its availability at your Hazira / Thatipur branch.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Thank you ${formName}! Your message has been sent to our ${formBranch} branch team.`);
    setFormName('');
    setFormPhone('');
    setFormMsg('');
  };

  return (
    <>
      {/* Sticky Floating Navigation Bar */}
      <nav>
        <div className="logo" onClick={() => switchView('home')}>
          Ambika<b>Mobile</b>
        </div>
        <ul>
          <li>
            <a className={currentView === 'home' ? 'active' : ''} onClick={() => switchView('home')}>
              Home
            </a>
          </li>
          <li>
            <a className={currentView === 'products-page' ? 'active' : ''} onClick={() => switchView('products-page')}>
              Products
            </a>
          </li>
          <li>
            <a className={currentView === 'repair-page' ? 'active' : ''} onClick={() => switchView('repair-page')}>
              Repair Services
            </a>
          </li>
          <li>
            <a className={currentView === 'contact-page' ? 'active' : ''} onClick={() => switchView('contact-page')}>
              Contact
            </a>
          </li>
        </ul>
        <button className="btn" onClick={() => switchView('products-page')} style={{ padding: '8px 18px', fontSize: '.88rem' }}>
          Explore Brands
        </button>
      </nav>

      <main>
        {/* HOME VIEW */}
        <div className={`view ${currentView === 'home' ? 'active' : ''}`} style={{ display: currentView === 'home' ? 'block' : 'none' }}>
          <header className="hero" id="top">
            <div className="reveal">
              <span className="tag">Gwalior’s Mobile Destination</span>
              <h1>
                Your next phone, <span>perfectly fixed</span> &amp; fitted.
              </h1>
              <p className="lead">
                Premium smartphones from Apple, Samsung, OnePlus and Vivo, genuine accessories and expert repair, all under one trusted roof in Gwalior.
              </p>
              <div className="cta">
                <button className="btn" onClick={() => switchView('products-page')}>
                  Explore Brands
                </button>
                <button className="btn ghost" onClick={() => switchView('repair-page')}>
                  Repair Services
                </button>
              </div>
              <div className="stats">
                <div>
                  <b>4</b>
                  <small>Top brands</small>
                </div>
                <div>
                  <b>2</b>
                  <small>Gwalior branches</small>
                </div>
                <div>
                  <b>Expert</b>
                  <small>Repair desk</small>
                </div>
              </div>
            </div>
            <div id="stage" ref={stageRef} className="reveal"></div>
          </header>

          <section id="brands">
            <h2 className="reveal">Brands you love</h2>
            <p className="sub reveal">Latest launches and best-sellers, with honest advice from people who use these phones every day.</p>
            <div className="brands reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div className="brand-card" onClick={() => switchView('products-page', 'Apple')}>
                <div className="ico"></div>
                <h3>Apple</h3>
                <p>iPhone 16 Pro, 16, 15 &amp; more</p>
              </div>
              <div className="brand-card" onClick={() => switchView('products-page', 'Samsung')}>
                <div className="ico">📱</div>
                <h3>Samsung</h3>
                <p>Galaxy S25 Ultra, Fold 6 &amp; A Series</p>
              </div>
              <div className="brand-card" onClick={() => switchView('products-page', 'OnePlus')}>
                <div className="ico">⚡</div>
                <h3>OnePlus</h3>
                <p>OnePlus 13, 13R, Open &amp; Nord</p>
              </div>
              <div className="brand-card" onClick={() => switchView('products-page', 'Vivo')}>
                <div className="ico">📸</div>
                <h3>Vivo</h3>
                <p>X200 Pro, V40 Pro, T3 Ultra &amp; Y Series</p>
              </div>
            </div>
          </section>

          <section className="band" id="services">
            <div>
              <h2 className="reveal">Sales, accessories &amp; service</h2>
              <p className="sub reveal">Everything your phone needs, from day one to year five.</p>
              <div className="grid">
                <div className="card reveal tilt" onClick={() => switchView('products-page')}>
                  <div className="ico">📱</div>
                  <h3>Smartphone Sales</h3>
                  <p>New launches across every budget, with exchange guidance and setup help.</p>
                </div>
                <div className="card reveal tilt" onClick={() => switchView('products-page')}>
                  <div className="ico">🎧</div>
                  <h3>Accessories</h3>
                  <p>Cases, tempered glass, chargers, earbuds and more, chosen for quality.</p>
                </div>
                <div className="card reveal tilt" onClick={() => switchView('repair-page')}>
                  <div className="ico">🛠️</div>
                  <h3>Expert Repair</h3>
                  <p>Screens, batteries, charging ports and software issues handled by skilled technicians.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Comprehensive FAQ Section */}
          <section id="faq">
            <h2 className="reveal">Frequently Asked Questions</h2>
            <p className="sub reveal">Got questions about our phones, exchanges, or repair warranties? We’ve got answers.</p>
            <div className="faq-list reveal">
              {[
                {
                  q: 'Are all smartphones sold at Ambika Mobile 100% genuine with warranty?',
                  a: 'Yes! Every smartphone we sell from Apple, Samsung, OnePlus, and Vivo is 100% genuine, factory-sealed, and comes with full official brand manufacturer warranty and support.',
                },
                {
                  q: 'Do you offer phone exchange and trade-in deals?',
                  a: 'Absolutely. Bring your old smartphone to either our Hazira or Thatipur branch for an instant, transparent evaluation and get the best exchange value towards your new upgrade.',
                },
                {
                  q: 'How long does a screen or battery repair take?',
                  a: 'Most standard screen and battery replacements are completed in 30 to 60 minutes. You can relax at our store lounge while our expert technicians service your device.',
                },
                {
                  q: 'Do repair services come with a warranty?',
                  a: 'Yes, all screen and battery replacements include a 6-month service warranty covering parts and craftsmanship.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit/debit cards, UPI payments (PhonePe, Google Pay, Paytm), cash, and offer zero-cost EMI options through leading finance partners.',
                },
              ].map((faq, idx) => (
                <div key={idx} className={`faq-item ${openFaqIndex === idx ? 'open' : ''}`}>
                  <div className="faq-q" onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}>
                    {faq.q}
                  </div>
                  <div className="faq-a">{faq.a}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="visit">
            <h2 className="reveal">Two branches, one promise</h2>
            <p className="sub reveal">Walk into whichever is closer to you.</p>
            <div className="grid">
              <div className="card reveal tilt" onClick={() => switchView('contact-page')}>
                <div className="ico">📍</div>
                <h3>Hazira Branch</h3>
                <p>Gwalior, Madhya Pradesh</p>
                <p style={{ marginTop: '14px' }}>
                  <span className="btn ghost" style={{ padding: '9px 20px' }}>
                    View branch details
                  </span>
                </p>
              </div>
              <div className="card reveal tilt" onClick={() => switchView('contact-page')}>
                <div className="ico">📍</div>
                <h3>Thatipur Branch</h3>
                <p>Gwalior, Madhya Pradesh</p>
                <p style={{ marginTop: '14px' }}>
                  <span className="btn ghost" style={{ padding: '9px 20px' }}>
                    View branch details
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="final">
            <h2 className="reveal">Ready for an upgrade?</h2>
            <p className="sub reveal">Drop in for a demo, a quote or a quick fix.</p>
            <button className="btn reveal" onClick={() => switchView('contact-page')}>
              Contact our stores
            </button>
          </section>
        </div>

        {/* PRODUCTS PAGE VIEW */}
        <div className={`view ${currentView === 'products-page' ? 'active' : ''}`} style={{ display: currentView === 'products-page' ? 'block' : 'none' }}>
          <div className="page-header">
            {!selectedBrand ? (
              <div>
                <span className="tag">Catalog &amp; Availability</span>
                <h2>Explore Smartphone Brands</h2>
                <p className="sub">Select a brand below to view available models, specifications, and best pricing at Ambika Mobile Gwalior.</p>

                <div className="brands reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
                  <div className="brand-card" onClick={() => setSelectedBrand('Apple')}>
                    <div className="ico"></div>
                    <h3>Apple</h3>
                    <p>iPhone 16 Pro, 16, 15 &amp; more</p>
                  </div>
                  <div className="brand-card" onClick={() => setSelectedBrand('Samsung')}>
                    <div className="ico">📱</div>
                    <h3>Samsung</h3>
                    <p>Galaxy S25 Ultra, Fold 6 &amp; A Series</p>
                  </div>
                  <div className="brand-card" onClick={() => setSelectedBrand('OnePlus')}>
                    <div className="ico">⚡</div>
                    <h3>OnePlus</h3>
                    <p>OnePlus 13, 13R, Open &amp; Nord</p>
                  </div>
                  <div className="brand-card" onClick={() => setSelectedBrand('Vivo')}>
                    <div className="ico">📸</div>
                    <h3>Vivo</h3>
                    <p>X200 Pro, V40 Pro, T3 Ultra &amp; Y Series</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <button className="btn ghost" onClick={() => setSelectedBrand(null)} style={{ marginBottom: '20px', padding: '8px 18px', fontSize: '.85rem' }}>
                  ← Back to Brands
                </button>
                <span className="tag">{selectedBrand} Collection</span>
                <h2>{selectedBrand} Smartphones</h2>
                <p className="sub">Showing available smartphones and specs for your selected brand.</p>
              </div>
            )}
          </div>

          {selectedBrand && (
            <div className="product-grid" style={{ display: 'grid' }}>
              {(brandProducts[selectedBrand] || []).map((prod, idx) => (
                <div key={idx} className="product-card reveal in">
                  <div>
                    <span className="product-badge">{prod.badge}</span>
                    <div className="product-title">{prod.name}</div>
                    <div className="product-price">{prod.price}</div>
                    <ul className="specs-list">
                      {prod.specs.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="btn" onClick={() => handleInquireProduct(prod.name, prod.price)} style={{ width: '100%', padding: '11px', fontSize: '.9rem' }}>
                    Inquire via WhatsApp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REPAIR SERVICES PAGE VIEW */}
        <div className={`view ${currentView === 'repair-page' ? 'active' : ''}`} style={{ display: currentView === 'repair-page' ? 'block' : 'none' }}>
          <div className="page-header">
            <button className="btn ghost" onClick={() => switchView('home')} style={{ marginBottom: '20px', padding: '8px 18px', fontSize: '.85rem' }}>
              ← Back to Home
            </button>
            <span className="tag">Expert Technicians</span>
            <h2>Dedicated Repair Services</h2>
            <p className="sub">
              Certified repairs for Apple, Samsung, OnePlus, Vivo and more. Genuine spare parts, professional diagnostics, and 6-month warranty on screen and battery replacements.
            </p>
          </div>

          <div className="repair-grid">
            {[
              {
                badge: 'Most Popular',
                title: 'Screen & Glass Replacement',
                specs: ['Original OLED/LCD touch displays', 'Same-day turnaround (30-60 mins)', '6-month replacement warranty', 'Free tempered glass protector included'],
              },
              {
                badge: 'Essential Care',
                title: 'Battery Replacement',
                specs: ['High-capacity certified cells', 'Restores 100% battery health', 'Prevents sudden shutdowns & heating', 'Tested for safety and longevity'],
              },
              {
                badge: 'Hardware Fix',
                title: 'Charging Port & Audio Repair',
                specs: ['USB-C / Lightning port cleaning or swap', 'Earpiece & loudspeaker replacement', 'Microphone clarity restoration', 'Fast-charging protocol verification'],
              },
              {
                badge: 'Digital Support',
                title: 'Software Troubleshooting',
                specs: ['OS flashing & bootloop recovery', 'Data backup & safe migration', 'Virus / malware removal & optimization', 'Apple ID / Google account unlocking support'],
              },
              {
                badge: 'Advanced Lab',
                title: 'Water Damage & Motherboard Fix',
                specs: ['Ultrasonic chemical cleaning', 'Chip-level micro-soldering repair', 'Dead phone data recovery services', 'Detailed diagnostic estimate before work'],
              },
              {
                badge: 'Protection',
                title: 'Camera & Glass Lens Repair',
                specs: ['Outer camera glass lens replacement', 'Main sensor dust cleaning & alignment', 'OIS stabilization repair', 'Original clarity and focus restored'],
              },
            ].map((repair, idx) => (
              <div key={idx} className="repair-card reveal">
                <div>
                  <span className="repair-badge">{repair.badge}</span>
                  <div className="repair-title">{repair.title}</div>
                  <ul className="repair-details" style={{ marginTop: '14px' }}>
                    {repair.specs.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <button className="btn" onClick={() => handleBookRepair(repair.title)} style={{ width: '100%', padding: '11px', fontSize: '.9rem' }}>
                  Book Repair Slot
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT PAGE VIEW */}
        <div className={`view ${currentView === 'contact-page' ? 'active' : ''}`} style={{ display: currentView === 'contact-page' ? 'block' : 'none' }}>
          <div className="page-header reveal">
            <button className="btn ghost" onClick={() => switchView('home')} style={{ marginBottom: '20px', padding: '8px 18px', fontSize: '.85rem' }}>
              ← Back to Home
            </button>
            <span className="tag">Get in Touch</span>
            <h2>Contact Ambika Mobile</h2>
            <p className="sub">Have a question about a phone launch, repair quote, or branch timings? Reach out or visit our Hazira and Thatipur stores.</p>
          </div>

          <div className="contact-layout">
            {/* Contact Form */}
            <div className="contact-form reveal">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 800 }}>Send us a message</h3>
              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="c-name">Your Full Name</label>
                  <input
                    type="text"
                    id="c-name"
                    className="form-control"
                    placeholder="Saksham Sharma"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="c-phone">Mobile Number</label>
                  <input
                    type="tel"
                    id="c-phone"
                    className="form-control"
                    placeholder="+91 98260 XXXXX"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="c-branch">Preferred Branch</label>
                  <select id="c-branch" className="form-control" value={formBranch} onChange={e => setFormBranch(e.target.value)}>
                    <option value="Hazira">Hazira Branch (Gwalior)</option>
                    <option value="Thatipur">Thatipur Branch (Gwalior)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="c-msg">Message / Inquiry</label>
                  <textarea
                    id="c-msg"
                    className="form-control"
                    placeholder="Tell us which phone or repair you are inquiring about..."
                    value={formMsg}
                    onChange={e => setFormMsg(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn" style={{ width: '100%', padding: '14px' }}>
                  Send Message
                </button>
              </form>
            </div>

            {/* Store Locations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="reveal">
              <div className="card" style={{ cursor: 'default' }}>
                <div className="ico">📍</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Hazira Branch (Main Store)</h3>
                <p style={{ color: 'var(--mut)', marginBottom: '12px' }}>Near Main Square, Hazira, Gwalior, Madhya Pradesh - 474003</p>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '14px' }}>Phone: +91 98260 11111 | Timing: 10:00 AM – 9:00 PM</p>
                <a className="btn ghost" style={{ padding: '9px 20px', fontSize: '.85rem' }} href="https://www.google.com/maps/search/Ambika+Mobile+Hazira+Gwalior" target="_blank" rel="noopener">
                  Get Google Directions
                </a>
              </div>

              <div className="card" style={{ cursor: 'default' }}>
                <div className="ico">📍</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Thatipur Branch</h3>
                <p style={{ color: 'var(--mut)', marginBottom: '12px' }}>Central Market Road, Thatipur, Gwalior, Madhya Pradesh - 474011</p>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '14px' }}>Phone: +91 98260 22222 | Timing: 10:00 AM – 9:00 PM</p>
                <a className="btn ghost" style={{ padding: '9px 20px', fontSize: '.85rem' }} href="https://www.google.com/maps/search/Ambika+Mobile+Thatipur+Gwalior" target="_blank" rel="noopener">
                  Get Google Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER AT BOTTOM OF ALL PAGES */}
      <footer>
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Ambika Mobile</h4>
            <p style={{ marginBottom: '16px' }}>Gwalior’s most trusted multi-brand smartphone showroom and repair center for Apple, Samsung, OnePlus, and Vivo.</p>
            <div className="social-icons">
              <div className="social-icon" title="Instagram">
                IG
              </div>
              <div className="social-icon" title="Facebook">
                FB
              </div>
              <div className="social-icon" title="WhatsApp">
                WA
              </div>
              <div className="social-icon" title="YouTube">
                YT
              </div>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a onClick={() => switchView('home')}>Home</a>
              </li>
              <li>
                <a onClick={() => switchView('products-page')}>Products</a>
              </li>
              <li>
                <a onClick={() => switchView('repair-page')}>Repair Services</a>
              </li>
              <li>
                <a onClick={() => switchView('contact-page')}>Contact</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Store Branches</h4>
            <ul>
              <li>
                <b>Hazira Branch:</b> Main Square, Gwalior
              </li>
              <li>
                <b>Thatipur Branch:</b> Central Market, Gwalior
              </li>
              <li>Open 7 Days a Week</li>
              <li>10:00 AM – 9:00 PM</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Business Contact</h4>
            <ul>
              <li>Phone: +91 98260 11111</li>
              <li>Support: support@ambikamobile.com</li>
              <li>Gwalior, Madhya Pradesh</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Ambika Mobile Sale &amp; Service, Gwalior. All rights reserved.
        </div>
      </footer>

      {/* Notification Toast */}
      <div id="toast" className={toastMessage ? 'show' : ''}>
        {toastMessage || 'Message sent successfully! We will get back to you shortly.'}
      </div>
    </>
  );
}
