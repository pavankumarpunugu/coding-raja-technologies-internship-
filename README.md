# ShopNest - Python Full Stack E-Commerce

A Python full-stack e-commerce application demonstrating React + Bootstrap on the frontend and Python + Django REST Framework on the backend.

## Features

- Responsive React + Bootstrap UI
- Reusable React components
- Product search with debouncing
- Product listing and details
- JWT authentication
- Registration and login validation
- Product CRUD API
- Cart CRUD
- Checkout and order history
- Backend validation
- Django ORM query optimization
- Frontend rendering and memoization
- Error handling and debugging-friendly API responses
- Git feature-branch / pull-request workflow

## Technology Stack

- Python
- Django
- Django REST Framework
- SQLite
- React
- JavaScript
- HTML5
- CSS3
- Bootstrap
- Git / GitHub

## No Node.js required

The React frontend is loaded through CDN scripts. The application does not require Node.js or npm.

## Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_products
python manage.py runserver
```

Backend: http://127.0.0.1:8000/

## Frontend setup

In another terminal:

```bash
cd frontend
python -m http.server 5500
```

Open:

http://127.0.0.1:5500/

## Admin

```bash
python manage.py createsuperuser
```

Then open:

http://127.0.0.1:8000/admin/

## Git workflow

Use a feature branch for each change:

```bash
git checkout -b feature/product-search
git add .
git commit -m "Add debounced product search"
git push -u origin feature/product-search
```

Open a Pull Request on GitHub, review the changes, make any required corrections, and merge the PR into `main`.

For real collaborative review, invite a teammate/mentor to review the PR. Do not claim another person's review unless they actually reviewed it.

## Project structure

```text
shopnest/
├── backend/
│   ├── config/
│   ├── store/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── .gitignore
└── README.md
```
