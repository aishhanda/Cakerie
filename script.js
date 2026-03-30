
document.addEventListener('DOMContentLoaded', () => {
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", (e) => {
  navLinks.classList.toggle("show");
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("show");
  });
});

const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;
let autoPlayInterval;
const transitionTime = 5000;

if (slides.length > 0) {
  function showSlide(index) {
      slides.forEach(slide => {
          slide.classList.remove('active');
      });
      dots.forEach(dot => {
          dot.classList.remove('active');
      });
      slides[index].classList.add('active');
      dots[index].classList.add('active');
      currentSlide = index;
      }

  function nextSlide() {
      let next = currentSlide + 1;
      if (next >= slides.length) next = 0;
      showSlide(next);
      }
    
  function startAutoPlay() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(nextSlide, transitionTime);
    }
    
    
  function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }
    
    
  dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopAutoPlay();
        showSlide(index);
        startAutoPlay();
      });
    });
    
  showSlide(0);
  startAutoPlay();
}

const designFileInput = document.getElementById('design-file');
if (designFileInput) {
  designFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const fileLabel = designFileInput.nextElementSibling;
    
    if (file) {
      const fileName = file.name;
      const fileSize = (file.size / 1024).toFixed(2); 
      
      const fileIcon = fileLabel.querySelector('.file-icon');
      const fileText = fileLabel.querySelector('span:last-child');
      
      fileIcon.textContent = '✓';
      fileText.textContent = `${fileName} (${fileSize} KB)`;
      
    } 
    else {
      const fileIcon = fileLabel.querySelector('.file-icon');
      const fileText = fileLabel.querySelector('span:last-child');
      
      fileIcon.textContent = '📁';
      fileText.textContent = 'Click to upload your design reference image';
      
    }
  });
}

});
