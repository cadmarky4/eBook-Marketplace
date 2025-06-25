import React, { useEffect, useState } from "react";
import Image from "next/image";
import "./mybooks.css";

export default function MyBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace this with your actual authentication/token logic
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Optionally, fetch publisher ID from user profile or context
        // For demo, we assume backend uses token to identify publisher
        const res = await fetch("/api/books/my", {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch books");
        const data = await res.json();
        setBooks(data.books || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  return (
    <div className="mybooks-container">
      <header className="mybooks-header">
        <h1 className="mybooks-title">My Books</h1>
        <button className="mybooks-add-btn" title="Add Book">+</button>
      </header>
      <div className="mybooks-manage-section">
        <div className="mybooks-manage-title">Manage Books</div>
        {loading && <div>Loading...</div>}
        {error && <div className="mybooks-error">{error}</div>}
        <div className="mybooks-list">
          {!loading && !error && books.length === 0 && (
            <div>No books found.</div>
          )}
          {books.map((book) => (
            <div className="mybooks-card" key={book._id || book.id}>
              <div className="mybooks-card-cover">
                {book.cover_image_url ? (
                  <Image
                    src={book.cover_image_url.startsWith("http") ? book.cover_image_url : `/uploads/covers/${book.cover_image_url}`}
                    alt={book.title}
                    width={100}
                    height={140}
                  />
                ) : (
                  <div className="mybooks-cover-placeholder">COVER</div>
                )}
              </div>
              <div className="mybooks-card-info">
                <div className="mybooks-card-title">{book.title}</div>
                <div className="mybooks-card-status">Status: {book.status || "Published"}</div>
                <div className="mybooks-card-actions">
                  <button className="mybooks-btn">Edit</button>
                  <button className="mybooks-btn">Analytics</button>
                </div>
                <button className="mybooks-btn unpublish">Unpublish</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}