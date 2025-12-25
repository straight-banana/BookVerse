const API_URL = 'http://localhost:8001/api';

let currentAuthMode = 'login';
let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const profileBtn = document.getElementById('profileBtn');
const adminBtn = document.getElementById('adminBtn');
const booksGrid = document.getElementById('booksGrid');
const searchInput = document.getElementById('search');
const categoryBtns = document.querySelectorAll('.category-btn');

function updateUIState() {
  if (token && currentUser) {
    profileBtn.textContent = currentUser.email.split('@')[0];
    if (currentUser.admin) {
      adminBtn.classList.remove('hidden');
    } else {
      adminBtn.classList.add('hidden');
    }
  } else {
    profileBtn.textContent = 'Profile';
    adminBtn.classList.add('hidden');
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

async function fetchBooks(query = '') {
  try {
    booksGrid.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading books...</p>';
    const response = await fetch(`${API_URL}/books`);
    const books = await response.json();

    let filteredBooks = books;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(lowerQuery) ||
        (book.author && book.author.toLowerCase().includes(lowerQuery))
      );
    }

    if (filteredBooks.length === 0) {
      booksGrid.innerHTML = '<p class="col-span-full text-center text-gray-500">No books found</p>';
      return;
    }

    booksGrid.innerHTML = filteredBooks.map(book => `
      <div class="book-card bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-2xl shadow-lg p-4 hover:shadow-xl"
           onclick="window.location.href='book.html?id=${book.id}'">
        <div class="relative mb-4">
          <img src="${book.image || 'https://via.placeholder.com/180x240?text=' + encodeURIComponent(book.title)}" 
               alt="${book.title}" class="rounded-xl w-full h-48 object-cover">
          <span class="absolute top-2 right-2 bg-white px-3 py-1 rounded-lg font-bold shadow-lg">
            ⭐ ${parseFloat(book.average_rating).toFixed(1)}
          </span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 line-clamp-2">${book.title}</h3>
        <p class="text-gray-700 text-sm mb-3">${book.author || 'Unknown Author'}</p>
        <div class="flex flex-wrap gap-1">
          ${book.tags ? JSON.parse(book.tags).slice(0, 2).map(tag => `
            <span class="text-xs bg-yellow-100 px-2 py-1 rounded-xl">${tag}</span>
          `).join('') : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error fetching books:', error);
    booksGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load books</p>';
  }
}

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

adminBtn.addEventListener('click', () => {
  window.location.href = 'admin.html';
});

authForm.addEventListener('submit', handleAuth);
toggleAuthBtn.addEventListener('click', toggleAuthMode);
closeAuthBtn.addEventListener('click', closeAuthModal);

searchInput.addEventListener('input', (e) => {
  fetchBooks(e.target.value.trim());
});

categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    fetchBooks();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  updateUIState();
  fetchBooks();
  if (categoryBtns.length > 0) {
    categoryBtns[0].classList.add('active');
  }
});
