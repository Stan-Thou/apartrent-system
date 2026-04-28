// ========== CLIENT PANORAMA 360 VIEW FUNCTIONALITY ==========

// Load panoramas for current apartment (view-only for clients)
window.loadClientPanoramas = async function(apartmentId, targetListId = 'clientPanoramaList') {
  const panoramaList = document.getElementById(targetListId);
  if (!panoramaList || !apartmentId) return;
  
  const client = initSupabaseClient();
  if (!client) return;
  
  try {
    const { data, error } = await client
      .from('panorama_images')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading panoramas:', error);
      return;
    }
    
    const panoramas = data || [];
    
    if (panoramas.length === 0) {
      panoramaList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 16px; font-size: 0.9rem;">No 360° panorama views available for this apartment.</p>';
      return;
    }
    
    // Display panoramas in a grid
    panoramaList.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${panoramas.map(item => `
          <div class="client-panorama-card" data-id="${item.id}" style="background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.3s ease; position: relative;">
            <div class="client-panorama-thumbnail" onclick="window.openClientPanoramaViewer('${item.id}')" style="width: 100%; height: 140px; overflow: hidden; position: relative;">
              <img src="${item.image_url}" alt="${item.label}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;"/>
              <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); display: flex; align-items: flex-end; padding: 12px;">
                <div style="color: white; font-weight: 600; font-size: 0.9rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                  <i class="fa-solid fa-vr-cardboard"></i> ${item.label}
                </div>
              </div>
              <div style="position: absolute; top: 8px; right: 8px; background: rgba(2, 33, 116, 0.9); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                360°
              </div>
            </div>
            <div style="padding: 12px; text-align: center;">
              <button onclick="window.openClientPanoramaViewer('${item.id}')" style="width: 100%; padding: 8px 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s ease;">
                <i class="fa-solid fa-eye"></i> View 360° Tour
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add hover effect
    const cards = panoramaList.querySelectorAll('.client-panorama-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
        this.style.borderColor = 'var(--primary-color)';
        const img = this.querySelector('img');
        if (img) img.style.transform = 'scale(1.1)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
        this.style.borderColor = 'var(--border-color)';
        const img = this.querySelector('img');
        if (img) img.style.transform = 'scale(1)';
      });
    });
    
  } catch (error) {
    console.error('Error loading client panoramas:', error);
  }
};

// Open panorama viewer for client (read-only)
window.openClientPanoramaViewer = async function(id) {
  console.log('openClientPanoramaViewer called with ID:', id);
  
  const client = initSupabaseClient();
  if (!client) {
    alert('Unable to connect to database.');
    return;
  }
  
  try {
    const { data, error } = await client
      .from('panorama_images')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Panorama not found:', error);
      return;
    }
    
    const modal = document.getElementById('panoramaViewerModal');
    const canvas = document.getElementById('panoramaCanvas');
    const labelEl = document.getElementById('panoramaViewerLabel');
    
    if (!modal || !canvas) {
      console.error('Modal or canvas not found');
      return;
    }
    
    labelEl.textContent = `360° View - ${data.label}`;
    modal.classList.add('active');
    
    console.log('Opening panorama viewer with image:', data.image_url);
    
    // Initialize 360 viewer
    initClientPanoramaViewer(canvas, data.image_url);
    
  } catch (error) {
    console.error('Error opening panorama viewer:', error);
  }
};

// Close panorama viewer
window.closePanoramaViewer = function() {
  const modal = document.getElementById('panoramaViewerModal');
  if (modal) {
    modal.classList.remove('active');
  }
  if (window.clientPanoramaViewer) {
    window.clientPanoramaViewer.destroy();
    window.clientPanoramaViewer = null;
  }
};

// WebGL-based 360 panorama viewer for hardware-accelerated rendering
function initClientPanoramaViewer(canvas, imageUrl) {
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.error('WebGL not supported, falling back to 2D');
    initFallback2DViewer(canvas, imageUrl);
    return;
  }
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let yaw = 0;
    let pitch = 0;
    let fov = 90;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;
    
    // Fragment shader for 360 spherical projection
    const fragmentShaderSource = `
      precision highp float;
      uniform sampler2D u_texture;
      uniform float u_yaw;
      uniform float u_pitch;
      uniform float u_fov;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      
      const float PI = 3.14159265359;
      
      void main() {
        vec2 screenPos = v_texCoord * 2.0 - 1.0;
        float aspect = u_resolution.x / u_resolution.y;
        screenPos.x *= aspect;
        
        float fovRad = radians(u_fov);
        float f = 1.0 / tan(fovRad * 0.5);
        
        vec3 rayDir = normalize(vec3(screenPos.x / f, -screenPos.y / f, 1.0));
        
        float cp = cos(-u_pitch);
        float sp = sin(-u_pitch);
        rayDir = vec3(
          rayDir.x,
          rayDir.y * cp - rayDir.z * sp,
          rayDir.y * sp + rayDir.z * cp
        );
        
        float cy = cos(-u_yaw);
        float sy = sin(-u_yaw);
        rayDir = vec3(
          rayDir.x * cy + rayDir.z * sy,
          rayDir.y,
          -rayDir.x * sy + rayDir.z * cy
        );
        
        float theta = atan(rayDir.x, rayDir.z);
        float phi = asin(clamp(rayDir.y, -1.0, 1.0));
        
        vec2 texCoord = vec2(
          0.5 + theta / (2.0 * PI),
          0.5 + phi / PI
        );
        
        gl_FragColor = texture2D(u_texture, texCoord);
      }
    `;
    
    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const yawLocation = gl.getUniformLocation(program, 'u_yaw');
    const pitchLocation = gl.getUniformLocation(program, 'u_pitch');
    const fovLocation = gl.getUniformLocation(program, 'u_fov');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    
    function render() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(program);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.uniform1f(yawLocation, yaw);
      gl.uniform1f(pitchLocation, pitch);
      gl.uniform1f(fovLocation, fov);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    // Mouse drag controls
    canvas.addEventListener('mousedown', function(e) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });
    
    canvas.addEventListener('mousemove', function(e) {
      if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        yaw -= deltaX * 0.005;
        pitch -= deltaY * 0.005;
        
        // Clamp pitch
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        render();
      }
    });
    
    canvas.addEventListener('mouseup', function() {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });
    
    canvas.addEventListener('mouseleave', function() {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });
    
    // Scroll to zoom
    canvas.addEventListener('wheel', function(e) {
      e.preventDefault();
      fov += e.deltaY * 0.05;
      fov = Math.max(30, Math.min(120, fov));
      render();
    });
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });
    
    canvas.addEventListener('touchmove', function(e) {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;
      
      yaw -= deltaX * 0.005;
      pitch -= deltaY * 0.005;
      
      // Clamp pitch
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      
      render();
    }, { passive: false });
    
    canvas.addEventListener('touchend', function() {
      isDragging = false;
    });
    
    // Initial render
    render();
    
    // Store viewer for cleanup
    window.clientPanoramaViewer = {
      destroy: function() {
        // Cleanup WebGL resources
        gl.deleteTexture(texture);
        gl.deleteBuffer(positionBuffer);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
      },
      reset: function() {
        yaw = 0;
        pitch = 0;
        fov = 90;
        render();
      }
    };
    
    // Handle window resize
    const modal = document.getElementById('panoramaViewerModal');
    let resizeTimeout;
    window.addEventListener('resize', () => {
      if (modal && modal.classList.contains('active')) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          render();
        }, 150);
      }
    });
  };
  
  img.onerror = function() {
    console.error('Failed to load panorama image');
    alert('Failed to load 360° panorama image.');
  };
  
  img.src = imageUrl;
}

// Fallback 2D viewer for browsers without WebGL
function initFallback2DViewer(canvas, imageUrl) {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let yaw = 0, pitch = 0, fov = 90;
    let isDragging = false, lastX = 0, lastY = 0;
    
    function render() {
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      
      const fovScale = fov / 90;
      const sw = img.width * fovScale;
      const sh = img.height * fovScale;
      const sx = ((yaw / (Math.PI * 2)) % 1) * img.width - sw / 2;
      const sy = ((0.5 - pitch / Math.PI) * img.height) - sh / 2;
      const csy = Math.max(0, Math.min(img.height - sh, sy));
      
      if (sx < 0) {
        const rw = -sx, lw = sw + sx;
        ctx.drawImage(img, img.width + sx, csy, rw, sh, 0, 0, (rw/sw)*w, h);
        ctx.drawImage(img, 0, csy, lw, sh, (rw/sw)*w, 0, (lw/sw)*w, h);
      } else if (sx + sw > img.width) {
        const lw = img.width - sx, rw = sw - lw;
        ctx.drawImage(img, sx, csy, lw, sh, 0, 0, (lw/sw)*w, h);
        ctx.drawImage(img, 0, csy, rw, sh, (lw/sw)*w, 0, (rw/sw)*w, h);
      } else {
        ctx.drawImage(img, sx, csy, sw, sh, 0, 0, w, h);
      }
    }
    
    // Mouse controls
    canvas.addEventListener('mousedown', function(e) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });
    
    canvas.addEventListener('mousemove', function(e) {
      if (isDragging) {
        yaw -= (e.clientX - lastX) * 0.005;
        pitch -= (e.clientY - lastY) * 0.005;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        lastX = e.clientX;
        lastY = e.clientY;
        render();
      }
    });
    
    canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'grab'; });
    
    canvas.addEventListener('wheel', function(e) {
      e.preventDefault();
      fov += e.deltaY * 0.05;
      fov = Math.max(30, Math.min(120, fov));
      render();
    });
    
    render();
    
    window.clientPanoramaViewer = {
      destroy: function() {},
      reset: function() { yaw = 0; pitch = 0; fov = 90; render(); }
    };
  };
  
  img.onerror = function() {
    console.error('Failed to load panorama image');
    alert('Failed to load 360° panorama image.');
  };
  
  img.src = imageUrl;
}

// Reset panorama view
window.resetPanoramaView = function() {
  if (window.clientPanoramaViewer && window.clientPanoramaViewer.reset) {
    window.clientPanoramaViewer.reset();
  }
};

// Toggle fullscreen
window.toggleFullscreen = function() {
  const container = document.querySelector('.panorama-viewer-container');
  if (!container) return;
  
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error('Error attempting to enable fullscreen:', err);
    });
  } else {
    document.exitFullscreen();
  }
};

// ========== END CLIENT PANORAMA 360 VIEW FUNCTIONALITY ==========
