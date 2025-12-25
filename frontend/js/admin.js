const API_URL = 'http://localhost:8001/api';

const profileBtn = document.getElementById('profileBtn');
const addBookForm = document.getElementById('addBookForm');
const booksTable = document.getElementById('booksTable');

async function loadBooks() {
  try {
    const response = await fetch(`${API_URL}/books`);
    const books = await response.json();

    if (books.length === 0) {
      booksTable.innerHTML = '<p class="text-gray-500 text-center">No books yet</p>';
      return;
    }

    booksTable.innerHTML = books.map(book => `
      <div class="border rounded-lg p-4 flex justify-between items-start bg-gray-50">
        <div class="flex-1 flex gap-4">
          <img src="${book.image || 'https://via.placeholder.com/60x80?text=' + encodeURIComponent(book.title)}" 
               alt="${book.title}" class="rounded w-16 h-20 object-cover flex-shrink-0">
          <div class="flex-1">
            <h3 class="font-bold text-lg">${book.title}</h3>
            <p class="text-gray-600">${book.author || 'Unknown Author'}</p>
            <div class="flex gap-2 mt-2 flex-wrap">
              ${book.tags ? JSON.parse(book.tags).map(tag => `
                <span class="bg-yellow-100 px-2 py-1 rounded text-sm">${tag}</span>
              `).join('') : ''}
            </div>
            <div class="mt-2 text-sm text-gray-500">
              <p>⭐ Rating: ${parseFloat(book.average_rating).toFixed(1)} (${book.review_count} reviews)</p>
            </div>
          </div>
        </div>
        <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold flex-shrink-0" onclick="deleteBook(${book.id})">
          Delete
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading books:', error);
    booksTable.innerHTML = '<p class="text-red-500">Failed to load books</p>';
  }
}

async function addBook(e) {
  e.preventDefault();

  const title = document.getElementById('bookTitle').value;
  const author = document.getElementById('bookAuthor').value;
  const image = document.getElementById('bookImage').value;
  const tagsInput = document.getElementById('bookTags').value;
  const buyLinksInput = document.getElementById('bookBuyLinks').value;
  const pdfLinksInput = document.getElementById('bookPdfLinks').value;

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : null;
  const buy_links = buyLinksInput ? buyLinksInput.split(',').map(t => t.trim()) : null;
  const pdf_links = pdfLinksInput ? pdfLinksInput.split(',').map(t => t.trim()) : null;

  try {
    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author: author || null,
        image: image || null,
        tags,
        buy_links,
        pdf_links,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('Book added successfully!');
      addBookForm.reset();
      await loadBooks();
    } else {
      alert(data.message || 'Error adding book');
    }
  } catch (error) {
    console.error('Error adding book:', error);
    alert('An error occurred');
  }
}

async function deleteBook(bookId) {
  if (!confirm('Are you sure you want to delete this book?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      alert('Book deleted successfully!');
      await loadBooks();
    } else {
      alert(data.message || 'Error deleting book');
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    alert('An error occurred');
  }
}

profileBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

addBookForm.addEventListener('submit', addBook);

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
});

