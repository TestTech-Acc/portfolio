// ── 3D BACKGROUND ──────────────────────────────────────────────
(function(){
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0,0,30);

  // Floating nodes (spheres)
  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.22,16,16);
  const colors = [0x2563EB, 0x7C3AED, 0x3B82F6, 0x8B5CF6, 0x60A5FA];
  for(let i=0;i<60;i++){
    const mat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random()*colors.length)],
      roughness:0.3, metalness:0.1, transparent:true, opacity:0.55
    });
    const mesh = new THREE.Mesh(nodeGeo, mat);
    const spread = 28;
    mesh.position.set(
      (Math.random()-0.5)*spread,
      (Math.random()-0.5)*spread*0.7,
      (Math.random()-0.5)*12 - 5
    );
    mesh.userData = {
      speed: 0.004 + Math.random()*0.007,
      offset: Math.random()*Math.PI*2,
      axis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize()
    };
    scene.add(mesh);
    nodes.push(mesh);
  }

  // Connecting lines between close nodes
  const lineMat = new THREE.LineBasicMaterial({color:0x93C5FD, transparent:true, opacity:0.18});
  const lineGroup = new THREE.Group();
  scene.add(lineGroup);

  function buildLines(){
    lineGroup.clear();
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        if(dist < 6){
          const geo = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position, nodes[j].position
          ]);
          lineGroup.add(new THREE.Line(geo, lineMat));
        }
      }
    }
  }

  // Ambient + directional light
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0x93C5FD, 1.2);
  dirLight.position.set(10,10,10);
  scene.add(dirLight);

  // Mouse parallax
  let mouseX=0, mouseY=0;
  window.addEventListener('mousemove', e=>{
    mouseX = (e.clientX/window.innerWidth - 0.5)*2;
    mouseY = (e.clientY/window.innerHeight - 0.5)*2;
  });

  let frame=0;
  function animate(){
    requestAnimationFrame(animate);
    frame++;
    const t = frame * 0.008;

    nodes.forEach(n=>{
      n.position.y += Math.sin(t + n.userData.offset) * 0.008;
      n.position.x += Math.cos(t * 0.7 + n.userData.offset) * 0.006;
      n.rotation.x += n.userData.speed * 0.5;
      n.rotation.y += n.userData.speed;
      // Wrap
      if(n.position.x > 15) n.position.x = -15;
      if(n.position.x < -15) n.position.x = 15;
      if(n.position.y > 12) n.position.y = -12;
      if(n.position.y < -12) n.position.y = 12;
    });

    if(frame % 4 === 0) buildLines();

    camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.03;
    camera.lookAt(0,0,0);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ── SCROLL REVEAL ──────────────────────────────────────────────
const io = new IntersectionObserver(entries=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      setTimeout(()=>e.target.classList.add('visible'), i*60);
      io.unobserve(e.target);
    }
  });
},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ── ACTIVE NAV HIGHLIGHT ──────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[data-section]');
const sectionObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      navLinks.forEach(a=>a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[data-section="${e.target.id}"]`);
      if(active) active.classList.add('active');
    }
  });
},{threshold:0.4});
sections.forEach(s=>sectionObserver.observe(s));

// ── CLEAN URL & SMOOTH SCROLL ──────────────────────────────────
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (anchor) {
    e.preventDefault();
    const targetId = anchor.getAttribute('href');
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
      // Clear the hash from the URL bar immediately to keep it clean and secure
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }
});

// Clear hash on page load if one was present, but still scroll to section
if (window.location.hash) {
  const targetId = window.location.hash;
  history.replaceState(null, document.title, window.location.pathname + window.location.search);
  window.addEventListener('load', () => {
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ── DARK MODE TOGGLE ───────────────────────────────────────────
(function() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const currentTheme = localStorage.getItem('theme') || 'light';

  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.textContent = '🌙';
  }

  themeToggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '☀️';
    }
  });
})();


