const API_URL = 'http://localhost:8001/api';

let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
let bookId = new URLSearchParams(window.location.search).get('id');
let selectedRating = null;

const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const profileBtn = document.getElementById('profileBtn');
const submitReviewForm = document.getElementById('submitReviewForm');
const reviewForm = document.getElementById('reviewForm');
const ratingBtns = document.querySelectorAll('.rating-btn');
const ratingInput = document.getElementById('ratingInput');
let currentAuthMode = 'login';

function updateUIState() {
  if (token && currentUser) {
    profileBtn.textContent = currentUser.email.split('@')[0];
    if (!currentUser.admin) {
      reviewForm.style.display = 'block';
    } else {
      reviewForm.style.display = 'none';
    }
  } else {
    profileBtn.textContent = 'Profile';
    reviewForm.style.display = 'none';
  }
}

function openAuthModal() {
  currentAuthMode = 'login';
  authTitle.textContent = 'Login';
  authForm.reset();
  authModal.classList.remove('hidden');
}

function closeAuthModal() {
  authModal.classList.add('hidden');
}

function toggleAuthMode() {
  currentAuthMode = currentAuthMode === 'login' ? 'register' : 'login';
  authTitle.textContent = currentAuthMode === 'login' ? 'Login' : 'Register';
  authForm.reset();
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  try {
    const endpoint = currentAuthMode === 'login' ? '/auth/login' : '/auth/register';
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      if (currentAuthMode === 'login') {
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUIState();
        closeAuthModal();
        alert('Logged in successfully!');
      } else {
        alert('Account created! Please login.');
        toggleAuthMode();
        authForm.reset();
      }
    } else {
      alert(data.message || 'An error occurred');
    }
  } catch (error) {
    console.error('Auth error:', error);
    alert('An error occurred');
  }
}

async function loadBookDetails() {
  if (!bookId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/books/${bookId}`);
    if (!response.ok) throw new Error('Book not found');

    const book = await response.json();
    document.title = `${book.title} - BookVerse`;
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = book.author || 'Unknown Author';
    document.getElementById('avgRating').textContent = parseFloat(book.average_rating).toFixed(1);
    document.getElementById('reviewCount').textContent = `(${book.review_count} reviews)`;

    if (book.image) {
      document.getElementById('coverImg').src = book.image;
    } else {
      document.getElementById('coverImg').src = `https://via.placeholder.com/180x240?text=${encodeURIComponent(book.title)}`;
    }

    if (book.tags) {
      const tags = JSON.parse(book.tags);
      document.getElementById('tags').innerHTML = tags.map(tag =>
        `<span class="bg-yellow-100 px-3 py-1 rounded-lg text-sm">${tag}</span>`
      ).join('');
    }

    if (book.buy_links) {
      const links = JSON.parse(book.buy_links);
      document.getElementById('buyBtn').onclick = () => window.open(links[0], '_blank');
    } else {
      document.getElementById('buyBtn').style.display = 'none';
    }

    if (book.pdf_links) {
      const links = JSON.parse(book.pdf_links);
      document.getElementById('pdfBtn').onclick = () => window.open(links[0], '_blank');
    } else {
      document.getElementById('pdfBtn').style.display = 'none';
    }

    await loadReviews();
  } catch (error) {
    console.error('Error loading book:', error);
    document.getElementById('bookDetails').innerHTML = '<p class="text-red-500">Book not found</p>';
  }
}

async function loadReviews() {
  try {
    const response = await fetch(`${API_URL}/books/${bookId}/reviews`);
    const reviews = await response.json();

    const reviewsList = document.getElementById('reviewsList');
    if (reviews.length === 0) {
      reviewsList.innerHTML = '<p class="text-gray-500 text-center">No reviews yet. Be the first to review!</p>';
      return;
    }

    reviewsList.innerHTML = reviews.map(review => `
      <div class="review-item bg-white p-4 rounded-lg shadow-md">
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="font-bold text-gray-900">${review.email}</p>
            <p class="text-sm text-gray-500">Rating: ${'⭐'.repeat(review.rating)}</p>
          </div>
        </div>
        ${review.review ? `<p class="text-gray-700">${review.review}</p>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

async function submitReview(e) {
  e.preventDefault();

  if (!token) {
    openAuthModal();
    return;
  }

  if (!selectedRating) {
    alert('Please select a rating');
    return;
  }

  const review = document.getElementById('reviewText').value;

  try {
    const response = await fetch(`${API_URL}/books/${bookId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: selectedRating, review }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('Review submitted successfully!');
      submitReviewForm.reset();
      selectedRating = null;
      ratingBtns.forEach(btn => btn.classList.remove('selected'));
      await loadReviews();
    } else {
      alert(data.message || 'Error submitting review');
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('An error occurred');
  }
}

ratingBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    ratingBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedRating = parseInt(btn.dataset.rating);
    ratingInput.value = selectedRating;
  });
});

profileBtn.addEventListener('click', () => {
  if (token) {
    const confirmed = confirm('Logout?');
    if (confirmed) {
      token = null;
      currentUser = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      updateUIState();
      alert('Logged out');
    }
  } else {
    openAuthModal();
  }
});

authForm.addEventListener('submit', handleAuth);
toggleAuthBtn.addEventListener('click', toggleAuthMode);
closeAuthBtn.addEventListener('click', closeAuthModal);
submitReviewForm.addEventListener('submit', submitReview);

document.addEventListener('DOMContentLoaded', () => {
  updateUIState();
  loadBookDetails();
});
