// main.js — Client-side enhancements

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });

  // Set min datetime for session creation
  const dtInput = document.getElementById('dateTime');
  if (dtInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const pad = (n) => String(n).padStart(2, '0');
    const localISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    dtInput.min = localISO;
  }

  // Number input: prevent negative
  const additionalInput = document.getElementById('additionalPlayersNeeded');
  if (additionalInput) {
    additionalInput.addEventListener('change', () => {
      if (parseInt(additionalInput.value) < 0) additionalInput.value = 0;
    });
  }

  // Confirm cancel forms
  document.querySelectorAll('[data-confirm]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (!confirm(btn.dataset.confirm)) e.preventDefault();
    });
  });

  // Close modal on overlay click
  const overlay = document.getElementById('cancelModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }
});

// Close modal (global)
function closeModal() {
  const modal = document.getElementById('cancelModal');
  if (modal) modal.style.display = 'none';
}
